import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getOrCreateCart(userId?: number, sessionToken?: string): Promise<Cart> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.cartRepository.findOne({ where: { userId } });
    } else if (sessionToken) {
      cart = await this.cartRepository.findOne({ where: { sessionToken } });
    }

    if (!cart) {
      cart = this.cartRepository.create({
        userId: userId ?? undefined,
        sessionToken: sessionToken ?? undefined,
      });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(userId?: number, sessionToken?: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const found = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.images',
      ],
    });

    return found!;
  }

  async addItem(
    userId?: number,
    sessionToken?: string,
    dto?: AddCartItemDto,
  ): Promise<Cart> {
    if (!dto) {
      throw new Error('AddCartItemDto is required');
    }

    const cart = await this.getOrCreateCart(userId, sessionToken);

    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.getCart(userId, sessionToken);
  }

  async updateItem(
    cartItemId: number,
    dto: UpdateCartItemDto,
    userId?: number,
    sessionToken?: string,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);

    return this.getCart(userId, sessionToken);
  }

  async removeItem(
    cartItemId: number,
    userId?: number,
    sessionToken?: string,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(item);

    return this.getCart(userId, sessionToken);
  }

  async saveForLater(
    cartItemId: number,
    userId?: number,
    sessionToken?: string,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, sessionToken);

    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.savedForLater = !item.savedForLater;
    await this.cartItemRepository.save(item);

    return this.getCart(userId, sessionToken);
  }

  async clearCart(userId?: number, sessionToken?: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId, sessionToken);
    await this.cartItemRepository.delete({ cartId: cart.id });
  }

  getCartSummary(cart: Cart): { totalItems: number; subtotal: number } {
    if (!cart.items) {
      return { totalItems: 0, subtotal: 0 };
    }

    const activeItems = cart.items.filter((item) => !item.savedForLater);

    const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = activeItems.reduce((sum, item) => {
      const price = item.variant ? Number(item.variant.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    return { totalItems, subtotal };
  }

  async getCartByCartId(cartId: number): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { id: cartId },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.images',
      ],
    });
  }

  async getCartEntityForCheckout(userId?: number, sessionToken?: string): Promise<Cart | null> {
    const cart = await this.getOrCreateCart(userId, sessionToken);
    return this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
  }
}
