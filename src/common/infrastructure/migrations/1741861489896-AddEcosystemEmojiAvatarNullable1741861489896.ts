import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddEcosystemEmojiAvatarNullable1741861489896
  implements MigrationInterface
{
  name = 'AddEcosystemEmojiAvatarNullable1741861489896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the "avatar" column as nullable with a default value.
    await queryRunner.query(`
      ALTER TABLE "Ecosystems"
      ADD COLUMN "avatar" json NULL DEFAULT '{"type": "emoji", "emoji": ""}'
    `);

    // Update existing rows that may have a NULL avatar to the default value.
    await queryRunner.query(`
      UPDATE "Ecosystems"
      SET "avatar" = '{"type": "emoji", "emoji": ""}'
      WHERE "avatar" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Ecosystems"
      DROP COLUMN "avatar"
    `);
  }
}
