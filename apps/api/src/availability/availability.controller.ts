import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('services/:serviceId/availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get available time slots for a service on a specific date' })
  @ApiQuery({ name: 'date', example: '2026-09-25', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid date format or past date' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getAvailableSlots(@Param('serviceId') serviceId: string, @Query('date') date: string) {
    return this.availabilityService.getAvailableSlots(serviceId, date);
  }
}
