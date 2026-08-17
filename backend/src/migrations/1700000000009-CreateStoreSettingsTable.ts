import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreSettingsTable1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_settings" (
        "id"                      SERIAL      NOT NULL,
        "store_name"              VARCHAR     NOT NULL,
        "contact_email"           VARCHAR     NOT NULL,
        "contact_phone"           VARCHAR     NOT NULL,
        "bank_name"               VARCHAR     NOT NULL,
        "bank_account"            VARCHAR     NOT NULL,
        "bank_owner"              VARCHAR     NOT NULL,
        "free_shipping_threshold" VARCHAR     NOT NULL,
        "updated_at"              TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_store_settings_id" PRIMARY KEY ("id")
      )
    `);

    // Seed the single settings row with the same defaults the frontend
    // used to hardcode, so behavior is unchanged until an admin edits it.
    await queryRunner.query(`
      INSERT INTO "store_settings"
        ("store_name", "contact_email", "contact_phone", "bank_name", "bank_account", "bank_owner", "free_shipping_threshold")
      VALUES
        ('ShopVN', 'support@shopvn.vn', '1900 1234', 'Vietcombank', '1234567890', 'CÔNG TY SHOPVN', '500000')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "store_settings"`);
  }
}
