/**
 * Yüklenen logonun çevresindeki boşluğu kırpar (kural: src/alan/logoKirpma.ts). Saf JavaScript çözücülerle çalışır;
 * Cloudflare Worker'da ve Node sunucusunda aynıdır (K2).
 * - PNG ve JPEG çözülür; sonuç her zaman kayıpsız PNG'dir (saydamlık korunur).
 * - WebP için saf JavaScript çözücü yok: WebP olduğu gibi saklanır.
 * - Çözülemeyen, kırpmaya gerek olmayan veya kırpınca büyüyüp sınırı aşan dosya değiştirilmez.
 */
import * as upngModulu from '@pdf-lib/upng'
import { decode as jpegCoz } from 'jpeg-js'
import { kes, kirpmaKutusu } from '@/alan/logoKirpma'

export type GorselTuru = 'image/png' | 'image/jpeg' | 'image/webp'
export interface KirpmaSonucu {
  veri: Uint8Array
  tur: GorselTuru
  kirpildi: boolean
  once?: { w: number; h: number }
  sonra?: { w: number; h: number }
}

// Paket ESM'de varsayılan dışa aktarım olarak, CommonJS'te bir veya iki kat `default` içinde gelir (Node betikleri);
// `decode` taşıyan nesne bulunur.
type Upng = typeof upngModulu
const UPNG: Upng = (() => {
  let x = upngModulu as unknown as { decode?: unknown; default?: unknown }
  for (let i = 0; i < 3 && x && typeof x.decode !== 'function'; i++) x = x.default as typeof x
  return x as unknown as Upng
})()

/** En çok bu kadar piksel çözülür (aşırı büyük görselle sunucuyu yormamak için); fazlası kırpılmadan saklanır. */
const EN_COK_PIKSEL = 4_000_000

function coz(veri: Uint8Array, tur: GorselTuru): { p: Uint8Array; w: number; h: number } | null {
  if (tur === 'image/png') {
    const img = UPNG.decode(veri.buffer.slice(veri.byteOffset, veri.byteOffset + veri.byteLength) as ArrayBuffer)
    if (img.width * img.height > EN_COK_PIKSEL) return null
    return { p: new Uint8Array(UPNG.toRGBA8(img)[0]!), w: img.width, h: img.height }
  }
  if (tur === 'image/jpeg') {
    const img = jpegCoz(veri, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: EN_COK_PIKSEL / 1_000_000, tolerantDecoding: true })
    return { p: img.data, w: img.width, h: img.height }
  }
  return null
}

export function logoyuKirp(veri: Uint8Array, tur: GorselTuru, enBuyuk = Infinity): KirpmaSonucu {
  let cozulen: ReturnType<typeof coz>
  try {
    cozulen = coz(veri, tur)
  } catch {
    return { veri, tur, kirpildi: false }
  }
  if (!cozulen) return { veri, tur, kirpildi: false }
  const { p, w, h } = cozulen
  const k = kirpmaKutusu(p, w, h)
  if (!k) return { veri, tur, kirpildi: false }
  const png = new Uint8Array(UPNG.encode([kes(p, w, k).buffer as ArrayBuffer], k.w, k.h, 0))
  if (png.byteLength > enBuyuk) return { veri, tur, kirpildi: false }
  return { veri: png, tur: 'image/png', kirpildi: true, once: { w, h }, sonra: { w: k.w, h: k.h } }
}
