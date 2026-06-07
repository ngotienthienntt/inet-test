import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { CheckoutService } from './checkout.service';
import { CartService } from '../cart/cart.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Variant } from '../products/entities/variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrderStatus } from '../common/types/index';

// ---------- helpers ----------

const makeVariant = (overrides: Partial<Variant> = {}): Variant =>
  ({
    id: 1,
    productId: 1,
    stock: 10,
    price: 500000,
    originalPrice: 600000,
    size: 'M',
    colorName: 'Black',
    colorHex: '#000',
    sku: 'SKU-001',
    product: { id: 1, name: 'Test Product' } as any,
    ...overrides,
  }) as Variant;

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem =>
  ({
    id: 1,
    cartId: 10,
    variantId: 1,
    quantity: 2,
    savedForLater: false,
    variant: makeVariant(),
    createdAt: new Date(),
    ...overrides,
  }) as CartItem;

const makeCart = (items: CartItem[] = []): Cart =>
  ({
    id: 10,
    userId: 1,
    sessionToken: null as unknown as string,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Cart;

const makeCheckoutDto = () => ({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '0900000000',
  address: '123 Main St',
  note: '',
});

// ---------- spec ----------

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartService: jest.Mocked<CartService>;
  let orderRepository: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: any;

  beforeEach(async () => {
    // Build a reusable query-runner mock
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        decrement: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: CartService,
          useValue: {
            getCartEntityForCheckout: jest.fn(),
            clearCart: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    cartService = module.get(CartService);
    orderRepository = module.get(getRepositoryToken(Order));
    eventEmitter = module.get(EventEmitter2);
    dataSource = module.get(DataSource);
  });

  describe('checkout', () => {
    it('throws BadRequestException when the cart is empty', async () => {
      cartService.getCartEntityForCheckout.mockResolvedValue(makeCart([]));

      await expect(service.checkout(makeCheckoutDto(), 1, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when a variant has insufficient stock', async () => {
      const itemWithLowStock = makeCartItem({
        quantity: 5,
        variant: makeVariant({ stock: 2 }), // only 2 in stock, wants 5
      });
      cartService.getCartEntityForCheckout.mockResolvedValue(makeCart([itemWithLowStock]));

      await expect(service.checkout(makeCheckoutDto(), 1, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates order, decrements stock, clears cart and emits "order.created" on success', async () => {
      const item = makeCartItem({ quantity: 1, variant: makeVariant({ stock: 5 }) });
      const cart = makeCart([item]);

      cartService.getCartEntityForCheckout.mockResolvedValue(cart);
      cartService.clearCart.mockResolvedValue();

      const savedOrder: Partial<Order> = {
        id: 42,
        orderNumber: 'VN12345678901234',
        status: OrderStatus.PENDING,
      };

      queryRunner.manager.create.mockReturnValue(savedOrder);
      queryRunner.manager.save
        .mockResolvedValueOnce(savedOrder)   // save Order
        .mockResolvedValueOnce([{}]);        // save OrderItems

      orderRepository.findOne.mockResolvedValue(savedOrder);

      const result = await service.checkout(makeCheckoutDto(), 1, undefined);

      // Transaction should have been committed
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();

      // Stock decrement for each active item
      expect(queryRunner.manager.decrement).toHaveBeenCalledWith(
        Variant,
        { id: item.variantId },
        'stock',
        item.quantity,
      );

      // Cart must be cleared
      expect(cartService.clearCart).toHaveBeenCalledWith(1, undefined);

      // Event must be emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.created', savedOrder);

      // Result shape
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('bankInfo');
    });
  });
});
