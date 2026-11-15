import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`basvurular_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`dosyalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`basvurular\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dosyalar_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`basvurular_rels_order_idx\` ON \`basvurular_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_rels_parent_idx\` ON \`basvurular_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_rels_path_idx\` ON \`basvurular_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_rels_dosyalar_id_idx\` ON \`basvurular_rels\` (\`dosyalar_id\`);`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`ay\` numeric;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`bitis_ay\` numeric;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`bitis_yil\` numeric;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`suresiz\` integer;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`kimlik_no\` text;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`url\` text;`)
  await db.run(sql`ALTER TABLE \`adaylar_sertifikalar\` ADD \`dosya_id\` integer REFERENCES dosyalar(id);`)
  await db.run(sql`CREATE INDEX \`adaylar_sertifikalar_dosya_idx\` ON \`adaylar_sertifikalar\` (\`dosya_id\`);`)
  await db.run(sql`ALTER TABLE \`adaylar_rels\` ADD \`taksonomiler_id\` integer REFERENCES taksonomiler(id);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_taksonomiler_id_idx\` ON \`adaylar_rels\` (\`taksonomiler_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`basvurular_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_adaylar_sertifikalar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`kurum\` text,
  	\`yil\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_adaylar_sertifikalar\`("_order", "_parent_id", "id", "ad", "kurum", "yil") SELECT "_order", "_parent_id", "id", "ad", "kurum", "yil" FROM \`adaylar_sertifikalar\`;`)
  await db.run(sql`DROP TABLE \`adaylar_sertifikalar\`;`)
  await db.run(sql`ALTER TABLE \`__new_adaylar_sertifikalar\` RENAME TO \`adaylar_sertifikalar\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`adaylar_sertifikalar_order_idx\` ON \`adaylar_sertifikalar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_sertifikalar_parent_id_idx\` ON \`adaylar_sertifikalar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_adaylar_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`firmalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`firmalar_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_adaylar_rels\`("id", "order", "parent_id", "path", "firmalar_id") SELECT "id", "order", "parent_id", "path", "firmalar_id" FROM \`adaylar_rels\`;`)
  await db.run(sql`DROP TABLE \`adaylar_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_adaylar_rels\` RENAME TO \`adaylar_rels\`;`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_order_idx\` ON \`adaylar_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_parent_idx\` ON \`adaylar_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_path_idx\` ON \`adaylar_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_firmalar_id_idx\` ON \`adaylar_rels\` (\`firmalar_id\`);`)
}
