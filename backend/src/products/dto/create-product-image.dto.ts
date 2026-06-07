import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order for display' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
