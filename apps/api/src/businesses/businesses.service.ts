import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto, UpdateOperatingHoursDto } from './dto';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    const existingBusiness = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (existingBusiness) {
      throw new ConflictException('You already have a business');
    }

    return this.prisma.business.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
      },
      include: {
        operatingHours: true,
      },
    });
  }

  async getMyBusiness(ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
      include: {
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async update(ownerId: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.prisma.business.update({
      where: { id: business.id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        operatingHours: true,
      },
    });
  }

  async getOperatingHours(ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
      include: {
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business.operatingHours;
  }

  async updateOperatingHours(ownerId: string, dto: UpdateOperatingHoursDto) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    for (const hour of dto.hours) {
      if (hour.openingTime >= hour.closingTime) {
        throw new BadRequestException(
          `Opening time must be before closing time for ${hour.dayOfWeek}`,
        );
      }
    }

    await this.prisma.operatingHour.deleteMany({
      where: { businessId: business.id },
    });

    const operatingHours = await this.prisma.$transaction(
      dto.hours.map((hour) =>
        this.prisma.operatingHour.create({
          data: {
            businessId: business.id,
            dayOfWeek: hour.dayOfWeek,
            openingTime: hour.openingTime,
            closingTime: hour.closingTime,
          },
        }),
      ),
    );

    return operatingHours;
  }

  async getBusinessBookings(ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
      include: {
        services: {
          include: {
            bookings: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                service: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
              orderBy: {
                startTime: 'desc',
              },
            },
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const bookings = business.services.flatMap((service) => service.bookings);

    return bookings;
  }

  async verifyOwnership(businessId: string, ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this business');
    }

    return business;
  }
}
