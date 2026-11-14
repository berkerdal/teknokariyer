/**
 * İlgili kişi başvuruları (KVKK m. 11 ve m. 13; Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ).
 *
 * - Başvuru en geç 30 gün içinde ücretsiz sonuçlandırılır. Süre, başvurunun Yönetici A.Ş.’ye ulaştığı günden sayılır.
 * - Ret veya kısmi kabul gerekçeli olur; cevap yazılı ya da elektronik ortamda verilir.
 * - Portal formu, hesabına giriş yapmış kişinin kimliğini doğrulanmış sayar. E-postayla veya yazılı gelen başvurularda
 *   kimlik ayrıca doğrulanır (kayıtlı e-posta adresi, ıslak imza, KEP).
 *
 * Bu modül saf kurallardır; sunucu ve arayüz ortak kullanır. Metinler hukuk birimi onayına kadar taslaktır.
 */
import { trGunBasi, trGunFarki } from './tarih'

export const YASAL_SURE_GUN = 30
/** Süresi bu kadar gün veya daha az kalan talep panelde öne çıkar. */
export const YAKLASAN_GUN = 7
/** Bir hesabın aynı anda açık tutabileceği portal başvurusu (kötüye kullanıma karşı). */
export const ACIK_BASVURU_SINIRI = 3

export type KvkkTalepTuru = 'bilgi' | 'amac' | 'aktarim' | 'duzeltme' | 'silme' | 'bildirim' | 'itiraz' | 'zarar' | 'diger'

/** [değer, panelde kısa ad, adaya açıklama (sen), açıklama yazmak zorunlu mu] */
export const KVKK_TALEP_TURLERI: Array<[KvkkTalepTuru, string, string, boolean]> = [
  ['bilgi', 'Bilgi talebi', 'Hakkımda hangi kişisel verilerin işlendiğini öğrenmek istiyorum.', false],
  ['amac', 'İşleme amacı', 'Verilerimin hangi amaçla işlendiğini ve bu amaca uygun kullanılıp kullanılmadığını öğrenmek istiyorum.', false],
  ['aktarim', 'Aktarılan kişiler', 'Verilerimin yurt içinde veya yurt dışında aktarıldığı kişileri öğrenmek istiyorum.', false],
  ['duzeltme', 'Düzeltme', 'Eksik veya yanlış işlenen verilerimin düzeltilmesini istiyorum.', true],
  ['silme', 'Silme', 'Kişisel verilerimin silinmesini veya yok edilmesini istiyorum.', false],
  ['bildirim', 'Üçüncü kişilere bildirim', 'Düzeltme veya silme işleminin, verilerimin aktarıldığı kişilere bildirilmesini istiyorum.', true],
  ['itiraz', 'Otomatik sonuca itiraz', 'Verilerimin otomatik sistemlerle analiz edilmesiyle aleyhime çıkan bir sonuca itiraz ediyorum.', true],
  ['zarar', 'Zararın giderilmesi', 'Verilerimin kanuna aykırı işlenmesi sebebiyle uğradığım zararın giderilmesini istiyorum.', true],
  ['diger', 'Diğer', 'Başka bir konuda başvurmak istiyorum.', true],
]
export const KVKK_TUR_ADI = Object.fromEntries(KVKK_TALEP_TURLERI.map(([t, a]) => [t, a])) as Record<KvkkTalepTuru, string>
export const kvkkTuruMu = (x: unknown): x is KvkkTalepTuru => KVKK_TALEP_TURLERI.some(([t]) => t === x)
export const aciklamaZorunluMu = (t: KvkkTalepTuru) => KVKK_TALEP_TURLERI.find(([x]) => x === t)?.[3] ?? true

export type KvkkKanal = 'portal' | 'eposta' | 'yazili' | 'kep'
export const KVKK_KANALLARI: Array<[KvkkKanal, string]> = [
  ['portal', 'Portal formu'],
  ['eposta', 'E-posta'],
  ['yazili', 'Yazılı (elden veya posta)'],
  ['kep', 'KEP'],
]
export const KVKK_KANAL_ADI = Object.fromEntries(KVKK_KANALLARI) as Record<KvkkKanal, string>

export type KimlikYontemi = 'hesap' | 'kayitli-eposta' | 'imzali' | 'kep' | 'dogrulanmadi'
export const KIMLIK_YONTEMLERI: Array<[KimlikYontemi, string]> = [
  ['hesap', 'Hesabına giriş yaparak başvurdu'],
  ['kayitli-eposta', 'Portalda kayıtlı e-posta adresinden yazdı'],
  ['imzali', 'Islak imzalı dilekçe ve kimlik'],
  ['kep', 'KEP veya güvenli elektronik imza'],
  ['dogrulanmadi', 'Henüz doğrulanmadı'],
]
export const KIMLIK_ADI = Object.fromEntries(KIMLIK_YONTEMLERI) as Record<KimlikYontemi, string>

export type KvkkDurum = 'alindi' | 'inceleniyor' | 'sonuclandi'
export const KVKK_DURUM_ADI: Record<KvkkDurum, string> = { alindi: 'Alındı', inceleniyor: 'İnceleniyor', sonuclandi: 'Sonuçlandı' }

export type KvkkSonuc = 'kabul' | 'kismen' | 'ret'
export const KVKK_SONUC_ADI: Record<KvkkSonuc, string> = { kabul: 'Kabul edildi', kismen: 'Kısmen kabul edildi', ret: 'Reddedildi' }

/** Yasal sürenin son günü (Türkiye saatiyle o günün başlangıcı). */
export function sonGun(basvuru: Date): Date {
  return new Date(trGunBasi(basvuru).getTime() + YASAL_SURE_GUN * 86_400_000)
}

