import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto {
  @ApiProperty({ example: 'ABC Wellness', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Premium wellness and spa services', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
