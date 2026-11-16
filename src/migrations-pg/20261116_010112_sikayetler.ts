import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sikayetler_neden" AS ENUM('sahte', 'ucret', 'ayrimci', 'yaniltici', 'diger');
  CREATE TYPE "public"."enum_sikayetler_durum" AS ENUM('yeni', 'sonuclandi');
  CREATE TYPE "public"."enum_sikayetler_sonuc" AS ENUM('yersiz', 'firma-uyarildi', 'ilan-kaldirildi');
  CREATE TABLE "sikayetler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ilan_id" integer NOT NULL,
  	"gonderen_id" integer,
  	"neden" "enum_sikayetler_neden" NOT NULL,
  	"aciklama" varchar,
  	"durum" "enum_sikayetler_durum" DEFAULT 'yeni' NOT NULL,
  	"sonuc" "enum_sikayetler_sonuc",
  	"firma_mesaji" varchar,
  	"ic_not" varchar,
  	"sonuclandiran_id" integer,
  	"sonuclanma_tarihi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sikayetler_id" integer;
  ALTER TABLE "sikayetler" ADD CONSTRAINT "sikayetler_ilan_id_ilanlar_id_fk" FOREIGN KEY ("ilan_id") REFERENCES "public"."ilanlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sikayetler" ADD CONSTRAINT "sikayetler_gonderen_id_kullanicilar_id_fk" FOREIGN KEY ("gonderen_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sikayetler" ADD CONSTRAINT "sikayetler_sonuclandiran_id_kullanicilar_id_fk" FOREIGN KEY ("sonuclandiran_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sikayetler_ilan_idx" ON "sikayetler" USING btree ("ilan_id");
  CREATE INDEX "sikayetler_gonderen_idx" ON "sikayetler" USING btree ("gonderen_id");
  CREATE INDEX "sikayetler_durum_idx" ON "sikayetler" USING btree ("durum");
  CREATE INDEX "sikayetler_sonuclandiran_idx" ON "sikayetler" USING btree ("sonuclandiran_id");
  CREATE INDEX "sikayetler_updated_at_idx" ON "sikayetler" USING btree ("updated_at");
  CREATE INDEX "sikayetler_created_at_idx" ON "sikayetler" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sikayetler_fk" FOREIGN KEY ("sikayetler_id") REFERENCES "public"."sikayetler"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sikayetler_id_idx" ON "payload_locked_documents_rels" USING btree ("sikayetler_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sikayetler" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sikayetler" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sikayetler_fk";
  
  DROP INDEX "payload_locked_documents_rels_sikayetler_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sikayetler_id";
  DROP TYPE "public"."enum_sikayetler_neden";
  DROP TYPE "public"."enum_sikayetler_durum";
  DROP TYPE "public"."enum_sikayetler_sonuc";`)
}