/** Son güne kalan takvim günü. Negatifse süre aşılmıştır. */
export function kalanGun(basvuru: Date, simdi: Date): number {
  return trGunFarki(simdi, sonGun(basvuru))
}

/** Sonuçlandırma kaç günde oldu (başvuru günü 0). */
export function cevapSuresi(basvuru: Date, cevap: Date): number {
  return trGunFarki(basvuru, cevap)
}

/** Açık talepler önce, en az süresi kalan en üstte; sonuçlananlar en yeniden eskiye. */
export function talepSirasi<T extends { durum: KvkkDurum; basvuruTarihi: string; cevapTarihi?: string | null }>(a: T, b: T): number {
  const acikA = a.durum !== 'sonuclandi'
  const acikB = b.durum !== 'sonuclandi'
  if (acikA !== acikB) return acikA ? -1 : 1
  if (acikA) return new Date(a.basvuruTarihi).getTime() - new Date(b.basvuruTarihi).getTime()
  return new Date(b.cevapTarihi ?? b.basvuruTarihi).getTime() - new Date(a.cevapTarihi ?? a.basvuruTarihi).getTime()
}

/** Elle kaydedilen başvurunun tarihi bugünden ileri olamaz. Geçmiş tarih kabul edilir; yasal süre o günden sayılır. */
export function basvuruTarihiDenetle(gun: Date, simdi: Date): string | null {
  if (trGunBasi(gun).getTime() > trGunBasi(simdi).getTime()) return 'Başvuru tarihi bugünden sonra olamaz.'
  return null
}

/**
 * Cevap taslakları (hukuk birimi onayına kadar taslak). Personel metni düzenleyerek gönderir; boş cevap gönderilemez.
 * Hitap: hesabı olan aday için “sen”, diğer başvurucular için “siz” (K9).
 */
export function cevapTaslagi(tur: KvkkTalepTuru, sonuc: KvkkSonuc, hitap: 'sen' | 'siz'): string {
  const sen = hitap === 'sen'
  if (sonuc === 'ret')
    return sen
      ? 'Başvurunu inceledik ve aşağıdaki gerekçeyle kabul edemedik: [gerekçeyi yazın]. Bu karara karşı 30 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsin.'
      : 'Başvurunuzu inceledik ve aşağıdaki gerekçeyle kabul edemedik: [gerekçeyi yazın]. Bu karara karşı 30 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsiniz.'
  const kismen = sonuc === 'kismen'
  const giris = sen ? 'Başvurunu inceledik.' : 'Başvurunuzu inceledik.'
  const govde: Record<KvkkTalepTuru, string> = {
    bilgi: sen
      ? 'Hakkında işlediğimiz verilerin bir kopyasını, hesabına giriş yapıp “Hesap ve gizlilik” sayfasındaki “Verilerimi indir” düğmesiyle alabilirsin. Bu dosyada hesap bilgilerin, profilin, başvuruların ve verdiğin onaylar yer alır.'
      : 'Hakkınızda işlediğimiz kişisel veriler şunlardır: [verileri yazın].',
    amac: sen
      ? 'Verilerini, aydınlatma metinlerinde yazan amaçlarla işliyoruz: hesabını yönetmek, ilanlara başvurmanı sağlamak ve izin verdiysen CV havuzunda firmalara görünmek. Metinlerin güncel hâli portalın alt bilgisindeki “Kişisel veriler” bölümünde yer alır.'
      : 'Verilerinizi şu amaçlarla işliyoruz: [amaçları yazın].',
    aktarim: sen
      ? 'Verilerin yalnızca başvurduğun firmalarla ve CV havuzuna katıldıysan havuzda profilini açan teknokent firmalarıyla paylaşılır. Hizmetin barındırıldığı altyapı sağlayıcısı verileri yalnızca bizim adımıza saklar.'
      : 'Verileriniz şu kişilere aktarılmıştır: [aktarılan kişileri yazın].',
    duzeltme: sen ? 'Belirttiğin bilgileri düzelttik: [düzeltilenleri yazın].' : 'Belirttiğiniz bilgileri düzelttik: [düzeltilenleri yazın].',
    silme: sen
      ? 'Hesabını ve kişisel verilerini sildik. Başvurduğun firmalarda başvuru kaydın “aday hesabını sildi” olarak kalır; adın, iletişim bilgilerin ve CV’n silinmiştir.'
      : 'Kişisel verilerinizi sildik: [silinen verileri yazın].',
    bildirim: sen ? 'Yaptığımız işlemi, verilerinin aktarıldığı şu firmalara bildirdik: [firmaları yazın].' : 'Yaptığımız işlemi, verilerinizin aktarıldığı şu kişilere bildirdik: [kişileri yazın].',
    itiraz: sen ? 'İtirazını inceledik: [sonucu yazın].' : 'İtirazınızı inceledik: [sonucu yazın].',
    zarar: sen ? 'Talebini inceledik: [sonucu yazın].' : 'Talebinizi inceledik: [sonucu yazın].',
    diger: sen ? '[Cevabı yazın].' : '[Cevabı yazın].',
  }
  const kismenNot = kismen ? (sen ? ' Talebinin bir kısmını şu gerekçeyle karşılayamadık: [gerekçeyi yazın].' : ' Talebinizin bir kısmını şu gerekçeyle karşılayamadık: [gerekçeyi yazın].') : ''
  return `${giris} ${govde[tur]}${kismenNot}`
}

/** Taslaktaki “[… yazın]” yer tutucuları doldurulmadan cevap gönderilemez. */
export const yerTutucuVarMi = (metin: string) => /\[[^\]]*yazın\]/i.test(metin)
