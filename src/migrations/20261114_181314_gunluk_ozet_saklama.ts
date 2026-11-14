import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`gunluk_ozetler\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tarih\` text NOT NULL,
  	\`yayindaki_ilan\` numeric DEFAULT 0,
  	\`yeni_ilan\` numeric DEFAULT 0,
  	\`basvuru\` numeric DEFAULT 0,
  	\`goruntulenme\` numeric DEFAULT 0,
  	\`toplam_aday\` numeric DEFAULT 0,
  	\`yeni_aday\` numeric DEFAULT 0,
  	\`havuzdaki_aday\` numeric DEFAULT 0,
  	\`ilan_veren_firma\` numeric DEFAULT 0,
  	\`ilanlar\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`gunluk_ozetler_tarih_idx\` ON \`gunluk_ozetler\` (\`tarih\`);`)
  await db.run(sql`CREATE INDEX \`gunluk_ozetler_updated_at_idx\` ON \`gunluk_ozetler\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`gunluk_ozetler_created_at_idx\` ON \`gunluk_ozetler\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`ilanlar\` ADD \`kapanis_tarihi\` text;`)
  await db.run(sql`ALTER TABLE \`_ilanlar_v\` ADD \`version_kapanis_tarihi\` text;`)
  await db.run(sql`ALTER TABLE \`basvurular\` ADD \`anonimlestirildi\` text;`)
  // Göçten önce kapanmış ilanların kapanış tarihi bilinmiyor; son güncelleme tarihi kullanılır (KVKK saklama süresi başlangıcı).
  await db.run(sql`UPDATE \`ilanlar\` SET \`kapanis_tarihi\` = \`updated_at\` WHERE \`durum\` IN ('kapandi', 'suresi-doldu') AND \`kapanis_tarihi\` IS NULL;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`gunluk_ozetler_id\` integer REFERENCES gunluk_ozetler(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gunluk_ozetler_id_idx\` ON \`payload_locked_documents_rels\` (\`gunluk_ozetler_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`gunluk_ozetler\`;`)
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
  	\`talepler_id\` integer,
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
  	FOREIGN KEY (\`test_postalar_id\`) REFERENCES \`test_postalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`talepler_id\`) REFERENCES \`talepler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id", "talepler_id") SELECT "id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id", "talepler_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_talepler_id_idx\` ON \`payload_locked_documents_rels\` (\`talepler_id\`);`)
  await db.run(sql`ALTER TABLE \`ilanlar\` DROP COLUMN \`kapanis_tarihi\`;`)
  await db.run(sql`ALTER TABLE \`_ilanlar_v\` DROP COLUMN \`version_kapanis_tarihi\`;`)
  await db.run(sql`ALTER TABLE \`basvurular\` DROP COLUMN \`anonimlestirildi\`;`)
}
