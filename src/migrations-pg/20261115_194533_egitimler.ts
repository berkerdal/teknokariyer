import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_adaylar_egitimler_duzey" AS ENUM('lise', 'onlisans', 'lisans', 'yuksek-lisans', 'doktora');
  CREATE TABLE "adaylar_egitimler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duzey" "enum_adaylar_egitimler_duzey" NOT NULL,
  	"okul_id" integer,
  	"okul_adi" varchar,
  	"bolum_id" integer,
  	"baslangic_yil" numeric,
  	"bitis_ay" numeric,
  	"bitis_yil" numeric,
  	"devam" boolean,
  	"sinif" varchar,
  	"gano" numeric
  );
  
  ALTER TABLE "adaylar_egitimler" ADD CONSTRAINT "adaylar_egitimler_okul_id_taksonomiler_id_fk" FOREIGN KEY ("okul_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_egitimler" ADD CONSTRAINT "adaylar_egitimler_bolum_id_taksonomiler_id_fk" FOREIGN KEY ("bolum_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_egitimler" ADD CONSTRAINT "adaylar_egitimler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "adaylar_egitimler_order_idx" ON "adaylar_egitimler" USING btree ("_order");
  CREATE INDEX "adaylar_egitimler_parent_id_idx" ON "adaylar_egitimler" USING btree ("_parent_id");
  CREATE INDEX "adaylar_egitimler_okul_idx" ON "adaylar_egitimler" USING btree ("okul_id");
  CREATE INDEX "adaylar_egitimler_bolum_idx" ON "adaylar_egitimler" USING btree ("bolum_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "adaylar_egitimler" CASCADE;
  DROP TYPE "public"."enum_adaylar_egitimler_duzey";`)
}
