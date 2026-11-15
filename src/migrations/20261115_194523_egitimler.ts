import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`adaylar_egitimler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`duzey\` text NOT NULL,
  	\`okul_id\` integer,
  	\`okul_adi\` text,
  	\`bolum_id\` integer,
  	\`baslangic_yil\` numeric,
  	\`bitis_ay\` numeric,
  	\`bitis_yil\` numeric,
  	\`devam\` integer,
  	\`sinif\` text,
  	\`gano\` numeric,
  	FOREIGN KEY (\`okul_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bolum_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_egitimler_order_idx\` ON \`adaylar_egitimler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_egitimler_parent_id_idx\` ON \`adaylar_egitimler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_egitimler_okul_idx\` ON \`adaylar_egitimler\` (\`okul_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_egitimler_bolum_idx\` ON \`adaylar_egitimler\` (\`bolum_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`adaylar_egitimler\`;`)
}
