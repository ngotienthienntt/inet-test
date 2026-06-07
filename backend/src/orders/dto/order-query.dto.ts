import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OrderStatus } from '../../common/types/index';

export class OrderQueryDto {
  @ApiPropertyOptional({ description: 'Filter by order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number = 20;
}
