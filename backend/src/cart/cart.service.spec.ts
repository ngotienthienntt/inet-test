import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

const mockCart = (): Cart =>
  ({
    id: 10,
    userId: 1,
    sessionToken: null as unknown as string,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Cart;

const mockCartItem = (): CartItem =>
  ({
    id: 100,
    cartId: 10,
    variantId: 5,
    quantity: 2,
    savedForLater: false,
    createdAt: new Date(),
  }) as CartItem;

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<Repository<Cart>>;
  let cartItemRepository: jest.Mocked<Repository<CartItem>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useFactory: mockRepo },
        { provide: getRepositoryToken(CartItem), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
  });

  describe('getOrCreateCart', () => {
    it('returns existing cart when found by userId', async () => {
      const cart = mockCart();
      cartRepository.findOne.mockResolvedValue(cart);

      const result = await service.getOrCreateCart(1, undefined);

      expect(cartRepository.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(result).toEqual(cart);
      expect(cartRepository.create).not.toHaveBeenCalled();
      expect(cartRepository.save).not.toHaveBeenCalled();
    });

    it('creates and returns a new cart when no existing cart is found', async () => {
      const newCart = mockCart();
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.create.mockReturnValue(newCart);
      cartRepository.save.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart(1, undefined);

      expect(cartRepository.create).toHaveBeenCalledWith({
        userId: 1,
        sessionToken: undefined,
      });
      expect(cartRepository.save).toHaveBeenCalledWith(newCart);
      expect(result).toEqual(newCart);
    });
  });

  describe('addItem', () => {
    it('increments quantity when the same variant is already in the cart', async () => {
      const cart = mockCart();
      const existingItem = mockCartItem(); // variantId: 5, quantity: 2
      const cartWithItems = {
        ...cart,
        items: [existingItem],
      };

      // getOrCreateCart -> findOne (by userId) -> returns cart
      cartRepository.findOne
        .mockResolvedValueOnce(cart)       // getOrCreateCart
        .mockResolvedValueOnce(cartWithItems); // getCart (final return)

      cartItemRepository.findOne.mockResolvedValue(existingItem);
      cartItemRepository.save.mockResolvedValue({ ...existingItem, quantity: 4 });

      await service.addItem(1, undefined, { variantId: 5, quantity: 2 });

      expect(cartItemRepository.findOne).toHaveBeenCalledWith({
        where: { cartId: cart.id, variantId: 5 },
      });
      expect(existingItem.quantity).toBe(4);
      expect(cartItemRepository.save).toHaveBeenCalledWith(existingItem);
      expect(cartItemRepository.create).not.toHaveBeenCalled();
    });

    it('creates a new cart item when the variant is not already in the cart', async () => {
      const cart = mockCart();
      const newItem = mockCartItem();
      const cartWithItems = { ...cart, items: [newItem] };

      cartRepository.findOne
        .mockResolvedValueOnce(cart)       // getOrCreateCart
        .mockResolvedValueOnce(cartWithItems); // getCart

      cartItemRepository.findOne.mockResolvedValue(null);
      cartItemRepository.create.mockReturnValue(newItem);
      cartItemRepository.save.mockResolvedValue(newItem);

      await service.addItem(1, undefined, { variantId: 99, quantity: 1 });

      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cartId: cart.id,
        variantId: 99,
        quantity: 1,
      });
      expect(cartItemRepository.save).toHaveBeenCalledWith(newItem);
    });
  });

  describe('removeItem', () => {
    it('throws NotFoundException when the cart item does not exist in the user\'s cart', async () => {
      const cart = mockCart();
      cartRepository.findOne.mockResolvedValue(cart);
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(service.removeItem(999, 1, undefined)).rejects.toThrow(NotFoundException);

      expect(cartItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999, cartId: cart.id },
      });
    });
  });
});
