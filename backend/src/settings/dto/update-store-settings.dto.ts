import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({ example: 'ShopVN' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ example: 'support@shopvn.vn' })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '1900 1234' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Vietcombank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'CÔNG TY SHOPVN' })
  @IsString()
  @IsOptional()
  bankOwner?: string;

  @ApiPropertyOptional({ example: '500000' })
  @IsString()
  @IsOptional()
  freeShippingThreshold?: string;
}
