# Promo Banners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins configure the homepage promo banner (image/link/active state) from `/admin/promotions` instead of it being hardcoded, in a way that supports adding more banner slots later without a schema change.

**Architecture:** New NestJS `banners` module (entity + service + admin-guarded CRUD + one public read endpoint) mirroring the existing `categories` module. A code-defined `BannerPosition` enum is the fixed list of valid slots. The frontend gets a new `PromoBanner` server component that fetches the active banner for a given position and renders nothing if none is configured, replacing the hardcoded banner block in `app/page.tsx`. A new "Khuyến mại" admin page provides CRUD, reusing the existing `/upload/image` endpoint for banner images.

**Tech Stack:** NestJS + TypeORM + PostgreSQL (backend), Next.js App Router + React server components (frontend). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-16-promo-banners-design.md`

## Global Constraints

- Positions are a fixed enum defined in code (`BannerPosition`), never an admin-typed free string — admins pick from a dropdown of existing values only.
- Exactly one active banner per position at a time: creating/updating a banner with `isActive: true` deactivates any other banner sharing that position (soft — via UPDATE, never delete).
- Banner images are uploaded through the existing `POST /upload/image` endpoint — no new upload endpoint, no new storage folder.
- Admin-only endpoints use the existing `JwtAuthGuard, AdminGuard` pair, exactly as in `categories.controller.ts`. The "get active banner for a position" endpoint is public (no guards) — the homepage is unauthenticated.
- All user-facing strings (labels, error messages, toasts) are in Vietnamese, matching the existing admin UI's tone (see `admin/categories/page.tsx`).
- No `synchronize: true` — schema changes go through a TypeORM migration file (glob-loaded from `src/migrations/*.ts`, no manual registration needed).
- **Deviation from spec, discovered during planning:** the frontend has zero test infrastructure today (no test script, no jest/vitest config, no `.test.tsx` files anywhere in the repo). Adding a whole test framework for one component's test would be a disproportionate, unrequested dependency. This plan skips automated frontend tests and instead verifies `PromoBanner` and the admin page manually by running the dev server (Task 6 and Task 8 each end with a manual verification step). Backend tests proceed as planned — `jest` is already configured there.

---

## File Structure

**Backend — new `banners` module** (`backend/src/banners/`), shaped like `backend/src/categories/`:
- `banner-position.enum.ts` — the fixed list of valid slots
- `entities/banner.entity.ts`
- `dto/create-banner.dto.ts`, `dto/update-banner.dto.ts`
- `banners.service.ts` + `banners.service.spec.ts`
- `banners.controller.ts`
- `banners.module.ts`
- `backend/src/migrations/1700000000007-CreateBannersTable.ts`
- Modify `backend/src/app.module.ts` to register the module

**Frontend:**
- Modify `frontend/lib/types.ts` — add `BannerPosition` type + `Banner` interface
- Create `frontend/components/home/PromoBanner.tsx`
- Modify `frontend/app/page.tsx` — swap hardcoded banner block for `<PromoBanner />`
- Modify `frontend/app/admin/layout.tsx` — add "Khuyến mại" nav item
- Create `frontend/app/admin/promotions/page.tsx` — admin CRUD page

---

### Task 1: Banner entity, enum, and migration

**Files:**
- Create: `backend/src/banners/banner-position.enum.ts`
- Create: `backend/src/banners/entities/banner.entity.ts`
- Create: `backend/src/migrations/1700000000007-CreateBannersTable.ts`

**Interfaces:**
- Produces: `BannerPosition` enum (`HOMEPAGE_BEFORE_CATEGORIES = 'homepage_before_categories'`), `Banner` entity class with fields `id: number`, `position: string`, `imageUrl: string`, `linkUrl: string | null`, `altText: string`, `isActive: boolean`, `createdAt: Date`, `updatedAt: Date`. Later tasks (service, DTOs) import both from these exact paths.

- [ ] **Step 1: Create the `BannerPosition` enum**

```ts
// backend/src/banners/banner-position.enum.ts
export enum BannerPosition {
  HOMEPAGE_BEFORE_CATEGORIES = 'homepage_before_categories',
}
```

- [ ] **Step 2: Create the `Banner` entity**

```ts
// backend/src/banners/entities/banner.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  position: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'link_url', nullable: true })
  linkUrl: string | null;

  @Column({ name: 'alt_text' })
  altText: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 3: Write the migration**

```ts
// backend/src/migrations/1700000000007-CreateBannersTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBannersTable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "banners" (
        "id"         SERIAL      NOT NULL,
        "position"   VARCHAR     NOT NULL,
        "image_url"  VARCHAR     NOT NULL,
        "link_url"   VARCHAR,
        "alt_text"   VARCHAR     NOT NULL,
        "is_active"  BOOLEAN     NOT NULL DEFAULT true,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_banners_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banners_position" ON "banners" ("position")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "banners"`);
  }
}
```

- [ ] **Step 4: Run the migration against the local dev database**

Run: `cd backend && npm run migration:run`
Expected: output includes `CreateBannersTable1700000000007` and no errors. (Requires the local Postgres from `docker-compose.yml` to be up — start it first if it isn't: `docker compose up -d postgres`.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/banners/banner-position.enum.ts backend/src/banners/entities/banner.entity.ts backend/src/migrations/1700000000007-CreateBannersTable.ts
git commit -m "feat(banners): add Banner entity, position enum, and migration"
```

---

### Task 2: Create/Update DTOs

**Files:**
- Create: `backend/src/banners/dto/create-banner.dto.ts`
- Create: `backend/src/banners/dto/update-banner.dto.ts`

**Interfaces:**
- Consumes: `BannerPosition` from `backend/src/banners/banner-position.enum.ts` (Task 1)
- Produces: `CreateBannerDto` (fields: `position: BannerPosition`, `imageUrl: string`, `linkUrl?: string`, `altText: string`, `isActive?: boolean`), `UpdateBannerDto` (all fields optional, same shape). Task 3 (service) and Task 4 (controller) import both from these exact paths.

- [ ] **Step 1: Write `CreateBannerDto`**

```ts
// backend/src/banners/dto/create-banner.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition } from '../banner-position.enum';

export class CreateBannerDto {
  @ApiProperty({ enum: BannerPosition, example: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiProperty({ example: 'http://localhost:3001/uploads/products/1234-banner.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/shop?category=dien-thoai' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false })
  linkUrl?: string;

  @ApiProperty({ example: 'Banner khuyến mãi điện thoại' })
  @IsString()
  @IsNotEmpty()
  altText: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

- [ ] **Step 2: Write `UpdateBannerDto`**

```ts
// backend/src/banners/dto/update-banner.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateBannerDto } from './create-banner.dto';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
```

- [ ] **Step 3: Verify the project still builds**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors (DTOs compile; nothing consumes them yet so this just checks syntax/types).

- [ ] **Step 4: Commit**

```bash
git add backend/src/banners/dto/create-banner.dto.ts backend/src/banners/dto/update-banner.dto.ts
git commit -m "feat(banners): add create/update DTOs"
```

---

### Task 3: BannersService, with tests

**Files:**
- Create: `backend/src/banners/banners.service.ts`
- Create: `backend/src/banners/banners.service.spec.ts`

**Interfaces:**
- Consumes: `Banner` entity (Task 1), `CreateBannerDto`/`UpdateBannerDto` (Task 2), `BannerPosition` enum (Task 1)
- Produces: `BannersService` with methods `findAll(): Promise<Banner[]>`, `findActive(position: string): Promise<Banner | null>`, `create(dto: CreateBannerDto): Promise<Banner>`, `update(id: number, dto: UpdateBannerDto): Promise<Banner>`, `remove(id: number): Promise<void>`. Task 4 (controller) calls these exact method names/signatures.

- [ ] **Step 1: Write the failing tests**

```ts
// backend/src/banners/banners.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';
import { BannerPosition } from './banner-position.enum';

const mockBanner = (overrides: Partial<Banner> = {}): Banner =>
  ({
    id: 1,
    position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
    imageUrl: 'http://localhost:3001/uploads/products/banner.jpg',
    linkUrl: null,
    altText: 'Banner khuyến mãi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Banner;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
});

describe('BannersService', () => {
  let service: BannersService;
  let repo: jest.Mocked<Repository<Banner>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: getRepositoryToken(Banner), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
    repo = module.get(getRepositoryToken(Banner));
  });

  describe('findAll', () => {
    it('returns all banners newest first', async () => {
      const banners = [mockBanner()];
      repo.find.mockResolvedValue(banners);

      const result = await service.findAll();

      expect(result).toBe(banners);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('findActive', () => {
    it('returns the active banner for a position', async () => {
      const banner = mockBanner();
      repo.findOne.mockResolvedValue(banner);

      const result = await service.findActive(BannerPosition.HOMEPAGE_BEFORE_CATEGORIES);

      expect(result).toBe(banner);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES, isActive: true },
      });
    });

    it('returns null when no banner is active for that position', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findActive(BannerPosition.HOMEPAGE_BEFORE_CATEGORIES);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deactivates other active banners in the same position before inserting an active one', async () => {
      const dto = {
        position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
        imageUrl: 'http://x/banner.jpg',
        altText: 'Alt',
        isActive: true,
      };
      const created = mockBanner();
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.update).toHaveBeenCalledWith(
        { position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES, isActive: true },
        { isActive: false },
      );
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('does not deactivate siblings when creating an inactive banner', async () => {
      const dto = {
        position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
        imageUrl: 'http://x/banner.jpg',
        altText: 'Alt',
        isActive: false,
      };
      const created = mockBanner({ isActive: false });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.create(dto);

      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the banner does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { altText: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('deactivates siblings when activating a banner', async () => {
      const existing = mockBanner({ isActive: false });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, isActive: true });

      await service.update(1, { isActive: true });

      expect(repo.update).toHaveBeenCalledWith(
        { position: existing.position, isActive: true },
        { isActive: false },
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the banner does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('removes the banner when it exists', async () => {
      const existing = mockBanner();
      repo.findOne.mockResolvedValue(existing);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && npx jest src/banners/banners.service.spec.ts`
Expected: FAIL — `Cannot find module './banners.service'`

- [ ] **Step 3: Write the implementation**

```ts
// backend/src/banners/banners.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive(position: string): Promise<Banner | null> {
    return this.bannerRepo.findOne({ where: { position, isActive: true } });
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    if (dto.isActive !== false) {
      await this.deactivateSiblings(dto.position);
    }
    const banner = this.bannerRepo.create(dto);
    return this.bannerRepo.save(banner);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner #${id} not found`);
    }
    if (dto.isActive === true) {
      await this.deactivateSiblings(dto.position ?? banner.position);
    }
    Object.assign(banner, dto);
    return this.bannerRepo.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner #${id} not found`);
    }
    await this.bannerRepo.remove(banner);
  }

  private async deactivateSiblings(position: string): Promise<void> {
    await this.bannerRepo.update({ position, isActive: true }, { isActive: false });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && npx jest src/banners/banners.service.spec.ts`
Expected: PASS, all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add backend/src/banners/banners.service.ts backend/src/banners/banners.service.spec.ts
git commit -m "feat(banners): add BannersService with active-per-position logic"
```

---

### Task 4: BannersController, BannersModule, and app wiring

**Files:**
- Create: `backend/src/banners/banners.controller.ts`
- Create: `backend/src/banners/banners.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `BannersService` (Task 3), `CreateBannerDto`/`UpdateBannerDto` (Task 2), `JwtAuthGuard` (`backend/src/auth/guards/jwt-auth.guard.ts`), `AdminGuard` (`backend/src/auth/guards/admin.guard.ts`)
- Produces: `GET /banners` (admin), `GET /banners/active/:position` (public), `POST /banners` (admin), `PATCH /banners/:id` (admin), `DELETE /banners/:id` (admin). Frontend tasks (5, 8) call these exact routes.

- [ ] **Step 1: Write the controller**

```ts
// backend/src/banners/banners.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @ApiOperation({ summary: 'Get all banners, all positions (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all banners' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @ApiOperation({ summary: 'Get the active banner for a position (public)' })
  @ApiResponse({ status: 200, description: 'The active banner, or null if none is configured' })
  @Get('active/:position')
  findActive(@Param('position') position: string) {
    return this.bannersService.findActive(position);
  }

  @ApiOperation({ summary: 'Create a new banner (admin only)' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @ApiOperation({ summary: 'Update a banner by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a banner by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }
}
```

Note: `GET /banners/active/:position` must be registered before no other `:id`-shaped route conflicts with it — since `banners.controller.ts` only has `Get()` and `Get('active/:position')`, there's no collision here (unlike routes such as `Get(':id')` which would need to come after literal-prefixed routes; not an issue in this controller, but worth knowing for the next slot added later).

- [ ] **Step 2: Write the module**

```ts
// backend/src/banners/banners.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
```

- [ ] **Step 3: Register `BannersModule` in `AppModule`**

In `backend/src/app.module.ts`, add the import:

```ts
import { BannersModule } from './banners/banners.module';
```

And add `BannersModule` to the `imports` array, after `UploadModule`:

```ts
    AdminModule,
    UploadModule,
    BannersModule,
  ],
```

- [ ] **Step 4: Start the backend and smoke-test the routes**

Run: `cd backend && npm run start:dev`

In another terminal:
```bash
# Public endpoint — should return null (no banners created yet)
curl -s http://localhost:3001/api/banners/active/homepage_before_categories

# Admin endpoint without a token — should 401
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/banners
```
Expected: first command prints `null`, second prints `401`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/banners/banners.controller.ts backend/src/banners/banners.module.ts backend/src/app.module.ts
git commit -m "feat(banners): add BannersController, BannersModule, and wire into AppModule"
```

---

### Task 5: Frontend types and `PromoBanner` component

**Files:**
- Modify: `frontend/lib/types.ts`
- Create: `frontend/components/home/PromoBanner.tsx`

**Interfaces:**
- Produces: `BannerPosition` type (string literal union), `Banner` interface (`id`, `position`, `imageUrl`, `linkUrl`, `altText`, `isActive`), `PromoBanner` server component with prop `{ position: BannerPosition }`. Task 6 (page.tsx) and Task 8 (admin page) import these.

- [ ] **Step 1: Add the `BannerPosition` type and `Banner` interface to `lib/types.ts`**

Append to `frontend/lib/types.ts`:

```ts
export type BannerPosition = 'homepage_before_categories'

export interface Banner {
  id: number
  position: BannerPosition
  imageUrl: string
  linkUrl: string | null
  altText: string
  isActive: boolean
}
```

- [ ] **Step 2: Write the `PromoBanner` component**

```tsx
// frontend/components/home/PromoBanner.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Banner, BannerPosition } from '@/lib/types'

async function fetchActiveBanner(position: BannerPosition): Promise<Banner | null> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/banners/active/${position}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

export default async function PromoBanner({ position }: { position: BannerPosition }) {
  const banner = await fetchActiveBanner(position)
  if (!banner) return null

  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.altText}
      width={1200}
      height={200}
      unoptimized
      className="w-full h-auto rounded-xl object-cover"
    />
  )

  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className="block">
      {image}
    </Link>
  ) : (
    <div>{image}</div>
  )
}
```

- [ ] **Step 3: Verify the project builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/types.ts frontend/components/home/PromoBanner.tsx
git commit -m "feat(banners): add BannerPosition/Banner types and PromoBanner component"
```

---

### Task 6: Wire `PromoBanner` into the homepage

**Files:**
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Consumes: `PromoBanner` component (Task 5), prop `position: BannerPosition`

- [ ] **Step 1: Replace the hardcoded banner block**

In `frontend/app/page.tsx`, replace:

```tsx
        <Link href="/shop" className="block">
          <Image
            src="https://placehold.co/1200x200/1c3b71/ffffff?text=Khuyến+mãi"
            alt="Banner khuyến mãi"
            width={1200}
            height={200}
            unoptimized
            className="w-full h-auto rounded-xl object-cover"
          />
        </Link>
```

with:

```tsx
        <PromoBanner position="homepage_before_categories" />
```

Update the imports at the top of the file: remove `import Image from 'next/image'` and `import Link from 'next/link'` if nothing else in the file uses them, and add:

```tsx
import PromoBanner from '@/components/home/PromoBanner'
```

- [ ] **Step 2: Verify the project builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual verification — no banner configured yet**

Run: `cd frontend && npm run dev` (with the backend from Task 4 also running)

Open `http://localhost:3000` in a browser. Expected: the page renders normally with no gap, broken image, or placeholder where the banner used to be — `PromoBanner` returns `null` since no `Banner` row exists yet.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat(banners): replace hardcoded homepage banner with PromoBanner"
```

---

### Task 7: Admin nav item

**Files:**
- Modify: `frontend/app/admin/layout.tsx`

**Interfaces:**
- Produces: sidebar link to `/admin/promotions`, consumed visually once Task 8 creates that page.

- [ ] **Step 1: Add the nav entry**

In `frontend/app/admin/layout.tsx`, in `NAV_ITEMS`, insert after the "Danh mục" entry:

```ts
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/products', label: 'Sản phẩm', icon: '📦' },
  { href: '/admin/categories', label: 'Danh mục', icon: '🗂️' },
  { href: '/admin/promotions', label: 'Khuyến mại', icon: '🎁' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '🛒' },
```

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run dev`, log into `/admin/login`, open `/admin`.
Expected: sidebar shows "🎁 Khuyến mại" between "Danh mục" and "Đơn hàng". Clicking it 404s for now (page comes in Task 8) — that's expected at this point.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "feat(banners): add Khuyến mại nav item to admin sidebar"
```

---

### Task 8: Admin promotions CRUD page

**Files:**
- Create: `frontend/app/admin/promotions/page.tsx`

**Interfaces:**
- Consumes: `Banner`/`BannerPosition` types (Task 5), backend routes `GET/POST /banners`, `PATCH/DELETE /banners/:id` (Task 4), `POST /upload/image` (existing), `useToast` (`@/hooks/useToast`), `ToastContainer` (`@/components/ui/Toast`), `ConfirmDialog` (`@/components/ui/ConfirmDialog`)

- [ ] **Step 1: Write the admin page**

```tsx
// frontend/app/admin/promotions/page.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Banner, BannerPosition } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : '' }

const POSITION_LABELS: Record<BannerPosition, string> = {
  homepage_before_categories: 'Trang chủ – trước danh mục',
}

const POSITION_OPTIONS = Object.keys(POSITION_LABELS) as BannerPosition[]

const EMPTY_FORM = {
  position: POSITION_OPTIONS[0],
  imageUrl: '',
  linkUrl: '',
  altText: '',
  isActive: true,
}

export default function AdminPromotionsPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Banner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, toast, close } = useToast()
  const [confirm, setConfirm] = useState<{ id: number; label: string } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API_URL}/banners`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(banner: Banner) {
    setEditTarget(banner)
    setForm({
      position: banner.position,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? '',
      altText: banner.altText,
      isActive: banner.isActive,
    })
    setError('')
    setShowForm(true)
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0])
      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload thất bại')
      setForm(prev => ({ ...prev, imageUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const body = {
        position: form.position,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        altText: form.altText,
        isActive: form.isActive,
      }
      const url = editTarget ? `${API_URL}/banners/${editTarget.id}` : `${API_URL}/banners`
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Lỗi lưu banner'); return }
      setShowForm(false)
      toast(
        form.isActive
          ? `Đã lưu banner. Banner này thay thế banner đang bật trước đó ở vị trí "${POSITION_LABELS[form.position]}".`
          : (editTarget ? 'Đã cập nhật banner' : 'Đã thêm banner mới'),
        'success',
      )
      load()
    } catch { setError('Lỗi kết nối') } finally { setSaving(false) }
  }

  async function doDelete(id: number, label: string) {
    const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.message || 'Không thể xóa banner', 'error')
      return
    }
    toast(`Đã xóa banner "${label}"`, 'success')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Khuyến mại</h1>
          <p className="text-sm text-gray-500 mt-1">{banners.length} banner</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4fa3] transition-colors">
          + Thêm banner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#1c3b71]">{editTarget ? 'Sửa banner' : 'Thêm banner'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí *</label>
              <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value as BannerPosition }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]">
                {POSITION_OPTIONS.map(pos => <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh *</label>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2 border border-gray-200" />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleUpload(e.target.files)} className="text-sm" />
              {uploading && <p className="text-xs text-gray-400 mt-1">Đang tải ảnh...</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="/shop?category=dien-thoai" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt text *</label>
              <input value={form.altText} onChange={e => setForm(p => ({ ...p, altText: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-[#3762cc]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || uploading || !form.imageUrl || !form.altText} className="flex-1 py-2.5 bg-[#3762cc] text-white rounded-lg font-semibold text-sm hover:bg-[#2a4fa3] disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có banner nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {banners.map(banner => (
              <div key={banner.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.imageUrl} alt="" className="w-20 h-12 object-cover rounded-lg border border-gray-200" />
                  <div>
                    <div className="font-medium text-gray-900">{POSITION_LABELS[banner.position]}</div>
                    <div className="text-xs text-gray-400 font-mono">{banner.linkUrl || '(không có link)'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.isActive ? 'Đang bật' : 'Tắt'}
                  </span>
                  <button onClick={() => openEdit(banner)} className="text-[#3762cc] hover:underline text-sm">Sửa</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => setConfirm({ id: banner.id, label: POSITION_LABELS[banner.position] })} className="text-red-500 hover:underline text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={close} />
      <ConfirmDialog
        open={confirm !== null}
        title="Xóa banner"
        message={`Bạn có chắc muốn xóa banner ở vị trí "${confirm?.label}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => { if (confirm) { doDelete(confirm.id, confirm.label); setConfirm(null) } }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the project builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual end-to-end verification**

With backend and frontend dev servers running:
1. Log into `/admin/login`, open `/admin/promotions`.
2. Click "+ Thêm banner", pick an image file, fill in Alt text, leave "Kích hoạt" on, save.
3. Confirm the toast appears and the new banner shows in the list as "Đang bật".
4. Open `http://localhost:3000` in another tab — the banner now appears between "Sản phẩm nổi bật" and "Điện thoại", pointing at the uploaded image.
5. Back in `/admin/promotions`, toggle the banner off ("Kích hoạt" off) and save; reload the homepage — the banner is gone (`PromoBanner` returns `null` again).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/admin/promotions/page.tsx
git commit -m "feat(banners): add admin promotions CRUD page"
```

---

## Plan Self-Review Notes

- **Spec coverage:** entity/enum/migration (Task 1), DTOs (Task 2), service with active-swap logic (Task 3), controller/module/auth wiring (Task 4), frontend types + `PromoBanner` (Task 5), homepage wiring (Task 6), admin nav (Task 7), admin CRUD page with upload (Task 8) — all spec sections have a task.
- **Frontend testing gap:** spec called for a `PromoBanner` render test; addressed as a Global Constraints deviation with manual verification steps in Tasks 6 and 8, since no test framework exists in the frontend today.
- **Type consistency checked:** `Banner`/`BannerPosition` (Task 5) match the backend `Banner` entity fields (Task 1) and are used identically in `PromoBanner.tsx` (Task 5), `page.tsx` (Task 6), and `admin/promotions/page.tsx` (Task 8). `BannersService` method names (`findAll`, `findActive`, `create`, `update`, `remove`) match what `BannersController` (Task 4) calls.
