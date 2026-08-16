# Promo Banners — Design Spec

## Context

The homepage has a manually-embedded, hardcoded promo banner (placeholder image + link) sitting between the "Sản phẩm nổi bật" (Featured Products) section and the per-category product sections (`app/page.tsx`). It was added directly in code based on annotation feedback.

The admin wants to be able to configure this banner's image/link themselves from the admin panel, without a code change, and wants the same mechanism to support additional banner slots elsewhere on the site in the future.

Decision: add a `banners` backend module (entity, API, admin CRUD) plus a small admin UI section ("Khuyến mại"), and swap the hardcoded homepage banner for a component that fetches its content from the API. New banner slots are added later by: (1) adding a new value to a code-defined `BannerPosition` enum, and (2) embedding `<PromoBanner position="..." />` at the new spot in the frontend.

## Goals

- Admin can edit the image, link, alt text, and active/inactive state of the existing homepage banner from `/admin/promotions`, with changes reflected on the homepage without a deploy.
- The banner slot ("position") concept is extensible: adding a new banner location elsewhere in the app requires an enum addition + one component embed, not a schema migration.
- Homepage never shows a broken or placeholder banner if no active banner is configured for a position — the slot just renders nothing.
- Follows existing repo conventions throughout (module/entity/DTO shape from `categories`, admin CRUD page shape from `admin/categories/page.tsx`, image upload via the existing `/upload/image` endpoint).

## Non-goals

- Banner carousels / multiple simultaneous banners per position (YAGNI — one active banner per slot for now).
- Scheduling (start/end dates for a banner going live).
- A generic "pick any page + any CSS position" placement builder — positions are a fixed, code-defined enum, not admin-authored.
- Migrating/replacing the existing top-of-page `HeroBanner` component — out of scope, this spec only covers the new promo-banner mechanism.
- A dedicated upload folder for banner images — they land in `uploads/products/` via the existing endpoint, same as product images.

## Architecture

### Backend — `banners` module

New module at `backend/src/banners/`, structured like `backend/src/categories/`:

- `banner-position.enum.ts`:
  ```ts
  export enum BannerPosition {
    HOMEPAGE_BEFORE_CATEGORIES = 'homepage_before_categories',
  }
  ```
  New slots are added here as new members. This is the single source of truth for which positions exist.

- `entities/banner.entity.ts` — `@Entity('banners')`:
  - `id: number` (PK, generated)
  - `position: string` (enum value, indexed — not `unique` alone, since history of inactive banners can share a position)
  - `imageUrl: string`
  - `linkUrl: string | null`
  - `altText: string`
  - `isActive: boolean` (default `true`)
  - `createdAt`, `updatedAt`

- `dto/create-banner.dto.ts` / `dto/update-banner.dto.ts`:
  - `position`: `@IsEnum(BannerPosition)`, required on create
  - `imageUrl`: `@IsString() @IsNotEmpty()`, required on create
  - `linkUrl`: `@IsOptional() @IsUrl()`
  - `altText`: `@IsString() @IsNotEmpty()`, required on create
  - `isActive`: `@IsOptional() @IsBoolean()`

- `banners.service.ts`:
  - `findAll()` — all banners, all positions, newest first (admin list)
  - `findActive(position: BannerPosition)` — the single active banner for a position, or `null`
  - `create(dto)` — if `dto.isActive !== false`, first deactivate any other banner sharing `dto.position` (single UPDATE), then insert
  - `update(id, dto)` — same deactivate-siblings behavior when `dto.isActive` is being set `true`
  - `remove(id)`

- `banners.controller.ts` (`@Controller('banners')`), mirroring `categories.controller.ts` auth shape:
  - `GET /banners` — **admin-only** (`JwtAuthGuard, AdminGuard`) — full list for the admin table
  - `GET /banners/active/:position` — **public** — used by the homepage; returns the active banner or `404`/`null` body (frontend treats both as "nothing configured")
  - `POST /banners` — admin-only
  - `PATCH /banners/:id` — admin-only
  - `DELETE /banners/:id` — admin-only

- `banners.module.ts` — registers the entity with TypeORM, exports the service (not currently needed elsewhere, but matches the pattern of other feature modules).

- Migration `AddBannersTable` in `backend/src/migrations/`, next number in the existing sequence, creating the `banners` table per the entity above.

- Image upload: no backend change. Admin UI reuses `POST /upload/image` exactly as the product form does.

### Admin UI

- `frontend/app/admin/layout.tsx`: add `{ href: '/admin/promotions', label: 'Khuyến mại', icon: '🎁' }` to `NAV_ITEMS`, positioned after "Danh mục".

- `frontend/app/admin/promotions/page.tsx`, structured like `admin/categories/page.tsx` (same `getToken()`/fetch/`useToast`/`ConfirmDialog` conventions):
  - **List**: rows with image thumbnail, position (mapped via a `POSITION_LABELS: Record<BannerPosition, string>` lookup to a Vietnamese label — starts with `{ homepage_before_categories: 'Trang chủ – trước danh mục' }`), link URL, active/inactive badge, Sửa/Xóa actions.
  - **Form modal** (create/edit), fields:
    - Vị trí — `<select>` populated from `BannerPosition` (not free text)
    - Ảnh — file input, uploads via `/upload/image` (same `FormData` flow as `admin/products/new/page.tsx`), shows a preview once uploaded, stores the returned `url` in form state
    - Link URL — optional text input
    - Alt text — text input
    - Kích hoạt — toggle switch (same styling as the categories form's `isActive` toggle)
  - Saving with "Kích hoạt" on surfaces a toast noting it replaces the previously active banner for that position (no extra confirm dialog — matches the lightweight tone of the rest of the admin CRUD).

### Public frontend integration

- `frontend/components/home/PromoBanner.tsx` — new server component:
  ```ts
  async function PromoBanner({ position }: { position: BannerPosition })
  ```
  - Fetches `GET /banners/active/:position` with `{ next: { revalidate: 300 } }`, matching the caching pattern already used in `CategoryGrid`/`ProductsByCategory`.
  - Renders `null` if the fetch fails, 404s, or returns no banner — so an unconfigured slot is invisible rather than broken.
  - When present, renders the same markup currently hardcoded in `page.tsx` (`Link` wrapping `Image`, `rounded-xl object-cover`).

- `frontend/lib/types.ts` (or co-located in `PromoBanner.tsx`) gets a `BannerPosition` string-literal type mirroring the backend enum's values — kept in sync by convention, same as other DTOs shared across the two apps in this repo (no shared package).

- `app/page.tsx`: the hardcoded `<Link><Image .../></Link>` block between `<FeaturedProducts />` and `<ProductsByCategory />` is replaced with:
  ```tsx
  <PromoBanner position="homepage_before_categories" />
  ```

## Testing

- Backend: `banners.service.spec.ts` unit tests covering the active-swap-on-create/update logic and `findActive` returning `null` when nothing is active; controller/e2e tests asserting the admin-only endpoints reject unauthenticated/non-admin requests and the `GET /banners/active/:position` endpoint is public, following the existing `categories` test files as the template.
- Frontend: no component tests for the new admin CRUD page (consistent with `categories`/`products` admin pages today). Add a test for `PromoBanner` confirming it renders nothing when the API returns no active banner.
