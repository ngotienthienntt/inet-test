import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition } from '../banner-position.enum';

export class CreateBannerDto {
  @ApiProperty({ enum: BannerPosition, example: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiProperty({ example: 'http://localhost:3001/uploads/products/1234-banner.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/shop?category=dien-thoai' })
  @IsOptional()
  @Matches(/^(https?:\/\/|\/)\S*$/, {
    message: 'linkUrl must be an absolute http(s) URL or a path starting with "/"',
  })
  linkUrl?: string;

  @ApiProperty({ example: 'Banner khuyến mãi điện thoại' })
  @IsString()
  @IsNotEmpty()
  altText: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
