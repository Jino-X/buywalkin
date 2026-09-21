import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsString, Matches, ValidateNested } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class OperatingHourDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'Opening time in HH:MM format' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Opening time must be in HH:MM format',
  })
  openingTime: string;

  @ApiProperty({ example: '18:00', description: 'Closing time in HH:MM format' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Closing time must be in HH:MM format',
  })
  closingTime: string;
}

export class UpdateOperatingHoursDto {
  @ApiProperty({ type: [OperatingHourDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHourDto)
  hours: OperatingHourDto[];
}
