import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`kullanicilar_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`kullanicilar_sessions_order_idx\` ON \`kullanicilar_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`kullanicilar_sessions_parent_id_idx\` ON \`kullanicilar_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`kullanicilar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`rol\` text DEFAULT 'aday' NOT NULL,
  	\`firma_id\` integer,
  	\`firma_yetkisi\` text,
  	\`iki_asamali_acik\` integer DEFAULT false,
  	\`totp_gizli\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`_verified\` integer,
  	\`_verificationtoken\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`kullanicilar_firma_idx\` ON \`kullanicilar\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`kullanicilar_updated_at_idx\` ON \`kullanicilar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`kullanicilar_created_at_idx\` ON \`kullanicilar\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`kullanicilar_email_idx\` ON \`kullanicilar\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`firmalar_calisma_modelleri\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`firmalar_calisma_modelleri_order_idx\` ON \`firmalar_calisma_modelleri\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_calisma_modelleri_parent_idx\` ON \`firmalar_calisma_modelleri\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`firmalar_yan_haklar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`firmalar_yan_haklar_order_idx\` ON \`firmalar_yan_haklar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_yan_haklar_parent_id_idx\` ON \`firmalar_yan_haklar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`firmalar_takip_notlari\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`not\` text NOT NULL,
  	\`tarih\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`firmalar_takip_notlari_order_idx\` ON \`firmalar_takip_notlari\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_takip_notlari_parent_id_idx\` ON \`firmalar_takip_notlari\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`firmalar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`unvan\` text NOT NULL,
  	\`kisa_ad\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`konum\` text NOT NULL,
  	\`sektor_id\` integer,
  	\`web\` text,
  	\`logo_id\` integer,
  	\`kisa_tanitim\` text,
  	\`uzun_tanitim\` text,
  	\`kurulus_yili\` numeric,
  	\`calisan_araligi\` text,
  	\`asama\` text DEFAULT 'iskelet' NOT NULL,
  	\`guvenilir\` integer DEFAULT false,
  	\`onaylanmis_ilan_sayisi\` numeric DEFAULT 0,
  	\`test_firmasi\` integer DEFAULT false,
  	\`yetkili_ad\` text,
  	\`yetkili_eposta\` text,
  	\`yetkili_telefon\` text,
  	\`yayina_hazir\` integer DEFAULT false,
  	\`arama\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`sektor_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`firmalar_slug_idx\` ON \`firmalar\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_sektor_idx\` ON \`firmalar\` (\`sektor_id\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_logo_idx\` ON \`firmalar\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_arama_idx\` ON \`firmalar\` (\`arama\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_updated_at_idx\` ON \`firmalar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_created_at_idx\` ON \`firmalar\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`firmalar_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`taksonomiler_id\` integer,
  	\`dosyalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dosyalar_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`firmalar_rels_order_idx\` ON \`firmalar_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_rels_parent_idx\` ON \`firmalar_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_rels_path_idx\` ON \`firmalar_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_rels_taksonomiler_id_idx\` ON \`firmalar_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`CREATE INDEX \`firmalar_rels_dosyalar_id_idx\` ON \`firmalar_rels\` (\`dosyalar_id\`);`)
  await db.run(sql`CREATE TABLE \`_firmalar_v_version_calisma_modelleri\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_firmalar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_calisma_modelleri_order_idx\` ON \`_firmalar_v_version_calisma_modelleri\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_calisma_modelleri_parent_idx\` ON \`_firmalar_v_version_calisma_modelleri\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_firmalar_v_version_yan_haklar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_firmalar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_yan_haklar_order_idx\` ON \`_firmalar_v_version_yan_haklar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_yan_haklar_parent_id_idx\` ON \`_firmalar_v_version_yan_haklar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_firmalar_v_version_takip_notlari\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`not\` text NOT NULL,
  	\`tarih\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_firmalar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_takip_notlari_order_idx\` ON \`_firmalar_v_version_takip_notlari\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_takip_notlari_parent_id_idx\` ON \`_firmalar_v_version_takip_notlari\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_firmalar_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_unvan\` text NOT NULL,
  	\`version_kisa_ad\` text NOT NULL,
  	\`version_slug\` text NOT NULL,
  	\`version_konum\` text NOT NULL,
  	\`version_sektor_id\` integer,
  	\`version_web\` text,
  	\`version_logo_id\` integer,
  	\`version_kisa_tanitim\` text,
  	\`version_uzun_tanitim\` text,
  	\`version_kurulus_yili\` numeric,
  	\`version_calisan_araligi\` text,
  	\`version_asama\` text DEFAULT 'iskelet' NOT NULL,
  	\`version_guvenilir\` integer DEFAULT false,
  	\`version_onaylanmis_ilan_sayisi\` numeric DEFAULT 0,
  	\`version_test_firmasi\` integer DEFAULT false,
  	\`version_yetkili_ad\` text,
  	\`version_yetkili_eposta\` text,
  	\`version_yetkili_telefon\` text,
  	\`version_yayina_hazir\` integer DEFAULT false,
  	\`version_arama\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_sektor_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_logo_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_firmalar_v_parent_idx\` ON \`_firmalar_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_slug_idx\` ON \`_firmalar_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_sektor_idx\` ON \`_firmalar_v\` (\`version_sektor_id\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_logo_idx\` ON \`_firmalar_v\` (\`version_logo_id\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_arama_idx\` ON \`_firmalar_v\` (\`version_arama\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_updated_at_idx\` ON \`_firmalar_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_version_version_created_at_idx\` ON \`_firmalar_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_created_at_idx\` ON \`_firmalar_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_updated_at_idx\` ON \`_firmalar_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_firmalar_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`taksonomiler_id\` integer,
  	\`dosyalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_firmalar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dosyalar_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_firmalar_v_rels_order_idx\` ON \`_firmalar_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_rels_parent_idx\` ON \`_firmalar_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_rels_path_idx\` ON \`_firmalar_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_rels_taksonomiler_id_idx\` ON \`_firmalar_v_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`CREATE INDEX \`_firmalar_v_rels_dosyalar_id_idx\` ON \`_firmalar_v_rels\` (\`dosyalar_id\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar_diller\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`dil_id\` integer NOT NULL,
  	\`seviye\` text NOT NULL,
  	FOREIGN KEY (\`dil_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_diller_order_idx\` ON \`ilanlar_diller\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_diller_parent_id_idx\` ON \`ilanlar_diller\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_diller_dil_idx\` ON \`ilanlar_diller\` (\`dil_id\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar_yan_haklar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_yan_haklar_order_idx\` ON \`ilanlar_yan_haklar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_yan_haklar_parent_id_idx\` ON \`ilanlar_yan_haklar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar_on_eleme_sorulari_secenekler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ilanlar_on_eleme_sorulari\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_on_eleme_sorulari_secenekler_order_idx\` ON \`ilanlar_on_eleme_sorulari_secenekler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_on_eleme_sorulari_secenekler_parent_id_idx\` ON \`ilanlar_on_eleme_sorulari_secenekler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar_on_eleme_sorulari\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`soru\` text NOT NULL,
  	\`tip\` text DEFAULT 'kisa' NOT NULL,
  	\`eleyici\` integer DEFAULT false,
  	\`beklenen_cevap\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_on_eleme_sorulari_order_idx\` ON \`ilanlar_on_eleme_sorulari\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_on_eleme_sorulari_parent_id_idx\` ON \`ilanlar_on_eleme_sorulari\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`firma_id\` integer NOT NULL,
  	\`pozisyon_adi\` text NOT NULL,
  	\`tur\` text NOT NULL,
  	\`alt_tur\` text NOT NULL,
  	\`aile_id\` integer NOT NULL,
  	\`model\` text NOT NULL,
  	\`konum\` text DEFAULT 'Pamukkale Teknokent' NOT NULL,
  	\`deneyim\` text NOT NULL,
  	\`egitim\` text NOT NULL,
  	\`pozisyon_sayisi\` numeric DEFAULT 1,
  	\`son_basvuru\` text NOT NULL,
  	\`baslangic\` text,
  	\`ucret_en_az\` numeric,
  	\`ucret_en_cok\` numeric,
  	\`ucret_gorunur\` integer DEFAULT false,
  	\`is_tanimi\` text NOT NULL,
  	\`nitelikler\` text NOT NULL,
  	\`sartname_id\` integer,
  	\`linkedin_metni\` text,
  	\`dil\` text DEFAULT 'tr' NOT NULL,
  	\`staj_donemi\` text,
  	\`ucretli_staj\` integer DEFAULT false,
  	\`sgk\` text,
  	\`staj_belgesi\` integer DEFAULT true,
  	\`pau_oncelik\` integer DEFAULT false,
  	\`durum\` text DEFAULT 'taslak' NOT NULL,
  	\`duzeltme_gerekcesi\` text,
  	\`kapanis_nedeni\` text,
  	\`yayin_tarihi\` text,
  	\`basvuru_sayisi\` numeric DEFAULT 0,
  	\`goruntulenme\` numeric DEFAULT 0,
  	\`arama\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`aile_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`sartname_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_firma_idx\` ON \`ilanlar\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_aile_idx\` ON \`ilanlar\` (\`aile_id\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_son_basvuru_idx\` ON \`ilanlar\` (\`son_basvuru\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_sartname_idx\` ON \`ilanlar\` (\`sartname_id\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_durum_idx\` ON \`ilanlar\` (\`durum\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_arama_idx\` ON \`ilanlar\` (\`arama\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_updated_at_idx\` ON \`ilanlar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_created_at_idx\` ON \`ilanlar\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ilanlar_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`taksonomiler_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ilanlar_rels_order_idx\` ON \`ilanlar_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_rels_parent_idx\` ON \`ilanlar_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_rels_path_idx\` ON \`ilanlar_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`ilanlar_rels_taksonomiler_id_idx\` ON \`ilanlar_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v_version_diller\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`dil_id\` integer NOT NULL,
  	\`seviye\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`dil_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ilanlar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_diller_order_idx\` ON \`_ilanlar_v_version_diller\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_diller_parent_id_idx\` ON \`_ilanlar_v_version_diller\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_diller_dil_idx\` ON \`_ilanlar_v_version_diller\` (\`dil_id\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v_version_yan_haklar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ilanlar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_yan_haklar_order_idx\` ON \`_ilanlar_v_version_yan_haklar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_yan_haklar_parent_id_idx\` ON \`_ilanlar_v_version_yan_haklar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v_version_on_eleme_sorulari_secenekler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ilanlar_v_version_on_eleme_sorulari\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_on_eleme_sorulari_secenekler_order_idx\` ON \`_ilanlar_v_version_on_eleme_sorulari_secenekler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_on_eleme_sorulari_secenekler_parent_id_idx\` ON \`_ilanlar_v_version_on_eleme_sorulari_secenekler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v_version_on_eleme_sorulari\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`soru\` text NOT NULL,
  	\`tip\` text DEFAULT 'kisa' NOT NULL,
  	\`eleyici\` integer DEFAULT false,
  	\`beklenen_cevap\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ilanlar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_on_eleme_sorulari_order_idx\` ON \`_ilanlar_v_version_on_eleme_sorulari\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_on_eleme_sorulari_parent_id_idx\` ON \`_ilanlar_v_version_on_eleme_sorulari\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_firma_id\` integer NOT NULL,
  	\`version_pozisyon_adi\` text NOT NULL,
  	\`version_tur\` text NOT NULL,
  	\`version_alt_tur\` text NOT NULL,
  	\`version_aile_id\` integer NOT NULL,
  	\`version_model\` text NOT NULL,
  	\`version_konum\` text DEFAULT 'Pamukkale Teknokent' NOT NULL,
  	\`version_deneyim\` text NOT NULL,
  	\`version_egitim\` text NOT NULL,
  	\`version_pozisyon_sayisi\` numeric DEFAULT 1,
  	\`version_son_basvuru\` text NOT NULL,
  	\`version_baslangic\` text,
  	\`version_ucret_en_az\` numeric,
  	\`version_ucret_en_cok\` numeric,
  	\`version_ucret_gorunur\` integer DEFAULT false,
  	\`version_is_tanimi\` text NOT NULL,
  	\`version_nitelikler\` text NOT NULL,
  	\`version_sartname_id\` integer,
  	\`version_linkedin_metni\` text,
  	\`version_dil\` text DEFAULT 'tr' NOT NULL,
  	\`version_staj_donemi\` text,
  	\`version_ucretli_staj\` integer DEFAULT false,
  	\`version_sgk\` text,
  	\`version_staj_belgesi\` integer DEFAULT true,
  	\`version_pau_oncelik\` integer DEFAULT false,
  	\`version_durum\` text DEFAULT 'taslak' NOT NULL,
  	\`version_duzeltme_gerekcesi\` text,
  	\`version_kapanis_nedeni\` text,
  	\`version_yayin_tarihi\` text,
  	\`version_basvuru_sayisi\` numeric DEFAULT 0,
  	\`version_goruntulenme\` numeric DEFAULT 0,
  	\`version_arama\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_aile_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_sartname_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_parent_idx\` ON \`_ilanlar_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_firma_idx\` ON \`_ilanlar_v\` (\`version_firma_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_aile_idx\` ON \`_ilanlar_v\` (\`version_aile_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_son_basvuru_idx\` ON \`_ilanlar_v\` (\`version_son_basvuru\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_sartname_idx\` ON \`_ilanlar_v\` (\`version_sartname_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_durum_idx\` ON \`_ilanlar_v\` (\`version_durum\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_arama_idx\` ON \`_ilanlar_v\` (\`version_arama\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_updated_at_idx\` ON \`_ilanlar_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_version_version_created_at_idx\` ON \`_ilanlar_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_created_at_idx\` ON \`_ilanlar_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_updated_at_idx\` ON \`_ilanlar_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_ilanlar_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`taksonomiler_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_ilanlar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taksonomiler_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_rels_order_idx\` ON \`_ilanlar_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_rels_parent_idx\` ON \`_ilanlar_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_rels_path_idx\` ON \`_ilanlar_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_ilanlar_v_rels_taksonomiler_id_idx\` ON \`_ilanlar_v_rels\` (\`taksonomiler_id\`);`)
  await db.run(sql`CREATE TABLE \`basvurular_etiketler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`basvurular\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`basvurular_etiketler_order_idx\` ON \`basvurular_etiketler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_etiketler_parent_id_idx\` ON \`basvurular_etiketler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`basvurular_ekip_notlari\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`not\` text NOT NULL,
  	\`yazan_id\` integer,
  	FOREIGN KEY (\`yazan_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`basvurular\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`basvurular_ekip_notlari_order_idx\` ON \`basvurular_ekip_notlari\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_ekip_notlari_parent_id_idx\` ON \`basvurular_ekip_notlari\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_ekip_notlari_yazan_idx\` ON \`basvurular_ekip_notlari\` (\`yazan_id\`);`)
  await db.run(sql`CREATE TABLE \`basvurular\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ilan_id\` integer NOT NULL,
  	\`firma_id\` integer,
  	\`aday_kullanici_id\` integer,
  	\`aday_kodu\` text,
  	\`profil_kopyasi\` text NOT NULL,
  	\`cv_id\` integer,
  	\`on_yazi\` text,
  	\`cevaplar\` text,
  	\`eleyici_uyari\` integer DEFAULT false,
  	\`kaynak\` text DEFAULT 'portal',
  	\`durum\` text DEFAULT 'alindi' NOT NULL,
  	\`puan\` numeric,
  	\`aydinlatma_surumu\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`ilan_id\`) REFERENCES \`ilanlar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`aday_kullanici_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`cv_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`basvurular_ilan_idx\` ON \`basvurular\` (\`ilan_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_firma_idx\` ON \`basvurular\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_aday_kullanici_idx\` ON \`basvurular\` (\`aday_kullanici_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_cv_idx\` ON \`basvurular\` (\`cv_id\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_durum_idx\` ON \`basvurular\` (\`durum\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_updated_at_idx\` ON \`basvurular\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`basvurular_created_at_idx\` ON \`basvurular\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_deneyimler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kurum\` text NOT NULL,
  	\`pozisyon\` text NOT NULL,
  	\`baslangic\` text,
  	\`bitis\` text,
  	\`aciklama\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_deneyimler_order_idx\` ON \`adaylar_deneyimler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_deneyimler_parent_id_idx\` ON \`adaylar_deneyimler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_beceriler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`beceri_id\` integer NOT NULL,
  	\`seviye\` text DEFAULT 'orta',
  	FOREIGN KEY (\`beceri_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_beceriler_order_idx\` ON \`adaylar_beceriler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_beceriler_parent_id_idx\` ON \`adaylar_beceriler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_beceriler_beceri_idx\` ON \`adaylar_beceriler\` (\`beceri_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_diller\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`dil_id\` integer NOT NULL,
  	\`seviye\` text NOT NULL,
  	FOREIGN KEY (\`dil_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_diller_order_idx\` ON \`adaylar_diller\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_diller_parent_id_idx\` ON \`adaylar_diller\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_diller_dil_idx\` ON \`adaylar_diller\` (\`dil_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_sertifikalar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`kurum\` text,
  	\`yil\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_sertifikalar_order_idx\` ON \`adaylar_sertifikalar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_sertifikalar_parent_id_idx\` ON \`adaylar_sertifikalar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_baglantilar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`adres\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_baglantilar_order_idx\` ON \`adaylar_baglantilar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_baglantilar_parent_id_idx\` ON \`adaylar_baglantilar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_tercihler_turler\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_tercihler_turler_order_idx\` ON \`adaylar_tercihler_turler\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_tercihler_turler_parent_idx\` ON \`adaylar_tercihler_turler\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_tercihler_modeller\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_tercihler_modeller_order_idx\` ON \`adaylar_tercihler_modeller\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_tercihler_modeller_parent_idx\` ON \`adaylar_tercihler_modeller\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_cvler\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	\`dosya_id\` integer NOT NULL,
  	FOREIGN KEY (\`dosya_id\`) REFERENCES \`dosyalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_cvler_order_idx\` ON \`adaylar_cvler\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_cvler_parent_id_idx\` ON \`adaylar_cvler\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_cvler_dosya_idx\` ON \`adaylar_cvler\` (\`dosya_id\`);`)
  await db.run(sql`CREATE TABLE \`adaylar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kullanici_id\` integer NOT NULL,
  	\`kod\` text,
  	\`telefon\` text,
  	\`cinsiyet\` text,
  	\`tanitim\` text,
  	\`okul_id\` integer,
  	\`bolum_id\` integer,
  	\`sinif\` text,
  	\`mezuniyet\` text,
  	\`gano\` numeric,
  	\`deneyim_seviyesi\` text,
  	\`tercihler_baslama\` text,
  	\`tercihler_sehir\` text,
  	\`tercihler_tasinmaya_acik\` integer DEFAULT false,
  	\`tercihler_ucret_beklentisi\` numeric,
  	\`askerlik\` text,
  	\`ozel_nitelikli\` text,
  	\`havuz_gorunurluk\` text DEFAULT 'gizli',
  	\`havuz_riza_tarihi\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`kullanici_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`okul_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`bolum_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`adaylar_kullanici_idx\` ON \`adaylar\` (\`kullanici_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`adaylar_kod_idx\` ON \`adaylar\` (\`kod\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_okul_idx\` ON \`adaylar\` (\`okul_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_bolum_idx\` ON \`adaylar\` (\`bolum_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_updated_at_idx\` ON \`adaylar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_created_at_idx\` ON \`adaylar\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`adaylar_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`firmalar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`firmalar_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`adaylar_rels_order_idx\` ON \`adaylar_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_parent_idx\` ON \`adaylar_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_path_idx\` ON \`adaylar_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`adaylar_rels_firmalar_id_idx\` ON \`adaylar_rels\` (\`firmalar_id\`);`)
  await db.run(sql`CREATE TABLE \`taksonomiler_es_anlamlilar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ad\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`taksonomiler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`taksonomiler_es_anlamlilar_order_idx\` ON \`taksonomiler_es_anlamlilar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`taksonomiler_es_anlamlilar_parent_id_idx\` ON \`taksonomiler_es_anlamlilar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`taksonomiler\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tur\` text NOT NULL,
  	\`ad\` text NOT NULL,
  	\`aktif\` integer DEFAULT true,
  	\`arama\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`taksonomiler_tur_idx\` ON \`taksonomiler\` (\`tur\`);`)
  await db.run(sql`CREATE INDEX \`taksonomiler_arama_idx\` ON \`taksonomiler\` (\`arama\`);`)
  await db.run(sql`CREATE INDEX \`taksonomiler_updated_at_idx\` ON \`taksonomiler\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`taksonomiler_created_at_idx\` ON \`taksonomiler\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`davetler_hatirlatmalar\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tarih\` text NOT NULL,
  	\`gun\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`davetler\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`davetler_hatirlatmalar_order_idx\` ON \`davetler_hatirlatmalar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`davetler_hatirlatmalar_parent_id_idx\` ON \`davetler_hatirlatmalar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`davetler\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`firma_id\` integer NOT NULL,
  	\`ad\` text NOT NULL,
  	\`eposta\` text NOT NULL,
  	\`firma_yetkisi\` text DEFAULT 'yonetici',
  	\`anahtar_ozeti\` text NOT NULL,
  	\`son_gecerlilik\` text NOT NULL,
  	\`kullanildi\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`davetler_firma_idx\` ON \`davetler\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`davetler_anahtar_ozeti_idx\` ON \`davetler\` (\`anahtar_ozeti\`);`)
  await db.run(sql`CREATE INDEX \`davetler_updated_at_idx\` ON \`davetler\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`davetler_created_at_idx\` ON \`davetler\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`rizalar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kullanici_id\` integer NOT NULL,
  	\`tur\` text NOT NULL,
  	\`metin_surumu\` text NOT NULL,
  	\`geri_alinma\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`kullanici_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`rizalar_kullanici_idx\` ON \`rizalar\` (\`kullanici_id\`);`)
  await db.run(sql`CREATE INDEX \`rizalar_updated_at_idx\` ON \`rizalar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`rizalar_created_at_idx\` ON \`rizalar\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`havuz_goruntulemeleri\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`aday_id\` integer NOT NULL,
  	\`firma_id\` integer NOT NULL,
  	\`kim_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`aday_id\`) REFERENCES \`adaylar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`firma_id\`) REFERENCES \`firmalar\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`kim_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`havuz_goruntulemeleri_aday_idx\` ON \`havuz_goruntulemeleri\` (\`aday_id\`);`)
  await db.run(sql`CREATE INDEX \`havuz_goruntulemeleri_firma_idx\` ON \`havuz_goruntulemeleri\` (\`firma_id\`);`)
  await db.run(sql`CREATE INDEX \`havuz_goruntulemeleri_kim_idx\` ON \`havuz_goruntulemeleri\` (\`kim_id\`);`)
  await db.run(sql`CREATE INDEX \`havuz_goruntulemeleri_updated_at_idx\` ON \`havuz_goruntulemeleri\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`havuz_goruntulemeleri_created_at_idx\` ON \`havuz_goruntulemeleri\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`islem_kayitlari\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`islem\` text NOT NULL,
  	\`tur\` text NOT NULL,
  	\`kim_id\` integer,
  	\`kayit_turu\` text,
  	\`kayit_id\` text,
  	\`ayrinti\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`kim_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_tur_idx\` ON \`islem_kayitlari\` (\`tur\`);`)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_kim_idx\` ON \`islem_kayitlari\` (\`kim_id\`);`)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_kayit_turu_idx\` ON \`islem_kayitlari\` (\`kayit_turu\`);`)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_kayit_id_idx\` ON \`islem_kayitlari\` (\`kayit_id\`);`)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_updated_at_idx\` ON \`islem_kayitlari\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`islem_kayitlari_created_at_idx\` ON \`islem_kayitlari\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`dosyalar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tur\` text NOT NULL,
  	\`alt\` text,
  	\`sahip_id\` integer,
  	\`tarama_durumu\` text DEFAULT 'bekliyor',
  	\`_objectkey\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	FOREIGN KEY (\`sahip_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`dosyalar_tur_idx\` ON \`dosyalar\` (\`tur\`);`)
  await db.run(sql`CREATE INDEX \`dosyalar_sahip_idx\` ON \`dosyalar\` (\`sahip_id\`);`)
  await db.run(sql`CREATE INDEX \`dosyalar_updated_at_idx\` ON \`dosyalar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`dosyalar_created_at_idx\` ON \`dosyalar\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`dosyalar_filename_idx\` ON \`dosyalar\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`test_postalar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kime\` text NOT NULL,
  	\`konu\` text,
  	\`html\` text,
  	\`metin\` text,
  	\`ortam\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`test_postalar_updated_at_idx\` ON \`test_postalar\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`test_postalar_created_at_idx\` ON \`test_postalar\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`kullanicilar_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`kullanicilar_id\`) REFERENCES \`kullanicilar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_kullanicilar_id_idx\` ON \`payload_preferences_rels\` (\`kullanicilar_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ayarlar_hatirlatma_gunleri\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`gun\` numeric NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ayarlar\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ayarlar_hatirlatma_gunleri_order_idx\` ON \`ayarlar_hatirlatma_gunleri\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ayarlar_hatirlatma_gunleri_parent_id_idx\` ON \`ayarlar_hatirlatma_gunleri\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ayarlar\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`onayli_ilan_sayisi\` numeric DEFAULT 3,
  	\`en_uzun_sure_gun\` numeric DEFAULT 60,
  	\`onay_hedefi_is_gunu\` numeric DEFAULT 1,
  	\`eslesme_agirliklari_zorunlu_beceri\` numeric DEFAULT 50,
  	\`eslesme_agirliklari_tercih_beceri\` numeric DEFAULT 10,
  	\`eslesme_agirliklari_model\` numeric DEFAULT 15,
  	\`eslesme_agirliklari_bolum\` numeric DEFAULT 10,
  	\`eslesme_agirliklari_deneyim\` numeric DEFAULT 10,
  	\`eslesme_agirliklari_dil\` numeric DEFAULT 5,
  	\`saklama_basvuru_anonimlestirme_ay\` numeric DEFAULT 12,
  	\`saklama_havuz_riza_ay\` numeric DEFAULT 12,
  	\`saklama_islem_kaydi_ay\` numeric DEFAULT 24,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_ayarlar_v_version_hatirlatma_gunleri\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`gun\` numeric NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ayarlar_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ayarlar_v_version_hatirlatma_gunleri_order_idx\` ON \`_ayarlar_v_version_hatirlatma_gunleri\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ayarlar_v_version_hatirlatma_gunleri_parent_id_idx\` ON \`_ayarlar_v_version_hatirlatma_gunleri\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ayarlar_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_onayli_ilan_sayisi\` numeric DEFAULT 3,
  	\`version_en_uzun_sure_gun\` numeric DEFAULT 60,
  	\`version_onay_hedefi_is_gunu\` numeric DEFAULT 1,
  	\`version_eslesme_agirliklari_zorunlu_beceri\` numeric DEFAULT 50,
  	\`version_eslesme_agirliklari_tercih_beceri\` numeric DEFAULT 10,
  	\`version_eslesme_agirliklari_model\` numeric DEFAULT 15,
  	\`version_eslesme_agirliklari_bolum\` numeric DEFAULT 10,
  	\`version_eslesme_agirliklari_deneyim\` numeric DEFAULT 10,
  	\`version_eslesme_agirliklari_dil\` numeric DEFAULT 5,
  	\`version_saklama_basvuru_anonimlestirme_ay\` numeric DEFAULT 12,
  	\`version_saklama_havuz_riza_ay\` numeric DEFAULT 12,
  	\`version_saklama_islem_kaydi_ay\` numeric DEFAULT 24,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_ayarlar_v_created_at_idx\` ON \`_ayarlar_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ayarlar_v_updated_at_idx\` ON \`_ayarlar_v\` (\`updated_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`kullanicilar_sessions\`;`)
  await db.run(sql`DROP TABLE \`kullanicilar\`;`)
  await db.run(sql`DROP TABLE \`firmalar_calisma_modelleri\`;`)
  await db.run(sql`DROP TABLE \`firmalar_yan_haklar\`;`)
  await db.run(sql`DROP TABLE \`firmalar_takip_notlari\`;`)
  await db.run(sql`DROP TABLE \`firmalar\`;`)
  await db.run(sql`DROP TABLE \`firmalar_rels\`;`)
  await db.run(sql`DROP TABLE \`_firmalar_v_version_calisma_modelleri\`;`)
  await db.run(sql`DROP TABLE \`_firmalar_v_version_yan_haklar\`;`)
  await db.run(sql`DROP TABLE \`_firmalar_v_version_takip_notlari\`;`)
  await db.run(sql`DROP TABLE \`_firmalar_v\`;`)
  await db.run(sql`DROP TABLE \`_firmalar_v_rels\`;`)
  await db.run(sql`DROP TABLE \`ilanlar_diller\`;`)
  await db.run(sql`DROP TABLE \`ilanlar_yan_haklar\`;`)
  await db.run(sql`DROP TABLE \`ilanlar_on_eleme_sorulari_secenekler\`;`)
  await db.run(sql`DROP TABLE \`ilanlar_on_eleme_sorulari\`;`)
  await db.run(sql`DROP TABLE \`ilanlar\`;`)
  await db.run(sql`DROP TABLE \`ilanlar_rels\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v_version_diller\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v_version_yan_haklar\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v_version_on_eleme_sorulari_secenekler\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v_version_on_eleme_sorulari\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v\`;`)
  await db.run(sql`DROP TABLE \`_ilanlar_v_rels\`;`)
  await db.run(sql`DROP TABLE \`basvurular_etiketler\`;`)
  await db.run(sql`DROP TABLE \`basvurular_ekip_notlari\`;`)
  await db.run(sql`DROP TABLE \`basvurular\`;`)
  await db.run(sql`DROP TABLE \`adaylar_deneyimler\`;`)
  await db.run(sql`DROP TABLE \`adaylar_beceriler\`;`)
  await db.run(sql`DROP TABLE \`adaylar_diller\`;`)
  await db.run(sql`DROP TABLE \`adaylar_sertifikalar\`;`)
  await db.run(sql`DROP TABLE \`adaylar_baglantilar\`;`)
  await db.run(sql`DROP TABLE \`adaylar_tercihler_turler\`;`)
  await db.run(sql`DROP TABLE \`adaylar_tercihler_modeller\`;`)
  await db.run(sql`DROP TABLE \`adaylar_cvler\`;`)
  await db.run(sql`DROP TABLE \`adaylar\`;`)
  await db.run(sql`DROP TABLE \`adaylar_rels\`;`)
  await db.run(sql`DROP TABLE \`taksonomiler_es_anlamlilar\`;`)
  await db.run(sql`DROP TABLE \`taksonomiler\`;`)
  await db.run(sql`DROP TABLE \`davetler_hatirlatmalar\`;`)
  await db.run(sql`DROP TABLE \`davetler\`;`)
  await db.run(sql`DROP TABLE \`rizalar\`;`)
  await db.run(sql`DROP TABLE \`havuz_goruntulemeleri\`;`)
  await db.run(sql`DROP TABLE \`islem_kayitlari\`;`)
  await db.run(sql`DROP TABLE \`dosyalar\`;`)
  await db.run(sql`DROP TABLE \`test_postalar\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`ayarlar_hatirlatma_gunleri\`;`)
  await db.run(sql`DROP TABLE \`ayarlar\`;`)
  await db.run(sql`DROP TABLE \`_ayarlar_v_version_hatirlatma_gunleri\`;`)
  await db.run(sql`DROP TABLE \`_ayarlar_v\`;`)
}
