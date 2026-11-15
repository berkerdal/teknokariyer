/**
 * Yönetici özeti “Site trafiği” sekmesinin verisi (src/alan/trafik.ts). Geçmiş günler özet tablosundan, bugün ham
 * olaylardan gelir; böylece sayfa canlıdır. Kişisel veri yoktur.
 */
import type { Donem } from '@/alan/ozet'
import { degisim } from '@/alan/ozet'
import { trGunMetni } from '@/alan/tarih'
import { CIHAZ_ADI, KAYNAK_ADI, gunlukDizi, satirlariTopla, sayfaTuru, type Cihaz, type Kaynak, type OzetSatiri } from '@/alan/trafik'
import { parcaliBul } from '@/altyapi/parcali'
import { bugununOzeti } from '@/servisler/trafik'
import { payloadAl } from './payload'

type GunSatiri = OzetSatiri & { gun: string }

const topla = (s: OzetSatiri[], boyut: OzetSatiri['boyut']) => s.filter((x) => x.boyut === boyut)

export async function trafikVerisi(d: Donem) {
  const payload = await payloadAl()
  const simdi = new Date()
  const bugun = trGunMetni(simdi)
  const { docs } = await payload.find({
    collection: 'trafik-ozetleri',
    where: { and: [{ gun: { greater_than_equal: trGunMetni(d.oncekiBas) } }, { gun: { less_than: bugun } }] },
    limit: 200000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const tum: GunSatiri[] = [
    ...docs.map((x) => ({ gun: x.gun, boyut: x.boyut as OzetSatiri['boyut'], deger: x.deger, goruntuleme: x.goruntuleme, ziyaret: x.ziyaret })),
    ...(await bugununOzeti(payload, simdi)).map((x) => ({ ...x, gun: bugun })),
  ]
  const basGun = trGunMetni(d.bas)
  const donemde = satirlariTopla(tum.filter((x) => x.gun >= basGun))
  const once = satirlariTopla(tum.filter((x) => x.gun < basGun))
  const t = topla(donemde, 'toplam')[0] ?? { goruntuleme: 0, ziyaret: 0 }
  const o = topla(once, 'toplam')[0] ?? { goruntuleme: 0, ziyaret: 0 }
  const cihazlar = topla(donemde, 'cihaz')
  const mobil = cihazlar.find((c) => c.deger === 'mobil')?.ziyaret ?? 0

  // Sayfa adları: ilan ve firma kimliklerinden
  const yollar = topla(donemde, 'yol').sort((a, b) => b.goruntuleme - a.goruntuleme).slice(0, 15)
  const girisler = topla(donemde, 'giris-yolu').sort((a, b) => b.ziyaret - a.ziyaret).slice(0, 10)
  const turler = [...yollar, ...girisler].map((y) => sayfaTuru(y.deger))
  const ilanIdleri = [...new Set(turler.flatMap((x) => (x.tur === 'ilan' ? [x.id] : [])))]
  const sluglar = [...new Set(turler.flatMap((x) => (x.tur === 'firma' ? [x.slug] : [])))]
  const [ilanlar, firmalar] = await Promise.all([
    parcaliBul(ilanIdleri, (p) => payload.find({ collection: 'ilanlar', where: { id: { in: p } }, select: { pozisyonAdi: true }, limit: p.length, depth: 0, overrideAccess: true })),
    parcaliBul(sluglar, (p) => payload.find({ collection: 'firmalar', where: { slug: { in: p } }, select: { kisaAd: true, slug: true }, limit: p.length, depth: 0, overrideAccess: true })),
  ])
  const sayfaAdi = (yol: string) => {
    const s = sayfaTuru(yol)
    if (s.tur === 'ilan') {
      const ad = ilanlar.find((i) => i.id === s.id)?.pozisyonAdi ?? `İlan ${s.id}`
      return s.basvuru ? `Başvuru formu: ${ad}` : `İlan: ${ad}`
    }
    if (s.tur === 'firma') return `Firma: ${firmalar.find((f) => f.slug === s.slug)?.kisaAd ?? s.slug}`
    return s.ad
  }
  const bagli = (yol: string) => (yol.startsWith('/') && !yol.endsWith('/basvur') ? yol : null)

  return {
    ziyaret: t.ziyaret,
    goruntuleme: t.goruntuleme,
    ziyaretDegisim: degisim(t.ziyaret, o.ziyaret),
    goruntulemeDegisim: degisim(t.goruntuleme, o.goruntuleme),
    sayfaBasina: t.ziyaret ? Math.round((t.goruntuleme / t.ziyaret) * 10) / 10 : null,
    mobilOran: t.ziyaret ? Math.round((mobil / t.ziyaret) * 100) : null,
    trend: gunlukDizi(
      tum.filter((x) => x.boyut === 'toplam' && x.gun >= basGun),
      d,
      trGunMetni,
    ),
    kaynaklar: topla(donemde, 'kaynak')
      .sort((a, b) => b.ziyaret - a.ziyaret)
      .map((k) => ({ ad: KAYNAK_ADI[k.deger as Kaynak] ?? k.deger, n: k.ziyaret })),
    cihazlar: cihazlar.sort((a, b) => b.ziyaret - a.ziyaret).map((c) => ({ ad: CIHAZ_ADI[c.deger as Cihaz] ?? c.deger, n: c.ziyaret })),
    siteler: topla(donemde, 'site').sort((a, b) => b.ziyaret - a.ziyaret).slice(0, 10).map((s) => ({ ad: s.deger, n: s.ziyaret })),
    sayfalar: yollar.map((y) => ({ ad: sayfaAdi(y.deger), yol: bagli(y.deger), goruntuleme: y.goruntuleme, ziyaret: y.ziyaret })),
    girisSayfalari: girisler.map((y) => ({ ad: sayfaAdi(y.deger), yol: bagli(y.deger), ziyaret: y.ziyaret })),
  }
}
