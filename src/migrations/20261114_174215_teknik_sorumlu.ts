import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`teknik_sorumlu\` integer DEFAULT false;`)
  // Payload ekranı artık yalnızca teknik sorumluya açık. Göç anındaki tam yetkili kurum kullanıcıları erişimini kaybetmesin:
  // teknik sorumlu olarak başlarlar (test ortamında yalnızca test yöneticisi). Sonradan eklenenler varsayılan olarak değildir.
  await db.run(sql`UPDATE \`kullanicilar\` SET \`teknik_sorumlu\` = 1 WHERE \`rol\` = 'yonetici';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`teknik_sorumlu\`;`)
}
