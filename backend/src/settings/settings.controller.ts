import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get store settings (public — used for storefront branding)' })
  @ApiResponse({ status: 200, description: 'Current store settings' })
  @Get()
  get() {
    return this.settingsService.get();
  }

  @ApiOperation({ summary: 'Update store settings (admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch()
  update(@Body() dto: UpdateStoreSettingsDto) {
    return this.settingsService.update(dto);
  }
}
