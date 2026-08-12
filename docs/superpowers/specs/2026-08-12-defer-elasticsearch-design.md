# Defer Elasticsearch — Design Spec

## Context

The shopvn e-commerce backend (NestJS) uses Elasticsearch for the `/search` endpoint (full-text search, filters, suggestions). The target deployment server is resource-constrained (1 CPU core, 2GB RAM, 20GB disk). Elasticsearch (a JVM process) alone needs ~700MB–1.2GB RAM and is CPU-heavy to start, which is too costly on this box.

Decision: defer running Elasticsearch. Search will run on PostgreSQL instead, with the ability to switch back to Elasticsearch later via configuration (no code changes) once the server is upgraded or ES is moved to its own host.

## Goals

- `/search` and `/search/suggestions` work correctly using PostgreSQL, with no functional regression in the response shape consumed by the frontend.
- Elasticsearch code is preserved (not deleted) and can be re-enabled via a single env var.
- The idle/disabled ES code path does no wasted work (no background sync, no reindex attempts) when Postgres is the active provider.
- `docker-compose.yml` no longer starts Elasticsearch by default.

## Non-goals

- Postgres full-text relevance ranking (tsvector/ts_rank) — out of scope for this pass; using `ILIKE`, matching the existing pattern in `ProductsService.findAll()`. Can be revisited later.
- Removing the Elasticsearch dependency (`@elastic/elasticsearch`) from `package.json`.
- Changing the frontend.

## Architecture

### Provider toggle

Add `SEARCH_PROVIDER` env var (`postgres` | `elasticsearch`, default `postgres`).

Introduce `ISearchService` interface (`search/search.interface.ts`) with `search(dto)` and `suggestions(q)`, matching the current `SearchService` public API.

- The existing `search.service.ts` becomes `ElasticsearchSearchService implements ISearchService`. Its internal logic is unchanged.
- A new `PostgresSearchService implements ISearchService` is added.
- `search.module.ts` registers both, plus a factory provider under a `SEARCH_SERVICE` DI token that selects the active implementation based on `ConfigService.get('SEARCH_PROVIDER')`, following the same factory-provider pattern already used for `ELASTICSEARCH_CLIENT` in `elasticsearch.module.ts`.
- `SearchController` injects `@Inject(SEARCH_SERVICE)` instead of the concrete `SearchService`.

### Idle ES pipeline

`SearchInitService` (bootstrap reindex) and `SearchSyncService` (event-driven reindex on product create/update/delete) each add an early return when `SEARCH_PROVIDER !== 'elasticsearch'`, so no ES calls are attempted when Postgres is active.

`ElasticsearchModule` is left as-is — the `Client` instance is cheap to construct and makes no network calls until a request is issued, so it's safe to leave registered even when unused.

### Shared response mapping

Extract `toProductDocument(product: Product): ProductDocument` out of `SearchIndexService.toDocument()` into `search/product-document.mapper.ts`. Both `PostgresSearchService` and the ES indexing path use this shared mapper, so the response shape returned to the frontend is identical regardless of active provider.

## PostgresSearchService behavior

### `search(dto: SearchQueryDto)`

Follows the existing two-step ID-then-entity pattern used in `ProductsService.findAll()` (paginate IDs first, then fetch full entities with relations — avoids the known TypeORM join + skip/take bug):

- Full-text: `(product.name ILIKE :q OR product.description ILIKE :q)` when `dto.q` is set
- Filters: `is_active = true` always; `category.slug IN (...)` for comma-separated `dto.category`; `EXISTS variant WHERE price >= minPrice` / `<= maxPrice` for price range
- Sort:
  - `price_asc` / `price_desc` — subquery `MIN(variant.price)`
  - `newest` — `createdAt DESC`
  - `relevance` (default) — falls back to `createdAt DESC`, since `ILIKE` has no relevance score. This is a known, accepted limitation, not a bug.
- Pagination: standard `page`/`limit`, same defaults as the ES version (`page=1`, `limit=20`, max `100`)
- Entities are fetched with relations (`category`, `images`, `specs`, `variants`) and mapped through `toProductDocument`
- Return type: `PaginatedResult<ProductDocument>` — identical shape to `ElasticsearchSearchService.search()`

### `suggestions(q: string)`

- `product.name ILIKE 'q%'` (prefix match) AND `is_active = true`
- `ORDER BY name ASC LIMIT 6`
- Maps to `{ id, name, category }`, matching `ElasticsearchSearchService.suggestions()`'s output shape

## Configuration changes

`docker-compose.yml`: comment out the `elasticsearch` service block entirely, with a comment explaining why (weak server) and how to re-enable (uncomment the block). The `elasticsearch_data` volume declaration stays, so any existing indexed data isn't lost if ES is turned back on later.

`.env.example` / `.env`: add `SEARCH_PROVIDER=postgres` with a comment noting `elasticsearch` as the alternative.

`src/config/env.validation.ts`:
- Add `SEARCH_PROVIDER: Joi.string().valid('postgres', 'elasticsearch').default('postgres')`
- Change `ES_NODE` from `.required()` to `.optional().default('http://localhost:9200')`, since the app must be able to start without Elasticsearch running when Postgres is the active provider

## Testing

- New unit test `postgres-search.service.spec.ts`, following the pattern in `products.service.spec.ts`: covers text search, category filter, price range filter, each sort option, pagination, and `suggestions()` prefix matching.
- No changes needed to any existing ES-related tests — their logic is unchanged, only the class name/export changes.
- Manual verification: run with `SEARCH_PROVIDER=postgres`, hit `/search?q=...` and `/search/suggestions?q=...`, confirm non-empty real results (as opposed to the current silent-empty-array behavior when ES is unreachable).

## Rollback / re-enable path

To re-enable Elasticsearch later: uncomment the `elasticsearch` service in `docker-compose.yml`, set `SEARCH_PROVIDER=elasticsearch` in `.env`, restart the backend. No code changes required.
