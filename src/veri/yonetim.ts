/**
 * Yönetici A.Ş. paneli verisi (yalnızca sunucuda). Kuyruklar kayıtlardan hesaplanır; sayılar elle yazılmaz.
 * Okumalar kurum kullanıcısının yetkisiyle yapılır (kurum her firmayı görür).
 */
import { cache } from 'react'
import type { Firmalar, Ilanlar, Talepler } from '@/payload-types'
import { kurumKullanicisiMi } from '@/erisim'
import { ilanTara, type TaramaBulgusu } from '@/alan/moderasyon'
import { kalanGun, VARSAYILAN_ONAYLI_ILAN_SAYISI } from '@/alan/ilan'
import { ESASLI_ALANLAR, ESASLI_ALAN_ADI, type EsasliAlan } from '@/alan/ilan'
import { yaz } from '@/alan/ilanGecmisi'
import { TALEP_TUR_ADI, benzerAdlar, talepKaynagi, type BenzerAd } from '@/alan/talep'
import { tarihYaz } from '@/arayuz/bicim'
import type { BekleyenDegisiklik } from '@/servisler/ilanFormu'
import type { Kullanici } from '@/servisler/ortak'
import { HATIRLATMA_ISLEMI } from '@/servisler/moderasyon'
import { oturum, payloadAl } from './payload'

export async function yonetimOturumu(donus = '/yonetim'): Promise<Kullanici> {
  const { redirect } = await import('next/navigation')
  const { rolAnaSayfasi } = await import('./cerez')
  const k = await oturum()
  if (!k) redirect(`/giris?donus=${encodeURIComponent(donus)}`)
  if (!kurumKullanicisiMi(k)) redirect(rolAnaSayfasi(String(k.rol)))
  return k
}

const firmaNesnesi = (x: unknown): Firmalar | null => (x && typeof x === 'object' ? (x as Firmalar) : null)

/** Geçen süreyi kısa ve okunur yazar: “45 dakika”, “5 saat”, “1 gün 2 saat”. */
export function beklemeMetni(iso: string, simdi = new Date()): string {
  const dk = Math.max(0, Math.floor((simdi.getTime() - new Date(iso).getTime()) / 60_000))
  if (dk < 60) return `${Math.max(1, dk)} dakika`
  const saat = Math.floor(dk / 60)
  if (saat < 24) return `${saat} saat`
  const gun = Math.floor(saat / 24)
  const kalan = saat % 24
  return kalan ? `${gun} gün ${kalan} saat` : `${gun} gün`
}

/** Hedef onay süresi 1 iş günü; hafta sonu sayılmadan geçen saat (yaklaşık, Türkiye günü). */
export function isSaati(iso: string, simdi = new Date()): number {
  let t = new Date(iso).getTime()
  const son = simdi.getTime()
  let saat = 0
  while (t < son) {
    const gun = new Date(t + 3 * 3_600_000).getUTCDay() // Türkiye saati
    const adim = Math.min(3_600_000, son - t)
    if (gun !== 0 && gun !== 6) saat += adim / 3_600_000
    t += adim
  }
  return saat
}

export const kurumKurallari = cache(async () => {
  const payload = await payloadAl()
  const a = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
  return { onayliIlanSayisi: a.onayliIlanSayisi ?? VARSAYILAN_ONAYLI_ILAN_SAYISI }
})

export interface OnayKaydi {
  id: number
  pozisyonAdi: string
  firma: { id: number; ad: string; konum: string; guvenilir: boolean; onayli: number }
  /** Firmanın kaçıncı onaylı ilanı olacak */
  kacinci: number
  gonderim: string
  bekleme: string
  gecikti: boolean
  uyari: number
  /** Daha önce düzeltme istenip yeniden gönderilmiş mi */
  duzeltilmis: boolean
}

const TARANACAK = (i: Ilanlar) => ({
  pozisyonAdi: i.pozisyonAdi,
  isTanimi: i.isTanimi,
  nitelikler: i.nitelikler,
  sorular: (i.onElemeSorulari ?? []).map((s) => s.soru),
})

/** Onay kuyruğu: en uzun bekleyen önce. Gönderim anı, ilanın onaya girdiği son güncellemedir. */
export const onayKuyrugu = cache(async (): Promise<OnayKaydi[]> => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { durum: { equals: 'onayda' } },
    sort: 'updatedAt',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    populate: { firmalar: { kisaAd: true, konum: true, guvenilir: true, onaylanmisIlanSayisi: true } },
  })
  const simdi = new Date()
  return docs.map((i) => {
    const f = firmaNesnesi(i.firma)
    const onayli = f?.onaylanmisIlanSayisi ?? 0
    return {
      id: i.id,
      pozisyonAdi: i.pozisyonAdi,
      firma: { id: f?.id ?? 0, ad: f?.kisaAd ?? 'Bilinmeyen firma', konum: f?.konum ?? '', guvenilir: Boolean(f?.guvenilir), onayli },
      kacinci: onayli + 1,
      gonderim: i.updatedAt,
      bekleme: beklemeMetni(i.updatedAt, simdi),
      gecikti: isSaati(i.updatedAt, simdi) > 24,
      uyari: ilanTara(TARANACAK(i)).filter((b) => b.tur === 'uyari').length,
      duzeltilmis: Boolean(i.duzeltmeGerekcesi),
    }
  })
})

