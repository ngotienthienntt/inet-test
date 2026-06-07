import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiPropertyOptional({ example: 'M', description: 'Size variant' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: 'Đen', description: 'Color name' })
  @IsString()
  @IsOptional()
  colorName?: string;

  @ApiPropertyOptional({ example: '#000000', description: 'Color hex code' })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiProperty({ example: 990000, description: 'Selling price (VND)' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 1200000, description: 'Original price before discount (VND)' })
  @IsNumber()
  @IsNotEmpty()
  originalPrice: number;

  @ApiPropertyOptional({ example: 100, description: 'Stock quantity', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 'SKU-001', description: 'Stock-keeping unit (unique)' })
  @IsString()
  @IsOptional()
  sku?: string;
}
