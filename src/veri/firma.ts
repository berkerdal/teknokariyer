/**
 * Firma paneli verisi (ön yüz, yalnızca sunucuda). Okumalar oturumdaki kullanıcıyla ve erişim kurallarıyla yapılır;
 * böylece kiracı ayrımı (yalnızca kendi firması) burada da veritabanı sorgusunda uygulanır.
 */
import { cache } from 'react'
import type { Firmalar, Ilanlar } from '@/payload-types'
import { firmaKimligi, firmaKullanicisiMi, type FirmaYetkisi } from '@/erisim'
import { VARSAYILAN_EN_UZUN_SURE_GUN, VARSAYILAN_ONAYLI_ILAN_SAYISI, type IlanDurumu } from '@/alan/ilan'
import type { Kullanici } from '@/servisler/ortak'
import { oturum, payloadAl } from './payload'

/**
 * Firma paneli sayfaları için oturum denetimi. Düzen ve sayfa paralel çalıştığı için her sayfa kendisi çağırır.
 */
export async function firmaOturumu(donus = '/firma-paneli'): Promise<Kullanici> {
  const { redirect } = await import('next/navigation')
  const { rolAnaSayfasi } = await import('./cerez')
  const k = await oturum()
  if (!k) redirect(`/giris?firma=1&donus=${encodeURIComponent(donus)}`)
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
