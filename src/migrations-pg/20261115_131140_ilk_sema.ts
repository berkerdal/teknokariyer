import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_kullanicilar_rol" AS ENUM('yonetici', 'moderator', 'raporlayici', 'firma', 'aday');
  CREATE TYPE "public"."enum_kullanicilar_firma_yetkisi" AS ENUM('yonetici', 'ilan-sorumlusu', 'degerlendirici');
  CREATE TYPE "public"."enum_firmalar_calisma_modelleri" AS ENUM('ofiste', 'hibrit', 'uzaktan');
  CREATE TYPE "public"."enum_firmalar_calisan_araligi" AS ENUM('1–9', '10–49', '50–99', '100–249', '250+');
  CREATE TYPE "public"."enum_firmalar_asama" AS ENUM('iskelet', 'davet', 'devralindi', 'profil-tamam', 'pasif');
  CREATE TYPE "public"."enum__firmalar_v_version_calisma_modelleri" AS ENUM('ofiste', 'hibrit', 'uzaktan');
  CREATE TYPE "public"."enum__firmalar_v_version_calisan_araligi" AS ENUM('1–9', '10–49', '50–99', '100–249', '250+');
  CREATE TYPE "public"."enum__firmalar_v_version_asama" AS ENUM('iskelet', 'davet', 'devralindi', 'profil-tamam', 'pasif');
  CREATE TYPE "public"."enum_ilanlar_diller_seviye" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_ilanlar_on_eleme_sorulari_tip" AS ENUM('kisa', 'evet-hayir', 'secmeli');
  CREATE TYPE "public"."enum_ilanlar_tur" AS ENUM('is', 'staj');
  CREATE TYPE "public"."enum_ilanlar_alt_tur" AS ENUM('tam-zamanli', 'yari-zamanli', 'proje', 'zorunlu-staj', 'gonullu-staj', 'uzun-donem-staj', 'yaz-staji');
  CREATE TYPE "public"."enum_ilanlar_model" AS ENUM('ofiste', 'hibrit', 'uzaktan');
  CREATE TYPE "public"."enum_ilanlar_deneyim" AS ENUM('ogrenci', 'yeni-mezun', '1-3', '3-5', '5+');
  CREATE TYPE "public"."enum_ilanlar_egitim" AS ENUM('lise', 'onlisans', 'lisans', 'yuksek-lisans', 'doktora');
  CREATE TYPE "public"."enum_ilanlar_dil" AS ENUM('tr', 'en', 'ikisi');
  CREATE TYPE "public"."enum_ilanlar_sgk" AS ENUM('okul', 'firma');
  CREATE TYPE "public"."enum_ilanlar_durum" AS ENUM('taslak', 'onayda', 'duzeltme', 'yayinda', 'duraklatildi', 'suresi-doldu', 'kapandi');
  CREATE TYPE "public"."enum_ilanlar_kapanis_nedeni" AS ENUM('doldu', 'iptal', 'baska-kanal', 'sure', 'moderasyon');
  CREATE TYPE "public"."enum__ilanlar_v_version_diller_seviye" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum__ilanlar_v_version_on_eleme_sorulari_tip" AS ENUM('kisa', 'evet-hayir', 'secmeli');
  CREATE TYPE "public"."enum__ilanlar_v_version_tur" AS ENUM('is', 'staj');
  CREATE TYPE "public"."enum__ilanlar_v_version_alt_tur" AS ENUM('tam-zamanli', 'yari-zamanli', 'proje', 'zorunlu-staj', 'gonullu-staj', 'uzun-donem-staj', 'yaz-staji');
  CREATE TYPE "public"."enum__ilanlar_v_version_model" AS ENUM('ofiste', 'hibrit', 'uzaktan');
  CREATE TYPE "public"."enum__ilanlar_v_version_deneyim" AS ENUM('ogrenci', 'yeni-mezun', '1-3', '3-5', '5+');
  CREATE TYPE "public"."enum__ilanlar_v_version_egitim" AS ENUM('lise', 'onlisans', 'lisans', 'yuksek-lisans', 'doktora');
  CREATE TYPE "public"."enum__ilanlar_v_version_dil" AS ENUM('tr', 'en', 'ikisi');
  CREATE TYPE "public"."enum__ilanlar_v_version_sgk" AS ENUM('okul', 'firma');
  CREATE TYPE "public"."enum__ilanlar_v_version_durum" AS ENUM('taslak', 'onayda', 'duzeltme', 'yayinda', 'duraklatildi', 'suresi-doldu', 'kapandi');
  CREATE TYPE "public"."enum__ilanlar_v_version_kapanis_nedeni" AS ENUM('doldu', 'iptal', 'baska-kanal', 'sure', 'moderasyon');
  CREATE TYPE "public"."enum_basvurular_kaynak" AS ENUM('portal', 'linkedin', 'google', 'dogrudan');
  CREATE TYPE "public"."enum_basvurular_durum" AS ENUM('alindi', 'inceleniyor', 'gorusme', 'teklif', 'olumlu', 'olumsuz', 'geri-cekti');
  CREATE TYPE "public"."enum_adaylar_beceriler_seviye" AS ENUM('baslangic', 'orta', 'iyi', 'uzman');
  CREATE TYPE "public"."enum_adaylar_diller_seviye" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_adaylar_tercihler_turler" AS ENUM('is', 'staj');
  CREATE TYPE "public"."enum_adaylar_tercihler_modeller" AS ENUM('ofiste', 'hibrit', 'uzaktan');
  CREATE TYPE "public"."enum_adaylar_cinsiyet" AS ENUM('kadin', 'erkek', 'belirtmek-istemiyor');
  CREATE TYPE "public"."enum_adaylar_deneyim_seviyesi" AS ENUM('ogrenci', 'yeni-mezun', '1-3', '3-5', '5+');
  CREATE TYPE "public"."enum_adaylar_havuz_gorunurluk" AS ENUM('aktif', 'acik', 'gizli');
  CREATE TYPE "public"."enum_taksonomiler_tur" AS ENUM('beceri', 'pozisyon-ailesi', 'sektor', 'universite', 'bolum', 'dil');
  CREATE TYPE "public"."enum_davetler_firma_yetkisi" AS ENUM('yonetici', 'ilan-sorumlusu', 'degerlendirici');
  CREATE TYPE "public"."enum_rizalar_tur" AS ENUM('aday-aydinlatma', 'basvuru-aydinlatma', 'havuz', 'ozel-nitelikli', 'ticari-ileti');
  CREATE TYPE "public"."enum_islem_kayitlari_tur" AS ENUM('kisisel-veri', 'ilan', 'moderasyon', 'kurulum', 'ayarlar', 'hesap', 'basvuru');
  CREATE TYPE "public"."enum_dosyalar_tur" AS ENUM('cv', 'sartname', 'logo', 'kapak', 'galeri');
  CREATE TYPE "public"."enum_dosyalar_tarama_durumu" AS ENUM('bekliyor', 'temiz', 'zararli');
  CREATE TYPE "public"."enum_talepler_taksonomi_turu" AS ENUM('beceri', 'pozisyon-ailesi', 'sektor', 'universite', 'bolum', 'dil');
  CREATE TYPE "public"."enum_talepler_durum" AS ENUM('bekliyor', 'onaylandi', 'kismen', 'reddedildi');
  CREATE TYPE "public"."enum_kvkk_talepleri_tur" AS ENUM('bilgi', 'amac', 'aktarim', 'duzeltme', 'silme', 'bildirim', 'itiraz', 'zarar', 'diger');
  CREATE TYPE "public"."enum_kvkk_talepleri_kanal" AS ENUM('portal', 'eposta', 'yazili', 'kep');
  CREATE TYPE "public"."enum_kvkk_talepleri_kimlik" AS ENUM('hesap', 'kayitli-eposta', 'imzali', 'kep', 'dogrulanmadi');
  CREATE TYPE "public"."enum_kvkk_talepleri_durum" AS ENUM('alindi', 'inceleniyor', 'sonuclandi');
  CREATE TYPE "public"."enum_kvkk_talepleri_sonuc" AS ENUM('kabul', 'kismen', 'ret');
  CREATE TABLE "kullanicilar_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "kullanicilar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"unvan" varchar,
  	"rol" "enum_kullanicilar_rol" DEFAULT 'aday' NOT NULL,
  	"firma_id" integer,
  	"firma_yetkisi" "enum_kullanicilar_firma_yetkisi",
  	"iki_asamali_acik" boolean DEFAULT false,
  	"totp_gizli" varchar,
  	"iki_asamali_tarih" timestamp(3) with time zone,
  	"totp_son_adim" numeric,
  	"kurtarma_kodlari" jsonb,
  	"iki_adim_hata" numeric,
  	"iki_adim_kilit" timestamp(3) with time zone,
  	"taninan_cihazlar" jsonb,
  	"eposta_kodu" jsonb,
  	"teknik_sorumlu" boolean DEFAULT false,
  	"pasif" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "firmalar_calisma_modelleri" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_firmalar_calisma_modelleri",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "firmalar_yan_haklar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL
  );
  
  CREATE TABLE "firmalar_takip_notlari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"not" varchar NOT NULL,
  	"tarih" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "firmalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unvan" varchar NOT NULL,
  	"kisa_ad" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"konum" varchar NOT NULL,
  	"sektor_id" integer,
  	"web" varchar,
  	"logo_id" integer,
  	"kisa_tanitim" varchar,
  	"uzun_tanitim" varchar,
  	"kurulus_yili" numeric,
  	"calisan_araligi" "enum_firmalar_calisan_araligi",
  	"asama" "enum_firmalar_asama" DEFAULT 'iskelet' NOT NULL,
  	"guvenilir" boolean DEFAULT false,
  	"onaylanmis_ilan_sayisi" numeric DEFAULT 0,
  	"test_firmasi" boolean DEFAULT false,
  	"yetkili_ad" varchar,
  	"yetkili_eposta" varchar,
  	"yetkili_telefon" varchar,
  	"yayina_hazir" boolean DEFAULT false,
  	"arama" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "firmalar_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taksonomiler_id" integer,
  	"dosyalar_id" integer
  );
  
  CREATE TABLE "_firmalar_v_version_calisma_modelleri" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__firmalar_v_version_calisma_modelleri",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_firmalar_v_version_yan_haklar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_firmalar_v_version_takip_notlari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"not" varchar NOT NULL,
  	"tarih" timestamp(3) with time zone NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_firmalar_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_unvan" varchar NOT NULL,
  	"version_kisa_ad" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_konum" varchar NOT NULL,
  	"version_sektor_id" integer,
  	"version_web" varchar,
  	"version_logo_id" integer,
  	"version_kisa_tanitim" varchar,
  	"version_uzun_tanitim" varchar,
  	"version_kurulus_yili" numeric,
  	"version_calisan_araligi" "enum__firmalar_v_version_calisan_araligi",
  	"version_asama" "enum__firmalar_v_version_asama" DEFAULT 'iskelet' NOT NULL,
  	"version_guvenilir" boolean DEFAULT false,
  	"version_onaylanmis_ilan_sayisi" numeric DEFAULT 0,
  	"version_test_firmasi" boolean DEFAULT false,
  	"version_yetkili_ad" varchar,
  	"version_yetkili_eposta" varchar,
  	"version_yetkili_telefon" varchar,
  	"version_yayina_hazir" boolean DEFAULT false,
  	"version_arama" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_firmalar_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taksonomiler_id" integer,
  	"dosyalar_id" integer
  );
  
  CREATE TABLE "ilanlar_diller" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dil_id" integer NOT NULL,
  	"seviye" "enum_ilanlar_diller_seviye" NOT NULL
  );
  
  CREATE TABLE "ilanlar_yan_haklar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL
  );
  
  CREATE TABLE "ilanlar_on_eleme_sorulari_secenekler" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL
  );
  
  CREATE TABLE "ilanlar_on_eleme_sorulari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"soru" varchar NOT NULL,
  	"tip" "enum_ilanlar_on_eleme_sorulari_tip" DEFAULT 'kisa' NOT NULL,
  	"eleyici" boolean DEFAULT false,
  	"beklenen_cevap" varchar
  );
  
  CREATE TABLE "ilanlar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"firma_id" integer NOT NULL,
  	"pozisyon_adi" varchar NOT NULL,
  	"tur" "enum_ilanlar_tur",
  	"alt_tur" "enum_ilanlar_alt_tur",
  	"aile_id" integer,
  	"model" "enum_ilanlar_model",
  	"konum" varchar DEFAULT 'Pamukkale Teknokent' NOT NULL,
  	"deneyim" "enum_ilanlar_deneyim",
  	"egitim" "enum_ilanlar_egitim",
  	"pozisyon_sayisi" numeric DEFAULT 1,
  	"son_basvuru" timestamp(3) with time zone,
  	"baslangic" timestamp(3) with time zone,
  	"ucret_en_az" numeric,
  	"ucret_en_cok" numeric,
  	"ucret_gorunur" boolean DEFAULT false,
  	"is_tanimi" varchar,
  	"nitelikler" varchar,
  	"sartname_id" integer,
  	"linkedin_metni" varchar,
  	"dil" "enum_ilanlar_dil" DEFAULT 'tr' NOT NULL,
  	"staj_donemi" varchar,
  	"ucretli_staj" boolean DEFAULT false,
  	"sgk" "enum_ilanlar_sgk",
  	"staj_belgesi" boolean DEFAULT true,
  	"pau_oncelik" boolean DEFAULT false,
  	"durum" "enum_ilanlar_durum" DEFAULT 'taslak' NOT NULL,
  	"duzeltme_gerekcesi" varchar,
  	"kapanis_nedeni" "enum_ilanlar_kapanis_nedeni",
  	"bekleyen_degisiklik" jsonb,
  	"yayin_tarihi" timestamp(3) with time zone,
  	"kapanis_tarihi" timestamp(3) with time zone,
  	"basvuru_sayisi" numeric DEFAULT 0,
  	"goruntulenme" numeric DEFAULT 0,
  	"arama" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ilanlar_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taksonomiler_id" integer
  );
  
  CREATE TABLE "_ilanlar_v_version_diller" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dil_id" integer NOT NULL,
  	"seviye" "enum__ilanlar_v_version_diller_seviye" NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ilanlar_v_version_yan_haklar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ilanlar_v_version_on_eleme_sorulari_secenekler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ilanlar_v_version_on_eleme_sorulari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"soru" varchar NOT NULL,
  	"tip" "enum__ilanlar_v_version_on_eleme_sorulari_tip" DEFAULT 'kisa' NOT NULL,
  	"eleyici" boolean DEFAULT false,
  	"beklenen_cevap" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ilanlar_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_firma_id" integer NOT NULL,
  	"version_pozisyon_adi" varchar NOT NULL,
  	"version_tur" "enum__ilanlar_v_version_tur",
  	"version_alt_tur" "enum__ilanlar_v_version_alt_tur",
  	"version_aile_id" integer,
  	"version_model" "enum__ilanlar_v_version_model",
  	"version_konum" varchar DEFAULT 'Pamukkale Teknokent' NOT NULL,
  	"version_deneyim" "enum__ilanlar_v_version_deneyim",
  	"version_egitim" "enum__ilanlar_v_version_egitim",
  	"version_pozisyon_sayisi" numeric DEFAULT 1,
  	"version_son_basvuru" timestamp(3) with time zone,
  	"version_baslangic" timestamp(3) with time zone,
  	"version_ucret_en_az" numeric,
  	"version_ucret_en_cok" numeric,
  	"version_ucret_gorunur" boolean DEFAULT false,
  	"version_is_tanimi" varchar,
  	"version_nitelikler" varchar,
  	"version_sartname_id" integer,
  	"version_linkedin_metni" varchar,
  	"version_dil" "enum__ilanlar_v_version_dil" DEFAULT 'tr' NOT NULL,
  	"version_staj_donemi" varchar,
  	"version_ucretli_staj" boolean DEFAULT false,
  	"version_sgk" "enum__ilanlar_v_version_sgk",
  	"version_staj_belgesi" boolean DEFAULT true,
  	"version_pau_oncelik" boolean DEFAULT false,
  	"version_durum" "enum__ilanlar_v_version_durum" DEFAULT 'taslak' NOT NULL,
  	"version_duzeltme_gerekcesi" varchar,
  	"version_kapanis_nedeni" "enum__ilanlar_v_version_kapanis_nedeni",
  	"version_bekleyen_degisiklik" jsonb,
  	"version_yayin_tarihi" timestamp(3) with time zone,
  	"version_kapanis_tarihi" timestamp(3) with time zone,
  	"version_basvuru_sayisi" numeric DEFAULT 0,
  	"version_goruntulenme" numeric DEFAULT 0,
  	"version_arama" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_ilanlar_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taksonomiler_id" integer
  );
  
  CREATE TABLE "basvurular_etiketler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL
  );
  
  CREATE TABLE "basvurular_ekip_notlari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"not" varchar NOT NULL,
  	"yazan_id" integer
  );
  
  CREATE TABLE "basvurular" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ilan_id" integer NOT NULL,
  	"firma_id" integer,
  	"aday_kullanici_id" integer,
  	"aday_kodu" varchar,
  	"profil_kopyasi" jsonb NOT NULL,
  	"cv_id" integer,
  	"on_yazi" varchar,
  	"cevaplar" jsonb,
  	"eleyici_uyari" boolean DEFAULT false,
  	"kaynak" "enum_basvurular_kaynak" DEFAULT 'portal',
  	"durum" "enum_basvurular_durum" DEFAULT 'alindi' NOT NULL,
  	"puan" numeric,
  	"anonimlestirildi" timestamp(3) with time zone,
  	"aydinlatma_surumu" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "adaylar_deneyimler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kurum" varchar NOT NULL,
  	"pozisyon" varchar NOT NULL,
  	"baslangic" timestamp(3) with time zone,
  	"bitis" timestamp(3) with time zone,
  	"aciklama" varchar
  );
  
  CREATE TABLE "adaylar_beceriler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"beceri_id" integer NOT NULL,
  	"seviye" "enum_adaylar_beceriler_seviye" DEFAULT 'orta'
  );
  
  CREATE TABLE "adaylar_diller" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dil_id" integer NOT NULL,
  	"seviye" "enum_adaylar_diller_seviye" NOT NULL
  );
  
  CREATE TABLE "adaylar_sertifikalar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"kurum" varchar,
  	"yil" numeric
  );
  
  CREATE TABLE "adaylar_baglantilar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"adres" varchar NOT NULL
  );
  
  CREATE TABLE "adaylar_tercihler_turler" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_adaylar_tercihler_turler",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "adaylar_tercihler_modeller" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_adaylar_tercihler_modeller",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "adaylar_cvler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"dosya_id" integer NOT NULL
  );
  
  CREATE TABLE "adaylar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kullanici_id" integer NOT NULL,
  	"kod" varchar,
  	"telefon" varchar,
  	"cinsiyet" "enum_adaylar_cinsiyet",
  	"tanitim" varchar,
  	"okul_id" integer,
  	"bolum_id" integer,
  	"sinif" varchar,
  	"mezuniyet" timestamp(3) with time zone,
  	"gano" numeric,
  	"deneyim_seviyesi" "enum_adaylar_deneyim_seviyesi",
  	"tercihler_baslama" varchar,
  	"tercihler_sehir" varchar,
  	"tercihler_tasinmaya_acik" boolean DEFAULT false,
  	"tercihler_ucret_beklentisi" numeric,
  	"askerlik" varchar,
  	"ozel_nitelikli" varchar,
  	"havuz_gorunurluk" "enum_adaylar_havuz_gorunurluk" DEFAULT 'gizli',
  	"havuz_riza_tarihi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "adaylar_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"firmalar_id" integer
  );
  
  CREATE TABLE "taksonomiler_es_anlamlilar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL
  );
  
  CREATE TABLE "taksonomiler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tur" "enum_taksonomiler_tur" NOT NULL,
  	"ad" varchar NOT NULL,
  	"aktif" boolean DEFAULT true,
  	"arama" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "davetler_hatirlatmalar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tarih" timestamp(3) with time zone NOT NULL,
  	"gun" numeric
  );
  
  CREATE TABLE "davetler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"firma_id" integer NOT NULL,
  	"ad" varchar NOT NULL,
  	"eposta" varchar NOT NULL,
  	"firma_yetkisi" "enum_davetler_firma_yetkisi" DEFAULT 'yonetici',
  	"anahtar_ozeti" varchar NOT NULL,
  	"son_gecerlilik" timestamp(3) with time zone NOT NULL,
  	"kullanildi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rizalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kullanici_id" integer NOT NULL,
  	"tur" "enum_rizalar_tur" NOT NULL,
  	"metin_surumu" varchar NOT NULL,
  	"geri_alinma" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "havuz_goruntulemeleri" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"aday_id" integer NOT NULL,
  	"firma_id" integer NOT NULL,
  	"kim_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "islem_kayitlari" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"islem" varchar NOT NULL,
  	"tur" "enum_islem_kayitlari_tur" NOT NULL,
  	"kim_id" integer,
  	"kayit_turu" varchar,
  	"kayit_id" varchar,
  	"ayrinti" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "dosyalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tur" "enum_dosyalar_tur" NOT NULL,
  	"alt" varchar,
  	"sahip_id" integer,
  	"tarama_durumu" "enum_dosyalar_tarama_durumu" DEFAULT 'bekliyor',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "test_postalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kime" varchar NOT NULL,
  	"konu" varchar,
  	"html" varchar,
  	"metin" varchar,
  	"ortam" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "talepler_oneriler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"kabul" boolean DEFAULT true
  );
  
  CREATE TABLE "talepler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ozet" varchar,
  	"taksonomi_turu" "enum_talepler_taksonomi_turu" NOT NULL,
  	"aciklama" varchar,
  	"kaynak" varchar,
  	"talep_eden_id" integer,
  	"firma_id" integer,
  	"durum" "enum_talepler_durum" DEFAULT 'bekliyor' NOT NULL,
  	"sonuc_notu" varchar,
  	"sonuclandiran_id" integer,
  	"sonuc_tarihi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "talepler_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taksonomiler_id" integer
  );
  
  CREATE TABLE "gunluk_ozetler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tarih" varchar NOT NULL,
  	"yayindaki_ilan" numeric DEFAULT 0,
  	"yeni_ilan" numeric DEFAULT 0,
  	"basvuru" numeric DEFAULT 0,
  	"goruntulenme" numeric DEFAULT 0,
  	"toplam_aday" numeric DEFAULT 0,
  	"yeni_aday" numeric DEFAULT 0,
  	"havuzdaki_aday" numeric DEFAULT 0,
  	"ilan_veren_firma" numeric DEFAULT 0,
  	"ilanlar" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "kvkk_talepleri_notlar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"metin" varchar NOT NULL,
  	"yazan_id" integer,
  	"tarih" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "kvkk_talepleri" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tur" "enum_kvkk_talepleri_tur" NOT NULL,
  	"aciklama" varchar,
  	"kanal" "enum_kvkk_talepleri_kanal" NOT NULL,
  	"kullanici_id" integer,
  	"basvuran_ad" varchar NOT NULL,
  	"basvuran_eposta" varchar NOT NULL,
  	"basvuru_tarihi" timestamp(3) with time zone NOT NULL,
  	"kimlik" "enum_kvkk_talepleri_kimlik" NOT NULL,
  	"durum" "enum_kvkk_talepleri_durum" DEFAULT 'alindi' NOT NULL,
  	"sonuc" "enum_kvkk_talepleri_sonuc",
  	"cevap" varchar,
  	"cevap_tarihi" timestamp(3) with time zone,
  	"cevap_gonderildi" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "istek_sinirlari" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"anahtar" varchar NOT NULL,
  	"sayi" numeric DEFAULT 0 NOT NULL,
  	"bitis" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"kullanicilar_id" integer,
  	"firmalar_id" integer,
  	"ilanlar_id" integer,
  	"basvurular_id" integer,
  	"adaylar_id" integer,
  	"taksonomiler_id" integer,
  	"davetler_id" integer,
  	"rizalar_id" integer,
  	"havuz_goruntulemeleri_id" integer,
  	"islem_kayitlari_id" integer,
  	"dosyalar_id" integer,
  	"test_postalar_id" integer,
  	"talepler_id" integer,
  	"gunluk_ozetler_id" integer,
  	"kvkk_talepleri_id" integer,
  	"istek_sinirlari_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"kullanicilar_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ayarlar_hatirlatma_gunleri" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gun" numeric NOT NULL
  );
  
  CREATE TABLE "ayarlar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"onayli_ilan_sayisi" numeric DEFAULT 3,
  	"en_uzun_sure_gun" numeric DEFAULT 60,
  	"onay_hedefi_is_gunu" numeric DEFAULT 1,
  	"eslesme_agirliklari_zorunlu_beceri" numeric DEFAULT 50,
  	"eslesme_agirliklari_tercih_beceri" numeric DEFAULT 10,
  	"eslesme_agirliklari_model" numeric DEFAULT 15,
  	"eslesme_agirliklari_bolum" numeric DEFAULT 10,
  	"eslesme_agirliklari_deneyim" numeric DEFAULT 10,
  	"eslesme_agirliklari_dil" numeric DEFAULT 5,
  	"saklama_basvuru_anonimlestirme_ay" numeric DEFAULT 12,
  	"saklama_havuz_riza_ay" numeric DEFAULT 12,
  	"saklama_islem_kaydi_ay" numeric DEFAULT 24,
  	"guvenlik_eposta_kodu_dakika" numeric DEFAULT 10,
  	"guvenlik_cihaz_gun" numeric DEFAULT 90,
  	"guvenlik_yeniden_gonder_saniye" numeric DEFAULT 60,
  	"guvenlik_saatte_en_fazla_kod" numeric DEFAULT 5,
  	"guvenlik_en_fazla_hata" numeric DEFAULT 5,
  	"guvenlik_kilit_dakika" numeric DEFAULT 15,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_ayarlar_v_version_hatirlatma_gunleri" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"gun" numeric NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ayarlar_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_onayli_ilan_sayisi" numeric DEFAULT 3,
  	"version_en_uzun_sure_gun" numeric DEFAULT 60,
  	"version_onay_hedefi_is_gunu" numeric DEFAULT 1,
  	"version_eslesme_agirliklari_zorunlu_beceri" numeric DEFAULT 50,
  	"version_eslesme_agirliklari_tercih_beceri" numeric DEFAULT 10,
  	"version_eslesme_agirliklari_model" numeric DEFAULT 15,
  	"version_eslesme_agirliklari_bolum" numeric DEFAULT 10,
  	"version_eslesme_agirliklari_deneyim" numeric DEFAULT 10,
  	"version_eslesme_agirliklari_dil" numeric DEFAULT 5,
  	"version_saklama_basvuru_anonimlestirme_ay" numeric DEFAULT 12,
  	"version_saklama_havuz_riza_ay" numeric DEFAULT 12,
  	"version_saklama_islem_kaydi_ay" numeric DEFAULT 24,
  	"version_guvenlik_eposta_kodu_dakika" numeric DEFAULT 10,
  	"version_guvenlik_cihaz_gun" numeric DEFAULT 90,
  	"version_guvenlik_yeniden_gonder_saniye" numeric DEFAULT 60,
  	"version_guvenlik_saatte_en_fazla_kod" numeric DEFAULT 5,
  	"version_guvenlik_en_fazla_hata" numeric DEFAULT 5,
  	"version_guvenlik_kilit_dakika" numeric DEFAULT 15,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "kullanicilar_sessions" ADD CONSTRAINT "kullanicilar_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kullanicilar" ADD CONSTRAINT "kullanicilar_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "firmalar_calisma_modelleri" ADD CONSTRAINT "firmalar_calisma_modelleri_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "firmalar_yan_haklar" ADD CONSTRAINT "firmalar_yan_haklar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "firmalar_takip_notlari" ADD CONSTRAINT "firmalar_takip_notlari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "firmalar" ADD CONSTRAINT "firmalar_sektor_id_taksonomiler_id_fk" FOREIGN KEY ("sektor_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "firmalar" ADD CONSTRAINT "firmalar_logo_id_dosyalar_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "firmalar_rels" ADD CONSTRAINT "firmalar_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "firmalar_rels" ADD CONSTRAINT "firmalar_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "firmalar_rels" ADD CONSTRAINT "firmalar_rels_dosyalar_fk" FOREIGN KEY ("dosyalar_id") REFERENCES "public"."dosyalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v_version_calisma_modelleri" ADD CONSTRAINT "_firmalar_v_version_calisma_modelleri_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_firmalar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v_version_yan_haklar" ADD CONSTRAINT "_firmalar_v_version_yan_haklar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_firmalar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v_version_takip_notlari" ADD CONSTRAINT "_firmalar_v_version_takip_notlari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_firmalar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v" ADD CONSTRAINT "_firmalar_v_parent_id_firmalar_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_firmalar_v" ADD CONSTRAINT "_firmalar_v_version_sektor_id_taksonomiler_id_fk" FOREIGN KEY ("version_sektor_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_firmalar_v" ADD CONSTRAINT "_firmalar_v_version_logo_id_dosyalar_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_firmalar_v_rels" ADD CONSTRAINT "_firmalar_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_firmalar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v_rels" ADD CONSTRAINT "_firmalar_v_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_firmalar_v_rels" ADD CONSTRAINT "_firmalar_v_rels_dosyalar_fk" FOREIGN KEY ("dosyalar_id") REFERENCES "public"."dosyalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar_diller" ADD CONSTRAINT "ilanlar_diller_dil_id_taksonomiler_id_fk" FOREIGN KEY ("dil_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ilanlar_diller" ADD CONSTRAINT "ilanlar_diller_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar_yan_haklar" ADD CONSTRAINT "ilanlar_yan_haklar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar_on_eleme_sorulari_secenekler" ADD CONSTRAINT "ilanlar_on_eleme_sorulari_secenekler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ilanlar_on_eleme_sorulari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar_on_eleme_sorulari" ADD CONSTRAINT "ilanlar_on_eleme_sorulari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_aile_id_taksonomiler_id_fk" FOREIGN KEY ("aile_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_sartname_id_dosyalar_id_fk" FOREIGN KEY ("sartname_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ilanlar_rels" ADD CONSTRAINT "ilanlar_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ilanlar_rels" ADD CONSTRAINT "ilanlar_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_version_diller" ADD CONSTRAINT "_ilanlar_v_version_diller_dil_id_taksonomiler_id_fk" FOREIGN KEY ("dil_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_version_diller" ADD CONSTRAINT "_ilanlar_v_version_diller_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ilanlar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_version_yan_haklar" ADD CONSTRAINT "_ilanlar_v_version_yan_haklar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ilanlar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_version_on_eleme_sorulari_secenekler" ADD CONSTRAINT "_ilanlar_v_version_on_eleme_sorulari_secenekler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ilanlar_v_version_on_eleme_sorulari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_version_on_eleme_sorulari" ADD CONSTRAINT "_ilanlar_v_version_on_eleme_sorulari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ilanlar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v" ADD CONSTRAINT "_ilanlar_v_parent_id_ilanlar_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ilanlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ilanlar_v" ADD CONSTRAINT "_ilanlar_v_version_firma_id_firmalar_id_fk" FOREIGN KEY ("version_firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ilanlar_v" ADD CONSTRAINT "_ilanlar_v_version_aile_id_taksonomiler_id_fk" FOREIGN KEY ("version_aile_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ilanlar_v" ADD CONSTRAINT "_ilanlar_v_version_sartname_id_dosyalar_id_fk" FOREIGN KEY ("version_sartname_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_rels" ADD CONSTRAINT "_ilanlar_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_ilanlar_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ilanlar_v_rels" ADD CONSTRAINT "_ilanlar_v_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "basvurular_etiketler" ADD CONSTRAINT "basvurular_etiketler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."basvurular"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "basvurular_ekip_notlari" ADD CONSTRAINT "basvurular_ekip_notlari_yazan_id_kullanicilar_id_fk" FOREIGN KEY ("yazan_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "basvurular_ekip_notlari" ADD CONSTRAINT "basvurular_ekip_notlari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."basvurular"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "basvurular" ADD CONSTRAINT "basvurular_ilan_id_ilanlar_id_fk" FOREIGN KEY ("ilan_id") REFERENCES "public"."ilanlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "basvurular" ADD CONSTRAINT "basvurular_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "basvurular" ADD CONSTRAINT "basvurular_aday_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("aday_kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "basvurular" ADD CONSTRAINT "basvurular_cv_id_dosyalar_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_deneyimler" ADD CONSTRAINT "adaylar_deneyimler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_beceriler" ADD CONSTRAINT "adaylar_beceriler_beceri_id_taksonomiler_id_fk" FOREIGN KEY ("beceri_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_beceriler" ADD CONSTRAINT "adaylar_beceriler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_diller" ADD CONSTRAINT "adaylar_diller_dil_id_taksonomiler_id_fk" FOREIGN KEY ("dil_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_diller" ADD CONSTRAINT "adaylar_diller_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_sertifikalar" ADD CONSTRAINT "adaylar_sertifikalar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_baglantilar" ADD CONSTRAINT "adaylar_baglantilar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_tercihler_turler" ADD CONSTRAINT "adaylar_tercihler_turler_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_tercihler_modeller" ADD CONSTRAINT "adaylar_tercihler_modeller_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_cvler" ADD CONSTRAINT "adaylar_cvler_dosya_id_dosyalar_id_fk" FOREIGN KEY ("dosya_id") REFERENCES "public"."dosyalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_cvler" ADD CONSTRAINT "adaylar_cvler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar" ADD CONSTRAINT "adaylar_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar" ADD CONSTRAINT "adaylar_okul_id_taksonomiler_id_fk" FOREIGN KEY ("okul_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar" ADD CONSTRAINT "adaylar_bolum_id_taksonomiler_id_fk" FOREIGN KEY ("bolum_id") REFERENCES "public"."taksonomiler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adaylar_rels" ADD CONSTRAINT "adaylar_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adaylar_rels" ADD CONSTRAINT "adaylar_rels_firmalar_fk" FOREIGN KEY ("firmalar_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "taksonomiler_es_anlamlilar" ADD CONSTRAINT "taksonomiler_es_anlamlilar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "davetler_hatirlatmalar" ADD CONSTRAINT "davetler_hatirlatmalar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."davetler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "davetler" ADD CONSTRAINT "davetler_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rizalar" ADD CONSTRAINT "rizalar_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "havuz_goruntulemeleri" ADD CONSTRAINT "havuz_goruntulemeleri_aday_id_adaylar_id_fk" FOREIGN KEY ("aday_id") REFERENCES "public"."adaylar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "havuz_goruntulemeleri" ADD CONSTRAINT "havuz_goruntulemeleri_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "havuz_goruntulemeleri" ADD CONSTRAINT "havuz_goruntulemeleri_kim_id_kullanicilar_id_fk" FOREIGN KEY ("kim_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "islem_kayitlari" ADD CONSTRAINT "islem_kayitlari_kim_id_kullanicilar_id_fk" FOREIGN KEY ("kim_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dosyalar" ADD CONSTRAINT "dosyalar_sahip_id_kullanicilar_id_fk" FOREIGN KEY ("sahip_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "talepler_oneriler" ADD CONSTRAINT "talepler_oneriler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."talepler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "talepler" ADD CONSTRAINT "talepler_talep_eden_id_kullanicilar_id_fk" FOREIGN KEY ("talep_eden_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "talepler" ADD CONSTRAINT "talepler_firma_id_firmalar_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firmalar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "talepler" ADD CONSTRAINT "talepler_sonuclandiran_id_kullanicilar_id_fk" FOREIGN KEY ("sonuclandiran_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "talepler_rels" ADD CONSTRAINT "talepler_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."talepler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "talepler_rels" ADD CONSTRAINT "talepler_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kvkk_talepleri_notlar" ADD CONSTRAINT "kvkk_talepleri_notlar_yazan_id_kullanicilar_id_fk" FOREIGN KEY ("yazan_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kvkk_talepleri_notlar" ADD CONSTRAINT "kvkk_talepleri_notlar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kvkk_talepleri"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kvkk_talepleri" ADD CONSTRAINT "kvkk_talepleri_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kullanicilar_fk" FOREIGN KEY ("kullanicilar_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_firmalar_fk" FOREIGN KEY ("firmalar_id") REFERENCES "public"."firmalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ilanlar_fk" FOREIGN KEY ("ilanlar_id") REFERENCES "public"."ilanlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_basvurular_fk" FOREIGN KEY ("basvurular_id") REFERENCES "public"."basvurular"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_adaylar_fk" FOREIGN KEY ("adaylar_id") REFERENCES "public"."adaylar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_taksonomiler_fk" FOREIGN KEY ("taksonomiler_id") REFERENCES "public"."taksonomiler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_davetler_fk" FOREIGN KEY ("davetler_id") REFERENCES "public"."davetler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rizalar_fk" FOREIGN KEY ("rizalar_id") REFERENCES "public"."rizalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_havuz_goruntulemeleri_fk" FOREIGN KEY ("havuz_goruntulemeleri_id") REFERENCES "public"."havuz_goruntulemeleri"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_islem_kayitlari_fk" FOREIGN KEY ("islem_kayitlari_id") REFERENCES "public"."islem_kayitlari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dosyalar_fk" FOREIGN KEY ("dosyalar_id") REFERENCES "public"."dosyalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_test_postalar_fk" FOREIGN KEY ("test_postalar_id") REFERENCES "public"."test_postalar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_talepler_fk" FOREIGN KEY ("talepler_id") REFERENCES "public"."talepler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gunluk_ozetler_fk" FOREIGN KEY ("gunluk_ozetler_id") REFERENCES "public"."gunluk_ozetler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kvkk_talepleri_fk" FOREIGN KEY ("kvkk_talepleri_id") REFERENCES "public"."kvkk_talepleri"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_istek_sinirlari_fk" FOREIGN KEY ("istek_sinirlari_id") REFERENCES "public"."istek_sinirlari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_kullanicilar_fk" FOREIGN KEY ("kullanicilar_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ayarlar_hatirlatma_gunleri" ADD CONSTRAINT "ayarlar_hatirlatma_gunleri_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ayarlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ayarlar_v_version_hatirlatma_gunleri" ADD CONSTRAINT "_ayarlar_v_version_hatirlatma_gunleri_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ayarlar_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "kullanicilar_sessions_order_idx" ON "kullanicilar_sessions" USING btree ("_order");
  CREATE INDEX "kullanicilar_sessions_parent_id_idx" ON "kullanicilar_sessions" USING btree ("_parent_id");
  CREATE INDEX "kullanicilar_firma_idx" ON "kullanicilar" USING btree ("firma_id");
  CREATE INDEX "kullanicilar_updated_at_idx" ON "kullanicilar" USING btree ("updated_at");
  CREATE INDEX "kullanicilar_created_at_idx" ON "kullanicilar" USING btree ("created_at");
  CREATE UNIQUE INDEX "kullanicilar_email_idx" ON "kullanicilar" USING btree ("email");
  CREATE INDEX "firmalar_calisma_modelleri_order_idx" ON "firmalar_calisma_modelleri" USING btree ("order");
  CREATE INDEX "firmalar_calisma_modelleri_parent_idx" ON "firmalar_calisma_modelleri" USING btree ("parent_id");
  CREATE INDEX "firmalar_yan_haklar_order_idx" ON "firmalar_yan_haklar" USING btree ("_order");
  CREATE INDEX "firmalar_yan_haklar_parent_id_idx" ON "firmalar_yan_haklar" USING btree ("_parent_id");
  CREATE INDEX "firmalar_takip_notlari_order_idx" ON "firmalar_takip_notlari" USING btree ("_order");
  CREATE INDEX "firmalar_takip_notlari_parent_id_idx" ON "firmalar_takip_notlari" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "firmalar_slug_idx" ON "firmalar" USING btree ("slug");
  CREATE INDEX "firmalar_sektor_idx" ON "firmalar" USING btree ("sektor_id");
  CREATE INDEX "firmalar_logo_idx" ON "firmalar" USING btree ("logo_id");
  CREATE INDEX "firmalar_arama_idx" ON "firmalar" USING btree ("arama");
  CREATE INDEX "firmalar_updated_at_idx" ON "firmalar" USING btree ("updated_at");
  CREATE INDEX "firmalar_created_at_idx" ON "firmalar" USING btree ("created_at");
  CREATE INDEX "firmalar_rels_order_idx" ON "firmalar_rels" USING btree ("order");
  CREATE INDEX "firmalar_rels_parent_idx" ON "firmalar_rels" USING btree ("parent_id");
  CREATE INDEX "firmalar_rels_path_idx" ON "firmalar_rels" USING btree ("path");
  CREATE INDEX "firmalar_rels_taksonomiler_id_idx" ON "firmalar_rels" USING btree ("taksonomiler_id");
  CREATE INDEX "firmalar_rels_dosyalar_id_idx" ON "firmalar_rels" USING btree ("dosyalar_id");
  CREATE INDEX "_firmalar_v_version_calisma_modelleri_order_idx" ON "_firmalar_v_version_calisma_modelleri" USING btree ("order");
  CREATE INDEX "_firmalar_v_version_calisma_modelleri_parent_idx" ON "_firmalar_v_version_calisma_modelleri" USING btree ("parent_id");
  CREATE INDEX "_firmalar_v_version_yan_haklar_order_idx" ON "_firmalar_v_version_yan_haklar" USING btree ("_order");
  CREATE INDEX "_firmalar_v_version_yan_haklar_parent_id_idx" ON "_firmalar_v_version_yan_haklar" USING btree ("_parent_id");
  CREATE INDEX "_firmalar_v_version_takip_notlari_order_idx" ON "_firmalar_v_version_takip_notlari" USING btree ("_order");
  CREATE INDEX "_firmalar_v_version_takip_notlari_parent_id_idx" ON "_firmalar_v_version_takip_notlari" USING btree ("_parent_id");
  CREATE INDEX "_firmalar_v_parent_idx" ON "_firmalar_v" USING btree ("parent_id");
  CREATE INDEX "_firmalar_v_version_version_slug_idx" ON "_firmalar_v" USING btree ("version_slug");
  CREATE INDEX "_firmalar_v_version_version_sektor_idx" ON "_firmalar_v" USING btree ("version_sektor_id");
  CREATE INDEX "_firmalar_v_version_version_logo_idx" ON "_firmalar_v" USING btree ("version_logo_id");
  CREATE INDEX "_firmalar_v_version_version_arama_idx" ON "_firmalar_v" USING btree ("version_arama");
  CREATE INDEX "_firmalar_v_version_version_updated_at_idx" ON "_firmalar_v" USING btree ("version_updated_at");
  CREATE INDEX "_firmalar_v_version_version_created_at_idx" ON "_firmalar_v" USING btree ("version_created_at");
  CREATE INDEX "_firmalar_v_created_at_idx" ON "_firmalar_v" USING btree ("created_at");
  CREATE INDEX "_firmalar_v_updated_at_idx" ON "_firmalar_v" USING btree ("updated_at");
  CREATE INDEX "_firmalar_v_rels_order_idx" ON "_firmalar_v_rels" USING btree ("order");
  CREATE INDEX "_firmalar_v_rels_parent_idx" ON "_firmalar_v_rels" USING btree ("parent_id");
  CREATE INDEX "_firmalar_v_rels_path_idx" ON "_firmalar_v_rels" USING btree ("path");
  CREATE INDEX "_firmalar_v_rels_taksonomiler_id_idx" ON "_firmalar_v_rels" USING btree ("taksonomiler_id");
  CREATE INDEX "_firmalar_v_rels_dosyalar_id_idx" ON "_firmalar_v_rels" USING btree ("dosyalar_id");
  CREATE INDEX "ilanlar_diller_order_idx" ON "ilanlar_diller" USING btree ("_order");
  CREATE INDEX "ilanlar_diller_parent_id_idx" ON "ilanlar_diller" USING btree ("_parent_id");
  CREATE INDEX "ilanlar_diller_dil_idx" ON "ilanlar_diller" USING btree ("dil_id");
  CREATE INDEX "ilanlar_yan_haklar_order_idx" ON "ilanlar_yan_haklar" USING btree ("_order");
  CREATE INDEX "ilanlar_yan_haklar_parent_id_idx" ON "ilanlar_yan_haklar" USING btree ("_parent_id");
  CREATE INDEX "ilanlar_on_eleme_sorulari_secenekler_order_idx" ON "ilanlar_on_eleme_sorulari_secenekler" USING btree ("_order");
  CREATE INDEX "ilanlar_on_eleme_sorulari_secenekler_parent_id_idx" ON "ilanlar_on_eleme_sorulari_secenekler" USING btree ("_parent_id");
  CREATE INDEX "ilanlar_on_eleme_sorulari_order_idx" ON "ilanlar_on_eleme_sorulari" USING btree ("_order");
  CREATE INDEX "ilanlar_on_eleme_sorulari_parent_id_idx" ON "ilanlar_on_eleme_sorulari" USING btree ("_parent_id");
  CREATE INDEX "ilanlar_firma_idx" ON "ilanlar" USING btree ("firma_id");
  CREATE INDEX "ilanlar_aile_idx" ON "ilanlar" USING btree ("aile_id");
  CREATE INDEX "ilanlar_son_basvuru_idx" ON "ilanlar" USING btree ("son_basvuru");
  CREATE INDEX "ilanlar_sartname_idx" ON "ilanlar" USING btree ("sartname_id");
  CREATE INDEX "ilanlar_durum_idx" ON "ilanlar" USING btree ("durum");
  CREATE INDEX "ilanlar_arama_idx" ON "ilanlar" USING btree ("arama");
  CREATE INDEX "ilanlar_updated_at_idx" ON "ilanlar" USING btree ("updated_at");
  CREATE INDEX "ilanlar_created_at_idx" ON "ilanlar" USING btree ("created_at");
  CREATE INDEX "ilanlar_rels_order_idx" ON "ilanlar_rels" USING btree ("order");
  CREATE INDEX "ilanlar_rels_parent_idx" ON "ilanlar_rels" USING btree ("parent_id");
  CREATE INDEX "ilanlar_rels_path_idx" ON "ilanlar_rels" USING btree ("path");
  CREATE INDEX "ilanlar_rels_taksonomiler_id_idx" ON "ilanlar_rels" USING btree ("taksonomiler_id");
  CREATE INDEX "_ilanlar_v_version_diller_order_idx" ON "_ilanlar_v_version_diller" USING btree ("_order");
  CREATE INDEX "_ilanlar_v_version_diller_parent_id_idx" ON "_ilanlar_v_version_diller" USING btree ("_parent_id");
  CREATE INDEX "_ilanlar_v_version_diller_dil_idx" ON "_ilanlar_v_version_diller" USING btree ("dil_id");
  CREATE INDEX "_ilanlar_v_version_yan_haklar_order_idx" ON "_ilanlar_v_version_yan_haklar" USING btree ("_order");
  CREATE INDEX "_ilanlar_v_version_yan_haklar_parent_id_idx" ON "_ilanlar_v_version_yan_haklar" USING btree ("_parent_id");
  CREATE INDEX "_ilanlar_v_version_on_eleme_sorulari_secenekler_order_idx" ON "_ilanlar_v_version_on_eleme_sorulari_secenekler" USING btree ("_order");
  CREATE INDEX "_ilanlar_v_version_on_eleme_sorulari_secenekler_parent_id_idx" ON "_ilanlar_v_version_on_eleme_sorulari_secenekler" USING btree ("_parent_id");
  CREATE INDEX "_ilanlar_v_version_on_eleme_sorulari_order_idx" ON "_ilanlar_v_version_on_eleme_sorulari" USING btree ("_order");
  CREATE INDEX "_ilanlar_v_version_on_eleme_sorulari_parent_id_idx" ON "_ilanlar_v_version_on_eleme_sorulari" USING btree ("_parent_id");
  CREATE INDEX "_ilanlar_v_parent_idx" ON "_ilanlar_v" USING btree ("parent_id");
  CREATE INDEX "_ilanlar_v_version_version_firma_idx" ON "_ilanlar_v" USING btree ("version_firma_id");
  CREATE INDEX "_ilanlar_v_version_version_aile_idx" ON "_ilanlar_v" USING btree ("version_aile_id");
  CREATE INDEX "_ilanlar_v_version_version_son_basvuru_idx" ON "_ilanlar_v" USING btree ("version_son_basvuru");
  CREATE INDEX "_ilanlar_v_version_version_sartname_idx" ON "_ilanlar_v" USING btree ("version_sartname_id");
  CREATE INDEX "_ilanlar_v_version_version_durum_idx" ON "_ilanlar_v" USING btree ("version_durum");
  CREATE INDEX "_ilanlar_v_version_version_arama_idx" ON "_ilanlar_v" USING btree ("version_arama");
  CREATE INDEX "_ilanlar_v_version_version_updated_at_idx" ON "_ilanlar_v" USING btree ("version_updated_at");
  CREATE INDEX "_ilanlar_v_version_version_created_at_idx" ON "_ilanlar_v" USING btree ("version_created_at");
  CREATE INDEX "_ilanlar_v_created_at_idx" ON "_ilanlar_v" USING btree ("created_at");
  CREATE INDEX "_ilanlar_v_updated_at_idx" ON "_ilanlar_v" USING btree ("updated_at");
  CREATE INDEX "_ilanlar_v_rels_order_idx" ON "_ilanlar_v_rels" USING btree ("order");
  CREATE INDEX "_ilanlar_v_rels_parent_idx" ON "_ilanlar_v_rels" USING btree ("parent_id");
  CREATE INDEX "_ilanlar_v_rels_path_idx" ON "_ilanlar_v_rels" USING btree ("path");
  CREATE INDEX "_ilanlar_v_rels_taksonomiler_id_idx" ON "_ilanlar_v_rels" USING btree ("taksonomiler_id");
  CREATE INDEX "basvurular_etiketler_order_idx" ON "basvurular_etiketler" USING btree ("_order");
  CREATE INDEX "basvurular_etiketler_parent_id_idx" ON "basvurular_etiketler" USING btree ("_parent_id");
  CREATE INDEX "basvurular_ekip_notlari_order_idx" ON "basvurular_ekip_notlari" USING btree ("_order");
  CREATE INDEX "basvurular_ekip_notlari_parent_id_idx" ON "basvurular_ekip_notlari" USING btree ("_parent_id");
  CREATE INDEX "basvurular_ekip_notlari_yazan_idx" ON "basvurular_ekip_notlari" USING btree ("yazan_id");
  CREATE INDEX "basvurular_ilan_idx" ON "basvurular" USING btree ("ilan_id");
  CREATE INDEX "basvurular_firma_idx" ON "basvurular" USING btree ("firma_id");
  CREATE INDEX "basvurular_aday_kullanici_idx" ON "basvurular" USING btree ("aday_kullanici_id");
  CREATE INDEX "basvurular_cv_idx" ON "basvurular" USING btree ("cv_id");
  CREATE INDEX "basvurular_durum_idx" ON "basvurular" USING btree ("durum");
  CREATE INDEX "basvurular_updated_at_idx" ON "basvurular" USING btree ("updated_at");
  CREATE INDEX "basvurular_created_at_idx" ON "basvurular" USING btree ("created_at");
  CREATE INDEX "adaylar_deneyimler_order_idx" ON "adaylar_deneyimler" USING btree ("_order");
  CREATE INDEX "adaylar_deneyimler_parent_id_idx" ON "adaylar_deneyimler" USING btree ("_parent_id");
  CREATE INDEX "adaylar_beceriler_order_idx" ON "adaylar_beceriler" USING btree ("_order");
  CREATE INDEX "adaylar_beceriler_parent_id_idx" ON "adaylar_beceriler" USING btree ("_parent_id");
  CREATE INDEX "adaylar_beceriler_beceri_idx" ON "adaylar_beceriler" USING btree ("beceri_id");
  CREATE INDEX "adaylar_diller_order_idx" ON "adaylar_diller" USING btree ("_order");
  CREATE INDEX "adaylar_diller_parent_id_idx" ON "adaylar_diller" USING btree ("_parent_id");
  CREATE INDEX "adaylar_diller_dil_idx" ON "adaylar_diller" USING btree ("dil_id");
  CREATE INDEX "adaylar_sertifikalar_order_idx" ON "adaylar_sertifikalar" USING btree ("_order");
  CREATE INDEX "adaylar_sertifikalar_parent_id_idx" ON "adaylar_sertifikalar" USING btree ("_parent_id");
  CREATE INDEX "adaylar_baglantilar_order_idx" ON "adaylar_baglantilar" USING btree ("_order");
  CREATE INDEX "adaylar_baglantilar_parent_id_idx" ON "adaylar_baglantilar" USING btree ("_parent_id");
  CREATE INDEX "adaylar_tercihler_turler_order_idx" ON "adaylar_tercihler_turler" USING btree ("order");
  CREATE INDEX "adaylar_tercihler_turler_parent_idx" ON "adaylar_tercihler_turler" USING btree ("parent_id");
  CREATE INDEX "adaylar_tercihler_modeller_order_idx" ON "adaylar_tercihler_modeller" USING btree ("order");
  CREATE INDEX "adaylar_tercihler_modeller_parent_idx" ON "adaylar_tercihler_modeller" USING btree ("parent_id");
  CREATE INDEX "adaylar_cvler_order_idx" ON "adaylar_cvler" USING btree ("_order");
  CREATE INDEX "adaylar_cvler_parent_id_idx" ON "adaylar_cvler" USING btree ("_parent_id");
  CREATE INDEX "adaylar_cvler_dosya_idx" ON "adaylar_cvler" USING btree ("dosya_id");
  CREATE UNIQUE INDEX "adaylar_kullanici_idx" ON "adaylar" USING btree ("kullanici_id");
  CREATE UNIQUE INDEX "adaylar_kod_idx" ON "adaylar" USING btree ("kod");
  CREATE INDEX "adaylar_okul_idx" ON "adaylar" USING btree ("okul_id");
  CREATE INDEX "adaylar_bolum_idx" ON "adaylar" USING btree ("bolum_id");
  CREATE INDEX "adaylar_updated_at_idx" ON "adaylar" USING btree ("updated_at");
  CREATE INDEX "adaylar_created_at_idx" ON "adaylar" USING btree ("created_at");
  CREATE INDEX "adaylar_rels_order_idx" ON "adaylar_rels" USING btree ("order");
  CREATE INDEX "adaylar_rels_parent_idx" ON "adaylar_rels" USING btree ("parent_id");
  CREATE INDEX "adaylar_rels_path_idx" ON "adaylar_rels" USING btree ("path");
  CREATE INDEX "adaylar_rels_firmalar_id_idx" ON "adaylar_rels" USING btree ("firmalar_id");
  CREATE INDEX "taksonomiler_es_anlamlilar_order_idx" ON "taksonomiler_es_anlamlilar" USING btree ("_order");
  CREATE INDEX "taksonomiler_es_anlamlilar_parent_id_idx" ON "taksonomiler_es_anlamlilar" USING btree ("_parent_id");
  CREATE INDEX "taksonomiler_tur_idx" ON "taksonomiler" USING btree ("tur");
  CREATE INDEX "taksonomiler_arama_idx" ON "taksonomiler" USING btree ("arama");
  CREATE INDEX "taksonomiler_updated_at_idx" ON "taksonomiler" USING btree ("updated_at");
  CREATE INDEX "taksonomiler_created_at_idx" ON "taksonomiler" USING btree ("created_at");
  CREATE INDEX "davetler_hatirlatmalar_order_idx" ON "davetler_hatirlatmalar" USING btree ("_order");
  CREATE INDEX "davetler_hatirlatmalar_parent_id_idx" ON "davetler_hatirlatmalar" USING btree ("_parent_id");
  CREATE INDEX "davetler_firma_idx" ON "davetler" USING btree ("firma_id");
  CREATE INDEX "davetler_anahtar_ozeti_idx" ON "davetler" USING btree ("anahtar_ozeti");
  CREATE INDEX "davetler_updated_at_idx" ON "davetler" USING btree ("updated_at");
  CREATE INDEX "davetler_created_at_idx" ON "davetler" USING btree ("created_at");
  CREATE INDEX "rizalar_kullanici_idx" ON "rizalar" USING btree ("kullanici_id");
  CREATE INDEX "rizalar_updated_at_idx" ON "rizalar" USING btree ("updated_at");
  CREATE INDEX "rizalar_created_at_idx" ON "rizalar" USING btree ("created_at");
  CREATE INDEX "havuz_goruntulemeleri_aday_idx" ON "havuz_goruntulemeleri" USING btree ("aday_id");
  CREATE INDEX "havuz_goruntulemeleri_firma_idx" ON "havuz_goruntulemeleri" USING btree ("firma_id");
  CREATE INDEX "havuz_goruntulemeleri_kim_idx" ON "havuz_goruntulemeleri" USING btree ("kim_id");
  CREATE INDEX "havuz_goruntulemeleri_updated_at_idx" ON "havuz_goruntulemeleri" USING btree ("updated_at");
  CREATE INDEX "havuz_goruntulemeleri_created_at_idx" ON "havuz_goruntulemeleri" USING btree ("created_at");
  CREATE INDEX "islem_kayitlari_tur_idx" ON "islem_kayitlari" USING btree ("tur");
  CREATE INDEX "islem_kayitlari_kim_idx" ON "islem_kayitlari" USING btree ("kim_id");
  CREATE INDEX "islem_kayitlari_kayit_turu_idx" ON "islem_kayitlari" USING btree ("kayit_turu");
  CREATE INDEX "islem_kayitlari_kayit_id_idx" ON "islem_kayitlari" USING btree ("kayit_id");
  CREATE INDEX "islem_kayitlari_updated_at_idx" ON "islem_kayitlari" USING btree ("updated_at");
  CREATE INDEX "islem_kayitlari_created_at_idx" ON "islem_kayitlari" USING btree ("created_at");
  CREATE INDEX "dosyalar_tur_idx" ON "dosyalar" USING btree ("tur");
  CREATE INDEX "dosyalar_sahip_idx" ON "dosyalar" USING btree ("sahip_id");
  CREATE INDEX "dosyalar_updated_at_idx" ON "dosyalar" USING btree ("updated_at");
  CREATE INDEX "dosyalar_created_at_idx" ON "dosyalar" USING btree ("created_at");
  CREATE UNIQUE INDEX "dosyalar_filename_idx" ON "dosyalar" USING btree ("filename");
  CREATE INDEX "test_postalar_updated_at_idx" ON "test_postalar" USING btree ("updated_at");
  CREATE INDEX "test_postalar_created_at_idx" ON "test_postalar" USING btree ("created_at");
  CREATE INDEX "talepler_oneriler_order_idx" ON "talepler_oneriler" USING btree ("_order");
  CREATE INDEX "talepler_oneriler_parent_id_idx" ON "talepler_oneriler" USING btree ("_parent_id");
  CREATE INDEX "talepler_talep_eden_idx" ON "talepler" USING btree ("talep_eden_id");
  CREATE INDEX "talepler_firma_idx" ON "talepler" USING btree ("firma_id");
  CREATE INDEX "talepler_durum_idx" ON "talepler" USING btree ("durum");
  CREATE INDEX "talepler_sonuclandiran_idx" ON "talepler" USING btree ("sonuclandiran_id");
  CREATE INDEX "talepler_updated_at_idx" ON "talepler" USING btree ("updated_at");
  CREATE INDEX "talepler_created_at_idx" ON "talepler" USING btree ("created_at");
  CREATE INDEX "talepler_rels_order_idx" ON "talepler_rels" USING btree ("order");
  CREATE INDEX "talepler_rels_parent_idx" ON "talepler_rels" USING btree ("parent_id");
  CREATE INDEX "talepler_rels_path_idx" ON "talepler_rels" USING btree ("path");
  CREATE INDEX "talepler_rels_taksonomiler_id_idx" ON "talepler_rels" USING btree ("taksonomiler_id");
  CREATE UNIQUE INDEX "gunluk_ozetler_tarih_idx" ON "gunluk_ozetler" USING btree ("tarih");
  CREATE INDEX "gunluk_ozetler_updated_at_idx" ON "gunluk_ozetler" USING btree ("updated_at");
  CREATE INDEX "gunluk_ozetler_created_at_idx" ON "gunluk_ozetler" USING btree ("created_at");
  CREATE INDEX "kvkk_talepleri_notlar_order_idx" ON "kvkk_talepleri_notlar" USING btree ("_order");
  CREATE INDEX "kvkk_talepleri_notlar_parent_id_idx" ON "kvkk_talepleri_notlar" USING btree ("_parent_id");
  CREATE INDEX "kvkk_talepleri_notlar_yazan_idx" ON "kvkk_talepleri_notlar" USING btree ("yazan_id");
  CREATE INDEX "kvkk_talepleri_kullanici_idx" ON "kvkk_talepleri" USING btree ("kullanici_id");
  CREATE INDEX "kvkk_talepleri_basvuru_tarihi_idx" ON "kvkk_talepleri" USING btree ("basvuru_tarihi");
  CREATE INDEX "kvkk_talepleri_durum_idx" ON "kvkk_talepleri" USING btree ("durum");
  CREATE INDEX "kvkk_talepleri_updated_at_idx" ON "kvkk_talepleri" USING btree ("updated_at");
  CREATE INDEX "kvkk_talepleri_created_at_idx" ON "kvkk_talepleri" USING btree ("created_at");
  CREATE UNIQUE INDEX "istek_sinirlari_anahtar_idx" ON "istek_sinirlari" USING btree ("anahtar");
  CREATE INDEX "istek_sinirlari_bitis_idx" ON "istek_sinirlari" USING btree ("bitis");
  CREATE INDEX "istek_sinirlari_updated_at_idx" ON "istek_sinirlari" USING btree ("updated_at");
  CREATE INDEX "istek_sinirlari_created_at_idx" ON "istek_sinirlari" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_kullanicilar_id_idx" ON "payload_locked_documents_rels" USING btree ("kullanicilar_id");
  CREATE INDEX "payload_locked_documents_rels_firmalar_id_idx" ON "payload_locked_documents_rels" USING btree ("firmalar_id");
  CREATE INDEX "payload_locked_documents_rels_ilanlar_id_idx" ON "payload_locked_documents_rels" USING btree ("ilanlar_id");
  CREATE INDEX "payload_locked_documents_rels_basvurular_id_idx" ON "payload_locked_documents_rels" USING btree ("basvurular_id");
  CREATE INDEX "payload_locked_documents_rels_adaylar_id_idx" ON "payload_locked_documents_rels" USING btree ("adaylar_id");
  CREATE INDEX "payload_locked_documents_rels_taksonomiler_id_idx" ON "payload_locked_documents_rels" USING btree ("taksonomiler_id");
  CREATE INDEX "payload_locked_documents_rels_davetler_id_idx" ON "payload_locked_documents_rels" USING btree ("davetler_id");
  CREATE INDEX "payload_locked_documents_rels_rizalar_id_idx" ON "payload_locked_documents_rels" USING btree ("rizalar_id");
  CREATE INDEX "payload_locked_documents_rels_havuz_goruntulemeleri_id_idx" ON "payload_locked_documents_rels" USING btree ("havuz_goruntulemeleri_id");
  CREATE INDEX "payload_locked_documents_rels_islem_kayitlari_id_idx" ON "payload_locked_documents_rels" USING btree ("islem_kayitlari_id");
  CREATE INDEX "payload_locked_documents_rels_dosyalar_id_idx" ON "payload_locked_documents_rels" USING btree ("dosyalar_id");
  CREATE INDEX "payload_locked_documents_rels_test_postalar_id_idx" ON "payload_locked_documents_rels" USING btree ("test_postalar_id");
  CREATE INDEX "payload_locked_documents_rels_talepler_id_idx" ON "payload_locked_documents_rels" USING btree ("talepler_id");
  CREATE INDEX "payload_locked_documents_rels_gunluk_ozetler_id_idx" ON "payload_locked_documents_rels" USING btree ("gunluk_ozetler_id");
  CREATE INDEX "payload_locked_documents_rels_kvkk_talepleri_id_idx" ON "payload_locked_documents_rels" USING btree ("kvkk_talepleri_id");
  CREATE INDEX "payload_locked_documents_rels_istek_sinirlari_id_idx" ON "payload_locked_documents_rels" USING btree ("istek_sinirlari_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_kullanicilar_id_idx" ON "payload_preferences_rels" USING btree ("kullanicilar_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "ayarlar_hatirlatma_gunleri_order_idx" ON "ayarlar_hatirlatma_gunleri" USING btree ("_order");
  CREATE INDEX "ayarlar_hatirlatma_gunleri_parent_id_idx" ON "ayarlar_hatirlatma_gunleri" USING btree ("_parent_id");
  CREATE INDEX "_ayarlar_v_version_hatirlatma_gunleri_order_idx" ON "_ayarlar_v_version_hatirlatma_gunleri" USING btree ("_order");
  CREATE INDEX "_ayarlar_v_version_hatirlatma_gunleri_parent_id_idx" ON "_ayarlar_v_version_hatirlatma_gunleri" USING btree ("_parent_id");
  CREATE INDEX "_ayarlar_v_created_at_idx" ON "_ayarlar_v" USING btree ("created_at");
  CREATE INDEX "_ayarlar_v_updated_at_idx" ON "_ayarlar_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "kullanicilar_sessions" CASCADE;
  DROP TABLE "kullanicilar" CASCADE;
  DROP TABLE "firmalar_calisma_modelleri" CASCADE;
  DROP TABLE "firmalar_yan_haklar" CASCADE;
  DROP TABLE "firmalar_takip_notlari" CASCADE;
  DROP TABLE "firmalar" CASCADE;
  DROP TABLE "firmalar_rels" CASCADE;
  DROP TABLE "_firmalar_v_version_calisma_modelleri" CASCADE;
  DROP TABLE "_firmalar_v_version_yan_haklar" CASCADE;
  DROP TABLE "_firmalar_v_version_takip_notlari" CASCADE;
  DROP TABLE "_firmalar_v" CASCADE;
  DROP TABLE "_firmalar_v_rels" CASCADE;
  DROP TABLE "ilanlar_diller" CASCADE;
  DROP TABLE "ilanlar_yan_haklar" CASCADE;
  DROP TABLE "ilanlar_on_eleme_sorulari_secenekler" CASCADE;
  DROP TABLE "ilanlar_on_eleme_sorulari" CASCADE;
  DROP TABLE "ilanlar" CASCADE;
  DROP TABLE "ilanlar_rels" CASCADE;
  DROP TABLE "_ilanlar_v_version_diller" CASCADE;
  DROP TABLE "_ilanlar_v_version_yan_haklar" CASCADE;
  DROP TABLE "_ilanlar_v_version_on_eleme_sorulari_secenekler" CASCADE;
  DROP TABLE "_ilanlar_v_version_on_eleme_sorulari" CASCADE;
  DROP TABLE "_ilanlar_v" CASCADE;
  DROP TABLE "_ilanlar_v_rels" CASCADE;
  DROP TABLE "basvurular_etiketler" CASCADE;
  DROP TABLE "basvurular_ekip_notlari" CASCADE;
  DROP TABLE "basvurular" CASCADE;
  DROP TABLE "adaylar_deneyimler" CASCADE;
  DROP TABLE "adaylar_beceriler" CASCADE;
  DROP TABLE "adaylar_diller" CASCADE;
  DROP TABLE "adaylar_sertifikalar" CASCADE;
  DROP TABLE "adaylar_baglantilar" CASCADE;
  DROP TABLE "adaylar_tercihler_turler" CASCADE;
  DROP TABLE "adaylar_tercihler_modeller" CASCADE;
  DROP TABLE "adaylar_cvler" CASCADE;
  DROP TABLE "adaylar" CASCADE;
  DROP TABLE "adaylar_rels" CASCADE;
  DROP TABLE "taksonomiler_es_anlamlilar" CASCADE;
  DROP TABLE "taksonomiler" CASCADE;
  DROP TABLE "davetler_hatirlatmalar" CASCADE;
  DROP TABLE "davetler" CASCADE;
  DROP TABLE "rizalar" CASCADE;
  DROP TABLE "havuz_goruntulemeleri" CASCADE;
  DROP TABLE "islem_kayitlari" CASCADE;
  DROP TABLE "dosyalar" CASCADE;
  DROP TABLE "test_postalar" CASCADE;
  DROP TABLE "talepler_oneriler" CASCADE;
  DROP TABLE "talepler" CASCADE;
  DROP TABLE "talepler_rels" CASCADE;
  DROP TABLE "gunluk_ozetler" CASCADE;
  DROP TABLE "kvkk_talepleri_notlar" CASCADE;
  DROP TABLE "kvkk_talepleri" CASCADE;
  DROP TABLE "istek_sinirlari" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "ayarlar_hatirlatma_gunleri" CASCADE;
  DROP TABLE "ayarlar" CASCADE;
  DROP TABLE "_ayarlar_v_version_hatirlatma_gunleri" CASCADE;
  DROP TABLE "_ayarlar_v" CASCADE;
  DROP TYPE "public"."enum_kullanicilar_rol";
  DROP TYPE "public"."enum_kullanicilar_firma_yetkisi";
  DROP TYPE "public"."enum_firmalar_calisma_modelleri";
  DROP TYPE "public"."enum_firmalar_calisan_araligi";
  DROP TYPE "public"."enum_firmalar_asama";
  DROP TYPE "public"."enum__firmalar_v_version_calisma_modelleri";
  DROP TYPE "public"."enum__firmalar_v_version_calisan_araligi";
  DROP TYPE "public"."enum__firmalar_v_version_asama";
  DROP TYPE "public"."enum_ilanlar_diller_seviye";
  DROP TYPE "public"."enum_ilanlar_on_eleme_sorulari_tip";
  DROP TYPE "public"."enum_ilanlar_tur";
  DROP TYPE "public"."enum_ilanlar_alt_tur";
  DROP TYPE "public"."enum_ilanlar_model";
  DROP TYPE "public"."enum_ilanlar_deneyim";
  DROP TYPE "public"."enum_ilanlar_egitim";
  DROP TYPE "public"."enum_ilanlar_dil";
  DROP TYPE "public"."enum_ilanlar_sgk";
  DROP TYPE "public"."enum_ilanlar_durum";
  DROP TYPE "public"."enum_ilanlar_kapanis_nedeni";
  DROP TYPE "public"."enum__ilanlar_v_version_diller_seviye";
  DROP TYPE "public"."enum__ilanlar_v_version_on_eleme_sorulari_tip";
  DROP TYPE "public"."enum__ilanlar_v_version_tur";
  DROP TYPE "public"."enum__ilanlar_v_version_alt_tur";
  DROP TYPE "public"."enum__ilanlar_v_version_model";
  DROP TYPE "public"."enum__ilanlar_v_version_deneyim";
  DROP TYPE "public"."enum__ilanlar_v_version_egitim";
  DROP TYPE "public"."enum__ilanlar_v_version_dil";
  DROP TYPE "public"."enum__ilanlar_v_version_sgk";
  DROP TYPE "public"."enum__ilanlar_v_version_durum";
  DROP TYPE "public"."enum__ilanlar_v_version_kapanis_nedeni";
  DROP TYPE "public"."enum_basvurular_kaynak";
  DROP TYPE "public"."enum_basvurular_durum";
  DROP TYPE "public"."enum_adaylar_beceriler_seviye";
  DROP TYPE "public"."enum_adaylar_diller_seviye";
  DROP TYPE "public"."enum_adaylar_tercihler_turler";
  DROP TYPE "public"."enum_adaylar_tercihler_modeller";
  DROP TYPE "public"."enum_adaylar_cinsiyet";
  DROP TYPE "public"."enum_adaylar_deneyim_seviyesi";
  DROP TYPE "public"."enum_adaylar_havuz_gorunurluk";
  DROP TYPE "public"."enum_taksonomiler_tur";
  DROP TYPE "public"."enum_davetler_firma_yetkisi";
  DROP TYPE "public"."enum_rizalar_tur";
  DROP TYPE "public"."enum_islem_kayitlari_tur";
  DROP TYPE "public"."enum_dosyalar_tur";
  DROP TYPE "public"."enum_dosyalar_tarama_durumu";
  DROP TYPE "public"."enum_talepler_taksonomi_turu";
  DROP TYPE "public"."enum_talepler_durum";
  DROP TYPE "public"."enum_kvkk_talepleri_tur";
  DROP TYPE "public"."enum_kvkk_talepleri_kanal";
  DROP TYPE "public"."enum_kvkk_talepleri_kimlik";
  DROP TYPE "public"."enum_kvkk_talepleri_durum";
  DROP TYPE "public"."enum_kvkk_talepleri_sonuc";`)
}