export interface OnayAyrintisi {
  ilan: Ilanlar
  firma: Firmalar
  tarama: TaramaBulgusu[]
  kural: number
}

export async function onayAyrintisi(id: number): Promise<OnayAyrintisi | null> {
  if (!Number.isInteger(id) || id <= 0) return null
  const payload = await payloadAl()
  const ilan = await payload
    .findByID({ collection: 'ilanlar', id, depth: 1, overrideAccess: true, populate: { taksonomiler: { ad: true } } })
    .catch((): null => null)
  if (!ilan) return null
  const firmaId = typeof ilan.firma === 'object' ? ilan.firma.id : ilan.firma
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 1, overrideAccess: true })
  const { onayliIlanSayisi } = await kurumKurallari()
  return { ilan, firma, tarama: ilanTara(TARANACAK(ilan)), kural: onayliIlanSayisi }
}

/* ---------- Bekleyen esaslı değişiklikler ---------- */

export interface DegisiklikKaydi {
  id: number
  pozisyonAdi: string
  firma: string
  bekleme: string
  tarih: string
  farklar: Array<{ alan: string; ad: string; once: string; sonra: string }>
}

const tl = (n: unknown) => (typeof n === 'number' ? `${new Intl.NumberFormat('tr-TR').format(n)} ₺` : 'boş')

export const bekleyenDegisiklikler = cache(async (): Promise<DegisiklikKaydi[]> => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { durum: { in: ['yayinda', 'duraklatildi'] } },
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    populate: { firmalar: { kisaAd: true } },
  })
  const simdi = new Date()
  return docs
    .flatMap((i) => {
      const b = i.bekleyenDegisiklik as unknown as BekleyenDegisiklik | null
      if (!b?.alanlar || b.reddedildi) return []
      const farklar = (Object.keys(b.alanlar) as EsasliAlan[])
        .filter((a) => (ESASLI_ALANLAR as readonly string[]).includes(a))
        .map((alan) => {
          const once = (i as unknown as Record<string, unknown>)[alan]
          const sonra = (b.alanlar as Record<string, unknown>)[alan]
          const bicim = alan === 'ucretEnAz' || alan === 'ucretEnCok' ? tl : (d: unknown) => yaz(alan, d, (s) => tarihYaz(s, true))
          return { alan, ad: ESASLI_ALAN_ADI[alan], once: bicim(once), sonra: bicim(sonra) }
        })
      return [{ id: i.id, pozisyonAdi: i.pozisyonAdi, firma: firmaNesnesi(i.firma)?.kisaAd ?? '', tarih: b.tarih, bekleme: beklemeMetni(b.tarih, simdi), farklar }]
    })
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
})

/* ---------- Liste talepleri ---------- */

export interface TalepKaydi {
  id: number
  tur: string
  turAdi: string
  ogeler: string[]
  aciklama?: string | null
  kaynak?: string | null
  isteyen: string
  isteyenTuru: string
  /** Talep edene “sen” mi “siz” mi denir (aday: sen) */
  sen: boolean
  bekleme: string
  /** Her öğe için listede benzer adlar */
  benzerler: Record<string, BenzerAd[]>
}

