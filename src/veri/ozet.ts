/**
 * Yönetici özeti verisi (K31). Bütün sayılar kayıtlardan hesaplanır; kişisel veri yalnızca sunucuda sayılmak için okunur
 * ve sayfaya yalnızca toplam olarak gider. 5'ten küçük gruplar gizlenir (`gruplariGizle`).
 * Yayın ortamında test firmaları ve ilanları sayılmaz; test ortamında örnek veri test firmalarından oluştuğu için sayılır.
 */
import { cache } from 'react'
import type { Firmalar, Ilanlar } from '@/payload-types'
import { ortam } from '@/altyapi/eposta'
import { kalanGun, type IlanDurumu } from '@/alan/ilan'
import { aralikta, degisim, dilimlereBol, gruplariGizle, huni, type Donem } from '@/alan/ozet'
import { normallestir } from '@/alan/metin'
import { payloadAl } from './payload'

const kimlik = (x: unknown) => Number(x && typeof x === 'object' ? (x as { id: number }).id : x)

export interface OzetIlan {
  id: number
  pozisyonAdi: string
  firma: string
  firmaId: number
  durum: IlanDurumu
  tur: string
  yayinTarihi: string | null
  kalan: number | null
  goruntulenme: number
  basvuru: number
  yeni: number
  donemBasvuru: number
  sonBasvuruAni: string | null
}

