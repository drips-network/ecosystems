import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddDeadlineColumns1759406128330 implements MigrationInterface {
  name = 'AddDeadlineColumns1759406128330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ADD "deadline" TIMESTAMP',
    );

    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ADD "refundAccountId" character varying(200)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "Ecosystems" DROP COLUMN "deadline"');
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" DROP COLUMN "refundAccountId"',
    );
  }
}
