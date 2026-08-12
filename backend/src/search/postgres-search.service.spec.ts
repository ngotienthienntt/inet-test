import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostgresSearchService } from './postgres-search.service';
import { Product } from '../products/entities/product.entity';
import { SearchQueryDto } from './dto/search-query.dto';

const mockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 1,
    name: 'Áo Thun Nam',
    slug: 'ao-thun-nam',
    description: 'Áo thun cotton',
    categoryId: 1,
    category: { id: 1, name: 'Thời trang', slug: 'thoi-trang' },
    badge: '',
    isActive: true,
    images: [],
    specs: [],
    variants: [{ size: 'M', colorName: 'Đen', price: 199000, originalPrice: 249000, stock: 10 }],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Product;

describe('PostgresSearchService', () => {
  let service: PostgresSearchService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getRawMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      getMany: jest.fn().mockResolvedValue([mockProduct()]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresSearchService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            find: jest.fn().mockResolvedValue([mockProduct()]),
          },
        },
      ],
    }).compile();

    service = module.get(PostgresSearchService);
    productRepo = module.get(getRepositoryToken(Product));
  });

  describe('search', () => {
    it('applies the text filter when q is provided', async () => {
      await service.search({ q: 'áo' } as SearchQueryDto);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :q OR product.description ILIKE :q)',
        { q: '%áo%' },
      );
    });

    it('applies category, price range filters and returns mapped ProductDocuments', async () => {
      const result = await service.search({
        category: 'thoi-trang,giay',
        minPrice: 100000,
        maxPrice: 300000,
      } as SearchQueryDto);

      expect(qb.andWhere).toHaveBeenCalledWith('category.slug IN (:...slugs)', {
        slugs: ['thoi-trang', 'giay'],
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('v.price AS NUMERIC) >= :minPrice'),
        { minPrice: 100000 },
      );
      expect(result.data[0]).toMatchObject({ id: 1, name: 'Áo Thun Nam', minPrice: 199000 });
      expect(result.total).toBe(1);
    });

    it('falls back to createdAt DESC when sort is relevance', async () => {
      await service.search({ sort: 'relevance' } as SearchQueryDto);

      expect(qb.orderBy).toHaveBeenCalledWith('product.createdAt', 'DESC');
    });

    it('sorts by min price ascending when sort is price_asc', async () => {
      await service.search({ sort: 'price_asc' } as SearchQueryDto);

      expect(qb.orderBy).toHaveBeenCalledWith('min_price', 'ASC');
    });

    it('returns an empty page without querying entities when there are no matching ids', async () => {
      qb.getRawMany.mockResolvedValueOnce([]);
      qb.getCount.mockResolvedValueOnce(0);

      const result = await service.search({} as SearchQueryDto);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
      expect(productRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('suggestions', () => {
    it('returns an empty array when q is empty', async () => {
      const result = await service.suggestions('');

      expect(result).toEqual([]);
      expect(productRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries with a prefix ILIKE and maps to id/name/category', async () => {
      const result = await service.suggestions('Áo');

      expect(qb.andWhere).toHaveBeenCalledWith('product.name ILIKE :q', { q: 'Áo%' });
      expect(result).toEqual([{ id: 1, name: 'Áo Thun Nam', category: 'Thời trang' }]);
    });
  });
});
