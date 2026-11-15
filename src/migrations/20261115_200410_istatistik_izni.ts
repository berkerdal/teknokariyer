import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` ADD \`izinli\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` ADD \`yeni_ziyaretci\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` ADD \`gunun_ilki\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` ADD \`ayin_ilki\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` ADD \`tekil_gun\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` ADD \`tekil_ay\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` ADD \`yeni\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` ADD \`izinli\` numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` DROP COLUMN \`izinli\`;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` DROP COLUMN \`yeni_ziyaretci\`;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` DROP COLUMN \`gunun_ilki\`;`)
  await db.run(sql`ALTER TABLE \`trafik_olaylari\` DROP COLUMN \`ayin_ilki\`;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` DROP COLUMN \`tekil_gun\`;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` DROP COLUMN \`tekil_ay\`;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` DROP COLUMN \`yeni\`;`)
  await db.run(sql`ALTER TABLE \`trafik_ozetleri\` DROP COLUMN \`izinli\`;`)
}
