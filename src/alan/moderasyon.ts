/**
 * İlan onayında otomatik tarama (prototip “İlan onayı”). Kararı vermez; Yönetici A.Ş.'nin dikkatini çeker.
 * Saf fonksiyon: ilan metni → bulgular. Her bulgu neyin, nerede ve neden işaretlendiğini Türkçe tam cümleyle söyler.
 */
import { normallestir } from './metin'

export interface TaramaBulgusu {
  tur: 'uyari' | 'temiz'
  metin: string
}

export interface TaranacakIlan {
  pozisyonAdi: string
  isTanimi?: string | null
  nitelikler?: string | null
  sorular?: string[]
}

const EPOSTA = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/
const TELEFON = /(?:\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\b0?\s?\(?(?:2|3|4)\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/
const ADRES = /\b(?:https?:\/\/|www\.)\S+/i

/** Ayrımcı olabilecek şartlar: yaş, cinsiyet, medeni hâl, görünüş. Eşleşme normalleştirilmiş metinde aranır. */
const AYRIMCI: Array<[RegExp, string]> = [
  // Normalleştirmede tire boşluğa döner: “25-35 yaş” → “25 35 yas”.
  [/\b\d{2}\s+(?:ile\s+|ila\s+)?\d{2}\s+yas/, 'yaş aralığı'],
  [/\b\d{2}\s*yas\w*\s+(?:alti|ustu|gecmemis|asmamis|kucuk|buyuk)/, 'yaş sınırı'],
  [/\b(?:bay|bayan|erkek|kadin|kiz)\s+(?:aday|eleman|personel|calisan)/, 'cinsiyet şartı'],
  [/\b(?:bekar|evli|evlenmemis)\b/, 'medeni hâl'],
  [/\b(?:boy|kilo)\s*(?:en az|en fazla|\d)/, 'boy veya kilo şartı'],
  [/\b(?:hos|duzgun|guzel)\s+gorunum/, 'görünüş şartı'],
  [/\b(?:askerligini yapmis|askerlikle ilisigi|askerlik(?:i)? tamamlanmis)/, 'askerlik şartı (dolaylı olarak cinsiyet şartı olabilir)'],
]
const UCRETSIZ: Array<[RegExp, string]> = [
  [/\bucretsiz\s+(?:deneme|calisma|staj donemi)/, 'ücretsiz deneme çalışması'],
  [/\bdeneme\s+(?:calismasi|suresi)\s+ucretsiz/, 'ücretsiz deneme süresi'],
  [/\b(?:egitim|kayit|dosya)\s+ucreti/, 'adaydan ücret talebi'],
  [/\bucret\s+(?:talep|alin)/, 'adaydan ücret talebi'],
]

export function ilanTara(i: TaranacakIlan): TaramaBulgusu[] {
  const bolumler: Array<[string, string]> = [
    ['Pozisyon adında', i.pozisyonAdi],
    ['İş tanımında', i.isTanimi ?? ''],
    ['Aranan niteliklerde', i.nitelikler ?? ''],
    ...((i.sorular ?? []).map((s, n) => [`${n + 1}. ön eleme sorusunda`, s]) as Array<[string, string]>),
  ]
  const bulgular: TaramaBulgusu[] = []
  const ekle = (metin: string) => {
    if (!bulgular.some((b) => b.metin === metin)) bulgular.push({ tur: 'uyari', metin })
  }
  for (const [yer, ham] of bolumler) {
    if (!ham) continue
    if (EPOSTA.test(ham)) ekle(`${yer} bir e-posta adresi var; başvurular portal dışına yönlenebilir.`)
    if (TELEFON.test(ham)) ekle(`${yer} bir telefon numarası var; başvurular portal dışına yönlenebilir.`)
    if (ADRES.test(ham)) ekle(`${yer} bir web adresi var; adresin ilanla ilgili olduğunu denetleyin.`)
    const n = normallestir(ham)
    for (const [d, ad] of AYRIMCI) if (d.test(n)) ekle(`${yer} ayrımcı olabilecek bir ifade var (${ad}).`)
    for (const [d, ad] of UCRETSIZ) if (d.test(n)) ekle(`${yer} şüpheli bir ifade var (${ad}).`)
  }
  if (!bulgular.length) bulgular.push({ tur: 'temiz', metin: 'Otomatik taramada ayrımcı ifade, ücret talebi veya portal dışı iletişim bilgisi bulunmadı.' })
  return bulgular
}

/** Düzeltme isterken seçilebilecek hazır gerekçeler; firmaya ne yapacağı söylenir. */
export const DUZELTME_GEREKCELERI: Array<[string, string]> = [
  ['iletisim', 'İlan metninde e-posta, telefon veya web adresi var. Başvuruların portal üzerinden gelmesi için bu bilgileri kaldırın.'],
  ['ayrimci', 'İlanda yaş, cinsiyet, medeni hâl veya görünüşle ilgili bir şart var. Bu şartlar ayrımcılık yasağına aykırıdır; kaldırın.'],
  ['ucretsiz', 'İlanda ücretsiz deneme çalışması veya adaydan ücret talebi var. Bu tür ilanlar yayınlanamaz.'],
  ['belirsiz', 'İş tanımı veya aranan nitelikler yeterince açık değil. Pozisyondaki kişinin ne yapacağını maddeler hâlinde yazın.'],
  ['tur', 'İlanın türü veya çalışma şekli içerikle uyuşmuyor. Doğru türü seçin.'],
]

/**
 * Onay öncesi kontrol listesi (prototip “İlan onayı”). Yasal ve etik maddeler insan tarafından tek tek onaylanır;
 * otomatik tarama yalnızca yardımcıdır. Onay için hepsi işaretlenmeli.
 */
export const KONTROL_LISTESI: Array<[string, string]> = [
  ['ayrimcilik', 'İlanda yaş, cinsiyet, medeni hâl veya görünüş şartı yok.'],
  ['ucret', 'Ücretsiz deneme çalışması veya adaydan ücret istenmiyor.'],
  ['firma', 'Pozisyon firmanın kendisine ait; aracılık veya başka firma adına ilan değil.'],
  ['metin', 'Metin anlaşılır; e-posta, telefon veya web adresi gömülü değil.'],
]

export function eksikKontroller(isaretli: string[]): string[] {
  return KONTROL_LISTESI.filter(([k]) => !isaretli.includes(k)).map(([, m]) => m)
}
