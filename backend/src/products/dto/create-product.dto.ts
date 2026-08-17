import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateProductSpecDto } from './create-product-spec.dto';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'iphone-15-pro', description: 'URL-friendly slug (unique)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({ example: 'The latest iPhone with A17 Pro chip', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'HOT', description: "Badge label: 'HOT' | 'SALE' | 'MỚI' | ''", default: '' })
  @IsString()
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the product is active/visible', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether the product appears in featured section', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [CreateProductImageDto], description: 'Product images' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({ type: [CreateProductSpecDto], description: 'Product specifications' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSpecDto)
  @IsOptional()
  specs?: CreateProductSpecDto[];

  @ApiPropertyOptional({ type: [CreateVariantDto], description: 'Product variants (size, color, price, stock)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({ type: [Number], example: [1, 2], description: 'IDs of audience tags to assign' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];
}
