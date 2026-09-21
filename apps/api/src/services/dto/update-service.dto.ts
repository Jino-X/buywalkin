import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({ example: 'Professional Haircut', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Expert haircut with styling consultation', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 500, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 60, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;
}
