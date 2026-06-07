import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpec } from './entities/product-spec.entity';
import { Variant } from './entities/variant.entity';

const mockProduct = (): Product =>
  ({
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    categoryId: 1,
    badge: '',
    isActive: true,
    images: [],
    specs: [],
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Product;

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let imageRepo: jest.Mocked<Repository<ProductImage>>;
  let specRepo: jest.Mocked<Repository<ProductSpec>>;
  let variantRepo: jest.Mocked<Repository<Variant>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
        { provide: getRepositoryToken(ProductImage), useFactory: mockRepo },
        { provide: getRepositoryToken(ProductSpec), useFactory: mockRepo },
        { provide: getRepositoryToken(Variant), useFactory: mockRepo },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    imageRepo = module.get(getRepositoryToken(ProductImage));
    specRepo = module.get(getRepositoryToken(ProductSpec));
    variantRepo = module.get(getRepositoryToken(Variant));
    eventEmitter = module.get(EventEmitter2);
  });

  describe('findBySlug', () => {
    it('returns the product when found', async () => {
      const product = mockProduct();
      productRepo.findOne.mockResolvedValue(product);

      const result = await service.findBySlug('test-product');

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-product', isActive: true },
        relations: expect.arrayContaining(['category', 'images', 'specs', 'variants']),
      });
      expect(result).toEqual(product);
    });

    it('throws NotFoundException when product is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('sets isActive to false and saves the product', async () => {
      const product = mockProduct();
      // findById is called internally — it uses findOne with { where: { id } }
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isActive: false });

      await service.remove(1);

      expect(product.isActive).toBe(false);
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('emits "product.deleted" event with the product id', async () => {
      const product = mockProduct();
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isActive: false });

      await service.remove(1);

      expect(eventEmitter.emit).toHaveBeenCalledWith('product.deleted', 1);
    });
  });

  describe('create', () => {
    it('saves the product and emits "product.created" event', async () => {
      const product = mockProduct();
      const dto = {
        name: 'Test Product',
        slug: 'test-product',
        categoryId: 1,
        description: 'A test product',
      };

      productRepo.create.mockReturnValue(product);
      productRepo.save.mockResolvedValue(product);
      // findById (called after save) also uses findOne
      productRepo.findOne.mockResolvedValue(product);
      imageRepo.create.mockImplementation((img) => img as ProductImage);
      specRepo.create.mockImplementation((spec) => spec as ProductSpec);
      variantRepo.create.mockImplementation((v) => v as Variant);

      const result = await service.create(dto);

      expect(productRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('product.created', product);
      expect(result).toEqual(product);
    });
  });
});
