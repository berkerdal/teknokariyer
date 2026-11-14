/**
 * Firma paneli verisi (ön yüz, yalnızca sunucuda). Okumalar oturumdaki kullanıcıyla ve erişim kurallarıyla yapılır;
 * böylece kiracı ayrımı (yalnızca kendi firması) burada da veritabanı sorgusunda uygulanır.
 */
import { cache } from 'react'
import type { Firmalar, Ilanlar } from '@/payload-types'
import { firmaKimligi, firmaKullanicisiMi, type FirmaYetkisi } from '@/erisim'
import { VARSAYILAN_EN_UZUN_SURE_GUN, VARSAYILAN_ONAYLI_ILAN_SAYISI, type IlanDurumu } from '@/alan/ilan'
import type { Kullanici } from '@/servisler/ortak'
import type { IlanFormBaslangici, Secenek } from '@/arayuz/firma/IlanFormu'
import { trGunMetni } from '@/alan/tarih'
import { siteAdresi } from '@/altyapi/epostaSablonlari'
import { ilanAdresi } from '@/arayuz/bicim'
import { oturum, payloadAl } from './payload'

/**
 * Firma paneli sayfaları için oturum denetimi. Düzen ve sayfa paralel çalıştığı için her sayfa kendisi çağırır.
 */
export async function firmaOturumu(donus = '/firma-paneli'): Promise<Kullanici> {
  const { redirect } = await import('next/navigation')
  const { rolAnaSayfasi } = await import('./cerez')
  const k = await oturum()
  if (!k) redirect(`/giris?firma=1&donus=${encodeURIComponent(donus)}`)
  if (k.rol === 'firma' && k.pasif) redirect('/cikis?pasif=1') // ekipten çıkarılan kişinin açık kalmış oturumu
  if (!firmaKullanicisiMi(k)) redirect(rolAnaSayfasi(String(k.rol)))
  return k
}

export const firmaYetkisi = (k: Kullanici): FirmaYetkisi => (k.firmaYetkisi as FirmaYetkisi | null) ?? 'degerlendirici'
export const ilanYonetebilirMi = (k: Kullanici) => ['yonetici', 'ilan-sorumlusu'].includes(firmaYetkisi(k))

export const oturumdakiFirma = cache(async (): Promise<Firmalar | null> => {
  const k = await oturum()
  if (!k || !firmaKullanicisiMi(k)) return null
  const payload = await payloadAl()
  return payload
    .findByID({ collection: 'firmalar', id: firmaKimligi(k) as number, depth: 1, overrideAccess: false, user: k })
    .catch((): null => null)
})

export interface FirmaIlani {
  id: number
  pozisyonAdi: string
  tur: Ilanlar['tur']
  durum: IlanDurumu
  sonBasvuru: string
  yayinTarihi?: string | null
  guncelleme: string
  duzeltmeGerekcesi?: string | null
  kapanisNedeni?: Ilanlar['kapanisNedeni']
  goruntulenme: number
  /** Bu ilana gelen başvurular (geri çekilenler hariç) */
  basvuru: number
  /** Henüz incelenmemiş (“Alındı” durumundaki) başvurular */
  yeni: number
  linkedinMetni?: string | null
}

