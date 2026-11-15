/**
 * Listelere dosyadan toplu aktarma (YÖK/ÖSYM üniversite ve bölüm listeleri; her yıl güncellenebilir).
 *
 * - Excel (.xlsx) kitaplıksız okunur: zip (fflate) + paylaşılan metinler + ilk çalışma sayfası. CSV için `csvOku`.
 * - Resmî listelerdeki biçim farkları temizlenir: tamamı büyük harfli adlar Türkçe kurallarla düzeltilir; üniversite
 *   adının sonundaki şehir “(DENİZLİ)” ve bölüm adındaki dil, ücret, öğretim türü ekleri “(İngilizce)”, “(Burslu)”,
 *   “(İÖ)” atılır. Aynı ad bir kez alınır.
 * Saf modül: tarayıcıda (önizleme) ve sunucuda (yeniden denetim) aynı çalışır.
 */
import { unzipSync, strFromU8 } from 'fflate'
import { normallestir } from './metin'
import { benzerAdlar, mevcutlariAyir } from './talep'

export const AKTARMA_PARCA = 200
export const AKTARMA_EN_FAZLA = 5000

/* ---------- Excel ---------- */

const varlik = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')

/** <t> öğelerinin metnini birleştirir (zengin metin parçaları dahil). */
const metinleri = (xml: string) => Array.from(xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (m) => varlik(m[1]!)).join('')

/** “AB12” → sütun sırası (0'dan) */
function sutunSirasi(hucre: string): number {
  const harfler = /^[A-Z]+/.exec(hucre)?.[0] ?? 'A'
  let n = 0
  for (const h of harfler) n = n * 26 + (h.charCodeAt(0) - 64)
  return n - 1
}

/** .xlsx dosyasının ilk çalışma sayfasını satırlara çevirir. Bozuk dosyada hata fırlatır. */
export function xlsxOku(baytlar: Uint8Array): string[][] {
  const dosyalar = unzipSync(baytlar)
  const oku = (ad: string) => (dosyalar[ad] ? strFromU8(dosyalar[ad]!) : null)
  const paylasilan = Array.from((oku('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g), (m) => metinleri(m[1]!))
  const sayfaAdi = Object.keys(dosyalar)
    .filter((a) => /^xl\/worksheets\/sheet\d+\.xml$/.test(a))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]))[0]
  if (!sayfaAdi) throw new Error('Çalışma sayfası bulunamadı')
  const sayfa = oku(sayfaAdi)!
  const satirlar: string[][] = []
  for (const s of sayfa.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const satir: string[] = []
    for (const c of s[1]!.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const nit = c[1]!
      const ic = c[2] ?? ''
      const r = /\br="([A-Z]+\d+)"/.exec(nit)?.[1]
      const tur = /\bt="(\w+)"/.exec(nit)?.[1]
      const v = /<v>([\s\S]*?)<\/v>/.exec(ic)?.[1]
      let deger = ''
      if (tur === 's' && v !== undefined) deger = paylasilan[Number(v)] ?? ''
      else if (tur === 'inlineStr') deger = metinleri(ic)
      else if (v !== undefined) deger = varlik(v)
      const i = r ? sutunSirasi(r) : satir.length
      while (satir.length < i) satir.push('')
      satir[i] = deger.trim()
    }
    if (satir.some(Boolean)) satirlar.push(satir)
  }
  return satirlar
}

/* ---------- Ad düzeltme ---------- */

const KUCUK_KALAN = new Set(['ve', 'ile', 'veya', 'ya', 'da', 'de', 'için', 'of', 'and'])
/** Büyük harf kalan kısaltmalar (vakıf üniversitesi adlarında geçenler) */
const KISALTMALAR = new Set(['TOBB', 'KTO', 'MEF', 'TED', 'SANKO', 'OSTİM', 'KKTC', 'TBMM', 'ODTÜ', 'İTÜ', 'MYO', 'TV', 'CNC', 'PLC', 'İK'])

const buyukMu = (s: string) => s === s.toLocaleUpperCase('tr') && s !== s.toLocaleLowerCase('tr')

/** Tamamı büyük harfli adı Türkçe kurallarla düzeltir: “BİLGİSAYAR VE ÖĞRETİM TEKNOLOJİLERİ” → “Bilgisayar ve Öğretim Teknolojileri”. */
export function basHarfleriDuzelt(ad: string): string {
  if (!buyukMu(ad.replace(/[^\p{L}]/gu, ''))) return ad
  let ilk = true
  return ad
    .split(/(\s+|-|\/)/)
    .map((parca) => {
      if (!/\p{L}/u.test(parca)) return parca
      if (KISALTMALAR.has(parca)) {
        ilk = false
        return parca
      }
      const kucuk = parca.toLocaleLowerCase('tr')
      const sonuc = !ilk && KUCUK_KALAN.has(kucuk) ? kucuk : kucuk.charAt(0).toLocaleUpperCase('tr') + kucuk.slice(1)
      ilk = false
      return sonuc
    })
    .join('')
}

