import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DayOfWeek, BookingStatus } from '@prisma/client';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(serviceId: string, date: string) {
    const requestedDate = new Date(date);

    if (isNaN(requestedDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      throw new BadRequestException('Cannot check availability for past dates');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        business: {
          include: {
            operatingHours: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const dayOfWeek = this.getDayOfWeek(requestedDate);

    const operatingHour = service.business.operatingHours.find((oh) => oh.dayOfWeek === dayOfWeek);

    if (!operatingHour) {
      return {
        date,
        service: {
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
        },
        slots: [],
        message: 'Business is closed on this day',
      };
    }

    const slots = this.generateSlots(
      operatingHour.openingTime,
      operatingHour.closingTime,
      service.durationMinutes,
    );

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        serviceId,
        status: BookingStatus.CONFIRMED,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        startTime: true,
      },
    });

    const bookedTimes = new Set(bookings.map((b) => this.formatTime(b.startTime)));

    const availableSlots = slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.startTime),
    }));

    return {
      date,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
      },
      business: {
        id: service.business.id,
        name: service.business.name,
      },
      slots: availableSlots,
    };
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const day = date.getDay();
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[day];
  }

  private generateSlots(
    openingTime: string,
    closingTime: string,
    durationMinutes: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);

    const openingMinutes = openHour * 60 + openMinute;
    const closingMinutes = closeHour * 60 + closeMinute;

    let currentMinutes = openingMinutes;

    while (currentMinutes + durationMinutes <= closingMinutes) {
      const startTime = this.minutesToTime(currentMinutes);
      const endTime = this.minutesToTime(currentMinutes + durationMinutes);

      slots.push({
        startTime,
        endTime,
        available: true,
      });

      currentMinutes += durationMinutes;
    }

    return slots;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  isSlotValid(
    slotTime: string,
    openingTime: string,
    closingTime: string,
    durationMinutes: number,
  ): boolean {
    const [slotHour, slotMinute] = slotTime.split(':').map(Number);
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);

    const slotMinutes = slotHour * 60 + slotMinute;
    const openingMinutes = openHour * 60 + openMinute;
    const closingMinutes = closeHour * 60 + closeMinute;
    const endMinutes = slotMinutes + durationMinutes;

    return slotMinutes >= openingMinutes && endMinutes <= closingMinutes;
  }
}
