import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../common/types/index';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: OrderStatus, example: OrderStatus.PROCESSING })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
