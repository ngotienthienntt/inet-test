import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtPayload } from '../common/types/index';

@ApiTags('Cart')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Session-Token',
  description: 'Session token for guest users',
  required: false,
})
@UseGuards(OptionalJwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private extractIdentifiers(
    req: Request,
    sessionToken?: string,
  ): { userId?: number; sessionToken?: string } {
    const user = req.user as JwtPayload | undefined;
    const userId = user?.sub ?? undefined;
    return { userId, sessionToken: userId ? undefined : sessionToken };
  }

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken?: string,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    const cart = await this.cartService.getCart(userId, token);
    const summary = this.cartService.getCartSummary(cart);
    return { cart, summary };
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
    @Body() dto: AddCartItemDto,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    const cart = await this.cartService.addItem(userId, token, dto);
    const summary = this.cartService.getCartSummary(cart);
    return { cart, summary };
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    const cart = await this.cartService.updateItem(id, dto, userId, token);
    const summary = this.cartService.getCartSummary(cart);
    return { cart, summary };
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    const cart = await this.cartService.removeItem(id, userId, token);
    const summary = this.cartService.getCartSummary(cart);
    return { cart, summary };
  }

  @Post('items/:id/save-later')
  @ApiOperation({ summary: 'Toggle save for later on a cart item' })
  async saveForLater(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    const cart = await this.cartService.saveForLater(id, userId, token);
    const summary = this.cartService.getCartSummary(cart);
    return { cart, summary };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(
    @Req() req: Request,
    @Headers('X-Session-Token') sessionToken: string,
  ) {
    const { userId, sessionToken: token } = this.extractIdentifiers(req, sessionToken);
    await this.cartService.clearCart(userId, token);
    return { message: 'Cart cleared successfully' };
  }
}
