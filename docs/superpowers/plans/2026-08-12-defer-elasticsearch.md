# Defer Elasticsearch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/search` and `/search/suggestions` work on PostgreSQL by default, with Elasticsearch preserved and re-enablable via a `SEARCH_PROVIDER` env var, no code changes required to switch back.

**Architecture:** Extract a shared `ISearchService` interface and `ProductDocument` mapper so both an `ElasticsearchSearchService` (existing logic, renamed) and a new `PostgresSearchService` (ILIKE-based, mirrors `ProductsService.findAll()`'s query pattern) return identical response shapes. `SearchModule` picks the active implementation at runtime via a `SEARCH_SERVICE` DI token factory keyed on `ConfigService.get('SEARCH_PROVIDER')`. The idle provider's background jobs (ES index init/sync) are guarded to no-op.

**Tech Stack:** NestJS, TypeORM (Postgres), `@elastic/elasticsearch`, Jest.

## Global Constraints

- Default `SEARCH_PROVIDER=postgres`; `elasticsearch` remains a valid, fully-working alternative selectable via env only.
- No frontend changes — `ProductDocument` response shape must stay identical for both providers.
- Follow existing two-step ID-then-entity pagination pattern from `ProductsService.findAll()` (`backend/src/products/products.service.ts:31-113`) to avoid the known TypeORM join + skip/take bug.
- `relevance` sort has no real score under ILIKE — falls back to `createdAt DESC` (documented in code, not a bug).

---

### Task 1: Extract shared `ProductDocument` mapper

**Files:**
- Create: `backend/src/search/product-document.mapper.ts`
- Modify: `backend/src/search/search-index.service.ts`
- Modify: `backend/src/search/search.service.ts`

**Interfaces:**
- Produces: `ProductDocument` interface and `toProductDocument(product: Product): ProductDocument` function, both exported from `product-document.mapper.ts`. Later tasks import both from here.

- [ ] **Step 1: Create the mapper file**

```typescript
// backend/src/search/product-document.mapper.ts
import { Product } from '../products/entities/product.entity';

export interface ProductDocument {
  id: number;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  badge: string;
  isActive: boolean;
  images: string[];
  minPrice: number;
  maxPrice: number;
  variants: {
    size: string;
    colorName: string;
    price: number;
    originalPrice: number;
    stock: number;
  }[];
  createdAt: string;
}

export function toProductDocument(product: Product): ProductDocument {
  const prices = (product.variants ?? []).map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? '',
    category: product.category?.name ?? '',
    categorySlug: product.category?.slug ?? '',
    badge: product.badge ?? '',
    isActive: product.isActive,
    images: (product.images ?? []).map((img) => img.url),
    minPrice,
    maxPrice,
    variants: (product.variants ?? []).map((v) => ({
      size: v.size ?? '',
      colorName: v.colorName ?? '',
      price: Number(v.price),
      originalPrice: Number(v.originalPrice),
      stock: v.stock,
    })),
    createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Update `search-index.service.ts` to use the shared mapper**

Remove the local `ProductDocument` interface (lines 8-27) and the private `toDocument` method (lines 38-63) from `backend/src/search/search-index.service.ts`. Replace the top of the file with:

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { Product } from '../products/entities/product.entity';
import { ELASTICSEARCH_CLIENT } from '../elasticsearch/elasticsearch.module';
import { ProductDocument, toProductDocument } from './product-document.mapper';

const INDEX = 'products';

@Injectable()
export class SearchIndexService {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly esClient: Client,
  ) {}

  async ensureIndex(): Promise<void> {
```

Everywhere inside this file that previously called `this.toDocument(product)`, call `toProductDocument(product)` instead. There are two call sites: inside `indexProduct` and inside `reindexAll`'s `operations` map.

- [ ] **Step 3: Update `search.service.ts`'s import**

In `backend/src/search/search.service.ts`, replace:

```typescript
import { ProductDocument } from './search-index.service';
```

with:

```typescript
import { ProductDocument } from './product-document.mapper';
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/search/product-document.mapper.ts backend/src/search/search-index.service.ts backend/src/search/search.service.ts
git commit -m "refactor: extract shared ProductDocument mapper from SearchIndexService"
```

---

### Task 2: Add `ISearchService` interface and rename the ES service

**Files:**
- Create: `backend/src/search/search.interface.ts`
- Modify: `backend/src/search/search.service.ts` → rename to `backend/src/search/elasticsearch-search.service.ts`

**Interfaces:**
- Consumes: `ProductDocument` from `product-document.mapper.ts` (Task 1).
- Produces: `ISearchService` interface and `SEARCH_SERVICE` token, exported from `search.interface.ts`. `ElasticsearchSearchService` class, exported from `elasticsearch-search.service.ts`, implementing `ISearchService`. Later tasks (3, 4) depend on both.

- [ ] **Step 1: Create the interface file**

```typescript
// backend/src/search/search.interface.ts
import { PaginatedResult } from '../common/types/index';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument } from './product-document.mapper';

export const SEARCH_SERVICE = 'SEARCH_SERVICE';

export interface ISearchService {
  search(dto: SearchQueryDto): Promise<PaginatedResult<ProductDocument>>;
  suggestions(q: string): Promise<Pick<ProductDocument, 'id' | 'name' | 'category'>[]>;
}
```

- [ ] **Step 2: Rename `search.service.ts` to `elasticsearch-search.service.ts` and update the class**

```bash
git mv backend/src/search/search.service.ts backend/src/search/elasticsearch-search.service.ts
```

Edit `backend/src/search/elasticsearch-search.service.ts`: add the `ISearchService` import and have the class implement it — change:

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import type { Sort } from '@elastic/elasticsearch/lib/api/types';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument } from './product-document.mapper';
import { ELASTICSEARCH_CLIENT } from '../elasticsearch/elasticsearch.module';
import { PaginatedResult } from '../common/types/index';
import { ISearchService } from './search.interface';

