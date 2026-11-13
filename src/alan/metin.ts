/**
 * Türkçe metin yardımcıları: karaktere duyarsız arama ve ünlü uyumuna uygun ekler.
 * Saf fonksiyonlar; veritabanından bağımsız (talimatlar 8: "yazilim" = "yazılım").
 */

const DONUSUM: Record<string, string> = { ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u' }

/** Aramada kullanılacak biçim: Türkçe küçük harf, aksansız, tek boşluk. "İŞ Güvenliği" → "is guvenligi" */
export function normallestir(metin: string): string {
  return metin
    .toLocaleLowerCase('tr')
    .normalize('NFC')
    .replace(/[ışğüöçâîû]/g, (h) => DONUSUM[h] ?? h)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // birleşik aksan işaretleri (ör. "i̇" içindeki nokta)
    .replace(/[^\p{L}\p{N}+#.]+/gu, ' ') // C++, C#, Node.js gibi adlar korunsun
    .replace(/\s+/g, ' ')
    .trim()
}

/** Bir kaydın aranabilir metni: alanlar normalleştirilip birleştirilir ve veritabanında ayrı bir sütunda saklanır. */
export function aramaMetni(alanlar: Array<string | null | undefined | string[]>): string {
  return normallestir(
    alanlar
      .flat()
      .filter((a): a is string => typeof a === 'string' && a.length > 0)
      .join(' '),
  )
}

/** Sorgudaki her kelime aranabilir metinde geçiyorsa eşleşir. Boş sorgu her şeye uyar. */
export function aramayaUyar(sorgu: string, aranabilir: string): boolean {
  const kelimeler = normallestir(sorgu).split(' ').filter(Boolean)
  return kelimeler.every((k) => aranabilir.includes(k))
}

const UNLULER = 'aeıioöuü'
const KALIN = 'aıou'

/**
 * Yönelme eki “’a / ’e / ’ya / ’ye” (“12 Aralık’a”, “Kodpit’e”, “Netinternet’e”).
 * Kısaltma ve sayı okunuşları kapsam dışı; yalnızca sözcükle biten adlar için.
 */
export function yonelmeEki(sozcuk: string): string {
  const son = sozcuk.trim().split(/\s+/).pop()?.toLocaleLowerCase('tr') ?? ''
  const unluler = [...son].filter((h) => UNLULER.includes(h))
  const sonUnlu = unluler[unluler.length - 1] ?? 'a'
  const kaynastirma = UNLULER.includes(son.at(-1) ?? '') ? 'y' : ''
  return `’${kaynastirma}${KALIN.includes(sonUnlu) ? 'a' : 'e'}`
}

/**
 * Sayıdan sonra gelen iyelik/belirtme eki: “4 becerinin 3’ü”, “10’u”, “100’ü”, “1000’i”.
 * Ek, sayının okunuşundaki son sözcüğe göre seçilir (üç → ü, on → u, yüz → ü, bin → i, milyon → u).
 */
export function sayiIyelikEki(sayi: number): string {
  const n = Math.abs(Math.trunc(sayi))
  const BIRLER = ['ı', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u'] // sıfır, bir, iki, üç, dört, beş, altı, yedi, sekiz, dokuz
  const ONLAR: Record<number, string> = { 1: 'u', 2: 'si', 3: 'u', 4: 'ı', 5: 'si', 6: 'ı', 7: 'i', 8: 'i', 9: 'ı' } // on, yirmi, otuz…
  if (n === 0) return '’ı'
  if (n % 10 !== 0) return `’${BIRLER[n % 10]}`
  if (n % 100 !== 0) return `’${ONLAR[(n % 100) / 10]}`
  if (n % 1000 !== 0) return '’ü' // yüz
  if (n % 1_000_000 !== 0) return '’i' // bin
  return '’u' // milyon
}
