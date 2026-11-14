/**
 * İşlem kayıtları ekranı (talimatlar 10: “kim neyi ne zaman değiştirdi; değiştirilemez ve aranabilir”).
 * Kayıtlar yalnızca okunur; koleksiyonda güncelleme ve silme kapalıdır. Yalnızca tam yetkili görür (sayfa denetler).
 */
import type { Where } from 'payload'
import type { IslemKayitlari } from '@/payload-types'
import { trGunu } from '@/alan/tarih'
import { payloadAl } from './payload'

export const KAYIT_TURLERI: Array<[string, string]> = [
  ['kisisel-veri', 'Kişisel veri'],
  ['ilan', 'İlan'],
  ['moderasyon', 'Moderasyon'],
  ['basvuru', 'Başvuru'],
  ['kurulum', 'Kurulum'],
  ['hesap', 'Hesap'],
  ['ayarlar', 'Ayarlar'],
]
export const KAYIT_TUR_ADI = Object.fromEntries(KAYIT_TURLERI) as Record<string, string>

export const SAYFA_BOYU = 50

export interface KayitSuzgeci {
  q?: string
  tur?: string
  bas?: string
  bit?: string
  sayfa?: string
}

const KAYIT_ADI: Record<string, string> = {
  ilanlar: 'İlan',
  firmalar: 'Firma',
  basvurular: 'Başvuru',
  adaylar: 'Aday profili',
  kullanicilar: 'Kullanıcı',
  'kvkk-talepleri': 'KVKK başvurusu',
  talepler: 'Liste talebi',
  taksonomiler: 'Liste öğesi',
  davetler: 'Davet',
  dosyalar: 'Dosya',
}

/** Kayıt bağlantısı: panelde ayrıntı sayfası olan türler için adres. */
function kayitAdresi(tur?: string | null, id?: string | null): string | null {
  if (!tur || !id) return null
  if (tur === 'firmalar') return `/yonetim/firmalar/${id}`
  if (tur === 'kvkk-talepleri') return `/yonetim/kvkk/${id}`
  return null
}

/** Süzgeçleri sorguya çevirir. Kişi araması ayrı sorguyla kullanıcı kimliklerine çözülür. */
async function sorgu(s: KayitSuzgeci): Promise<{ where: Where; hata?: string }> {
  const kosullar: Where[] = []
  let hata: string | undefined
  if (s.tur && KAYIT_TUR_ADI[s.tur]) kosullar.push({ tur: { equals: s.tur } })
  const bas = s.bas ? trGunu(s.bas) : null
  const bit = s.bit ? trGunu(s.bit) : null
  if (s.bas && !bas) hata = 'Başlangıç tarihi geçersiz; süzgeçte kullanılmadı.'
  if (s.bit && !bit) hata = 'Bitiş tarihi geçersiz; süzgeçte kullanılmadı.'
  if (bas) kosullar.push({ createdAt: { greater_than_equal: bas.toISOString() } })
  if (bit) kosullar.push({ createdAt: { less_than: new Date(bit.getTime() + 86_400_000).toISOString() } })
  const q = (s.q ?? '').trim()
  if (q) {
    const payload = await payloadAl()
    const { docs: kisiler } = await payload.find({
      collection: 'kullanicilar',
      where: { or: [{ ad: { contains: q } }, { email: { contains: q } }] },
      select: { ad: true },
      limit: 80, // D1 parametre sınırının altında
      depth: 0,
      overrideAccess: true,
    })
    const ya: Where[] = [{ islem: { contains: q } }, { kayitId: { equals: q } }]
    if (kisiler.length) ya.push({ kim: { in: kisiler.map((k) => k.id) } })
    kosullar.push({ or: ya })
  }
  return { where: kosullar.length ? { and: kosullar } : {}, hata }
}

function kimMetni(k: IslemKayitlari['kim']): string {
  if (!k) return 'Sistem'
  if (typeof k !== 'object') return 'Silinmiş kullanıcı'
  const firma = k.firma && typeof k.firma === 'object' ? (k.firma as { kisaAd?: string }).kisaAd : null
  return `${k.ad ?? k.email}${firma ? ` (${firma})` : k.rol && k.rol !== 'aday' && k.rol !== 'firma' ? ' (Yönetici A.Ş.)' : k.rol === 'aday' ? ' (aday)' : ''}`
}

/** Ayrıntıyı kısa metne çevirir: “gerekce: …, adet: 3”. */
export function ayrintiMetni(a: unknown): string {
  if (a === null || a === undefined) return ''
  if (typeof a !== 'object') return String(a)
  return Object.entries(a as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ')
}

export interface KayitSatiri {
  id: number
  zaman: string
  kim: string
  islem: string
  tur: string
  turAdi: string
  kayit: string | null
  kayitAdresi: string | null
  ayrinti: string
}

function satir(d: IslemKayitlari): KayitSatiri {
  return {
    id: d.id,
    zaman: d.createdAt,
    kim: kimMetni(d.kim),
    islem: d.islem,
    tur: d.tur,
    turAdi: KAYIT_TUR_ADI[d.tur] ?? d.tur,
    kayit: d.kayitTuru ? `${KAYIT_ADI[d.kayitTuru] ?? d.kayitTuru}${d.kayitId ? ` #${d.kayitId}` : ''}` : null,
    kayitAdresi: kayitAdresi(d.kayitTuru, d.kayitId),
    ayrinti: ayrintiMetni(d.ayrinti),
  }
}

export async function islemKayitlari(s: KayitSuzgeci) {
  const payload = await payloadAl()
  const { where, hata } = await sorgu(s)
  const sayfa = Math.max(1, Number(s.sayfa) || 1)
  const r = await payload.find({
    collection: 'islem-kayitlari',
    where,
    sort: '-createdAt',
    limit: SAYFA_BOYU,
    page: sayfa,
    depth: 2,
    overrideAccess: true,
    populate: { kullanicilar: { ad: true, email: true, rol: true, firma: true }, firmalar: { kisaAd: true } },
  })
  return { satirlar: (r.docs as IslemKayitlari[]).map(satir), toplam: r.totalDocs, sayfa: r.page ?? sayfa, sayfaSayisi: r.totalPages, hata }
}

/** Dışa aktarma: süzgeçteki kayıtlar, en fazla 10.000 (sayfalı okunur). */
export async function islemKayitlariHepsi(s: KayitSuzgeci, enFazla = 10_000): Promise<KayitSatiri[]> {
  const payload = await payloadAl()
  const { where } = await sorgu(s)
  const satirlar: KayitSatiri[] = []
  for (let sayfa = 1; satirlar.length < enFazla; sayfa++) {
    const r = await payload.find({
      collection: 'islem-kayitlari',
      where,
      sort: '-createdAt',
      limit: 500,
      page: sayfa,
      depth: 2,
      overrideAccess: true,
      populate: { kullanicilar: { ad: true, email: true, rol: true, firma: true }, firmalar: { kisaAd: true } },
    })
    satirlar.push(...(r.docs as IslemKayitlari[]).map(satir))
    if (!r.hasNextPage) break
  }
  return satirlar.slice(0, enFazla)
}
