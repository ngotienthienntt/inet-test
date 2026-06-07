import { Controller, Get, Patch, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats (admin only)' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers (admin only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getCustomers(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getCustomers(search, Number(page), Number(limit));
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer detail (admin only)' })
  getCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getCustomer(id);
  }

  @Patch('customers/:id/toggle-ban')
  @ApiOperation({ summary: 'Toggle customer ban status (admin only)' })
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleBan(id);
  }
}
