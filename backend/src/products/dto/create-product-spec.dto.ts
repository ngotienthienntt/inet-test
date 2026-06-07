import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductSpecDto {
  @ApiProperty({ example: 'RAM', description: 'Spec label' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '8GB', description: 'Spec value' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order for display' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
