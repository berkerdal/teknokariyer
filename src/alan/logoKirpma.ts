/**
 * Logo kırpma kuralı (kullanıcı kararı, 15.11.2026: “boşluğu kırpılmış logo”). Firmaların gönderdiği logo dosyalarının
 * çoğunda logo, geniş beyaz veya saydam bir alanın ortasında küçük bir şerit; 48 piksellik kutuya sığdırılınca okunmuyor.
 * Saf fonksiyonlar: RGBA piksellerinde boş alanın (beyaz veya saydam) dışındaki kutuyu bulur.
 * - Kenarları boş olmayan logolar (renkli plaka üstündeki logo: Argeplus, Bulutfon) kırpılmaz.
 * - Çok küçük kazançta (her iki yönde %4'ten az) kırpılmaz; tamamen boş görselde kırpılmaz.
 * - Kırpılan logonun çevresinde uzun kenarın %4'ü kadar (en az 2 px) nefes payı bırakılır.
 */
export interface Kutu {
  x: number
  y: number
  w: number
  h: number
}

/** Beyaza çok yakın (her kanal ≥ 240) veya neredeyse saydam (alfa < 16) piksel boş sayılır. */
export const bosMu = (r: number, g: number, b: number, a: number) => a < 16 || (r >= 240 && g >= 240 && b >= 240)

/** Dış çerçevedeki piksellerin en az %90'ı boşsa logo boş bir zeminin üstündedir. */
export function zeminBosMu(p: Uint8Array, w: number, h: number): boolean {
  let bos = 0
  let toplam = 0
  const bak = (x: number, y: number) => {
    const i = (y * w + x) * 4
    toplam++
    if (bosMu(p[i]!, p[i + 1]!, p[i + 2]!, p[i + 3]!)) bos++
  }
  for (let x = 0; x < w; x++) {
    bak(x, 0)
    if (h > 1) bak(x, h - 1)
  }
  for (let y = 1; y < h - 1; y++) {
    bak(0, y)
    if (w > 1) bak(w - 1, y)
  }
  return toplam > 0 && bos / toplam >= 0.9
}

/** Boş olmayan piksellerin kutusu; görsel tamamen boşsa null. */
export function doluKutu(p: Uint8Array, w: number, h: number): Kutu | null {
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (bosMu(p[i]!, p[i + 1]!, p[i + 2]!, p[i + 3]!)) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/** Kırpılacak kutu (nefes payıyla, görselin içinde kalır); kırpmaya gerek yoksa null. */
export function kirpmaKutusu(p: Uint8Array, w: number, h: number): Kutu | null {
  if (w < 4 || h < 4 || !zeminBosMu(p, w, h)) return null
  const k = doluKutu(p, w, h)
  if (!k) return null
  const pay = Math.max(2, Math.round(Math.max(k.w, k.h) * 0.04))
  const x = Math.max(0, k.x - pay)
  const y = Math.max(0, k.y - pay)
  const sonuc = { x, y, w: Math.min(w, k.x + k.w + pay) - x, h: Math.min(h, k.y + k.h + pay) - y }
  // Kazanç küçükse dosyaya dokunulmaz
  if (sonuc.w > w * 0.96 && sonuc.h > h * 0.96) return null
  return sonuc
}

/** RGBA dizisinden kutuyu keser. */
export function kes(p: Uint8Array, w: number, k: Kutu): Uint8Array {
  const out = new Uint8Array(k.w * k.h * 4)
  for (let y = 0; y < k.h; y++) out.set(p.subarray(((k.y + y) * w + k.x) * 4, ((k.y + y) * w + k.x + k.w) * 4), y * k.w * 4)
  return out
}
