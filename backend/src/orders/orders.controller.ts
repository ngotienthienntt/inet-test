import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { OrdersService } from './orders.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtPayload, PaginatedResult } from '../common/types/index';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiHeader({ name: 'X-Session-Token', description: 'Guest session token', required: false })
  @ApiOperation({ summary: 'Get my orders (JWT or session token)' })
  async findMyOrders(
    @Req() req: Request,
    @Query() query: OrderQueryDto,
    @Headers('X-Session-Token') sessionToken?: string,
  ): Promise<PaginatedResult<Order>> {
    const user = req.user as JwtPayload | undefined;

    if (user) {
      // Authenticated: return user orders, optionally merged with session orders
      const userResult = await this.ordersService.findByUser(user.sub, query);
      if (sessionToken) {
        const sessionResult = await this.ordersService.findBySession(sessionToken, query);
        // Merge, deduplicate by id, keep user orders first
        const seen = new Set(userResult.data.map((o) => o.id));
        const extra = sessionResult.data.filter((o) => !seen.has(o.id));
        const merged = [...userResult.data, ...extra].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const total = userResult.total + extra.length;
        return { ...userResult, data: merged, total };
      }
      return userResult;
    }

    if (sessionToken) {
      return this.ordersService.findBySession(sessionToken, query);
    }

    throw new UnauthorizedException('Authentication required');
  }

  @Get(':id')
  @ApiHeader({
    name: 'X-Session-Token',
    description: 'Session token for guest users',
    required: false,
  })
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Get order by ID (JWT or session token)' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Headers('X-Session-Token') sessionToken?: string,
  ) {
    const user = req.user as JwtPayload | undefined;
    const order = await this.ordersService.findById(id);

    // Authorization check: user must own the order (by userId or sessionToken)
    if (user) {
      if (order.userId !== user.sub) {
        throw new UnauthorizedException('Access denied');
      }
    } else if (sessionToken) {
      if (order.sessionToken !== sessionToken) {
        throw new UnauthorizedException('Access denied');
      }
    } else {
      throw new UnauthorizedException('Authentication required');
    }

    return order;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
