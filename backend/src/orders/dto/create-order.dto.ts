import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Full name of the recipient', example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Email address', example: 'example@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Delivery address', example: '123 Le Loi, Quan 1, TP.HCM' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Order note', example: 'Please call before delivery' })
  @IsString()
  @IsOptional()
  note?: string;
}
