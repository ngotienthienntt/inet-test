import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('customer', 'admin')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            SERIAL        NOT NULL,
        "email"         VARCHAR       NOT NULL,
        "password_hash" VARCHAR       NOT NULL,
        "full_name"     VARCHAR       NOT NULL,
        "phone"         VARCHAR,
        "role"          "user_role"   NOT NULL DEFAULT 'customer',
        "is_active"     BOOLEAN       NOT NULL DEFAULT true,
        "created_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}
