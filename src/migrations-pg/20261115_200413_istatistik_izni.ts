import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trafik_olaylari" ADD COLUMN "izinli" boolean DEFAULT false;
  ALTER TABLE "trafik_olaylari" ADD COLUMN "yeni_ziyaretci" boolean DEFAULT false;
  ALTER TABLE "trafik_olaylari" ADD COLUMN "gunun_ilki" boolean DEFAULT false;
  ALTER TABLE "trafik_olaylari" ADD COLUMN "ayin_ilki" boolean DEFAULT false;
  ALTER TABLE "trafik_ozetleri" ADD COLUMN "tekil_gun" numeric DEFAULT 0;
  ALTER TABLE "trafik_ozetleri" ADD COLUMN "tekil_ay" numeric DEFAULT 0;
  ALTER TABLE "trafik_ozetleri" ADD COLUMN "yeni" numeric DEFAULT 0;
  ALTER TABLE "trafik_ozetleri" ADD COLUMN "izinli" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trafik_olaylari" DROP COLUMN "izinli";
  ALTER TABLE "trafik_olaylari" DROP COLUMN "yeni_ziyaretci";
  ALTER TABLE "trafik_olaylari" DROP COLUMN "gunun_ilki";
  ALTER TABLE "trafik_olaylari" DROP COLUMN "ayin_ilki";
  ALTER TABLE "trafik_ozetleri" DROP COLUMN "tekil_gun";
  ALTER TABLE "trafik_ozetleri" DROP COLUMN "tekil_ay";
  ALTER TABLE "trafik_ozetleri" DROP COLUMN "yeni";
  ALTER TABLE "trafik_ozetleri" DROP COLUMN "izinli";`)
}
