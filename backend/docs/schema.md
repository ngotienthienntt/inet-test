# PostgreSQL Database Schema

## Overview

This document defines the PostgreSQL schema for the ShopVN e-commerce platform.
All tables use `BIGSERIAL` or `SERIAL` primary keys. Timestamps are stored as `TIMESTAMPTZ`.

---

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'admin');

CREATE TYPE order_status AS ENUM (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- ============================================================
-- USERS
-- Stores registered and guest user accounts.
-- ============================================================

CREATE TABLE users (
  id            BIGSERIAL       PRIMARY KEY,
  email         VARCHAR(255)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  full_name     VARCHAR(255)    NOT NULL,
  phone         VARCHAR(20),
  role          user_role       NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

-- ============================================================
-- CATEGORIES
-- Hierarchical product categories via self-referencing FK.
-- ============================================================

CREATE TABLE categories (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(255)  NOT NULL UNIQUE,
  parent_id   INT           REFERENCES categories (id) ON DELETE SET NULL,
  icon        VARCHAR(255),
  description TEXT,
  sort_order  INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug      ON categories (slug);
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_sort      ON categories (sort_order);

-- ============================================================
-- PRODUCTS
-- Core product record. Pricing and stock live on variants.
-- ============================================================

CREATE TABLE products (
  id          BIGSERIAL     PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(255)  NOT NULL UNIQUE,
  description TEXT,
  category_id INT           NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  badge       VARCHAR(10)   NOT NULL DEFAULT '' CHECK (badge IN ('HOT', 'SALE', 'MỚI', '')),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug        ON products (slug);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_is_active   ON products (is_active);
CREATE INDEX idx_products_badge       ON products (badge);

-- ============================================================
-- PRODUCT IMAGES
-- Ordered images belonging to a product.
-- ============================================================

CREATE TABLE product_images (
  id         BIGSERIAL    PRIMARY KEY,
  product_id BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  url        VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_images_product_id ON product_images (product_id);
CREATE INDEX idx_product_images_sort       ON product_images (product_id, sort_order);

-- ============================================================
-- PRODUCT SPECS
-- Key/value specification pairs displayed on the product page.
-- ============================================================

CREATE TABLE product_specs (
  id         BIGSERIAL    PRIMARY KEY,
  product_id BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  label      VARCHAR(255) NOT NULL,
  value      VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_specs_product_id ON product_specs (product_id);

-- ============================================================
-- VARIANTS
-- A purchasable SKU combining size, color, price and stock.
-- ============================================================

CREATE TABLE variants (
  id             BIGSERIAL       PRIMARY KEY,
  product_id     BIGINT          NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size           VARCHAR(50),
  color_name     VARCHAR(100),
  color_hex      VARCHAR(7),                         -- e.g. "#FF0000"
  price          NUMERIC(15, 0)  NOT NULL,            -- VND has no decimals
  original_price NUMERIC(15, 0)  NOT NULL,
  stock          INT             NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku            VARCHAR(100)    NOT NULL UNIQUE
);

CREATE INDEX idx_variants_product_id ON variants (product_id);
CREATE INDEX idx_variants_sku        ON variants (sku);
CREATE INDEX idx_variants_stock      ON variants (stock);

-- ============================================================
-- CART
-- Each cart belongs to either a logged-in user OR a session.
-- ============================================================

CREATE TABLE cart (
  id            BIGSERIAL    PRIMARY KEY,
  user_id       BIGINT       REFERENCES users (id) ON DELETE CASCADE,
  session_token VARCHAR(255),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT cart_owner_check CHECK (
    (user_id IS NOT NULL) OR (session_token IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_cart_user_id       ON cart (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX        idx_cart_session_token ON cart (session_token) WHERE session_token IS NOT NULL;

-- ============================================================
-- CART ITEMS
-- Line items inside a cart. saved_for_later supports wishlists.
-- ============================================================

CREATE TABLE cart_items (
  id               BIGSERIAL   PRIMARY KEY,
  cart_id          BIGINT      NOT NULL REFERENCES cart (id) ON DELETE CASCADE,
  variant_id       BIGINT      NOT NULL REFERENCES variants (id) ON DELETE CASCADE,
  quantity         INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  saved_for_later  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cart_items_unique_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id    ON cart_items (cart_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items (variant_id);

-- ============================================================
-- ORDERS
-- Completed (or in-progress) purchase records.
-- user_id / session_token may both be null for legacy imports.
-- ============================================================

CREATE TABLE orders (
  id            BIGSERIAL       PRIMARY KEY,
  order_number  VARCHAR(30)     NOT NULL UNIQUE,
  user_id       BIGINT          REFERENCES users (id) ON DELETE SET NULL,
  session_token VARCHAR(255),
  status        order_status    NOT NULL DEFAULT 'pending',
  full_name     VARCHAR(255)    NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  phone         VARCHAR(20)     NOT NULL,
  address       TEXT            NOT NULL,
  note          TEXT,
  subtotal      NUMERIC(15, 0)  NOT NULL DEFAULT 0,
  shipping      NUMERIC(15, 0)  NOT NULL DEFAULT 0,
  total         NUMERIC(15, 0)  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders (order_number);
CREATE INDEX idx_orders_user_id      ON orders (user_id);
CREATE INDEX idx_orders_status       ON orders (status);
CREATE INDEX idx_orders_created_at   ON orders (created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- Snapshot of variant data at purchase time.
-- product_name and variant_label are denormalised intentionally
-- so they survive product/variant edits.
-- ============================================================

CREATE TABLE order_items (
  id             BIGSERIAL       PRIMARY KEY,
  order_id       BIGINT          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  variant_id     BIGINT          NOT NULL REFERENCES variants (id) ON DELETE RESTRICT,
  product_name   VARCHAR(255)    NOT NULL,
  variant_label  VARCHAR(255)    NOT NULL,
  price          NUMERIC(15, 0)  NOT NULL,
  quantity       INT             NOT NULL CHECK (quantity > 0),
  line_total     NUMERIC(15, 0)  NOT NULL
);

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_variant_id ON order_items (variant_id);
```

---

## Notes

| Decision | Reason |
|---|---|
| `NUMERIC(15, 0)` for prices | VND is an integer currency; avoids floating-point rounding errors |
| `ON DELETE CASCADE` on child tables | Images, specs, variants, cart items are meaningless without their parent |
| `ON DELETE RESTRICT` on `order_items.variant_id` | Variants referenced by orders must not be deleted; deactivate instead |
| `ON DELETE SET NULL` on `orders.user_id` | Orders survive account deletion (legal / financial requirement) |
| `synchronize: false` in TypeORM | Schema changes are applied via explicit migrations only |
| `cart_owner_check` constraint | Every cart must be owned by either a user or a session token |
| Denormalised `product_name` / `variant_label` in `order_items` | Preserves order history when products are later edited |
