import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductSortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  RATING = 'rating',
}

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 'iphone', description: 'Full-text search on name and description' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 'dien-thoai', description: 'Filter by category slug' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 500000, description: 'Minimum price filter (VND)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 10000000, description: 'Maximum price filter (VND)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ProductSortOption,
    example: ProductSortOption.NEWEST,
    description: 'Sort order',
  })
  @IsEnum(ProductSortOption)
  @IsOptional()
  sort?: ProductSortOption;

  @ApiPropertyOptional({ example: true, description: 'Include inactive products (admin only)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  all?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter by featured products only' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