const INDEX = 'products';

@Injectable()
export class ElasticsearchSearchService implements ISearchService {
  private readonly logger = new Logger(ElasticsearchSearchService.name);
```

The rest of the class body (constructor, `search`, `suggestions`) is unchanged.

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit -p tsconfig.json`
Expected: errors in `search.module.ts` and `search.controller.ts` (they still import the old `SearchService` name) — expected at this point, fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add backend/src/search/search.interface.ts backend/src/search/elasticsearch-search.service.ts
git commit -m "refactor: introduce ISearchService and rename SearchService to ElasticsearchSearchService"
```

---

### Task 3: Add `PostgresSearchService`

**Files:**
- Create: `backend/src/search/postgres-search.service.ts`
- Test: `backend/src/search/postgres-search.service.spec.ts`

**Interfaces:**
- Consumes: `ISearchService` from `search.interface.ts` (Task 2); `ProductDocument`, `toProductDocument` from `product-document.mapper.ts` (Task 1); `Product` entity from `../products/entities/product.entity`; `SearchQueryDto` from `./dto/search-query.dto`; `PaginatedResult` from `../common/types/index`.
- Produces: `PostgresSearchService` class implementing `ISearchService`. Task 4 wires it into `SearchModule`.

- [ ] **Step 1: Write the implementation**

```typescript
// backend/src/search/postgres-search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument, toProductDocument } from './product-document.mapper';
import { ISearchService } from './search.interface';
import { PaginatedResult } from '../common/types/index';

const PRODUCT_RELATIONS = ['category', 'images', 'specs', 'variants'];

@Injectable()
export class PostgresSearchService implements ISearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async search(dto: SearchQueryDto): Promise<PaginatedResult<ProductDocument>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const idQb = this.productRepo
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .where('product.is_active = :isActive', { isActive: true });

    if (dto.q) {
      idQb.andWhere(
        '(product.name ILIKE :q OR product.description ILIKE :q)',
        { q: `%${dto.q}%` },
      );
    }

