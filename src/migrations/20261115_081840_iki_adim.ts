import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`iki_asamali_tarih\` text;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`totp_son_adim\` numeric;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`kurtarma_kodlari\` text;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`iki_adim_hata\` numeric;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`iki_adim_kilit\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`iki_asamali_tarih\`;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`totp_son_adim\`;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`kurtarma_kodlari\`;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`iki_adim_hata\`;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`iki_adim_kilit\`;`)
}
