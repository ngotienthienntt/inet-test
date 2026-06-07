import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Variant ID to add to cart', example: 1 })
  @IsNumber()
  variantId: number;

  @ApiPropertyOptional({ description: 'Quantity to add (min 1)', example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity: number = 1;
}
