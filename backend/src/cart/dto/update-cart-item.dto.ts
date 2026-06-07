import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity (min 1)', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
