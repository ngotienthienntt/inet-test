import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // cart table
    await queryRunner.query(`
      CREATE TABLE "cart" (
        "id"            SERIAL      NOT NULL,
        "user_id"       INTEGER,
        "session_token" VARCHAR,
        "created_at"    TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cart_user_id" ON "cart" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cart_session_token" ON "cart" ("session_token")
    `);

    // cart_items table
    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id"              SERIAL    NOT NULL,
        "cart_id"         INTEGER   NOT NULL,
        "variant_id"      INTEGER   NOT NULL,
        "quantity"        INTEGER   NOT NULL DEFAULT 1,
        "saved_for_later" BOOLEAN   NOT NULL DEFAULT false,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_items_cart"
          FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_items_variant"
          FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_cart_id" ON "cart_items" ("cart_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_variant_id" ON "cart_items" ("variant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart"`);
  }
}
