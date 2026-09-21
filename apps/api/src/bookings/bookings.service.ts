import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { CreateBookingDto } from './dto';
import { BookingStatus, DayOfWeek } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: dto.serviceId },
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

      const startTime = new Date(dto.startTime);

      if (isNaN(startTime.getTime())) {
        throw new BadRequestException('Invalid start time format');
      }

      const now = new Date();
      if (startTime <= now) {
        throw new BadRequestException('Cannot book slots in the past');
      }

      const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

      const dayOfWeek = this.getDayOfWeek(startTime);

      const operatingHour = service.business.operatingHours.find(
        (oh) => oh.dayOfWeek === dayOfWeek,
      );

      if (!operatingHour) {
        throw new BadRequestException('Business is closed on this day');
      }

      const slotTime = this.formatTime(startTime);

      const isValid = this.availabilityService.isSlotValid(
        slotTime,
        operatingHour.openingTime,
        operatingHour.closingTime,
        service.durationMinutes,
      );

      if (!isValid) {
        throw new BadRequestException(
          'Booking time is outside business operating hours or invalid slot',
        );
      }

      try {
        const booking = await tx.booking.create({
          data: {
            serviceId: dto.serviceId,
            customerId,
            startTime,
            endTime,
            status: BookingStatus.CONFIRMED,
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                durationMinutes: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return booking;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException('The selected slot is no longer available');
          }
        }
        throw error;
      }
    });
  }

  async getMyBookings(customerId: string, status?: BookingStatus) {
    const where: Prisma.BookingWhereInput = {
      customerId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async getBookingById(id: string, customerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async cancel(id: string, customerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
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

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
