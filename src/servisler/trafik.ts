/**
 * Çerezsiz site trafiği (talimatlar 9; kurallar src/alan/trafik.ts). Her sayfa açılışı bir ham olay olarak yazılır;
 * gece işi biten günlerin olaylarını boyut boyut özetler ve ham olayları siler. Kişisel veri yoktur.
 */
import type { Payload } from 'payload'
import { trGunMetni } from '@/alan/tarih'
import { cihazSiniflandir, kaynakSiniflandir, olaylariOzetle, yolNormallestir, type Kaynak, type OzetSatiri, type TrafikOlayi } from '@/alan/trafik'

/** Günde yol ve giriş sayfası başına en fazla bu kadar satır; gerisi “(diğer sayfalar)” olarak toplanır. */
const EN_COK_YOL = 300

export interface OlayGirdisi {
  yol: string
  yonlendiren: string
  isaret?: string | null
  ua: string | null
  kendiSite: string
}

/** Olayı yazar; ölçülmeyen yol veya bot ise false. */
export async function olayKaydet(payload: Payload, g: OlayGirdisi, simdi = new Date()): Promise<boolean> {
  const yol = yolNormallestir(g.yol)
  const cihaz = cihazSiniflandir(g.ua)
  if (!yol || !cihaz) return false
  const { kaynak, site } = kaynakSiniflandir(g.yonlendiren, g.kendiSite, g.isaret)
  await payload.create({
    collection: 'trafik-olaylari',
    data: { gun: trGunMetni(simdi), yol, kaynak, kaynakSite: site, cihaz, giris: kaynak !== 'ic' },
    overrideAccess: true,
  })
  return true
}

const olayaCevir = (d: { yol: string; kaynak: string; kaynakSite?: string | null; cihaz: string; giris?: boolean | null }): TrafikOlayi => ({
  yol: d.yol,
  kaynak: d.kaynak as Kaynak,
  kaynakSite: d.kaynakSite,
  cihaz: d.cihaz as TrafikOlayi['cihaz'],
  giris: Boolean(d.giris),
})

/** Çok sayıda farklı sayfa olduğunda küçük olanları tek satırda toplar. */
function kirp(satirlar: OzetSatiri[]): OzetSatiri[] {
  const sonuc: OzetSatiri[] = []
  for (const boyut of ['yol', 'giris-yolu', 'site'] as const) {
    const grup = satirlar.filter((s) => s.boyut === boyut).sort((a, b) => b.goruntuleme - a.goruntuleme)
    sonuc.push(...grup.slice(0, EN_COK_YOL))
    const kalan = grup.slice(EN_COK_YOL)
    if (kalan.length)
      sonuc.push({ boyut, deger: '(diğer)', goruntuleme: kalan.reduce((t, s) => t + s.goruntuleme, 0), ziyaret: kalan.reduce((t, s) => t + s.ziyaret, 0) })
  }
  return [...satirlar.filter((s) => !['yol', 'giris-yolu', 'site'].includes(s.boyut)), ...sonuc]
}

/** Bugünün (henüz özetlenmemiş) olaylarının özeti; pano canlı görünsün diye. */
export async function bugununOzeti(payload: Payload, simdi = new Date()): Promise<OzetSatiri[]> {
  const { docs } = await payload.find({ collection: 'trafik-olaylari', where: { gun: { equals: trGunMetni(simdi) } }, limit: 100000, pagination: false, depth: 0, overrideAccess: true })
  return olaylariOzetle(docs.map(olayaCevir))
}

/**
 * Biten günlerin ham olaylarını özetler, özet satırlarını yazar (varsa üstüne ekler) ve ham olayları siler.
 * Dönen değer özetlenen olay sayısıdır.
 */
export async function trafikOzetle(payload: Payload, simdi = new Date()): Promise<number> {
  const bugun = trGunMetni(simdi)
  let toplam = 0
  for (let tur = 0; tur < 60; tur++) {
    const ilk = await payload.find({ collection: 'trafik-olaylari', where: { gun: { less_than: bugun } }, sort: 'gun', limit: 1, depth: 0, overrideAccess: true })
    const gun = ilk.docs[0]?.gun
    if (!gun) break
    const { docs } = await payload.find({ collection: 'trafik-olaylari', where: { gun: { equals: gun } }, limit: 100000, pagination: false, depth: 0, overrideAccess: true })
    const satirlar = kirp(olaylariOzetle(docs.map(olayaCevir)))
    const { docs: mevcut } = await payload.find({ collection: 'trafik-ozetleri', where: { gun: { equals: gun } }, limit: 10000, pagination: false, depth: 0, overrideAccess: true })
    for (const s of satirlar) {
      const m = mevcut.find((x) => x.boyut === s.boyut && x.deger === s.deger)
      if (m) await payload.update({ collection: 'trafik-ozetleri', id: m.id, data: { goruntuleme: m.goruntuleme + s.goruntuleme, ziyaret: m.ziyaret + s.ziyaret }, overrideAccess: true })
      else await payload.create({ collection: 'trafik-ozetleri', data: { gun, ...s }, overrideAccess: true })
    }
    // Tek sorguyla (kancasız): binlerce olay tek tek silinmez.
    await payload.db.deleteMany({ collection: 'trafik-olaylari', where: { gun: { equals: gun } } })
    toplam += docs.length
  }
  return toplam
}
