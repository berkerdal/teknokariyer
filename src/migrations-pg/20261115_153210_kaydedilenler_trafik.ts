import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "kaydedilen_ilanlar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kullanici_id" integer NOT NULL,
  	"ilan_id" integer NOT NULL,
  	"hatirlatildi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trafik_olaylari" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"gun" varchar NOT NULL,
  	"yol" varchar NOT NULL,
  	"kaynak" varchar NOT NULL,
  	"kaynak_site" varchar,
  	"cihaz" varchar NOT NULL,
  	"giris" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trafik_ozetleri" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"gun" varchar NOT NULL,
  	"boyut" varchar NOT NULL,
  	"deger" varchar NOT NULL,
  	"goruntuleme" numeric DEFAULT 0 NOT NULL,
  	"ziyaret" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kaydedilen_ilanlar_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trafik_olaylari_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trafik_ozetleri_id" integer;
  ALTER TABLE "kaydedilen_ilanlar" ADD CONSTRAINT "kaydedilen_ilanlar_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kaydedilen_ilanlar" ADD CONSTRAINT "kaydedilen_ilanlar_ilan_id_ilanlar_id_fk" FOREIGN KEY ("ilan_id") REFERENCES "public"."ilanlar"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "kaydedilen_ilanlar_kullanici_idx" ON "kaydedilen_ilanlar" USING btree ("kullanici_id");
  CREATE INDEX "kaydedilen_ilanlar_ilan_idx" ON "kaydedilen_ilanlar" USING btree ("ilan_id");
  CREATE INDEX "kaydedilen_ilanlar_updated_at_idx" ON "kaydedilen_ilanlar" USING btree ("updated_at");
  CREATE INDEX "kaydedilen_ilanlar_created_at_idx" ON "kaydedilen_ilanlar" USING btree ("created_at");
  CREATE UNIQUE INDEX "kullanici_ilan_idx" ON "kaydedilen_ilanlar" USING btree ("kullanici_id","ilan_id");
  CREATE INDEX "trafik_olaylari_gun_idx" ON "trafik_olaylari" USING btree ("gun");
  CREATE INDEX "trafik_olaylari_updated_at_idx" ON "trafik_olaylari" USING btree ("updated_at");
  CREATE INDEX "trafik_olaylari_created_at_idx" ON "trafik_olaylari" USING btree ("created_at");
  CREATE INDEX "trafik_ozetleri_gun_idx" ON "trafik_ozetleri" USING btree ("gun");
  CREATE INDEX "trafik_ozetleri_updated_at_idx" ON "trafik_ozetleri" USING btree ("updated_at");
  CREATE INDEX "trafik_ozetleri_created_at_idx" ON "trafik_ozetleri" USING btree ("created_at");
  CREATE UNIQUE INDEX "gun_boyut_deger_idx" ON "trafik_ozetleri" USING btree ("gun","boyut","deger");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kaydedilen_ilanlar_fk" FOREIGN KEY ("kaydedilen_ilanlar_id") REFERENCES "public"."kaydedilen_ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trafik_olaylari_fk" FOREIGN KEY ("trafik_olaylari_id") REFERENCES "public"."trafik_olaylari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trafik_ozetleri_fk" FOREIGN KEY ("trafik_ozetleri_id") REFERENCES "public"."trafik_ozetleri"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_kaydedilen_ilanlar_id_idx" ON "payload_locked_documents_rels" USING btree ("kaydedilen_ilanlar_id");
  CREATE INDEX "payload_locked_documents_rels_trafik_olaylari_id_idx" ON "payload_locked_documents_rels" USING btree ("trafik_olaylari_id");
  CREATE INDEX "payload_locked_documents_rels_trafik_ozetleri_id_idx" ON "payload_locked_documents_rels" USING btree ("trafik_ozetleri_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "kaydedilen_ilanlar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trafik_olaylari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trafik_ozetleri" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "kaydedilen_ilanlar" CASCADE;
  DROP TABLE "trafik_olaylari" CASCADE;
  DROP TABLE "trafik_ozetleri" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_kaydedilen_ilanlar_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trafik_olaylari_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trafik_ozetleri_fk";
  
  DROP INDEX "payload_locked_documents_rels_kaydedilen_ilanlar_id_idx";
  DROP INDEX "payload_locked_documents_rels_trafik_olaylari_id_idx";
  DROP INDEX "payload_locked_documents_rels_trafik_ozetleri_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kaydedilen_ilanlar_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trafik_olaylari_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trafik_ozetleri_id";`)
}
