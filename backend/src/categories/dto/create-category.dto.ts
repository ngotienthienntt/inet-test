import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Điện thoại', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'dien-thoai', description: 'URL-friendly slug (unique)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'Parent category ID for nested categories' })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ example: 'phone-icon', description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'All mobile phones and smartphones', description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order for display (lower = first)' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the category is visible', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