const bosluk = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Kurala uymayan resmî yazımlar (büyük harfli kaynaktan çıkarılamaz). Anahtar: normalleştirilmiş ham ad. */
const OZEL_YAZIMLAR: Record<string, string> = {
  [normallestir('BEZM-İ ÂLEM VAKIF ÜNİVERSİTESİ')]: 'Bezmiâlem Vakıf Üniversitesi',
}

/** “PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)” → “Pamukkale Üniversitesi”. Şehir veya kampüs eki parantezde ise atılır. */
export function universiteAdi(ham: string): string {
  const ad = bosluk(ham.replace(/\s*\([^)]*\)\s*$/, ''))
  return OZEL_YAZIMLAR[normallestir(ad)] ?? basHarfleriDuzelt(ad)
}

/** “Bilgisayar Mühendisliği (İngilizce) (Burslu)” → “Bilgisayar Mühendisliği”. Parantez içi bütün ekler atılır. */
export function bolumAdi(ham: string): string {
  const ad = bosluk(ham.replace(/\([^)]*\)/g, ' ').replace(/\s+[-–]\s+(İÖ|UÖ|AÖ)\s*$/i, ''))
  return basHarfleriDuzelt(ad)
}

export type AktarmaTuru = 'universite' | 'bolum' | 'diger'

const BASLIK_GIBI = /^(üniversite|universite|program|bölüm|bolum|ad|adı|adi|kod|sıra|no)(\s*(adı|adi|kodu))?$/i

/** Seçilen sütundaki değerleri temizler ve tekilleştirir. Başlık satırı ve boş hücreler atlanır. */
export function aktarmaAdlari(satirlar: string[][], sutun: number, tur: AktarmaTuru): string[] {
  const goruldu = new Set<string>()
  const sonuc: string[] = []
  for (const s of satirlar) {
    const ham = (s[sutun] ?? '').trim()
    if (!ham || BASLIK_GIBI.test(ham) || /^\d+$/.test(ham)) continue
    const ad = tur === 'universite' ? universiteAdi(ham) : tur === 'bolum' ? bolumAdi(ham) : basHarfleriDuzelt(bosluk(ham))
    if (ad.length < 2 || ad.length > 120) continue
    const anahtar = normallestir(ad)
    if (goruldu.has(anahtar)) continue
    goruldu.add(anahtar)
    sonuc.push(ad)
  }
  return sonuc.sort((a, b) => a.localeCompare(b, 'tr'))
}

/** Başlıklara bakarak sütun önerir (ör. “Üniversite Adı”, “Program Adı”). Bulamazsa -1. */
export function sutunOner(baslik: string[], tur: AktarmaTuru): number {
  const ara = tur === 'universite' ? /üniversite|universite|kurum/i : tur === 'bolum' ? /program|bölüm|bolum/i : /ad/i
  return baslik.findIndex((b) => ara.test(b) && !/kod/i.test(b))
}

/* ---------- Listeyle karşılaştırma ---------- */

export interface AktarmaSiniflamasi {
  /** Eklenecek adlar */
  yeni: string[]
  /** Listede (ad veya eş anlamlı olarak) zaten bulunan ad sayısı */
  zatenVar: number
  /** Listede aynı kökte başka bir yazımla bulunduğu için eklenmeyenler */
  benzer: Array<{ ad: string; listede: string }>
}

/** Adları mevcut listeyle karşılaştırır. Sunucu da betik de (scripts/liste-yukle.ts) aynı kuralı kullanır. */
export function aktarmaSiniflandir(adlar: string[], mevcut: Array<{ ad: string; esAnlamlilar?: Array<{ ad: string }> | null }>): AktarmaSiniflamasi {
  const tumAdlar = mevcut.flatMap((m) => [m.ad, ...(m.esAnlamlilar ?? []).map((e) => e.ad)])
  const { yeni, zatenVar } = mevcutlariAyir(adlar, tumAdlar)
  const listedeki = mevcut.map((m) => m.ad)
  const benzer: AktarmaSiniflamasi['benzer'] = []
  // Dosyanın kendi içindeki aynı kökteki yazımlar da bir kez alınır
  const eklenecek: string[] = []
  for (const o of yeni) {
    const b = benzerAdlar(o, [...listedeki, ...eklenecek]).find((x) => x.ayni)
    if (b) benzer.push({ ad: o, listede: b.ad })
    else eklenecek.push(o)
  }
  return { yeni: eklenecek, zatenVar: zatenVar.length, benzer }
}
