import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Sinh viên', description: 'Tag name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'sinh-vien', description: 'URL-friendly slug (unique)' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
