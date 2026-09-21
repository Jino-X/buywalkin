import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'service-uuid' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    example: '2026-09-25T10:00:00+05:30',
    description: 'Booking start time in ISO 8601 format',
  })
  @IsDateString()
  startTime: string;
}
