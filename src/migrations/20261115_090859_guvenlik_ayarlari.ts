import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_eposta_kodu_dakika\` numeric DEFAULT 10;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_cihaz_gun\` numeric DEFAULT 90;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_yeniden_gonder_saniye\` numeric DEFAULT 60;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_saatte_en_fazla_kod\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_en_fazla_hata\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` ADD \`guvenlik_kilit_dakika\` numeric DEFAULT 15;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_eposta_kodu_dakika\` numeric DEFAULT 10;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_cihaz_gun\` numeric DEFAULT 90;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_yeniden_gonder_saniye\` numeric DEFAULT 60;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_saatte_en_fazla_kod\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_en_fazla_hata\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` ADD \`version_guvenlik_kilit_dakika\` numeric DEFAULT 15;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_eposta_kodu_dakika\`;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_cihaz_gun\`;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_yeniden_gonder_saniye\`;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_saatte_en_fazla_kod\`;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_en_fazla_hata\`;`)
  await db.run(sql`ALTER TABLE \`ayarlar\` DROP COLUMN \`guvenlik_kilit_dakika\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_eposta_kodu_dakika\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_cihaz_gun\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_yeniden_gonder_saniye\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_saatte_en_fazla_kod\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_en_fazla_hata\`;`)
  await db.run(sql`ALTER TABLE \`_ayarlar_v\` DROP COLUMN \`version_guvenlik_kilit_dakika\`;`)
}
