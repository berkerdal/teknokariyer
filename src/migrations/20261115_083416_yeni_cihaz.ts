import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`taninan_cihazlar\` text;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`eposta_kodu\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`taninan_cihazlar\`;`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`eposta_kodu\`;`)
}