    if (dto.category) {
      const slugs = dto.category.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length) {
        idQb.leftJoin('product.category', 'category')
          .andWhere('category.slug IN (:...slugs)', { slugs });
      }
    }

    if (dto.minPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) >= :minPrice)',
        { minPrice: dto.minPrice },
      );
    }

    if (dto.maxPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) <= :maxPrice)',
        { maxPrice: dto.maxPrice },
      );
    }

    switch (dto.sort) {
      case 'price_asc':
        idQb
          .addSelect(
            '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
            'min_price',
          )
          .orderBy('min_price', 'ASC');
        break;
      case 'price_desc':
        idQb
          .addSelect(
            '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
            'min_price',
          )
          .orderBy('min_price', 'DESC');
        break;
      case 'newest':
      case 'relevance':
      default:
        // ILIKE has no relevance score, so "relevance" falls back to newest-first.
        idQb.orderBy('product.createdAt', 'DESC');
        break;
    }

    const total = await idQb.getCount();
    const rows = await idQb.offset(skip).limit(limit).getRawMany<{ id: number }>();
    const ids = rows.map((r) => r.id);

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const entities = await this.productRepo.find({
      where: { id: In(ids) },
      relations: PRODUCT_RELATIONS,
    });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    const data = entities
      .sort((a, b) => idOrder.get(a.id)! - idOrder.get(b.id)!)
      .map(toProductDocument);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suggestions(q: string): Promise<Pick<ProductDocument, 'id' | 'name' | 'category'>[]> {
    if (!q) {
      return [];
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = true')
      .andWhere('product.name ILIKE :q', { q: `${q}%` })
      .orderBy('product.name', 'ASC')
      .limit(6)
      .getMany();

    return products.map((p) => ({ id: p.id, name: p.name, category: p.category?.name ?? '' }));
  }
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// backend/src/search/postgres-search.service.spec.ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && npx jest search/postgres-search.service.spec.ts`
Expected: FAIL — `Cannot find module './postgres-search.service'`.

- [ ] **Step 4: Confirm the implementation from Step 1 makes tests pass**

Run: `cd backend && npx jest search/postgres-search.service.spec.ts`
Expected: PASS (5 tests under `search`, 2 under `suggestions`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/search/postgres-search.service.ts backend/src/search/postgres-search.service.spec.ts
git commit -m "feat: add PostgresSearchService as an ILIKE-based search provider"
```

---

### Task 4: Wire the `SEARCH_SERVICE` provider toggle

**Files:**
- Modify: `backend/src/search/search.module.ts`
- Modify: `backend/src/search/search.controller.ts`

**Interfaces:**
- Consumes: `ElasticsearchSearchService` (Task 2), `PostgresSearchService` (Task 3), `SEARCH_SERVICE`/`ISearchService` (Task 2).
- Produces: `SEARCH_SERVICE`-tokened provider resolving to the active `ISearchService`, consumed by `SearchController`.

- [ ] **Step 1: Update `search.module.ts`**

```typescript
// backend/src/search/search.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductsModule } from '../products/products.module';
import { SearchIndexService } from './search-index.service';
import { ElasticsearchSearchService } from './elasticsearch-search.service';
import { PostgresSearchService } from './postgres-search.service';
import { SearchController } from './search.controller';
import { SearchSyncService } from './search-sync.service';
import { SearchInitService } from './search-init.service';
import { SEARCH_SERVICE } from './search.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), ProductsModule],
  controllers: [SearchController],
  providers: [
    SearchIndexService,
    ElasticsearchSearchService,
    PostgresSearchService,
    SearchSyncService,
    SearchInitService,
    {
      provide: SEARCH_SERVICE,
      inject: [ConfigService, ElasticsearchSearchService, PostgresSearchService],
      useFactory: (
        config: ConfigService,
        esService: ElasticsearchSearchService,
        pgService: PostgresSearchService,
      ) => (config.get<string>('SEARCH_PROVIDER') === 'elasticsearch' ? esService : pgService),
    },
  ],
  exports: [SearchIndexService, SEARCH_SERVICE],
})
export class SearchModule {}
```

- [ ] **Step 2: Update `search.controller.ts`**

```typescript
// backend/src/search/search.controller.ts
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchQueryDto } from './dto/search-query.dto';
import { ISearchService, SEARCH_SERVICE } from './search.interface';