export const ozetVerisi = cache(async (d: Donem) => {
  const payload = await payloadAl()
  const yayin = ortam() === 'yayin'
  const tum = <T,>(r: { docs: T[] }) => r.docs
  const [firmalar, ilanlar, basvurular, adaylarSimdi, adaylarOnce, havuz, onayda] = await Promise.all([
    payload.find({ collection: 'firmalar', select: { kisaAd: true, testFirmasi: true, asama: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true }).then(tum),
    payload
      .find({
        collection: 'ilanlar',
        where: { durum: { not_equals: 'taslak' } },
        select: { pozisyonAdi: true, firma: true, durum: true, tur: true, yayinTarihi: true, sonBasvuru: true, goruntulenme: true, zorunluBeceriler: true },
        limit: 50000,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      .then(tum),
    payload
      .find({ collection: 'basvurular', select: { ilan: true, firma: true, durum: true, kaynak: true, profilKopyasi: true, createdAt: true }, limit: 200000, pagination: false, depth: 0, overrideAccess: true })
      .then(tum),
    payload.count({ collection: 'kullanicilar', where: { and: [{ rol: { equals: 'aday' } }, { createdAt: { greater_than_equal: d.bas.toISOString() } }] }, overrideAccess: true }),
    payload.count({ collection: 'kullanicilar', where: { and: [{ rol: { equals: 'aday' } }, { createdAt: { greater_than_equal: d.oncekiBas.toISOString() } }, { createdAt: { less_than: d.bas.toISOString() } }] }, overrideAccess: true }),
    payload.find({ collection: 'adaylar', where: { 'havuz.gorunurluk': { not_equals: 'gizli' } }, select: { beceriler: true }, limit: 100000, pagination: false, depth: 0, overrideAccess: true }).then(tum),
    payload.count({ collection: 'ilanlar', where: { durum: { equals: 'onayda' } }, overrideAccess: true }),
  ])
  const firmaHaritasi = new Map((firmalar as Firmalar[]).map((f) => [f.id, f]))
  const sayilir = (firmaId: number) => !yayin || !firmaHaritasi.get(firmaId)?.testFirmasi
  const ilanListesi = (ilanlar as Ilanlar[]).filter((i) => sayilir(kimlik(i.firma)))
  const ilanIdleri = new Set(ilanListesi.map((i) => i.id))
  const bListesi = basvurular.filter((b) => ilanIdleri.has(kimlik(b.ilan)))
  const donemde = bListesi.filter((b) => aralikta(b.createdAt, d.bas, d.bit))
  const oncekiDonemde = bListesi.filter((b) => aralikta(b.createdAt, d.oncekiBas, d.bas))
  const simdi = new Date()

  // İlan tablosu
  const ilanBasvuru = new Map<number, { toplam: number; yeni: number; donem: number; son: string | null }>()
  for (const b of bListesi) {
    if (b.durum === 'geri-cekti') continue
    const id = kimlik(b.ilan)
    const s = ilanBasvuru.get(id) ?? { toplam: 0, yeni: 0, donem: 0, son: null }
    s.toplam++
    if (b.durum === 'alindi') s.yeni++
    if (aralikta(b.createdAt, d.bas, d.bit)) s.donem++
    if (!s.son || b.createdAt > s.son) s.son = b.createdAt
    ilanBasvuru.set(id, s)
  }
  const tablo: OzetIlan[] = ilanListesi.map((i) => {
    const s = ilanBasvuru.get(i.id)
    const durum = i.durum as IlanDurumu
    return {
      id: i.id,
      pozisyonAdi: i.pozisyonAdi,
      firma: firmaHaritasi.get(kimlik(i.firma))?.kisaAd ?? '',
      firmaId: kimlik(i.firma),
      durum,
      tur: i.tur ?? '',
      yayinTarihi: i.yayinTarihi ?? null,
      kalan: ['yayinda', 'duraklatildi'].includes(durum) && i.sonBasvuru ? kalanGun(new Date(i.sonBasvuru), simdi) : null,
      goruntulenme: i.goruntulenme ?? 0,
      basvuru: s?.toplam ?? 0,
      yeni: s?.yeni ?? 0,
      donemBasvuru: s?.donem ?? 0,
      sonBasvuruAni: s?.son ?? null,
    }
  })

  // Üst şerit
  const yayindaki = tablo.filter((i) => i.durum === 'yayinda')
  const ilanVerenFirma = new Set(ilanListesi.filter((i) => aralikta(i.yayinTarihi, d.bas, d.bit) || i.durum === 'yayinda').map((i) => kimlik(i.firma))).size
  const serit = {
    yayindakiIlan: yayindaki.length,
    donemBasvuru: donemde.filter((b) => b.durum !== 'geri-cekti').length,
    basvuruDegisim: degisim(donemde.filter((b) => b.durum !== 'geri-cekti').length, oncekiDonemde.filter((b) => b.durum !== 'geri-cekti').length),
    yeniAday: adaylarSimdi.totalDocs,
    adayDegisim: degisim(adaylarSimdi.totalDocs, adaylarOnce.totalDocs),
    ilanVerenFirma,
    onaydaIlan: onayda.totalDocs,
  }

  // Trend (iki ayrı grafik; tek eksen kuralı)
  const basvuruTrendi = dilimlereBol(donemde.filter((b) => b.durum !== 'geri-cekti').map((b) => b.createdAt), d)
  const ilanTrendi = dilimlereBol(ilanListesi.map((i) => i.yayinTarihi), d)

  // Sonuç hunisi: dönemde gelen başvurular
  const sonuc = huni(donemde.map((b) => String(b.durum)))

  // Aday kaynakları (dönemde başvuranlar; 5'ten küçük gruplar gizli)
  const okul = new Map<string, number>()
  const bolum = new Map<string, number>()
  const kanal = new Map<string, number>()
  const KANAL_ADI: Record<string, string> = { portal: 'Portal içinden', linkedin: 'LinkedIn paylaşımı', google: 'Google', dogrudan: 'Doğrudan bağlantı' }
  let pau = 0
  let okulBilinen = 0
  for (const b of donemde) {
    if (b.durum === 'geri-cekti') continue
    const p = (b.profilKopyasi ?? {}) as { okul?: string | null; bolum?: string | null; anonim?: boolean }
    if (p.okul) {
      okul.set(p.okul, (okul.get(p.okul) ?? 0) + 1)
      okulBilinen++
      if (normallestir(p.okul).includes('pamukkale')) pau++
    }
    if (p.bolum) bolum.set(p.bolum, (bolum.get(p.bolum) ?? 0) + 1)
    const k = KANAL_ADI[String(b.kaynak ?? 'portal')] ?? 'Diğer'
    kanal.set(k, (kanal.get(k) ?? 0) + 1)
  }

  // Yetenek ihtiyacı: yayındaki ilanlarda zorunlu beceri ↔ havuzdaki aday
  const talep = new Map<number, number>()
  for (const i of ilanListesi.filter((x) => x.durum === 'yayinda')) for (const b of i.zorunluBeceriler ?? []) talep.set(kimlik(b), (talep.get(kimlik(b)) ?? 0) + 1)
  const arz = new Map<number, number>()
  for (const a of havuz) for (const b of a.beceriler ?? []) arz.set(kimlik(b.beceri), (arz.get(kimlik(b.beceri)) ?? 0) + 1)
  const beceriAdlari = talep.size
    ? new Map(
        (await payload.find({ collection: 'taksonomiler', where: { id: { in: [...talep.keys()] } }, select: { ad: true }, limit: 1000, depth: 0, overrideAccess: true })).docs.map((t) => [t.id, t.ad]),
      )
    : new Map<number, string>()
  const yetenek = [...talep.entries()]
    .map(([id, ilan]) => ({ ad: beceriAdlari.get(id) ?? '', ilan, aday: arz.get(id) ?? 0 }))
    .map((x) => ({ ...x, oran: x.ilan ? x.aday / x.ilan : 0 }))
    .sort((a, b) => a.oran - b.oran || b.ilan - a.ilan)
    .slice(0, 12)

  // Firmalar: dönemde en çok başvuru alanlar ve hiç ilan vermeyenler
  const firmaBasvuru = new Map<number, number>()
  for (const b of donemde) if (b.durum !== 'geri-cekti') firmaBasvuru.set(kimlik(b.firma), (firmaBasvuru.get(kimlik(b.firma)) ?? 0) + 1)
  const firmaIlan = new Map<number, number>()
  for (const i of yayindaki) firmaIlan.set(i.firmaId, (firmaIlan.get(i.firmaId) ?? 0) + 1)
  const ilanVermisFirma = new Set(ilanListesi.filter((i) => i.yayinTarihi).map((i) => kimlik(i.firma)))
  const etkinFirmalar = (firmalar as Firmalar[]).filter((f) => f.asama !== 'pasif' && sayilir(f.id))
  const firmaTablosu = etkinFirmalar
    .filter((f) => firmaIlan.get(f.id) || firmaBasvuru.get(f.id))
    .map((f) => ({ id: f.id, ad: f.kisaAd, yayinda: firmaIlan.get(f.id) ?? 0, basvuru: firmaBasvuru.get(f.id) ?? 0 }))
    .sort((a, b) => b.basvuru - a.basvuru || b.yayinda - a.yayinda)
  const ilanVermeyen = etkinFirmalar.filter((f) => !ilanVermisFirma.has(f.id)).length

  return {
    serit,
    basvuruTrendi,
    ilanTrendi,
    tablo,
    sonuc,
    kaynak: {
      okul: gruplariGizle(okul),
      bolum: gruplariGizle(bolum),
      kanal: gruplariGizle(kanal, 6),
      pauOrani: okulBilinen >= 5 ? Math.round((pau / okulBilinen) * 100) : null,
      okulBilinen,
    },
    yetenek,
    firmalar: { tablo: firmaTablosu.slice(0, 15), etkin: etkinFirmalar.length, ilanVermeyen, ilanVeren: etkinFirmalar.length - ilanVermeyen },
  }
})