/** Firmanın bütün ilanları, başvuru sayılarıyla. Sayılar elle değil, başvuru kayıtlarından hesaplanır. */
export const firmaIlanlari = cache(async (): Promise<FirmaIlani[]> => {
  const k = await oturum()
  if (!k || !firmaKullanicisiMi(k)) return []
  const payload = await payloadAl()
  const [ilanlar, basvurular] = await Promise.all([
    payload.find({
      collection: 'ilanlar',
      where: { firma: { equals: firmaKimligi(k) } },
      sort: '-updatedAt',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      user: k,
    }),
    payload.find({
      collection: 'basvurular',
      where: { and: [{ firma: { equals: firmaKimligi(k) } }, { durum: { not_equals: 'geri-cekti' } }] },
      select: { ilan: true, durum: true },
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: false,
      user: k,
    }),
  ])
  const sayi = new Map<number, { basvuru: number; yeni: number }>()
  for (const b of basvurular.docs) {
    const id = Number(typeof b.ilan === 'object' ? b.ilan?.id : b.ilan)
    const s = sayi.get(id) ?? { basvuru: 0, yeni: 0 }
    s.basvuru++
    if (b.durum === 'alindi') s.yeni++
    sayi.set(id, s)
  }
  return ilanlar.docs.map((i) => ({
    id: i.id,
    pozisyonAdi: i.pozisyonAdi,
    tur: i.tur,
    durum: i.durum as IlanDurumu,
    sonBasvuru: i.sonBasvuru,
    yayinTarihi: i.yayinTarihi,
    guncelleme: i.updatedAt,
    duzeltmeGerekcesi: i.duzeltmeGerekcesi,
    kapanisNedeni: i.kapanisNedeni,
    goruntulenme: i.goruntulenme ?? 0,
    basvuru: sayi.get(i.id)?.basvuru ?? 0,
    yeni: sayi.get(i.id)?.yeni ?? 0,
    linkedinMetni: i.linkedinMetni,
  }))
})

/** K4 onay durumu ve ayarlardaki sınırlar. */
export const firmaKurallari = cache(async () => {
  const payload = await payloadAl()
  const a = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
  return {
    onayliIlanSayisi: a.onayliIlanSayisi ?? VARSAYILAN_ONAYLI_ILAN_SAYISI,
    enUzunSureGun: a.enUzunSureGun ?? VARSAYILAN_EN_UZUN_SURE_GUN,
  }
})

/** Tarih seçici sınırları: yarından ayarlardaki gün sınırına kadar (Türkiye günü). */
export async function tarihSiniri(simdi = new Date()) {
  const { trGunMetni } = await import('@/alan/tarih')
  const { enUzunSureGun } = await firmaKurallari()
  const g = (n: number) => trGunMetni(new Date(simdi.getTime() + n * 86_400_000))
  return { bugun: g(0), enErken: g(1), enGec: g(enUzunSureGun), gun: enUzunSureGun }
}

/* ---------- İlan formu ---------- */


/** Formdaki seçim listeleri: yalnızca seçilebilir (aktif) taksonomi kayıtları, Türkçe sıralı. */
export const ilanFormuSecenekleri = cache(async () => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'taksonomiler',
    where: { and: [{ tur: { in: ['pozisyon-ailesi', 'beceri', 'bolum', 'dil'] } }, { aktif: { not_equals: false } }] },
    select: { tur: true, ad: true },
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
  })
  const liste = (tur: string): Secenek[] =>
    docs
      .filter((d) => d.tur === tur)
      .map((d) => ({ id: d.id, ad: d.ad }))
      .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
  return { aileler: liste('pozisyon-ailesi'), beceriler: liste('beceri'), bolumler: liste('bolum'), diller: liste('dil') }
})

const secenek = (x: unknown): Secenek | null =>
  x && typeof x === 'object' && 'ad' in x ? { id: (x as unknown as { id: number }).id, ad: String((x as unknown as { ad: string }).ad) } : null
const tutarMetni = (n?: number | null) => (n ? new Intl.NumberFormat('tr-TR').format(n) : '')

/** Yeni ilan: firma profilinden konum ve yan haklar dolu gelir. */
export function bosIlanFormu(firma: Firmalar): IlanFormBaslangici {
  return {
    pozisyonAdi: '',
    tur: '',
    altTur: '',
    aile: null,
    model: '',
    konum: `Pamukkale Teknokent, ${firma.konum}`,
    deneyim: '',
    egitim: '',
    pozisyonSayisi: 1,
    bolumler: [],
    zorunluBeceriler: [],
    tercihBeceriler: [],
    diller: [],
    sonBasvuru: '',
    baslangic: '',
    ucretEnAz: '',
    ucretEnCok: '',
    ucretGorunur: false,
    yanHaklar: (firma.yanHaklar ?? []).map((y) => y.ad),
    isTanimi: '',
    nitelikler: '',
    sorular: [],
    linkedinMetni: '',
    dil: 'tr',
    stajDonemi: '',
    ucretliStaj: false,
    sgk: '',
    stajBelgesi: true,
    pauOncelik: false,
  }
}

