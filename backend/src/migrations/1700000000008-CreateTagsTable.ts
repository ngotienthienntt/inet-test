import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTagsTable1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id"         SERIAL      NOT NULL,
        "name"       VARCHAR     NOT NULL,
        "slug"       VARCHAR     NOT NULL,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_tags" (
        "product_id" INTEGER NOT NULL,
        "tag_id"     INTEGER NOT NULL,
        CONSTRAINT "PK_product_tags" PRIMARY KEY ("product_id", "tag_id"),
        CONSTRAINT "FK_product_tags_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_tags_tag"
          FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_tags_tag_id" ON "product_tags" ("tag_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
  }
}