@ApiTags('Search')
@Throttle({ short: { ttl: 1000, limit: 10 }, medium: { ttl: 60000, limit: 200 } })
@Controller('search')
export class SearchController {
  constructor(
    @Inject(SEARCH_SERVICE) private readonly searchService: ISearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search products', description: 'Full-text search with filters, sorting and pagination' })
  @ApiQuery({ name: 'q', required: false, description: 'Full-text search term' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug(s), comma-separated for multi-select' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'newest', 'relevance'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Search suggestions', description: 'Fast typeahead suggestions (responds under 200ms)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term for suggestions' })
  suggestions(@Query('q') q: string) {
    return this.searchService.suggestions(q ?? '');
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/search/search.module.ts backend/src/search/search.controller.ts
git commit -m "feat: select active search provider via SEARCH_PROVIDER at runtime"
```

---

### Task 5: Guard ES background jobs when Postgres is active

**Files:**
- Modify: `backend/src/search/search-init.service.ts`
- Modify: `backend/src/search/search-sync.service.ts`

**Interfaces:**
- Consumes: `ConfigService` from `@nestjs/config`.
- Produces: no-op behavior for both services when `SEARCH_PROVIDER !== 'elasticsearch'`.

- [ ] **Step 1: Update `search-init.service.ts`**

```typescript
// backend/src/search/search-init.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchIndexService } from './search-index.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SearchInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchInitService.name);

  constructor(
    private readonly searchIndexService: SearchIndexService,
    private readonly productsService: ProductsService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('SEARCH_PROVIDER') !== 'elasticsearch') {
      this.logger.log('SEARCH_PROVIDER is not "elasticsearch" — skipping ES index bootstrap');
      return;
    }

    try {
      await this.searchIndexService.ensureIndex();

      const count = await this.searchIndexService.countDocuments();
      if (count === 0) {
        this.logger.log('Elasticsearch index is empty — triggering full reindex');
        const result = await this.productsService.findAll({ page: 1, limit: 10000 });
        await this.searchIndexService.reindexAll(result.data);
      } else {
        this.logger.log(`Elasticsearch index already has ${count} documents — skipping reindex`);
      }
    } catch (err) {
      this.logger.warn(
        `Search init failed (app will continue without ES): ${(err as Error).message}`,
      );
    }
  }
}
```

- [ ] **Step 2: Update `search-sync.service.ts`**

```typescript
// backend/src/search/search-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchIndexService } from './search-index.service';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class SearchSyncService {
  private readonly logger = new Logger(SearchSyncService.name);

  constructor(
    private readonly searchIndexService: SearchIndexService,
    private readonly config: ConfigService,
  ) {}

  private get esActive(): boolean {
    return this.config.get<string>('SEARCH_PROVIDER') === 'elasticsearch';
  }

