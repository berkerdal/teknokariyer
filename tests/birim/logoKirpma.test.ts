import { describe, expect, it } from 'vitest'
import UPNG from '@pdf-lib/upng'
import { encode as jpegYaz } from 'jpeg-js'
import { kirpmaKutusu, zeminBosMu } from '@/alan/logoKirpma'
import { logoyuKirp } from '@/altyapi/logoKirp'

/** w×h beyaz (veya verilen zemin) görsel; [x,y,w,h] dikdörtgeni lacivert. */
function gorsel(w: number, h: number, dolu: [number, number, number, number], zemin = [255, 255, 255, 255]) {
  const p = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) p.set(zemin, i * 4)
  const [x0, y0, dw, dh] = dolu
  for (let y = y0; y < y0 + dh; y++) for (let x = x0; x < x0 + dw; x++) p.set([33, 85, 173, 255], (y * w + x) * 4)
  return p
}
const png = (p: Uint8Array, w: number, h: number) => new Uint8Array(UPNG.encode([p.buffer as ArrayBuffer], w, h, 0))

describe('logo kırpma kuralı', () => {
  it('beyaz boşluğun ortasındaki şeridi nefes payıyla keser', () => {
    // 320×320 içinde 300×70'lik şerit (Netinternet gibi)
    const k = kirpmaKutusu(gorsel(320, 320, [10, 125, 300, 70]), 320, 320)
    expect(k).toEqual({ x: 0, y: 113, w: 320, h: 94 }) // pay: 300 × %4 = 12 px; görselin dışına taşmaz
  })
  it('saydam zemin de boş sayılır', () => {
    const k = kirpmaKutusu(gorsel(200, 200, [50, 80, 100, 40], [0, 0, 0, 0]), 200, 200)
    expect(k).toEqual({ x: 46, y: 76, w: 108, h: 48 })
  })
  it('renkli plakalı logo, boş görsel ve küçük kazanç kırpılmaz', () => {
    const plaka = gorsel(100, 100, [20, 40, 60, 20], [185, 6, 6, 255])
    expect(zeminBosMu(plaka, 100, 100)).toBe(false)
    expect(kirpmaKutusu(plaka, 100, 100)).toBeNull()
    expect(kirpmaKutusu(gorsel(50, 50, [0, 0, 0, 0]), 50, 50)).toBeNull()
    expect(kirpmaKutusu(gorsel(100, 100, [2, 2, 96, 96]), 100, 100)).toBeNull()
  })
})

describe('yüklemede kırpma (PNG ve JPEG)', () => {
  it('PNG kırpılır ve PNG olarak döner', () => {
    const r = logoyuKirp(png(gorsel(400, 400, [40, 180, 320, 40]), 400, 400), 'image/png')
    expect(r).toMatchObject({ kirpildi: true, tur: 'image/png', once: { w: 400, h: 400 } })
    const img = UPNG.decode(r.veri.buffer.slice(r.veri.byteOffset, r.veri.byteOffset + r.veri.byteLength) as ArrayBuffer)
    expect([img.width, img.height]).toEqual([r.sonra!.w, r.sonra!.h])
    expect(r.sonra!.h).toBeLessThan(80)
  })
  it('JPEG kırpılır ve kayıpsız PNG olur', () => {
    const p = gorsel(300, 300, [30, 120, 240, 60])
    const jpeg = new Uint8Array(jpegYaz({ data: p, width: 300, height: 300 }, 95).data)
    const r = logoyuKirp(jpeg, 'image/jpeg')
    expect(r.kirpildi).toBe(true)
    expect(r.tur).toBe('image/png')
    expect(r.sonra!.h).toBeLessThan(100)
  })
  it('WebP, bozuk dosya ve sınırı aşan sonuç olduğu gibi kalır', () => {
    const webp = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])
    expect(logoyuKirp(webp, 'image/webp')).toMatchObject({ kirpildi: false, tur: 'image/webp' })
    const bozuk = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
    expect(logoyuKirp(bozuk, 'image/png')).toMatchObject({ kirpildi: false, veri: bozuk })
    const kaynak = png(gorsel(400, 400, [40, 180, 320, 40]), 400, 400)
    expect(logoyuKirp(kaynak, 'image/png', 10).kirpildi).toBe(false)
  })
})
