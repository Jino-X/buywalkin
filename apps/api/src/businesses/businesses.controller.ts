import { Controller, Get, Post, Patch, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto, UpdateOperatingHoursDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('businesses')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create a new business (Business Owner only)' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiResponse({ status: 409, description: 'Business already exists' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get my business (Business Owner only)' })
  @ApiResponse({ status: 200, description: 'Business retrieved' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getMyBusiness(@CurrentUser() user: RequestUser) {
    return this.businessesService.getMyBusiness(user.id);
  }

  @Patch('me')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update my business (Business Owner only)' })
  @ApiResponse({ status: 200, description: 'Business updated' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(@CurrentUser() user: RequestUser, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(user.id, dto);
  }

  @Get('me/operating-hours')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get my business operating hours' })
  @ApiResponse({ status: 200, description: 'Operating hours retrieved' })
  async getOperatingHours(@CurrentUser() user: RequestUser) {
    return this.businessesService.getOperatingHours(user.id);
  }

  @Put('me/operating-hours')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update my business operating hours' })
  @ApiResponse({ status: 200, description: 'Operating hours updated' })
  @ApiResponse({ status: 400, description: 'Invalid operating hours' })
  async updateOperatingHours(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOperatingHoursDto,
  ) {
    return this.businessesService.updateOperatingHours(user.id, dto);
  }

  @Get('me/bookings')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get all bookings for my business' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved' })
  async getBusinessBookings(@CurrentUser() user: RequestUser) {
    return this.businessesService.getBusinessBookings(user.id);
  }
}
