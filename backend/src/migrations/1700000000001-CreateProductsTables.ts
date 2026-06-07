import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTables1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"          SERIAL        NOT NULL,
        "name"        VARCHAR       NOT NULL,
        "slug"        VARCHAR       NOT NULL,
        "icon"        VARCHAR,
        "description" TEXT,
        "sort_order"  INTEGER       NOT NULL DEFAULT 0,
        "parent_id"   INTEGER,
        "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_categories_parent"
          FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id")
    `);

    // products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"          SERIAL        NOT NULL,
        "name"        VARCHAR       NOT NULL,
        "slug"        VARCHAR       NOT NULL,
        "description" TEXT,
        "category_id" INTEGER       NOT NULL,
        "badge"       VARCHAR       NOT NULL DEFAULT '',
        "is_active"   BOOLEAN       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_is_active" ON "products" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_created_at" ON "products" ("created_at")
    `);

    // product_images table
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id"          SERIAL        NOT NULL,
        "product_id"  INTEGER       NOT NULL,
        "url"         VARCHAR       NOT NULL,
        "sort_order"  INTEGER       NOT NULL DEFAULT 0,
        CONSTRAINT "PK_product_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_images_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_images_product_id" ON "product_images" ("product_id")
    `);

    // product_specs table
    await queryRunner.query(`
      CREATE TABLE "product_specs" (
        "id"          SERIAL        NOT NULL,
        "product_id"  INTEGER       NOT NULL,
        "label"       VARCHAR       NOT NULL,
        "value"       VARCHAR       NOT NULL,
        "sort_order"  INTEGER       NOT NULL DEFAULT 0,
        CONSTRAINT "PK_product_specs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_specs_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_specs_product_id" ON "product_specs" ("product_id")
    `);

    // variants table
    await queryRunner.query(`
      CREATE TABLE "variants" (
        "id"             SERIAL        NOT NULL,
        "product_id"     INTEGER       NOT NULL,
        "size"           VARCHAR,
        "color_name"     VARCHAR,
        "color_hex"      VARCHAR,
        "price"          NUMERIC(15,0) NOT NULL,
        "original_price" NUMERIC(15,0) NOT NULL,
        "stock"          INTEGER       NOT NULL DEFAULT 0,
        "sku"            VARCHAR,
        CONSTRAINT "PK_variants_id"  PRIMARY KEY ("id"),
        CONSTRAINT "UQ_variants_sku" UNIQUE ("sku"),
        CONSTRAINT "FK_variants_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_variants_product_id" ON "variants" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_variants_price" ON "variants" ("price")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "variants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_specs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
