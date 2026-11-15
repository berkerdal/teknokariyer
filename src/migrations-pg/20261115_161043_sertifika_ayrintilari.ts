import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_dosyalar_tur" ADD VALUE 'sertifika' BEFORE 'sartname';
  CREATE TABLE "basvurular_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dosyalar_id" integer
  );
  
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "ay" numeric;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "bitis_ay" numeric;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "bitis_yil" numeric;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "suresiz" boolean;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "kimlik_no" varchar;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "url" varchar;
  ALTER TABLE "adaylar_sertifikalar" ADD COLUMN "dosya_id" integer;
  ALTER TABLE "adaylar_rels" ADD COLUMN "taksonomiler_id" integer;
  ALTER TABLE "basvurular_rels" ADD CONSTRAINT "basvurular_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."basvurular"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "basvurular_rels" ADD CONSTRAINT "basvurular_rels_dosyalar_fk" FOREIGN KEY ("dosyalar_id") REFERENCES "public"."dosyalar"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "basvurular_rels_order_idx" ON "basvurular_rels" USING btree ("order");
  CREATE INDEX "basvurular_rels_parent_idx" ON "basvurular_rels" USING btree ("parent_id");
  CREATE INDEX "basvurular_rels_path_idx" ON "basvurular_rels" USING btree ("path");
  CREATE INDEX "basvurular_rels_dosyalar_id_idx" ON "basvurular_rels" USING btree ("dosyalar_id");
  ALTER TABLE "adaylar_sertifikalar" ADD CONSTRAINT "adaylar_sertifikalar_dosya_id_dosyalar_id_fk" FOREIGN KEY ("dosya_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_rels" ADD CONSTRAINT "adaylar_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "adaylar_sertifikalar_dosya_idx" ON "adaylar_sertifikalar" USING btree ("dosya_id");
  CREATE INDEX "adaylar_rels_taksonomiler_id_idx" ON "adaylar_rels" USING btree ("taksonomiler_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "basvurular_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "basvurular_rels" CASCADE;
  ALTER TABLE "adaylar_sertifikalar" DROP CONSTRAINT "adaylar_sertifikalar_dosya_id_dosyalar_id_fk";
  
  ALTER TABLE "adaylar_rels" DROP CONSTRAINT "adaylar_rels_taksonomiler_fk";
  
  ALTER TABLE "dosyalar" ALTER COLUMN "tur" SET DATA TYPE text;
  DROP TYPE "public"."enum_dosyalar_tur";
  CREATE TYPE "public"."enum_dosyalar_tur" AS ENUM('cv', 'sartname', 'logo', 'kapak', 'galeri');
  ALTER TABLE "dosyalar" ALTER COLUMN "tur" SET DATA TYPE "public"."enum_dosyalar_tur" USING "tur"::"public"."enum_dosyalar_tur";
  DROP INDEX "adaylar_sertifikalar_dosya_idx";
  DROP INDEX "adaylar_rels_taksonomiler_id_idx";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "ay";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "bitis_ay";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "bitis_yil";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "suresiz";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "kimlik_no";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "url";
  ALTER TABLE "adaylar_sertifikalar" DROP COLUMN "dosya_id";
  ALTER TABLE "adaylar_rels" DROP COLUMN "taksonomiler_id";`)
}
