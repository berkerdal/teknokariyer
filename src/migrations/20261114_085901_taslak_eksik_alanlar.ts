import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'
import { bagliSatirlariKoru, ILAN_KORUMA_PLANI } from '../altyapi/gocYardimcisi'

/**
 * Taslak ilanlar eksik kaydedilebilsin: ilanın içerik sütunlarındaki NOT NULL kısıtı kalkar (tamlık, taslak dışındaki
 * durumlarda uygulama katmanında denetlenir). Onay bekleyen değişiklik sütunu eklenir.
 * Drizzle'ın ürettiği yeniden kurma adımları `bagliSatirlariKoru` içinde çalışır; aksi hâlde D1'de bağlı satırlar
 * (dil şartları, beceriler) silinir ve başvurular yüzünden silme reddedilir (src/altyapi/gocYardimcisi.ts).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await bagliSatirlariKoru(db, ILAN_KORUMA_PLANI, async () => {
    await db.run(sql`CREATE TABLE \`__new_ilanlar\` (
      	\`id\` integer PRIMARY KEY NOT NULL,
      	\`firma_id\` integer NOT NULL,
      	\`pozisyon_adi\` text NOT NULL,
      	\`tur\` text,
      	\`alt_tur\` text,
      	\`aile_id\` integer,
      	\`model\` text,
      	\`konum\` text DEFAULT 'Pamukkale Teknokent' NOT NULL,
      	\`deneyim\` text,
      	\`egitim\` text,
      	\`pozisyon_sayisi\` numeric DEFAULT 1,
      	\`son_basvuru\` text,
      	\`baslangic\` text,
      	\`ucret_en_az\` numeric,
      	\`ucret_en_cok\` numeric,
      	\`ucret_gorunur\` integer DEFAULT false,
      	\`is_tanimi\` text,
      	\`nitelikler\` text,
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
      	\`bekleyen_degisiklik\` text,
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
    await db.run(sql`INSERT INTO \`__new_ilanlar\`("id", "firma_id", "pozisyon_adi", "tur", "alt_tur", "aile_id", "model", "konum", "deneyim", "egitim", "pozisyon_sayisi", "son_basvuru", "baslangic", "ucret_en_az", "ucret_en_cok", "ucret_gorunur", "is_tanimi", "nitelikler", "sartname_id", "linkedin_metni", "dil", "staj_donemi", "ucretli_staj", "sgk", "staj_belgesi", "pau_oncelik", "durum", "duzeltme_gerekcesi", "kapanis_nedeni", "bekleyen_degisiklik", "yayin_tarihi", "basvuru_sayisi", "goruntulenme", "arama", "updated_at", "created_at") SELECT "id", "firma_id", "pozisyon_adi", "tur", "alt_tur", "aile_id", "model", "konum", "deneyim", "egitim", "pozisyon_sayisi", "son_basvuru", "baslangic", "ucret_en_az", "ucret_en_cok", "ucret_gorunur", "is_tanimi", "nitelikler", "sartname_id", "linkedin_metni", "dil", "staj_donemi", "ucretli_staj", "sgk", "staj_belgesi", "pau_oncelik", "durum", "duzeltme_gerekcesi", "kapanis_nedeni", "bekleyen_degisiklik", "yayin_tarihi", "basvuru_sayisi", "goruntulenme", "arama", "updated_at", "created_at" FROM \`ilanlar\`;`)
    await db.run(sql`DROP TABLE \`ilanlar\`;`)
    await db.run(sql`ALTER TABLE \`__new_ilanlar\` RENAME TO \`ilanlar\`;`)
    await db.run(sql`CREATE INDEX \`ilanlar_firma_idx\` ON \`ilanlar\` (\`firma_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_aile_idx\` ON \`ilanlar\` (\`aile_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_son_basvuru_idx\` ON \`ilanlar\` (\`son_basvuru\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_sartname_idx\` ON \`ilanlar\` (\`sartname_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_durum_idx\` ON \`ilanlar\` (\`durum\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_arama_idx\` ON \`ilanlar\` (\`arama\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_updated_at_idx\` ON \`ilanlar\` (\`updated_at\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_created_at_idx\` ON \`ilanlar\` (\`created_at\`);`)
    await db.run(sql`CREATE TABLE \`__new__ilanlar_v\` (
      	\`id\` integer PRIMARY KEY NOT NULL,
      	\`parent_id\` integer,
      	\`version_firma_id\` integer NOT NULL,
      	\`version_pozisyon_adi\` text NOT NULL,
      	\`version_tur\` text,
      	\`version_alt_tur\` text,
      	\`version_aile_id\` integer,
      	\`version_model\` text,
      	\`version_konum\` text DEFAULT 'Pamukkale Teknokent' NOT NULL,
      	\`version_deneyim\` text,
      	\`version_egitim\` text,
      	\`version_pozisyon_sayisi\` numeric DEFAULT 1,
      	\`version_son_basvuru\` text,
      	\`version_baslangic\` text,
      	\`version_ucret_en_az\` numeric,
      	\`version_ucret_en_cok\` numeric,
      	\`version_ucret_gorunur\` integer DEFAULT false,
      	\`version_is_tanimi\` text,
      	\`version_nitelikler\` text,
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
      	\`version_bekleyen_degisiklik\` text,
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
    await db.run(sql`INSERT INTO \`__new__ilanlar_v\`("id", "parent_id", "version_firma_id", "version_pozisyon_adi", "version_tur", "version_alt_tur", "version_aile_id", "version_model", "version_konum", "version_deneyim", "version_egitim", "version_pozisyon_sayisi", "version_son_basvuru", "version_baslangic", "version_ucret_en_az", "version_ucret_en_cok", "version_ucret_gorunur", "version_is_tanimi", "version_nitelikler", "version_sartname_id", "version_linkedin_metni", "version_dil", "version_staj_donemi", "version_ucretli_staj", "version_sgk", "version_staj_belgesi", "version_pau_oncelik", "version_durum", "version_duzeltme_gerekcesi", "version_kapanis_nedeni", "version_bekleyen_degisiklik", "version_yayin_tarihi", "version_basvuru_sayisi", "version_goruntulenme", "version_arama", "version_updated_at", "version_created_at", "created_at", "updated_at") SELECT "id", "parent_id", "version_firma_id", "version_pozisyon_adi", "version_tur", "version_alt_tur", "version_aile_id", "version_model", "version_konum", "version_deneyim", "version_egitim", "version_pozisyon_sayisi", "version_son_basvuru", "version_baslangic", "version_ucret_en_az", "version_ucret_en_cok", "version_ucret_gorunur", "version_is_tanimi", "version_nitelikler", "version_sartname_id", "version_linkedin_metni", "version_dil", "version_staj_donemi", "version_ucretli_staj", "version_sgk", "version_staj_belgesi", "version_pau_oncelik", "version_durum", "version_duzeltme_gerekcesi", "version_kapanis_nedeni", "version_bekleyen_degisiklik", "version_yayin_tarihi", "version_basvuru_sayisi", "version_goruntulenme", "version_arama", "version_updated_at", "version_created_at", "created_at", "updated_at" FROM \`_ilanlar_v\`;`)
    await db.run(sql`DROP TABLE \`_ilanlar_v\`;`)
    await db.run(sql`ALTER TABLE \`__new__ilanlar_v\` RENAME TO \`_ilanlar_v\`;`)
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
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await bagliSatirlariKoru(db, ILAN_KORUMA_PLANI, async () => {
    await db.run(sql`CREATE TABLE \`__new_ilanlar\` (
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
    await db.run(sql`INSERT INTO \`__new_ilanlar\`("id", "firma_id", "pozisyon_adi", "tur", "alt_tur", "aile_id", "model", "konum", "deneyim", "egitim", "pozisyon_sayisi", "son_basvuru", "baslangic", "ucret_en_az", "ucret_en_cok", "ucret_gorunur", "is_tanimi", "nitelikler", "sartname_id", "linkedin_metni", "dil", "staj_donemi", "ucretli_staj", "sgk", "staj_belgesi", "pau_oncelik", "durum", "duzeltme_gerekcesi", "kapanis_nedeni", "yayin_tarihi", "basvuru_sayisi", "goruntulenme", "arama", "updated_at", "created_at") SELECT "id", "firma_id", "pozisyon_adi", "tur", "alt_tur", "aile_id", "model", "konum", "deneyim", "egitim", "pozisyon_sayisi", "son_basvuru", "baslangic", "ucret_en_az", "ucret_en_cok", "ucret_gorunur", "is_tanimi", "nitelikler", "sartname_id", "linkedin_metni", "dil", "staj_donemi", "ucretli_staj", "sgk", "staj_belgesi", "pau_oncelik", "durum", "duzeltme_gerekcesi", "kapanis_nedeni", "yayin_tarihi", "basvuru_sayisi", "goruntulenme", "arama", "updated_at", "created_at" FROM \`ilanlar\`;`)
    await db.run(sql`DROP TABLE \`ilanlar\`;`)
    await db.run(sql`ALTER TABLE \`__new_ilanlar\` RENAME TO \`ilanlar\`;`)
    await db.run(sql`CREATE INDEX \`ilanlar_firma_idx\` ON \`ilanlar\` (\`firma_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_aile_idx\` ON \`ilanlar\` (\`aile_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_son_basvuru_idx\` ON \`ilanlar\` (\`son_basvuru\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_sartname_idx\` ON \`ilanlar\` (\`sartname_id\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_durum_idx\` ON \`ilanlar\` (\`durum\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_arama_idx\` ON \`ilanlar\` (\`arama\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_updated_at_idx\` ON \`ilanlar\` (\`updated_at\`);`)
    await db.run(sql`CREATE INDEX \`ilanlar_created_at_idx\` ON \`ilanlar\` (\`created_at\`);`)
    await db.run(sql`CREATE TABLE \`__new__ilanlar_v\` (
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
    await db.run(sql`INSERT INTO \`__new__ilanlar_v\`("id", "parent_id", "version_firma_id", "version_pozisyon_adi", "version_tur", "version_alt_tur", "version_aile_id", "version_model", "version_konum", "version_deneyim", "version_egitim", "version_pozisyon_sayisi", "version_son_basvuru", "version_baslangic", "version_ucret_en_az", "version_ucret_en_cok", "version_ucret_gorunur", "version_is_tanimi", "version_nitelikler", "version_sartname_id", "version_linkedin_metni", "version_dil", "version_staj_donemi", "version_ucretli_staj", "version_sgk", "version_staj_belgesi", "version_pau_oncelik", "version_durum", "version_duzeltme_gerekcesi", "version_kapanis_nedeni", "version_yayin_tarihi", "version_basvuru_sayisi", "version_goruntulenme", "version_arama", "version_updated_at", "version_created_at", "created_at", "updated_at") SELECT "id", "parent_id", "version_firma_id", "version_pozisyon_adi", "version_tur", "version_alt_tur", "version_aile_id", "version_model", "version_konum", "version_deneyim", "version_egitim", "version_pozisyon_sayisi", "version_son_basvuru", "version_baslangic", "version_ucret_en_az", "version_ucret_en_cok", "version_ucret_gorunur", "version_is_tanimi", "version_nitelikler", "version_sartname_id", "version_linkedin_metni", "version_dil", "version_staj_donemi", "version_ucretli_staj", "version_sgk", "version_staj_belgesi", "version_pau_oncelik", "version_durum", "version_duzeltme_gerekcesi", "version_kapanis_nedeni", "version_yayin_tarihi", "version_basvuru_sayisi", "version_goruntulenme", "version_arama", "version_updated_at", "version_created_at", "created_at", "updated_at" FROM \`_ilanlar_v\`;`)
    await db.run(sql`DROP TABLE \`_ilanlar_v\`;`)
    await db.run(sql`ALTER TABLE \`__new__ilanlar_v\` RENAME TO \`_ilanlar_v\`;`)
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
  })
}
