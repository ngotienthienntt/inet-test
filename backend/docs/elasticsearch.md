# Elasticsearch Index Mapping — `products`

## Index Creation

```json
PUT /products
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "id":            { "type": "integer" },
      "name": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description":   { "type": "text", "analyzer": "standard" },
      "category":      { "type": "keyword" },
      "categorySlug":  { "type": "keyword" },
      "badge":         { "type": "keyword" },
      "isActive":      { "type": "boolean" },
      "variants": {
        "type": "nested",
        "properties": {
          "size":          { "type": "keyword" },
          "colorName":     { "type": "keyword" },
          "price":         { "type": "double" },
          "originalPrice": { "type": "double" },
          "stock":         { "type": "integer" }
        }
      },
      "minPrice":  { "type": "double" },
      "maxPrice":  { "type": "double" },
      "createdAt": { "type": "date" }
    }
  }
}
```

---

## Field Reference

### `id` — `integer`

The PostgreSQL primary key of the product. Stored as an integer so Elasticsearch results can be joined back to the relational database efficiently. Not used for full-text scoring.

---

### `name` — `text` with `.keyword` sub-field

- **`text` (analyzed)**: Enables full-text search with relevance scoring. The `standard` analyzer tokenises, lowercases, and strips punctuation, allowing queries like `"running shoes"` to match `"Premium Running Shoes"`.
- **`.keyword` sub-field**: Preserves the raw, unanalyzed value for exact-match filters, aggregations (e.g., faceted UI), and sorting by product name alphabetically.

---

### `description` — `text`

Full-text searched but not sorted or aggregated, so no `.keyword` sub-field is needed. The `standard` analyzer is sufficient for Vietnamese/English mixed product descriptions.

---

### `category` — `keyword`

The human-readable category name (e.g., `"Giày Nam"`). Mapped as `keyword` because it is used only for:
- Exact-match filtering (`term` query)
- Bucket aggregations (category facets in search sidebar)

Analyzing it as `text` would break exact aggregations.

---

### `categorySlug` — `keyword`

URL-safe slug (e.g., `"giay-nam"`). Used for URL-driven category filtering on the frontend. Always an exact match; `keyword` is correct.

---

### `badge` — `keyword`

One of `HOT`, `SALE`, `MỚI`, or empty string. Used for:
- Exact filtering (`term: { badge: "SALE" }`)
- Badge-facet aggregations

No analysis needed — values are short, controlled vocabulary.

---

### `isActive` — `boolean`

Every search query should filter `isActive: true` to hide unpublished products. A dedicated boolean field is far more efficient than a string-based active flag.

---

### `variants` — `nested`

Variants are stored as a **nested** type rather than a plain `object` array. This is critical because Elasticsearch flattens plain arrays, which would corrupt cross-field queries such as:

> "Find products that have a red variant priced under 500,000 VND"

With `nested`, each variant is indexed as a hidden sub-document, allowing `nested` queries to correctly correlate `colorName + price` within the same variant object.

#### Nested fields

| Field | Type | Reason |
|---|---|---|
| `size` | `keyword` | Exact filter (S / M / L / XL); no full-text needed |
| `colorName` | `keyword` | Exact filter for color facets |
| `price` | `double` | Range queries (`range` filter for price slider) |
| `originalPrice` | `double` | Needed to compute discount percentage in UI |
| `stock` | `integer` | Filter out out-of-stock variants (`stock > 0`) |

---

### `minPrice` / `maxPrice` — `double`

Denormalised aggregates computed from all variants of a product. Used for:
- **Price range slider** at the product-list level (without needing a nested query every time)
- **Sorting by price** (`sort: { minPrice: "asc" }`)

Using `nested` queries for this on every sort/filter would be expensive; pre-computing these values at index time is the standard pattern.

---

### `createdAt` — `date`

ISO-8601 timestamp used for:
- Sorting by "newest arrivals"
- Date-range filters (e.g., products added in the last 30 days)

Elasticsearch's `date` type supports both ISO strings and epoch milliseconds.

---

## Sync Strategy

1. On product create/update/delete in PostgreSQL, publish an event via `@nestjs/event-emitter`.
2. The `SearchModule` listens for these events and calls the Elasticsearch client to index or delete the document.
3. A periodic full-reindex job (e.g., nightly cron) ensures consistency after any missed events.