export const bekleyenTalepler = cache(async (): Promise<TalepKaydi[]> => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'talepler',
    where: { durum: { equals: 'bekliyor' } },
    sort: 'createdAt',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    populate: { kullanicilar: { ad: true, rol: true, unvan: true }, firmalar: { kisaAd: true } },
  })
  const simdi = new Date()
  const turler = [...new Set(docs.map((t) => t.taksonomiTuru))]
  const liste = turler.length
    ? await payload.find({ collection: 'taksonomiler', where: { tur: { in: turler } }, select: { ad: true, tur: true }, limit: 20000, pagination: false, depth: 0, overrideAccess: true })
    : { docs: [] as Array<{ ad: string; tur: string }> }
  const adlar = (tur: string) => liste.docs.filter((d) => d.tur === tur).map((d) => d.ad)
  return docs.map((t: Talepler) => {
    const eden = t.talepEden && typeof t.talepEden === 'object' ? t.talepEden : null
    const firma = firmaNesnesi(t.firma)
    const isteyenTuru = firma ? `${firma.kisaAd}${eden?.unvan ? ` · ${eden.unvan}` : ''}` : eden?.rol === 'aday' ? 'Aday' : 'Yönetici A.Ş.'
    return {
      id: t.id,
      tur: t.taksonomiTuru,
      turAdi: TALEP_TUR_ADI[t.taksonomiTuru]?.tekil ?? t.taksonomiTuru,
      ogeler: (t.oneriler ?? []).map((o) => o.ad),
      aciklama: t.aciklama,
      kaynak: talepKaynagi(t.kaynak),
      // Aday talebinde ad gösterilmez: karar için gerekmez (veri en aza indirme)
      isteyen: eden?.rol === 'aday' ? 'Bir aday' : (eden?.ad ?? 'Bilinmeyen kullanıcı'),
      isteyenTuru,
      sen: eden?.rol === 'aday',
      bekleme: beklemeMetni(t.createdAt, simdi),
      benzerler: Object.fromEntries((t.oneriler ?? []).map((o) => [o.ad, benzerAdlar(o.ad, adlar(t.taksonomiTuru))])),
    }
  })
})

/* ---------- Başvurusuz bitmek üzere ---------- */

export interface BasvurusuzIlan {
  id: number
  pozisyonAdi: string
  firma: string
  kalan: number
  hatirlatildi: boolean
}

export const basvurusuzBitenler = cache(async (): Promise<BasvurusuzIlan[]> => {
  const payload = await payloadAl()
  const simdi = new Date()
  const sinir = new Date(simdi.getTime() + 7 * 86_400_000).toISOString()
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { and: [{ durum: { equals: 'yayinda' } }, { sonBasvuru: { less_than: sinir } }] },
    sort: 'sonBasvuru',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    populate: { firmalar: { kisaAd: true } },
  })
  if (!docs.length) return []
  const b = await payload.find({
    collection: 'basvurular',
    where: { and: [{ ilan: { in: docs.map((d) => d.id) } }, { durum: { not_equals: 'geri-cekti' } }] },
    select: { ilan: true },
    depth: 0,
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  })
  const basvurulu = new Set(b.docs.map((x) => Number(typeof x.ilan === 'object' ? x.ilan?.id : x.ilan)))
  const h = await payload.find({
    collection: 'islem-kayitlari',
    where: { and: [{ islem: { equals: HATIRLATMA_ISLEMI } }, { kayitId: { in: docs.map((d) => String(d.id)) } }] },
    select: { kayitId: true },
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })
  const hatirlatilan = new Set(h.docs.map((x) => Number(x.kayitId)))
  return docs
    .filter((i) => !basvurulu.has(i.id) && kalanGun(new Date(i.sonBasvuru), simdi) >= 0)
    .map((i) => ({ id: i.id, pozisyonAdi: i.pozisyonAdi, firma: firmaNesnesi(i.firma)?.kisaAd ?? '', kalan: kalanGun(new Date(i.sonBasvuru), simdi), hatirlatildi: hatirlatilan.has(i.id) }))
})

/** Menüdeki sayılar ve “Bugün” başlığı. */
export const yonetimSayilari = cache(async () => {
  const [onay, degisiklik, talep, tumBasvurusuz] = await Promise.all([onayKuyrugu(), bekleyenDegisiklikler(), bekleyenTalepler(), basvurusuzBitenler()])
  const basvurusuz = tumBasvurusuz.filter((i) => !i.hatirlatildi)
  const { kurulumOzeti } = await import('./firmaYonetimi')
  const takip = (await kurulumOzeti()).takip.length
  return {
    onay: onay.length,
    degisiklik: degisiklik.length,
    talep: talep.length,
    basvurusuz: basvurusuz.length,
    takip,
    toplam: onay.length + degisiklik.length + talep.length + basvurusuz.length + takip,
  }
})

/** Zamanlanmış işlerin son çalışması (panelde güven için gösterilir). */
export const sonZamanliCalisma = cache(async () => {
  const payload = await payloadAl()
  const { docs } = await payload.find({ collection: 'islem-kayitlari', where: { islem: { equals: 'Zamanlanmış işler çalıştı' } }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true })
  const d = docs[0]
  if (!d) return null
  const a = (d.ayrinti ?? {}) as { kapananIlan?: number; davetHatirlatma?: number; profilHatirlatma?: number; hatalar?: string[] }
  return { tarih: d.createdAt, kapananIlan: a.kapananIlan ?? 0, hatirlatma: (a.davetHatirlatma ?? 0) + (a.profilHatirlatma ?? 0), hata: (a.hatalar ?? []).length }
})
