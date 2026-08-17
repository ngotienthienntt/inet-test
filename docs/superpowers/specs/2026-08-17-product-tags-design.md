# Product Audience Tags — Design Spec

## Context

The shop page (`/shop`) currently lets customers filter products by category and by price (`CategorySidebar.tsx`, single-select Link-based filters). There is no way to filter by target audience/use case (e.g. "for students", "for gamers", "for office workers") — a common e-commerce filtering dimension distinct from price.

Decision: add a curated, admin-managed `Tag` entity representing target-audience labels, a many-to-many relationship to `Product`, an admin CRUD page to manage the tag vocabulary, a tag picker on the product create/edit forms, and a new filter block in `CategorySidebar` alongside (not replacing) the existing price filter.

## Goals

- Admin can create/edit/delete a fixed vocabulary of audience tags from `/admin/tags`, and assign zero or more tags to each product from the product form.
- Customers can filter `/shop` by one tag at a time (consistent with how category/price filtering already works — single-select via URL, no new client-state paradigm), combinable with category and price filters simultaneously.
- Deleting a tag still in use on products is blocked with a clear error (matches the existing category-delete-block behavior), not silently orphaned.
- No regression to the existing price/category filters — this is purely additive.

## Non-goals

- Multi-select tag filtering (checkboxes selecting several tags at once) — out of scope for this pass; the existing sidebar filters are all single-select via `<Link>`, and multi-select would require introducing new client-side filter-state UX not otherwise present in this codebase. Can be revisited later.
- Wiring tags into the Elasticsearch/Postgres `search` module (`/api/search`) — `/shop` fetches from `/api/products`, not `/api/search`; category and price filters already only apply there, not in the search module either. Matching existing scope.
- Free-text/uncontrolled tags — rejected during brainstorming in favor of an admin-managed vocabulary, to keep the filter UI's tag list clean and consistent.
- A tag icon field — `Category` has one, but nothing in this feature's requirements calls for it; skip per YAGNI.

## Architecture

### Backend — new `tags` module

`backend/src/tags/`, structured identically to `backend/src/categories/`:

