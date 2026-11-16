import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_kayitli_aramalar_tur" AS ENUM('ilan', 'havuz');
  CREATE TYPE "public"."enum_kayitli_aramalar_siklik" AS ENUM('anlik', 'haftalik');
  CREATE TABLE "kayitli_aramalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kullanici_id" integer NOT NULL,
  	"tur" "enum_kayitli_aramalar_tur" NOT NULL,
  	"ad" varchar NOT NULL,
  	"sorgu" varchar,
  	"siklik" "enum_kayitli_aramalar_siklik" DEFAULT 'haftalik' NOT NULL,
  	"son_bildirim" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kayitli_aramalar_id" integer;
  ALTER TABLE "kayitli_aramalar" ADD CONSTRAINT "kayitli_aramalar_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "kayitli_aramalar_kullanici_idx" ON "kayitli_aramalar" USING btree ("kullanici_id");
  CREATE INDEX "kayitli_aramalar_updated_at_idx" ON "kayitli_aramalar" USING btree ("updated_at");
  CREATE INDEX "kayitli_aramalar_created_at_idx" ON "kayitli_aramalar" USING btree ("created_at");
  CREATE UNIQUE INDEX "kullanici_tur_sorgu_idx" ON "kayitli_aramalar" USING btree ("kullanici_id","tur","sorgu");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kayitli_aramalar_fk" FOREIGN KEY ("kayitli_aramalar_id") REFERENCES "public"."kayitli_aramalar"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_kayitli_aramalar_id_idx" ON "payload_locked_documents_rels" USING btree ("kayitli_aramalar_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "kayitli_aramalar" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "kayitli_aramalar" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_kayitli_aramalar_fk";
  
  DROP INDEX "payload_locked_documents_rels_kayitli_aramalar_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kayitli_aramalar_id";
  DROP TYPE "public"."enum_kayitli_aramalar_tur";
  DROP TYPE "public"."enum_kayitli_aramalar_siklik";`)
}
