import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_gorusmeler_bicim" AS ENUM('yuz-yuze', 'cevrim-ici', 'telefon');
  CREATE TYPE "public"."enum_gorusmeler_durum" AS ENUM('bekliyor', 'onaylandi', 'yeni-tarih', 'iptal');
  CREATE TABLE "gorusmeler_secenekler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"baslangic" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "gorusmeler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"basvuru_id" integer NOT NULL,
  	"firma_id" integer NOT NULL,
  	"ilan_id" integer NOT NULL,
  	"aday_kullanici_id" integer,
  	"sure" numeric NOT NULL,
  	"bicim" "enum_gorusmeler_bicim" NOT NULL,
  	"yer" varchar,
  	"not" varchar,
  	"durum" "enum_gorusmeler_durum" DEFAULT 'bekliyor' NOT NULL,
  	"secilen" timestamp(3) with time zone,
  	"aday_notu" varchar,
  	"iptal_nedeni" varchar,
  	"takvim_no" numeric DEFAULT 0,
  	"olusturan_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "test_postalar" ADD COLUMN "ekler" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gorusmeler_id" integer;
  ALTER TABLE "gorusmeler_secenekler" ADD CONSTRAINT "gorusmeler_secenekler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gorusmeler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gorusmeler" ADD CONSTRAINT "gorusmeler_basvuru_id_basvurular_id_fk" FOREIGN KEY ("basvuru_id") REFERENCES "public"."basvurular"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gorusmeler" ADD CONSTRAINT "gorusmeler_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gorusmeler" ADD CONSTRAINT "gorusmeler_ilan_id_ilanlar_id_fk" FOREIGN KEY ("ilan_id") REFERENCES "public"."ilanlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gorusmeler" ADD CONSTRAINT "gorusmeler_aday_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("aday_kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gorusmeler" ADD CONSTRAINT "gorusmeler_olusturan_id_kullanicilar_id_fk" FOREIGN KEY ("olusturan_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "gorusmeler_secenekler_order_idx" ON "gorusmeler_secenekler" USING btree ("_order");
  CREATE INDEX "gorusmeler_secenekler_parent_id_idx" ON "gorusmeler_secenekler" USING btree ("_parent_id");
  CREATE INDEX "gorusmeler_basvuru_idx" ON "gorusmeler" USING btree ("basvuru_id");
  CREATE INDEX "gorusmeler_firma_idx" ON "gorusmeler" USING btree ("firma_id");
  CREATE INDEX "gorusmeler_ilan_idx" ON "gorusmeler" USING btree ("ilan_id");
  CREATE INDEX "gorusmeler_aday_kullanici_idx" ON "gorusmeler" USING btree ("aday_kullanici_id");
  CREATE INDEX "gorusmeler_durum_idx" ON "gorusmeler" USING btree ("durum");
  CREATE INDEX "gorusmeler_olusturan_idx" ON "gorusmeler" USING btree ("olusturan_id");
  CREATE INDEX "gorusmeler_updated_at_idx" ON "gorusmeler" USING btree ("updated_at");
  CREATE INDEX "gorusmeler_created_at_idx" ON "gorusmeler" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gorusmeler_fk" FOREIGN KEY ("gorusmeler_id") REFERENCES "public"."gorusmeler"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_gorusmeler_id_idx" ON "payload_locked_documents_rels" USING btree ("gorusmeler_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gorusmeler_secenekler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gorusmeler" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "gorusmeler_secenekler" CASCADE;
  DROP TABLE "gorusmeler" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gorusmeler_fk";
  
  DROP INDEX "payload_locked_documents_rels_gorusmeler_id_idx";
  ALTER TABLE "test_postalar" DROP COLUMN "ekler";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gorusmeler_id";
  DROP TYPE "public"."enum_gorusmeler_bicim";
  DROP TYPE "public"."enum_gorusmeler_durum";`)
}
