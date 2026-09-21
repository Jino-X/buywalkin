import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateServiceDto) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business not found. Please create a business first.');
    }

    return this.prisma.service.create({
      data: {
        businessId: business.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 20, search?: string, businessId?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (businessId) {
      where.businessId = businessId;
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findMyServices(ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.prisma.service.findMany({
      where: { businessId: business.id },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async remove(id: string, ownerId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this service');
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'Service deleted successfully' };
  }

  async verifyOwnership(serviceId: string, ownerId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this service');
    }

    return service;
  }
}
