# Product Audience Tags — Implementation Plan (condensed)

**Spec:** `docs/superpowers/specs/2026-08-17-product-tags-design.md`
**Executed:** inline, directly by the controller session (no subagent dispatch) — user asked for speed over the full per-task review ceremony used for the promo-banners feature.

## Tasks

1. **Backend: `Tag` entity + migration** — `backend/src/tags/entities/tag.entity.ts` (mirrors `Category`, no parent/icon: `id`, `name`, `slug` unique, `createdAt`). Migration `1700000000008-CreateTagsTable.ts`: `tags` table + `product_tags` join table (composite PK `product_id`+`tag_id`, FKs `ON DELETE CASCADE` to both).
2. **Backend: Tag DTOs + service + controller + module** — mirror `categories` module exactly (`create-tag.dto.ts`, `update-tag.dto.ts`, `tags.service.ts` with slug-conflict check + remove-blocked-if-in-use, `tags.controller.ts` public GET / admin-guarded POST-PATCH-DELETE, `tags.module.ts`). Wire into `app.module.ts`.
3. **Backend: Product ↔ Tag wiring** — add `tags: Tag[]` `@ManyToMany`+`@JoinTable` to `Product` entity; register `Tag` in `ProductsModule`'s `TypeOrmModule.forFeature`; add `'tags'` to `PRODUCT_RELATIONS`; `CreateProductDto`/`UpdateProductDto` gain `tagIds?: number[]`; `ProductsService.create/update` resolve `tagIds` via `tagRepo.find({ where: { id: In(tagIds) } })` and assign `product.tags`; `ProductQueryDto` gains `tag?: string`; `findAll()` joins+filters by `tag.slug`. Tests: `tags.service.spec.ts` (CRUD + remove-blocked) and additions to `products.service.spec.ts` (tag filter, tagIds resolution).
4. **Frontend: types + admin nav** — `Tag` interface in `lib/types.ts`; `{ href: '/admin/tags', label: 'Đối tượng', icon: '🏷️' }` in `admin/layout.tsx` NAV_ITEMS, after "Danh mục".
5. **Frontend: `/admin/tags` CRUD page** — `frontend/app/admin/tags/page.tsx`, flat list (no tree), mirrors `admin/categories/page.tsx` (modal form: name + auto-slug, Sửa/Xóa, `ConfirmDialog`, `useToast`).
6. **Frontend: product form tag picker** — in both `admin/products/new/page.tsx` and `admin/products/[id]/edit/page.tsx`: fetch `/api/tags`, add `tags: number[]` state, checkbox list section "Đối tượng sử dụng", include `tagIds` in save payload; edit page seeds from `product.tags?.map(t => t.id)`.
7. **Frontend: storefront filter** — `fetchTags()` in `shop/layout.tsx`, threaded through `SlidersWrapper.tsx` to `CategorySidebar.tsx` as a `tags` prop; new "Lọc theo đối tượng sử dụng" block (Link-based single-select/toggle, preserves other query params via `URLSearchParams`); `shop/page.tsx` forwards `tag` param to `/api/products`.

## Verification (per task, lightweight)

- Backend: `npx tsc --noEmit` + `npx jest src/tags src/products` after tasks 1-3.
- Frontend: `npx tsc --noEmit` after tasks 4-7.
- Manual: create 2 tags, assign to a product, filter `/shop` by tag, confirm composes with category/price, confirm delete-blocked-when-in-use.

## Global constraints (carried from spec)

- Single-select tag filter (Link-based, matches existing category/price pattern) — no multi-select checkboxes.
- No changes to the `search` module — `/shop` only ever calls `/api/products`.
- No frontend automated tests (repo-wide accepted deviation).
