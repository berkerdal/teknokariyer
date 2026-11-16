import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`gorusmeler_secenekler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`baslangic\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`gorusmeler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`gorusmeler_secenekler_order_idx\` ON \`gorusmeler_secenekler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_secenekler_parent_id_idx\` ON \`gorusmeler_secenekler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`gorusmeler\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`basvuru_id\` integer NOT NULL,
  	\`firma_id\` integer NOT NULL,
  	\`ilan_id\` integer NOT NULL,
  	\`aday_kullanici_id\` integer,
  	\`sure\` numeric NOT NULL,
  	\`bicim\` text NOT NULL,
  	\`yer\` text,
  	\`not\` text,
  	\`durum\` text DEFAULT 'bekliyor' NOT NULL,
  	\`secilen\` text,
  	\`aday_notu\` text,
  	\`iptal_nedeni\` text,
  	\`takvim_no\` numeric DEFAULT 0,
  	\`olusturan_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`basvuru_id\`) REFERENCES \`basvurular\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`ilan_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`aday_kullanici_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`olusturan_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`gorusmeler_basvuru_idx\` ON \`gorusmeler\` (\`basvuru_id\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_firma_idx\` ON \`gorusmeler\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_ilan_idx\` ON \`gorusmeler\` (\`ilan_id\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_aday_kullanici_idx\` ON \`gorusmeler\` (\`aday_kullanici_id\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_durum_idx\` ON \`gorusmeler\` (\`durum\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_olusturan_idx\` ON \`gorusmeler\` (\`olusturan_id\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_updated_at_idx\` ON \`gorusmeler\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`gorusmeler_created_at_idx\` ON \`gorusmeler\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`test_postalar\` ADD \`ekler\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`gorusmeler_id\` integer REFERENCES gorusmeler(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gorusmeler_id_idx\` ON \`payload_locked_documents_rels\` (\`gorusmeler_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`gorusmeler_secenekler\`;`)
  await db.run(sql`DROP TABLE \`gorusmeler\`;`)
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
  	\`gunluk_ozetler_id\` integer,
  	\`kvkk_talepleri_id\` integer,
  	\`istek_sinirlari_id\` integer,
  	\`kaydedilen_ilanlar_id\` integer,
  	\`kayitli_aramalar_id\` integer,
  	\`sikayetler_id\` integer,
  	\`hesap_talepleri_id\` integer,
  	\`trafik_olaylari_id\` integer,
  	\`trafik_ozetleri_id\` integer,
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
  	FOREIGN KEY (\`talepler_id\`) REFERENCES \`talepler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`gunluk_ozetler_id\`) REFERENCES \`gunluk_ozetler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`kvkk_talepleri_id\`) REFERENCES \`kvkk_talepleri\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`istek_sinirlari_id\`) REFERENCES \`istek_sinirlari\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`kaydedilen_ilanlar_id\`) REFERENCES \`kaydedilen_ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`kayitli_aramalar_id\`) REFERENCES \`kayitli_aramalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sikayetler_id\`) REFERENCES \`sikayetler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`hesap_talepleri_id\`) REFERENCES \`hesap_talepleri\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`trafik_olaylari_id\`) REFERENCES \`trafik_olaylari\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`trafik_ozetleri_id\`) REFERENCES \`trafik_ozetleri\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id", "talepler_id", "gunluk_ozetler_id", "kvkk_talepleri_id", "istek_sinirlari_id", "kaydedilen_ilanlar_id", "kayitli_aramalar_id", "sikayetler_id", "hesap_talepleri_id", "trafik_olaylari_id", "trafik_ozetleri_id") SELECT "id", "order", "parent_id", "path", "kullanicilar_id", "firmalar_id", "ilanlar_id", "basvurular_id", "adaylar_id", "taksonomiler_id", "davetler_id", "rizalar_id", "havuz_goruntulemeleri_id", "islem_kayitlari_id", "dosyalar_id", "test_postalar_id", "talepler_id", "gunluk_ozetler_id", "kvkk_talepleri_id", "istek_sinirlari_id", "kaydedilen_ilanlar_id", "kayitli_aramalar_id", "sikayetler_id", "hesap_talepleri_id", "trafik_olaylari_id", "trafik_ozetleri_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gunluk_ozetler_id_idx\` ON \`payload_locked_documents_rels\` (\`gunluk_ozetler_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_kvkk_talepleri_id_idx\` ON \`payload_locked_documents_rels\` (\`kvkk_talepleri_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_istek_sinirlari_id_idx\` ON \`payload_locked_documents_rels\` (\`istek_sinirlari_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_kaydedilen_ilanlar_id_idx\` ON \`payload_locked_documents_rels\` (\`kaydedilen_ilanlar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_kayitli_aramalar_id_idx\` ON \`payload_locked_documents_rels\` (\`kayitli_aramalar_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_sikayetler_id_idx\` ON \`payload_locked_documents_rels\` (\`sikayetler_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_hesap_talepleri_id_idx\` ON \`payload_locked_documents_rels\` (\`hesap_talepleri_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_trafik_olaylari_id_idx\` ON \`payload_locked_documents_rels\` (\`trafik_olaylari_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_trafik_ozetleri_id_idx\` ON \`payload_locked_documents_rels\` (\`trafik_ozetleri_id\`);`)
  await db.run(sql`ALTER TABLE \`test_postalar\` DROP COLUMN \`ekler\`;`)
}
