import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Variant } from '../products/entities/variant.entity';
import { CartService } from '../cart/cart.service';
import { generateOrderNumber } from '../common/utils/format.util';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../common/types/index';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async checkout(
    dto: CreateOrderDto,
    userId?: number,
    sessionToken?: string,
  ) {
    const cart = await this.cartService.getCartEntityForCheckout(userId, sessionToken);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const activeItems = cart.items.filter((item) => !item.savedForLater);
    if (activeItems.length === 0) {
      throw new BadRequestException('No active items in cart');
    }

    // Validate stock
    for (const item of activeItems) {
      if (!item.variant) {
        throw new BadRequestException(`Variant not found for cart item ${item.id}`);
      }
      if (item.variant.stock < item.quantity) {
        const productName = item.variant.product?.name ?? `Variant #${item.variantId}`;
        throw new BadRequestException(
          `Insufficient stock for "${productName}". Available: ${item.variant.stock}, requested: ${item.quantity}`,
        );
      }
    }

    const subtotal = activeItems.reduce((sum, item) => {
      return sum + Number(item.variant.price) * item.quantity;
    }, 0);

    const shipping = 0;
    const total = subtotal + shipping;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let order: Order;

    try {
      order = queryRunner.manager.create(Order, {
        orderNumber: generateOrderNumber(),
        userId: userId ?? undefined,
        sessionToken: userId ? undefined : (sessionToken ?? undefined),
        status: OrderStatus.PENDING,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        note: dto.note ?? undefined,
        subtotal,
        shipping,
        total,
      } as Partial<Order>);

      order = await queryRunner.manager.save(Order, order);

      const orderItemsToSave: OrderItem[] = activeItems.map((item) => {
        const variant = item.variant;
        const product = variant.product;

        const labelParts: string[] = [];
        if (variant.size) labelParts.push(variant.size);
        if (variant.colorName) labelParts.push(variant.colorName);
        const variantLabel = labelParts.length > 0 ? labelParts.join(' - ') : undefined;

        return queryRunner.manager.create(OrderItem, {
          orderId: order.id,
          variantId: variant.id,
          productName: product?.name ?? `Product #${variant.productId}`,
          variantLabel,
          price: Number(variant.price),
          quantity: item.quantity,
          lineTotal: Number(variant.price) * item.quantity,
        } as Partial<OrderItem>);
      });

      await queryRunner.manager.save(OrderItem, orderItemsToSave);

      // Decrement stock for each variant
      for (const item of activeItems) {
        await queryRunner.manager.decrement(
          Variant,
          { id: item.variantId },
          'stock',
          item.quantity,
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Checkout transaction failed', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('Checkout failed. Please try again.');
    } finally {
      await queryRunner.release();
    }

    // Clear cart after successful order (outside transaction)
    await this.cartService.clearCart(userId, sessionToken);

    // Emit order.created event
    this.eventEmitter.emit('order.created', order);

    const bankInfo = {
      bankName: this.configService.get<string>('BANK_NAME'),
      bankAccount: this.configService.get<string>('BANK_ACCOUNT'),
      bankOwner: this.configService.get<string>('BANK_OWNER'),
      amount: total,
      transferContent: order.orderNumber,
    };

    const fullOrder = await this.orderRepository.findOne({
      where: { id: order.id },
      relations: ['items'],
    });

    return { order: fullOrder, bankInfo };
  }
}