- `entities/tag.entity.ts` — `@Entity('tags')`: `id`, `name: string`, `slug: string` (`@Column({ unique: true })`), `createdAt` (`@CreateDateColumn`). No parent/children, no icon — simpler than `Category`.
- `dto/create-tag.dto.ts` (`name`, `slug` required strings) / `dto/update-tag.dto.ts` (`PartialType(CreateTagDto)`) — same shape as the category DTOs.
- `tags.service.ts`: `findAll()`, `findBySlug(slug)`, `create(dto)` (slug-uniqueness check, `ConflictException` on collision — mirrors `CategoriesService.create`), `update(id, dto)`, `remove(id)` (blocks with `BadRequestException` if any product still has this tag assigned, mirroring `CategoriesService.remove`'s product-count check — implemented via a count query against the `product_tags` join table).
- `tags.controller.ts` (`@Controller('tags')`): `GET /tags` (public), `GET /tags/:slug` (public), `POST /tags` / `PATCH /tags/:id` / `DELETE /tags/:id` (`JwtAuthGuard, AdminGuard`, mirroring `CategoriesController`).
- `tags.module.ts`: registers `Tag` with TypeORM, exports `TagsService`.
- Migration `CreateTagsTable` (`backend/src/migrations/1700000000008-CreateTagsTable.ts`, next number after `1700000000007-CreateBannersTable.ts`): creates `tags` table and the `product_tags` join table (`product_id`, `tag_id`, composite PK, FKs `ON DELETE CASCADE` to both `products` and `tags`).

### Product ↔ Tag relationship

- `Product` entity gains `@ManyToMany(() => Tag) @JoinTable({ name: 'product_tags', joinColumn: { name: 'product_id' }, inverseJoinColumn: { name: 'tag_id' } }) tags: Tag[]`.
- `ProductsModule` registers `Tag` in its own `TypeOrmModule.forFeature([...])` array (alongside `Product`, `ProductImage`, `ProductSpec`, `Variant`) so `ProductsService` can inject `@InjectRepository(Tag) tagRepo` directly — matching how `ProductsService` already owns `imageRepo`/`specRepo`/`variantRepo` directly rather than going through another module's service. No dependency on `TagsModule` needed.
- `PRODUCT_RELATIONS` in `products.service.ts` gains `'tags'`.
- `CreateProductDto`/`UpdateProductDto` gain `tagIds?: number[]` (`@IsArray() @IsInt({ each: true }) @IsOptional()`).
- `ProductsService.create()`: when `dto.tagIds` is present, look up `Tag` entities via `this.tagRepo.find({ where: { id: In(dto.tagIds) } })` and assign to `product.tags` before `save()` — same shape as how `images`/`specs`/`variants` are built from the DTO in `create()`, adapted for a relation to an *existing* entity (tags aren't created inline; only referenced by ID) rather than a cascaded child.
- `ProductsService.update()`: when `dto.tagIds !== undefined`, re-resolve via the same `In()` lookup and reassign `product.tags` (full replace, no need for the delete-then-recreate pattern used for images/specs/variants since this is a `@ManyToMany` relation — TypeORM's relation save handles the join-table diff).
- `ProductQueryDto` gains `tag?: string` (optional slug, `@IsString() @IsOptional()`, same shape as `category`).
- `ProductsService.findAll()`: when `query.tag` is set, `idQb.leftJoin('product.tags', 'tag').andWhere('tag.slug = :tagSlug', { tagSlug: query.tag })` — same pattern as the existing `category` join/filter a few lines above it.

### Admin UI

- `frontend/app/admin/layout.tsx`: add `{ href: '/admin/tags', label: 'Đối tượng', icon: '🏷️' }` to `NAV_ITEMS`, after "Danh mục" (before "Khuyến mại", matching the order these features were built).
- `frontend/app/admin/tags/page.tsx` — new file, structured identically to `admin/categories/page.tsx` (list + modal create/edit form: name input with slug auto-derived via the same `slugify()` helper, Sửa/Xóa actions, `ConfirmDialog` before delete, `useToast`). No parent/tree flattening needed (`Tag` has no hierarchy) — a flat list, simpler than the categories page's `flattenCategories` logic.
- `frontend/app/admin/products/new/page.tsx` and `frontend/app/admin/products/[id]/edit/page.tsx`: both gain:
  - `tags: number[]` state (selected tag IDs) alongside the existing `specs`/`variants` local state.
  - A fetch of `GET /api/tags` (parallel to the existing categories fetch in each file's `useEffect`).
  - A new "Đối tượng sử dụng" section rendered as a checkbox list (one checkbox per available tag, toggling membership in the `tags` array), placed after the specs section.
  - `tagIds: tags` included in the `POST /products` / `PATCH /products/:id` body.
  - The edit page additionally seeds `tags` state from `product.tags?.map(t => t.id) ?? []` when loading the existing product (same pattern as how it seeds `categoryId` from `product.category?.id`).

### Storefront UI

- `frontend/lib/types.ts`: add `export interface Tag { id: number; name: string; slug: string }`.
- `frontend/app/shop/layout.tsx`: add a `fetchTags()` function (parallel to the existing `fetchCategories()`), call both, pass `tags` down as a new prop through `SlidersHorizontalWrapper` to `CategorySidebar`.
- `frontend/components/shop/SlidersWrapper.tsx`: thread the new `tags` prop through to both `CategorySidebar` render call sites (mobile drawer and desktop aside) — no other change.
- `frontend/components/shop/CategorySidebar.tsx`: add an `activeTag = searchParams.get('tag')` read, and a new filter block below the existing "Lọc theo giá" block:
  ```tsx
  <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Lọc theo đối tượng sử dụng</h3>
  <div className="space-y-1.5">
    {tags.map(tag => {
      const active = activeTag === tag.slug
      const params = new URLSearchParams(searchParams.toString())
      if (active) params.delete('tag'); else params.set('tag', tag.slug)
      return (
        <Link key={tag.slug} href={`/shop?${params.toString()}`} className={/* same active/inactive classes as price ranges */}>
          {tag.name}
        </Link>
      )
    })}
  </div>
  ```
  Clicking the active tag again clears it (toggle-off), matching a natural single-select UX; clicking a different tag replaces it. Existing `category`/`minPrice`/`maxPrice` params in the URL are preserved (carried via `URLSearchParams(searchParams.toString())`), so tag filtering composes with the other filters rather than resetting them — this also means the existing price-range links (which currently build hrefs from scratch, e.g. `/shop?minPrice=...`) should be revisited for the same param-preserving treatment, but that's pre-existing behavior outside this feature's scope; only the new tag block needs to preserve params correctly since it's what's being added.
- `frontend/app/shop/page.tsx`: `ShopPageProps.searchParams` gains `tag?: string`; `fetchProducts()` forwards `params.tag` as `query.set('tag', params.tag)` when present, same shape as the existing `category`/`minPrice` forwarding.

## Testing

- Backend: `tags.service.spec.ts` (unit tests: CRUD, slug-conflict on create, remove blocked when a product still references the tag) following `banners.service.spec.ts`'s mock-repository pattern. `products.service.spec.ts` gains a test for `findAll()` with `query.tag` set (asserts the query builder join/where call), and for `create()`/`update()` resolving `tagIds` into the `tags` relation via the mocked `tagRepo.find`.
- Frontend: no automated tests (accepted repo-wide deviation — no test framework exists; see the promo-banners plan's Global Constraints for the original ruling). Manual verification: create 2-3 tags in `/admin/tags`, assign one to a product, confirm it appears under `/shop`'s new filter block, confirm clicking it filters correctly and composes with an existing category/price filter, confirm deleting a tag still assigned to a product is blocked with an error toast.
