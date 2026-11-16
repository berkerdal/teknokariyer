import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hesap_talepleri_durum" AS ENUM('yeni', 'davet', 'red');
  CREATE TABLE "hesap_talepleri" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"firma_adi" varchar NOT NULL,
  	"konum" varchar,
  	"yetkili_ad" varchar NOT NULL,
  	"unvan" varchar,
  	"eposta" varchar NOT NULL,
  	"telefon" varchar,
  	"not" varchar,
  	"aydinlatma_surumu" varchar NOT NULL,
  	"durum" "enum_hesap_talepleri_durum" DEFAULT 'yeni' NOT NULL,
  	"firma_id" integer,
  	"ret_gerekcesi" varchar,
  	"sonuclandiran_id" integer,
  	"sonuclanma_tarihi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hesap_talepleri_id" integer;
  ALTER TABLE "hesap_talepleri" ADD CONSTRAINT "hesap_talepleri_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hesap_talepleri" ADD CONSTRAINT "hesap_talepleri_sonuclandiran_id_kullanicilar_id_fk" FOREIGN KEY ("sonuclandiran_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hesap_talepleri_durum_idx" ON "hesap_talepleri" USING btree ("durum");
  CREATE INDEX "hesap_talepleri_firma_idx" ON "hesap_talepleri" USING btree ("firma_id");
  CREATE INDEX "hesap_talepleri_sonuclandiran_idx" ON "hesap_talepleri" USING btree ("sonuclandiran_id");
  CREATE INDEX "hesap_talepleri_updated_at_idx" ON "hesap_talepleri" USING btree ("updated_at");
  CREATE INDEX "hesap_talepleri_created_at_idx" ON "hesap_talepleri" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hesap_talepleri_fk" FOREIGN KEY ("hesap_talepleri_id") REFERENCES "public"."hesap_talepleri"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hesap_talepleri_id_idx" ON "payload_locked_documents_rels" USING btree ("hesap_talepleri_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hesap_talepleri" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hesap_talepleri" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hesap_talepleri_fk";
  
  DROP INDEX "payload_locked_documents_rels_hesap_talepleri_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hesap_talepleri_id";
  DROP TYPE "public"."enum_hesap_talepleri_durum";`)
}
