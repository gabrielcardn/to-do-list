import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748834594736 implements MigrationInterface {
    name = 'InitialSchema1748834594736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_8d12ff38fcc62aaba2cab748772" DEFAULT NEWSEQUENTIALID(), "title" varchar(255) NOT NULL, "description" text, "status" nvarchar(50) CONSTRAINT CHK_4e9922f4a1b1e2ef50a2d095cc_ENUM CHECK(status IN ('PENDING','IN_PROGRESS','DONE')) NOT NULL CONSTRAINT "DF_6086c8dafbae729a930c04d8651" DEFAULT 'PENDING', "userId" uniqueidentifier NOT NULL, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a3ffb1c0c8416b9fc6f907b7433" DEFAULT NEWSEQUENTIALID(), "username" varchar(255) NOT NULL, "password" varchar(255) NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
        await queryRunner.query(`DROP INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
    }

}
