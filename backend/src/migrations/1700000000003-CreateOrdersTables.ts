import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTables1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create order_status enum
    await queryRunner.query(`
      CREATE TYPE "order_status" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    `);

    // orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"            SERIAL          NOT NULL,
        "order_number"  VARCHAR         NOT NULL,
        "user_id"       INTEGER,
        "session_token" VARCHAR,
        "status"        "order_status"  NOT NULL DEFAULT 'pending',
        "full_name"     VARCHAR         NOT NULL,
        "email"         VARCHAR         NOT NULL,
        "phone"         VARCHAR         NOT NULL,
        "address"       TEXT            NOT NULL,
        "note"          TEXT,
        "subtotal"      NUMERIC(15,0)   NOT NULL,
        "shipping"      NUMERIC(15,0)   NOT NULL DEFAULT 0,
        "total"         NUMERIC(15,0)   NOT NULL,
        "created_at"    TIMESTAMP       NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id"           PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_session_token" ON "orders" ("session_token")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_status" ON "orders" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_created_at" ON "orders" ("created_at")
    `);

    // order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"            SERIAL        NOT NULL,
        "order_id"      INTEGER       NOT NULL,
        "variant_id"    INTEGER,
        "product_name"  VARCHAR       NOT NULL,
        "variant_label" VARCHAR,
        "price"         NUMERIC(15,0) NOT NULL,
        "quantity"      INTEGER       NOT NULL,
        "line_total"    NUMERIC(15,0) NOT NULL,
        CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_variant"
          FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_variant_id" ON "order_items" ("variant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status"`);
  }
}
