import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBannersTable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "banners" (
        "id"         SERIAL      NOT NULL,
        "position"   VARCHAR     NOT NULL,
        "image_url"  VARCHAR     NOT NULL,
        "link_url"   VARCHAR,
        "alt_text"   VARCHAR     NOT NULL,
        "is_active"  BOOLEAN     NOT NULL DEFAULT true,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_banners_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_banners_position" ON "banners" ("position")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "banners"`);
  }
}
