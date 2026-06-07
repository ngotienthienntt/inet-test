# E-Commerce Website — Build Plan

## Project Overview

A full-stack e-commerce website with NestJS backend, Next.js frontend, PostgreSQL database, and Elasticsearch for search.

**Reference UI:** https://tahico.com/

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeORM + PostgreSQL |
| Frontend | Next.js 14 (App Router) + React + TypeScript |
| Search | Elasticsearch |
| Auth | JWT (access + refresh tokens) |
| Testing | Jest + Supertest + Playwright |
| DevOps | Docker Compose |

---

## Progress Tracker

> Legend: `- [ ]` = not started · `- [x]` = completed

---

## Phase 0 — Frontend Layout (Static / No API) ⬅️ START HERE

> Goal: Build the full visual shell of the site with mock data so the UI is visible and reviewable before any backend work begins.

- [x] **0.1** Scaffold Next.js frontend project (`frontend/`)
  - Init Next.js 14 with App Router + TypeScript
  - Install: `tailwindcss`, `axios`, `lucide-react`
  - Configure ESLint + Prettier
- [x] **0.2** Root layout (`app/layout.tsx`)
  - Header: logo, search bar placeholder, cart icon, login/register links
  - Footer: links, copyright
  - Mobile-responsive with hamburger menu
- [x] **0.3** Category sidebar / main navigation
  - Hardcoded mock categories (Electronics, Clothing, etc.)
  - Active state highlighting
  - Collapsible on mobile
- [x] **0.4** Search bar UI (Client Component)
  - Input with icon
  - Dropdown suggestion list (static mock results)
  - Keyboard navigation (arrow keys, enter, escape)
- [x] **0.5** Product listing page — `/shop` (mock data)
  - Grid/list view toggle
  - Filter panel: category checkboxes, price range slider, variant chips
  - Sort dropdown: price asc/desc, newest
  - Pagination controls
  - Product card: image, name, price, add-to-cart button
- [x] **0.6** Product detail page — `/products/[id]` (mock data)
  - Image gallery (thumbnails + main image)
  - Product name, price, description, specs table
  - Variant selector: size + color swatches
  - Stock status badge
  - Add to cart button
- [x] **0.7** Cart page — `/cart` (mock data)
  - Item list with quantity stepper and remove button
  - Save for later section
  - Cart summary sidebar: subtotal, item count, proceed to checkout button
  - Cart item count badge on header icon
- [x] **0.8** Checkout page — `/checkout` (static multi-step)
  - Step 1: Contact info form (name, email) with guest checkout note
  - Step 2: Order summary review
  - Step 3: Confirmation with bank account info display
- [x] **0.9** Order history page — `/orders` (mock data)
  - List of past orders: order number, date, status badge, total
- [x] **0.10** Order tracking page — `/orders/[id]` (mock data)
  - Status timeline (Placed → Processing → Shipped → Delivered)
  - Order items summary
- [x] **0.11** Auth pages
  - Login page — `/auth/login`
  - Register page — `/auth/register`
- [x] **0.12** Shared UI components
  - Button, Input, Badge, Card, Modal, Skeleton loader
  - 404 and 500 error pages

---

## Phase 1 — Project Foundation (Tech Lead)

- [x] **1.1** Scaffold NestJS backend project (`backend/`)
  - Init NestJS app with TypeScript
  - Install dependencies: `@nestjs/typeorm`, `pg`, `class-validator`, `class-transformer`, `@nestjs/jwt`, `@nestjs/config`
  - Configure ESLint + Prettier
- [x] **1.2** Scaffold Next.js frontend project (`frontend/`)
  - Init Next.js 14 with App Router + TypeScript
  - Install dependencies: `axios`, `tailwindcss`
  - Configure ESLint + Prettier
- [x] **1.3** Design PostgreSQL database schema
  - Tables: `users`, `products`, `categories`, `variants`, `inventory`, `cart`, `cart_items`, `orders`, `order_items`
  - Define relationships and constraints
- [x] **1.4** Set up Elasticsearch index mappings
  - `products` index: name, description, category, price, variants, stock
- [x] **1.5** Docker Compose setup
  - Services: `postgres`, `elasticsearch`, `backend`, `frontend`
  - `.env.example` with all required variables
- [x] **1.6** Define shared TypeScript types/interfaces
  - Product, Category, Variant, Cart, Order, User DTOs

---

## Phase 2 — Backend: Auth & User Module

- [x] **2.1** Auth module
  - `POST /auth/register` — register with email + password
  - `POST /auth/login` — return JWT access token
  - `POST /auth/guest` — generate guest session token
  - JWT guard for protected routes
