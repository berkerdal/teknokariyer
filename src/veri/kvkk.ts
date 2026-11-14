/**
 * KVKK başvuruları: Yönetici A.Ş. listesi ve ayrıntısı, adayın kendi başvuruları.
 * Liste ve ayrıntı yalnızca tam yetkili kullanıcıya açılır (sayfa yetkiyi denetler); okuma sunucuda yapılır.
 */
import { cache } from 'react'
import type { KvkkTalepleri } from '@/payload-types'
import { KIMLIK_ADI, KVKK_DURUM_ADI, KVKK_KANAL_ADI, KVKK_SONUC_ADI, KVKK_TUR_ADI, YAKLASAN_GUN, cevapSuresi, kalanGun, sonGun, talepSirasi } from '@/alan/kvkk'
import { payloadAl } from './payload'

const ad = (x: unknown) => (x && typeof x === 'object' ? ((x as { ad?: string | null }).ad ?? null) : null)

export interface KvkkSatiri {
  id: number
  tur: KvkkTalepleri['tur']
  turAdi: string
  kanalAdi: string
  basvuranAd: string
  hesapVar: boolean
  basvuruTarihi: string
  sonGun: string
  kalan: number
  durum: KvkkTalepleri['durum']
  durumAdi: string
  sonucAdi: string | null
  cevapTarihi: string | null
  cevapGun: number | null
  yaklasan: boolean
  gecikti: boolean
}

function satir(t: KvkkTalepleri, simdi: Date): KvkkSatiri {
  const bas = new Date(t.basvuruTarihi)
  const kalan = kalanGun(bas, simdi)
  const acik = t.durum !== 'sonuclandi'
  const cevapGun = t.cevapTarihi ? cevapSuresi(bas, new Date(t.cevapTarihi)) : null
  return {
    id: t.id,
    tur: t.tur,
    turAdi: KVKK_TUR_ADI[t.tur],
    kanalAdi: KVKK_KANAL_ADI[t.kanal],
    basvuranAd: t.basvuranAd,
    hesapVar: Boolean(t.kullanici),
    basvuruTarihi: t.basvuruTarihi,
    sonGun: sonGun(bas).toISOString(),
    kalan,
    durum: t.durum,
    durumAdi: KVKK_DURUM_ADI[t.durum],
    sonucAdi: t.sonuc ? KVKK_SONUC_ADI[t.sonuc] : null,
    cevapTarihi: t.cevapTarihi ?? null,
    cevapGun,
    yaklasan: acik && kalan <= YAKLASAN_GUN && kalan >= 0,
    gecikti: acik ? kalan < 0 : cevapGun !== null && cevapGun > 30,
  }
}

export const kvkkListesi = cache(async (): Promise<KvkkSatiri[]> => {
  const payload = await payloadAl()
  const { docs } = await payload.find({ collection: 'kvkk-talepleri', sort: '-basvuruTarihi', limit: 500, depth: 0, overrideAccess: true, select: { notlar: false, cevap: false, aciklama: false } as never })
  const simdi = new Date()
  return (docs as KvkkTalepleri[]).map((t) => satir(t, simdi)).sort(talepSirasi)
})

/** Açık başvurular (menü sayacı ve “Bugün” kuyruğu). */
export const acikKvkk = cache(async () => (await kvkkListesi()).filter((t) => t.durum !== 'sonuclandi'))

export async function kvkkAyrintisi(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null
  const payload = await payloadAl()
  const t = await payload.findByID({ collection: 'kvkk-talepleri', id, depth: 1, overrideAccess: true, populate: { kullanicilar: { ad: true, email: true, rol: true } } }).catch((): null => null)
  if (!t) return null
  const hesap = t.kullanici && typeof t.kullanici === 'object' ? t.kullanici : null
  const { docs: gecmis } = await payload.find({
    collection: 'islem-kayitlari',
    where: { and: [{ kayitTuru: { equals: 'kvkk-talepleri' } }, { kayitId: { equals: String(id) } }] },
    sort: 'createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
    populate: { kullanicilar: { ad: true } },
  })
  let basvuruSayisi = 0
  if (hesap) basvuruSayisi = (await payload.count({ collection: 'basvurular', where: { adayKullanici: { equals: hesap.id } }, overrideAccess: true })).totalDocs
  return {
    ...satir(t as KvkkTalepleri, new Date()),
    aciklama: t.aciklama ?? '',
    basvuranEposta: t.basvuranEposta,
    kanal: t.kanal,
    kimlik: t.kimlik,
    kimlikAdi: KIMLIK_ADI[t.kimlik],
    sonuc: t.sonuc ?? null,
    cevap: t.cevap ?? '',
    cevapGonderildi: Boolean(t.cevapGonderildi),
    hesap: hesap ? { id: hesap.id, ad: hesap.ad ?? '', eposta: hesap.email, aday: hesap.rol === 'aday', basvuruSayisi } : null,
    notlar: (t.notlar ?? []).map((n) => ({ metin: n.metin, yazan: ad(n.yazan) ?? 'Silinmiş kullanıcı', tarih: n.tarih })),
    gecmis: gecmis.map((g) => ({ islem: g.islem, kim: g.kim ? (ad(g.kim) ?? 'Silinmiş kullanıcı') : 'Sistem', tarih: g.createdAt })),
  }
}

/** Adayın kendi başvuruları (iç notlar olmadan). */
export async function adayinKvkkBasvurulari(kullaniciId: number) {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'kvkk-talepleri',
    where: { kullanici: { equals: kullaniciId } },
    sort: '-basvuruTarihi',
    limit: 50,
    depth: 0,
    overrideAccess: true,
    select: { tur: true, basvuruTarihi: true, durum: true, sonuc: true, cevap: true, cevapTarihi: true },
  })
  return docs.map((t) => ({
    id: t.id,
    turAdi: KVKK_TUR_ADI[t.tur],
    basvuruTarihi: t.basvuruTarihi,
    sonGun: sonGun(new Date(t.basvuruTarihi)).toISOString(),
    durumAdi: KVKK_DURUM_ADI[t.durum],
    durum: t.durum,
    sonuc: t.sonuc ?? null,
    acik: t.durum !== 'sonuclandi',
    sonucAdi: t.sonuc ? KVKK_SONUC_ADI[t.sonuc] : null,
    cevap: t.cevap ?? null,
    cevapTarihi: t.cevapTarihi ?? null,
  }))
}
