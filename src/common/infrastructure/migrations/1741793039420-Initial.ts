import {MigrationInterface, QueryRunner} from 'typeorm';

export class Initial1741793039420 implements MigrationInterface {
  name = 'Initial1741793039420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(
      'CREATE TABLE "Edges" ("sourceNodeId" uuid NOT NULL, "targetNodeId" uuid NOT NULL, "ecosystemId" uuid NOT NULL, "weight" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_3f643c2217e5595ced195e5894b" PRIMARY KEY ("sourceNodeId", "targetNodeId", "ecosystemId"))',
    );
    await queryRunner.query(
      'CREATE TABLE "Nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectName" character varying(200) NOT NULL, "url" character varying(200), "projectAccountId" character varying(200), "originalProjectName" character varying(200) NOT NULL, "absoluteWeight" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ecosystemId" uuid, CONSTRAINT "PK_b547a86fc0c87c1bf14c54a9095" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE INDEX "ecosystem" ON "Nodes" ("ecosystemId") ',
    );
    await queryRunner.query(
      'CREATE TABLE "Ecosystems" ("id" uuid NOT NULL, "name" character varying(150) NOT NULL, "description" character varying(150), "state" character varying NOT NULL, "chainId" character varying(64) NOT NULL, "metadata" jsonb NOT NULL, "error" jsonb, "rawGraph" jsonb NOT NULL, "accountId" character varying(200), "ownerAddress" character varying(42) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "CHK_cb93592f951789177b84b76d72" CHECK ((public."Ecosystems"."state" <> \'deployed\' OR public."Ecosystems"."accountId" IS NOT NULL)), CONSTRAINT "PK_dfea6f8ca06edf7ac32bab9f994" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" ADD CONSTRAINT "FK_ebfc55bfb780decd50fd5d4c2bc" FOREIGN KEY ("sourceNodeId") REFERENCES "Nodes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" ADD CONSTRAINT "FK_17f812c03e35a8e2a0b5a6ee530" FOREIGN KEY ("targetNodeId") REFERENCES "Nodes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" ADD CONSTRAINT "FK_48eecc6a2de58ba6a053fc83f2c" FOREIGN KEY ("ecosystemId") REFERENCES "Ecosystems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "Nodes" ADD CONSTRAINT "FK_5993aeb50b65839a13002579abb" FOREIGN KEY ("ecosystemId") REFERENCES "Ecosystems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "Nodes" DROP CONSTRAINT "FK_5993aeb50b65839a13002579abb"',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" DROP CONSTRAINT "FK_48eecc6a2de58ba6a053fc83f2c"',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" DROP CONSTRAINT "FK_17f812c03e35a8e2a0b5a6ee530"',
    );
    await queryRunner.query(
      'ALTER TABLE "Edges" DROP CONSTRAINT "FK_ebfc55bfb780decd50fd5d4c2bc"',
    );
    await queryRunner.query('DROP TABLE "Ecosystems"');
    await queryRunner.query('DROP INDEX "public"."ecosystem"');
    await queryRunner.query('DROP TABLE "Nodes"');
    await queryRunner.query('DROP TABLE "Edges"');

    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}
