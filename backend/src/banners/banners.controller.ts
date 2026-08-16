import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @ApiOperation({ summary: 'Get all banners, all positions (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all banners' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @ApiOperation({ summary: 'Get the active banner for a position (public)' })
  @ApiResponse({ status: 200, description: 'The active banner, or null if none is configured' })
  @Get('active/:position')
  findActive(@Param('position') position: string) {
    return this.bannersService.findActive(position);
  }

  @ApiOperation({ summary: 'Create a new banner (admin only)' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @ApiOperation({ summary: 'Update a banner by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a banner by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }
}
