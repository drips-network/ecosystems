import {MigrationInterface, QueryRunner} from 'typeorm';

export class MakeEcosystemEmojiAvatarNotNull1741866649376
  implements MigrationInterface
{
  name = 'MakeEcosystemEmojiAvatarNotNull1741866649376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ALTER COLUMN "avatar" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ALTER COLUMN "avatar" DROP DEFAULT',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ALTER COLUMN "avatar" SET DEFAULT \'{"type": "emoji", "emoji": ""}\'',
    );
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ALTER COLUMN "avatar" DROP NOT NULL',
    );
  }
}