  @OnEvent('product.created')
  async onProductCreated(product: Product): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Indexing created product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.updated')
  async onProductUpdated(product: Product): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Re-indexing updated product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.deleted')
  async onProductDeleted(id: number): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Removing deleted product #${id} from index`);
    await this.searchIndexService.removeProduct(id);
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/search/search-init.service.ts backend/src/search/search-sync.service.ts
git commit -m "fix: skip Elasticsearch bootstrap/sync when SEARCH_PROVIDER is not elasticsearch"
```

---

### Task 6: Config, env, and docker-compose changes

**Files:**
- Modify: `backend/src/config/env.validation.ts`
- Modify: `backend/.env.example`
- Modify: `backend/.env`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: none.
- Produces: `SEARCH_PROVIDER` and optional `ES_NODE` env vars available via `ConfigService`, consumed by Tasks 4 and 5's factories/guards.

- [ ] **Step 1: Update `env.validation.ts`**

In `backend/src/config/env.validation.ts`, change:

```typescript
  ES_NODE: Joi.string().uri().required(),
```

to:

```typescript
  SEARCH_PROVIDER: Joi.string().valid('postgres', 'elasticsearch').default('postgres'),
  ES_NODE: Joi.string().uri().optional().default('http://localhost:9200'),
```

- [ ] **Step 2: Update `backend/.env.example`**

Change the `# Elasticsearch` section from:

```
# Elasticsearch
ES_NODE=http://localhost:9200
```

to:

```
# Search — "postgres" (default, works without Elasticsearch running) or "elasticsearch"
SEARCH_PROVIDER=postgres

# Elasticsearch (only used when SEARCH_PROVIDER=elasticsearch)
ES_NODE=http://localhost:9200
```

- [ ] **Step 3: Apply the same change to `backend/.env`**

Add `SEARCH_PROVIDER=postgres` to `backend/.env` next to its existing `ES_NODE` line (same comment as Step 2).

- [ ] **Step 4: Comment out the Elasticsearch service in `docker-compose.yml`**

In `docker-compose.yml`, wrap the `elasticsearch` service block in a comment, keeping the `elasticsearch_data` volume declaration active:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: shopvn_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: shopvn
      POSTGRES_USER: shopvn
      POSTGRES_PASSWORD: shopvn_secret
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U shopvn -d shopvn']
      interval: 10s
      timeout: 5s
      retries: 5

  # Elasticsearch is disabled by default — deferred because the target server
  # (1 CPU core / 2GB RAM) can't afford the ~700MB-1.2GB the JVM needs.
  # Set SEARCH_PROVIDER=elasticsearch in .env and uncomment this block to re-enable.
  # elasticsearch:
  #   image: elasticsearch:8.13.0
  #   container_name: shopvn_elasticsearch
  #   restart: unless-stopped
  #   environment:
  #     - discovery.type=single-node
  #     - xpack.security.enabled=false
  #     - ES_JAVA_OPTS=-Xms512m -Xmx512m
  #   ports:
  #     - '9200:9200'
  #   volumes:
  #     - elasticsearch_data:/usr/share/elasticsearch/data
  #   healthcheck:
  #     test: ['CMD-SHELL', 'curl -sf http://localhost:9200/_cluster/health || exit 1']
  #     interval: 15s
  #     timeout: 10s
  #     retries: 10

volumes:
  postgres_data:
  elasticsearch_data:
```

- [ ] **Step 5: Verify docker-compose config is valid**

Run: `docker compose config --quiet`
Expected: no output, exit code 0 (only the `postgres` service and both volumes remain defined).

- [ ] **Step 6: Commit**

```bash
git add backend/src/config/env.validation.ts backend/.env.example docker-compose.yml
git commit -m "chore: default SEARCH_PROVIDER to postgres, disable Elasticsearch in docker-compose"
```

Note: `backend/.env` is typically gitignored — check with `git status backend/.env` before adding; if untracked, skip staging it (leave the local edit in place) but still complete the other files in this commit.

---

### Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && npm test`
Expected: all suites pass, including `search/postgres-search.service.spec.ts`.

- [ ] **Step 2: Start Postgres only and boot the app**

Run: `docker compose up -d postgres && cd backend && npm run start:dev`
Expected: app boots without connecting to Elasticsearch; logs show `SEARCH_PROVIDER is not "elasticsearch" — skipping ES index bootstrap` from `SearchInitService`.

- [ ] **Step 3: Manually verify the search endpoints return real data**

Run: `curl "http://localhost:3001/search?q=áo"` and `curl "http://localhost:3001/search/suggestions?q=áo"`
Expected: non-empty `data`/array results from Postgres (assuming seeded data via `npm run seed:data`), not the previously silent empty-array ES-failure behavior.