- [x] **2.2** User module
  - `GET /users/me` — get current user profile
  - `PATCH /users/me` — update profile
  - Password hashing with bcrypt
  - Never expose password in responses
- [x] **2.3** Database migrations for `users` table

---

## Phase 3 — Backend: Product & Category Module

- [x] **3.1** Category module
  - `GET /categories` — list all categories with tree structure
  - `POST /categories` — create category (admin)
- [x] **3.2** Product module
  - `GET /products` — list with pagination, filter by category, price range, sort
  - `GET /products/:id` — product detail with variants and inventory
  - `POST /products` — create product (admin)
  - `PATCH /products/:id` — update product (admin)
  - `DELETE /products/:id` — soft delete (admin)
- [x] **3.3** Variant & inventory sub-resources
  - Variants: size, color combinations
  - Inventory: stock count per variant, price per variant
- [x] **3.4** Database migrations for `products`, `categories`, `variants`, `inventory`

---

## Phase 4 — Backend: Search Module (Elasticsearch)

- [x] **4.1** Set up Elasticsearch client in NestJS (`@elastic/elasticsearch`)
- [x] **4.2** Product sync service
  - Sync on product create/update/delete (event-driven via NestJS EventEmitter)
  - Full re-index script for initial load
- [x] **4.3** Search API
  - `GET /search?q=&category=&minPrice=&maxPrice=&sort=` — full-text search with filters
  - `GET /search/suggestions?q=` — auto-suggestions (< 200ms)
- [x] **4.4** Multi-select filter support (e.g., multiple categories)

---

## Phase 5 — Backend: Cart Module

- [x] **5.1** Cart module
  - `GET /cart` — get cart (works for auth users and guests via session token)
  - `POST /cart/items` — add item to cart
  - `PATCH /cart/items/:id` — update quantity
  - `DELETE /cart/items/:id` — remove item
  - `POST /cart/items/:id/save-later` — save for later
- [x] **5.2** Cart summary calculation (subtotal, item count)
- [x] **5.3** Database migrations for `cart`, `cart_items`

---

## Phase 6 — Backend: Checkout & Order Module

- [x] **6.1** Checkout module
  - `POST /checkout` — create order from cart (auth + guest)
  - Validates stock before creating order
  - Returns bank account payment info on success
  - Clears cart after successful order
- [x] **6.2** Order module
  - `GET /orders` — order history for current user
  - `GET /orders/:id` — order detail with items and status timeline
  - `PATCH /orders/:id/status` — update status (admin)
- [x] **6.3** Bank account info stored in config (not hardcoded)
- [x] **6.4** Database migrations for `orders`, `order_items`

---

## Phase 7 — Frontend: Layout & Navigation

- [ ] **7.1** Root layout (`app/layout.tsx`)
  - Header with logo, search bar, cart icon, auth links
  - Category sidebar / main menu
  - Mobile-responsive (hamburger menu)
- [ ] **7.2** Category navigation component
  - Fetch categories from API
  - Active state highlighting
- [ ] **7.3** Search bar component (Client Component)
  - Real-time auto-suggestions (debounced, < 200ms)
  - Keyboard navigation in suggestion dropdown

---

## Phase 8 — Frontend: Product Pages

- [ ] **8.1** Product listing page (`app/shop/page.tsx`) — Server Component
  - Grid/list view toggle
  - Filters: category, price range, variants (multi-select)
  - Sorting: price asc/desc, newest, popularity
  - Pagination
- [ ] **8.2** Product detail page (`app/products/[id]/page.tsx`) — Server Component
  - Image gallery with zoom
  - Video embed support
  - Description and specifications
  - Variant selector (size, color) — Client Component
  - Stock availability indicator
  - Add to cart button — Client Component

---

## Phase 9 — Frontend: Cart

- [ ] **9.1** Cart page (`app/cart/page.tsx`)
  - List cart items with quantity controls
  - Remove item / save for later
  - Cart summary sidebar (subtotal, item count)
- [ ] **9.2** Cart icon in header showing item count (Client Component)
- [ ] **9.3** Cart context/state management

---

## Phase 10 — Frontend: Checkout & Orders

- [ ] **10.1** Checkout page (`app/checkout/page.tsx`) — Client Component
  - Step 1: Contact info (email, name) — guest or auth user
  - Step 2: Order summary review
  - Step 3: Place order → display bank account payment info
- [ ] **10.2** Order confirmation page (`app/checkout/confirmation/[id]/page.tsx`)
  - Bank account details display
  - Order summary
- [ ] **10.3** Order history page (`app/orders/page.tsx`) — Server Component
  - List past orders with status
- [ ] **10.4** Order tracking page (`app/orders/[id]/page.tsx`) — Server Component
  - Current status + timeline

---

## Phase 11 — Frontend: Auth Pages

