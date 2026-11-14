import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`talepler_oneriler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`kabul\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`talepler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`talepler_oneriler_order_idx\` ON \`talepler_oneriler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`talepler_oneriler_parent_id_idx\` ON \`talepler_oneriler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`talepler\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ozet\` text,
  	\`taksonomi_turu\` text NOT NULL,
  	\`aciklama\` text,
  	\`kaynak\` text,
  	\`talep_eden_id\` integer,
  	\`firma_id\` integer,
  	\`durum\` text DEFAULT 'bekliyor' NOT NULL,
  	\`sonuc_notu\` text,
  	\`sonuclandiran_id\` integer,
  	\`sonuc_tarihi\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`talep_eden_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`sonuclandiran_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`talepler_talep_eden_idx\` ON \`talepler\` (\`talep_eden_id\`);`)
  await db.run(sql`CREATE INDEX \`talepler_firma_idx\` ON \`talepler\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`talepler_durum_idx\` ON \`talepler\` (\`durum\`);`)
  await db.run(sql`CREATE INDEX \`talepler_sonuclandiran_idx\` ON \`talepler\` (\`sonuclandiran_id\`);`)
  await db.run(sql`CREATE INDEX \`talepler_updated_at_idx\` ON \`talepler\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`talepler_created_at_idx\` ON \`talepler\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`talepler_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`taksonomiler_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`talepler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`talepler_rels_order_idx\` ON \`talepler_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`talepler_rels_parent_idx\` ON \`talepler_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`talepler_rels_path_idx\` ON \`talepler_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`talepler_rels_taksonomiler_id_idx\` ON \`talepler_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` ADD \`unvan\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`talepler_id\` integer REFERENCES talepler(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_talepler_id_idx\` ON \`payload_locked_documents_rels\` (\`talepler_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`talepler_oneriler\`;`)
  await db.run(sql`DROP TABLE \`talepler\`;`)
  await db.run(sql`DROP TABLE \`talepler_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`kullanicilar_id\` integer,
  	\`firmalar_id\` integer,
  	\`ilanlar_id\` integer,
  	\`basvurular_id\` integer,
  	\`adaylar_id\` integer,
  	\`taksonomiler_id\` integer,
  	\`davetler_id\` integer,
  	\`rizalar_id\` integer,
  	\`havuz_goruntulemeleri_id\` integer,
  	\`islem_kayitlari_id\` integer,
  	\`dosyalar_id\` integer,
  	\`test_postalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`kullanicilar_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`firmalar_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`ilanlar_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`basvurular_id\`) REFERENCES \`basvurular\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`adaylar_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`davetler_id\`) REFERENCES \`davetler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`rizalar_id\`) REFERENCES \`rizalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`havuz_goruntulemeleri_id\`) REFERENCES \`havuz_goruntulemeleri\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`islem_kayitlari_id\`) REFERENCES \`islem_kayitlari\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dosyalar_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`test_postalar_id\`) REFERENCES \`test_postalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id") SELECT "id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_kullanicilar_id_idx\` ON \`payload_locked_documents_rels\` (\`kullanicilar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_firmalar_id_idx\` ON \`payload_locked_documents_rels\` (\`firmalar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_ilanlar_id_idx\` ON \`payload_locked_documents_rels\` (\`ilanlar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_basvurular_id_idx\` ON \`payload_locked_documents_rels\` (\`basvurular_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_adaylar_id_idx\` ON \`payload_locked_documents_rels\` (\`adaylar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_taksonomiler_id_idx\` ON \`payload_locked_documents_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_davetler_id_idx\` ON \`payload_locked_documents_rels\` (\`davetler_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_rizalar_id_idx\` ON \`payload_locked_documents_rels\` (\`rizalar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_havuz_goruntulemeleri_id_idx\` ON \`payload_locked_documents_rels\` (\`havuz_goruntulemeleri_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_islem_kayitlari_id_idx\` ON \`payload_locked_documents_rels\` (\`islem_kayitlari_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dosyalar_id_idx\` ON \`payload_locked_documents_rels\` (\`dosyalar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_test_postalar_id_idx\` ON \`payload_locked_documents_rels\` (\`test_postalar_id\`);`)
  await db.run(sql`ALTER TABLE \`kullanicilar\` DROP COLUMN \`unvan\`;`)
}
