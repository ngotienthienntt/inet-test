import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtPayload } from '../common/types/index';

@ApiTags('Checkout')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Session-Token',
  description: 'Session token for guest users',
  required: false,
})
@UseGuards(OptionalJwtGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Place an order from the current cart' })
  async checkout(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
    @Body() dto: CreateOrderDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    const userId = user?.sub ?? undefined;
    const token = userId ? undefined : sessionToken;

    return this.checkoutService.checkout(dto, userId, token);
  }
}
