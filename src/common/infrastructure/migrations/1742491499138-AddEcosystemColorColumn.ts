import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddEcosystemColorColumn1742491499138
  implements MigrationInterface
{
  name = 'AddEcosystemColorColumn1742491499138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add column with NULL allowed temporarily.
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ADD "color" character varying(9)',
    );

    // Step 2: Fill existing rows with a default color.
    await queryRunner.query(
      'UPDATE "Ecosystems" SET "color" = \'#FFFFFF\' WHERE "color" IS NULL',
    );

    // Step 3: Enforce NOT NULL constraint.
    await queryRunner.query(
      'ALTER TABLE "Ecosystems" ALTER COLUMN "color" SET NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "Ecosystems" DROP COLUMN "color"');
  }
}
