import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';

const mockCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 1,
    name: 'Điện thoại',
    slug: 'dien-thoai',
    icon: '',
    description: '',
    sortOrder: 0,
    isActive: true,
    parentId: null,
    children: [],
    createdAt: new Date(),
    ...overrides,
  }) as Category;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(CategoriesService);
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    // Regression test: TypeORM silently drops a raw `null` value from
    // FindOptionsWhere (no WHERE clause at all is generated), which used
    // to make every category — including ones with a real parentId —
    // come back as a top-level "parent" IN ADDITION to being correctly
    // nested under its actual parent's `children`, duplicating it in the
    // admin category list.
    it('queries with IsNull() for parentId, not a raw null', async () => {
      categoryRepo.find.mockResolvedValue([]);

      await service.findAll();

      const call = categoryRepo.find.mock.calls[0][0] as { where: { parentId: unknown } };
      expect(call.where.parentId).toEqual(IsNull());
    });

    it('only returns categories with no parent, each nested exactly once', async () => {
      const child = mockCategory({ id: 10, name: 'Phụ kiện', parentId: 2 });
      const parent = mockCategory({ id: 2, name: 'Điện thoại', children: [child] });
      categoryRepo.find.mockResolvedValue([parent]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(result[0].children).toEqual([child]);
    });

    it('filters isActive=true by default (public request)', async () => {
      categoryRepo.find.mockResolvedValue([]);

      await service.findAll(false);

      const call = categoryRepo.find.mock.calls[0][0] as { where: { isActive?: boolean } };
      expect(call.where.isActive).toBe(true);
    });

    it('omits the isActive filter when includeInactive is true (admin request)', async () => {
      categoryRepo.find.mockResolvedValue([]);

      await service.findAll(true);

      const call = categoryRepo.find.mock.calls[0][0] as { where: { isActive?: boolean } };
      expect(call.where.isActive).toBeUndefined();
    });
  });
});