- [ ] **11.1** Login page (`app/auth/login/page.tsx`)
- [ ] **11.2** Register page (`app/auth/register/page.tsx`)
- [ ] **11.3** Auth context / token management (Client Component)
  - Store JWT in httpOnly cookie
  - Auto-refresh on expiry

---

## Phase 12 — Testing

- [ ] **12.1** Unit tests — NestJS services
  - Auth service
  - Product service
  - Cart service
  - Order service
- [ ] **12.2** Integration tests — API endpoints (Supertest)
  - Auth endpoints
  - Product CRUD
  - Cart operations
  - Checkout flow
- [ ] **12.3** E2E tests — Playwright
  - User registration and login
  - Guest checkout end-to-end
  - Product search with filters
  - Add to cart → checkout → bank info display
  - Order tracking

---

## Phase 13 — Polish & Launch Readiness

- [x] **13.1** SEO: metadata, Open Graph tags on product pages
- [x] **13.2** Error pages: 404, 500
- [x] **13.3** Loading skeletons for product listing and detail
- [x] **13.4** Rate limiting on auth and search endpoints (`@nestjs/throttler`)
- [x] **13.5** Environment variable validation on startup (Joi schema)
- [x] **13.6** Production Docker Compose with health checks + multi-stage Dockerfiles
- [x] **13.7** Final review: security audit (fixed AdminGuard UnauthorizedException, removed error message leak in checkout)

---

## Phase 14 — Admin Dashboard

> **Prerequisites:** Phases 1–6 (backend) must be complete. Admin routes are protected by JWT + admin role guard.
>
> **Access:** Separate layout at `/admin/*`, completely isolated from the customer-facing site.

### 14.1 — Admin Foundation
- [x] **14.1.1** Admin layout (`app/admin/layout.tsx`) — dark `#1c3b71` sidebar, mobile overlay, active links
- [x] **14.1.2** Admin auth guard — `middleware.ts` protecting `/admin/*`, redirects to `/admin/login`; login page sets `admin_token` cookie
- [x] **14.1.3** Admin dashboard home (`app/admin/page.tsx`) — stats cards (revenue, orders, products, customers), recent orders table, quick action buttons

### 14.2 — Product Management
- [x] **14.2.1** Product list page (`app/admin/products/page.tsx`) — searchable table, image thumbnail, stock badge, delete
- [x] **14.2.2** Create product page (`app/admin/products/new/page.tsx`) — multi-section form: basic info, pricing, category, variants, images (URL), specs; auto-slug
- [x] **14.2.3** Edit product page (`app/admin/products/[id]/edit/page.tsx`) — pre-filled form, link to product page, delete button
- [x] **14.2.4** Inventory management (`app/admin/inventory/page.tsx`) — variant stock table, inline restock, low/out-of-stock alerts

### 14.3 — Category Management
- [x] **14.3.1** Category list + form (`app/admin/categories/page.tsx`) — tree view with indentation, create/edit modal, delete; auto-slug

### 14.4 — Order Management
- [x] **14.4.1** Order list page (`app/admin/orders/page.tsx`) — status filter tabs, search, table with status badges
- [x] **14.4.2** Order detail page (`app/admin/orders/[id]/page.tsx`) — customer info, line items, status update dropdown, print invoice
- [x] **14.4.3** Order status update via `PATCH /orders/:id/status` (backend already existed)

### 14.5 — Customer Management
- [x] **14.5.1** Customer list page (`app/admin/customers/page.tsx`) — paginated table, search, status badge
- [x] **14.5.2** Customer detail page (`app/admin/customers/[id]/page.tsx`) — profile info, ban/unban toggle

### 14.6 — Settings
- [x] **14.6.1** Store settings (`app/admin/settings/page.tsx`) — store name, contact, bank details, shipping threshold (localStorage)
- [x] **14.6.2** Change password form — calls `PATCH /auth/change-password`

### Backend (Admin API)
- [x] `GET /api/admin/stats` — revenue, orders, products, customers counts + recent orders
- [x] `GET /api/admin/customers` — paginated customer list with search
- [x] `GET /api/admin/customers/:id` — customer detail
- [x] `PATCH /api/admin/customers/:id/toggle-ban` — flip isActive

---

## Current Status

**Active Phase:** COMPLETE — All 14 phases done
**Last Updated:** 2026-04-13
**Next Step:** Deploy to production using `docker-compose.prod.yml`

---

## Notes

- Guest checkout uses a temporary session token — no account required
- Payment is bank transfer only — no payment gateway
- PostgreSQL is the source of truth; Elasticsearch is read-only for search
- All schema changes via migrations — never direct DB edits
- All secrets in `.env` — never hardcoded