/** Firmanın kendi ilanı (erişim kuralıyla okunur; başka firmanın ilanı bulunamaz). */
export async function firmaIlani(ilanId: number): Promise<Ilanlar | null> {
  const k = await oturum()
  if (!k || !firmaKullanicisiMi(k) || !Number.isInteger(ilanId) || ilanId <= 0) return null
  const payload = await payloadAl()
  const i = await payload
    .findByID({ collection: 'ilanlar', id: ilanId, depth: 1, overrideAccess: false, user: k, populate: { taksonomiler: { ad: true } } })
    .catch((): null => null)
  if (!i) return null
  const firma = typeof i.firma === 'object' ? i.firma?.id : i.firma
  return Number(firma) === Number(firmaKimligi(k)) ? i : null
}

export function ilanFormuBaslangici(i: Ilanlar): IlanFormBaslangici {
  const liste = (x: unknown[] | null | undefined) => (x ?? []).map(secenek).filter((y): y is Secenek => Boolean(y))
  return {
    pozisyonAdi: i.pozisyonAdi,
    tur: (i.tur as 'is' | 'staj') ?? '',
    altTur: i.altTur ?? '',
    aile: i.aile ? Number(typeof i.aile === 'object' ? i.aile.id : i.aile) : null,
    model: i.model ?? '',
    konum: i.konum,
    deneyim: i.deneyim ?? '',
    egitim: i.egitim ?? '',
    pozisyonSayisi: i.pozisyonSayisi ?? 1,
    bolumler: liste(i.bolumler),
    zorunluBeceriler: liste(i.zorunluBeceriler),
    tercihBeceriler: liste(i.tercihBeceriler),
    diller: (i.diller ?? []).flatMap((d) => {
      const s = secenek(d.dil)
      return s ? [{ ...s, seviye: d.seviye }] : []
    }),
    sonBasvuru: i.sonBasvuru ? trGunMetni(new Date(i.sonBasvuru)) : '',
    baslangic: i.baslangic ? trGunMetni(new Date(i.baslangic)) : '',
    ucretEnAz: tutarMetni(i.ucretEnAz),
    ucretEnCok: tutarMetni(i.ucretEnCok),
    ucretGorunur: Boolean(i.ucretGorunur),
    yanHaklar: (i.yanHaklar ?? []).map((y) => y.ad),
    isTanimi: i.isTanimi ?? '',
    nitelikler: i.nitelikler ?? '',
    sorular: (i.onElemeSorulari ?? []).map((s) => ({
      soru: s.soru,
      tip: s.tip,
      eleyici: Boolean(s.eleyici),
      beklenenCevap: s.beklenenCevap ?? '',
      secenekler: (s.secenekler ?? []).map((x) => x.ad).join('\n'),
    })),
    linkedinMetni: i.linkedinMetni ?? '',
    dil: i.dil ?? 'tr',
    stajDonemi: i.stajDonemi ?? '',
    ucretliStaj: Boolean(i.ucretliStaj),
    sgk: i.sgk ?? '',
    stajBelgesi: i.stajBelgesi !== false,
    pauOncelik: Boolean(i.pauOncelik),
  }
}

/** LinkedIn paylaşımı için metin ve ilanın tam adresi. Metin boşsa ilan ve firma adından kısa bir cümle kurulur. */
export function paylasimBilgisi(i: { id: number; pozisyonAdi: string; linkedinMetni?: string | null }, firmaAd: string) {
  return {
    metin: i.linkedinMetni?.trim() || `${firmaAd}, Pamukkale Teknokent’teki ekibine “${i.pozisyonAdi}” arıyor. Ayrıntılar ve başvuru için ilan bağlantısı aşağıdadır.`,
    adres: `${siteAdresi()}${ilanAdresi(i)}`,
  }
}
