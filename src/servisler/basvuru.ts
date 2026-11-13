/**
 * Adayın başvurusu (talimatlar 5): profil kopyası dondurulur, rızalar sürümüyle kaydedilir, eleyici soru işaretlenir,
 * havuz kutusu işaretliyse havuz açık rızası alınır (K24). İlanın başvuru sayacı artar.
 */
import type { Payload } from 'payload'
import type { Adaylar, Ilanlar } from '@/payload-types'
import { adayMi } from '@/erisim'
import { IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

/** Yürürlükteki metin sürümleri. Metin değişince sürüm artırılır; eski onaylar eski sürümle kayıtlı kalır. */
export const METIN_SURUMLERI = { basvuruAydinlatma: '1.0', havuzRiza: '1.0' } as const

export interface BasvuruGirdisi {
  ilanId: number | string
  cvDosyaId?: number | string
  onYazi?: string
  cevaplar: Record<string, string>
  aydinlatmaOnay: boolean
  havuzaKatil: boolean
  kaynak?: 'portal' | 'linkedin' | 'google' | 'dogrudan'
}

/** Başvuru anındaki profil: firmanın göreceği bilgi. Sonradan profil değişse de bu kopya değişmez. */
export function profilKopyasi(kullanici: Kullanici, aday: Adaylar) {
  const ad = (x: unknown) => (x && typeof x === 'object' ? (x as { ad?: string }).ad : undefined)
  return {
    ad: kullanici.ad,
    eposta: kullanici.email,
    telefon: aday.telefon ?? null,
    cinsiyet: aday.cinsiyet ?? null,
    tanitim: aday.tanitim ?? null,
    okul: ad(aday.okul) ?? null,
    bolum: ad(aday.bolum) ?? null,
    sinif: aday.sinif ?? null,
    mezuniyet: aday.mezuniyet ?? null,
    deneyimSeviyesi: aday.deneyimSeviyesi ?? null,
    deneyimler: aday.deneyimler ?? [],
    beceriler: (aday.beceriler ?? []).map((b) => ({ ad: ad(b.beceri), seviye: b.seviye })),
    diller: (aday.diller ?? []).map((d) => ({ dil: ad(d.dil), seviye: d.seviye })),
    sertifikalar: aday.sertifikalar ?? [],
    baglantilar: aday.baglantilar ?? [],
    tercihler: { ...(aday.tercihler ?? {}), ucretBeklentisi: undefined as number | undefined }, // ücret beklentisi firmaya gösterilmez
    kopyaTarihi: new Date().toISOString(),
  }
}

/** Ön eleme cevaplarını denetler: zorunlu cevaplar ve eleyici soruya beklenmeyen cevap. */
export function cevaplariDenetle(ilan: Ilanlar, cevaplar: Record<string, string>) {
  const sorular = ilan.onElemeSorulari ?? []
  const eksik = sorular.filter((s, i) => !String(cevaplar[s.id ?? String(i)] ?? '').trim())
  const eleyiciUyari = sorular.some((s, i) => {
    if (!s.eleyici || !s.beklenenCevap) return false
    const c = String(cevaplar[s.id ?? String(i)] ?? '').trim().toLocaleLowerCase('tr')
    return c !== s.beklenenCevap.trim().toLocaleLowerCase('tr')
  })
  return { eksik: eksik.map((s) => s.soru), eleyiciUyari }
}

export async function basvur(payload: Payload, kullanici: Kullanici, girdi: BasvuruGirdisi) {
  if (!adayMi(kullanici)) throw new IslemHatasi('Başvuru yalnızca aday hesabıyla yapılabilir.', 403)
  if (!girdi.aydinlatmaOnay) throw new IslemHatasi('Başvurmak için aydınlatma metnini okuduğunu onayla.')

  const ilan = await payload.findByID({ collection: 'ilanlar', id: girdi.ilanId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!ilan || ilan.durum !== 'yayinda') throw new IslemHatasi('Bu ilan şu an başvuru almıyor.', 409)

  const { docs } = await payload.find({
    collection: 'adaylar',
    where: { kullanici: { equals: kullanici.id } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const aday = docs[0]
  if (!aday) throw new IslemHatasi('Başvurmadan önce profilini oluştur.')

  const { eksik, eleyiciUyari } = cevaplariDenetle(ilan, girdi.cevaplar)
  if (eksik.length) throw new IslemHatasi(`Şu soruları cevapla: ${eksik.join(' · ')}`)

  if (girdi.cvDosyaId) {
    const cvSahibi = (aday.cvler ?? []).some((c) => kimlik(c.dosya) === Number(girdi.cvDosyaId))
    if (!cvSahibi) throw new IslemHatasi('Seçilen CV senin CV’lerin arasında değil.', 403)
  }

  const req = await istekOlustur(payload, kullanici)
  // Rızalar ayrı ayrı ve sürümüyle (talimatlar 12).
  await payload.create({
    collection: 'rizalar',
    data: { kullanici: kullanici.id, tur: 'basvuru-aydinlatma', metinSurumu: METIN_SURUMLERI.basvuruAydinlatma },
    overrideAccess: true,
    req,
  })
  if (girdi.havuzaKatil) {
    await payload.create({
      collection: 'rizalar',
      data: { kullanici: kullanici.id, tur: 'havuz', metinSurumu: METIN_SURUMLERI.havuzRiza },
      overrideAccess: true,
      req,
    })
    await payload.update({
      collection: 'adaylar',
      id: aday.id,
      data: {
        havuz: {
          ...aday.havuz,
          rizaTarihi: new Date().toISOString(),
          gorunurluk: aday.havuz?.gorunurluk && aday.havuz.gorunurluk !== 'gizli' ? aday.havuz.gorunurluk : 'acik',
          gizlenenFirmalar: (aday.havuz?.gizlenenFirmalar ?? []).map(kimlik),
        },
      },
      overrideAccess: true,
      req,
    })
  }

  // Oluşturma, başvuru koleksiyonunun kendi kancalarından geçer (aynı ilana ikinci başvuru engeli dahil).
  const basvuru = await payload.create({
    collection: 'basvurular',
    data: {
      ilan: ilan.id,
      adayKodu: aday.kod,
      profilKopyasi: profilKopyasi(kullanici, aday),
      cv: girdi.cvDosyaId ? Number(girdi.cvDosyaId) : undefined,
      onYazi: girdi.onYazi?.slice(0, 1500),
      cevaplar: girdi.cevaplar,
      eleyiciUyari,
      kaynak: girdi.kaynak ?? 'portal',
      aydinlatmaSurumu: METIN_SURUMLERI.basvuruAydinlatma,
      durum: 'alindi',
    } as never,
    user: kullanici as never,
    overrideAccess: false,
    req,
  })

  await payload.update({
    collection: 'ilanlar',
    id: ilan.id,
    data: { basvuruSayisi: (ilan.basvuruSayisi ?? 0) + 1 },
    overrideAccess: true,
    req,
  })
  return basvuru
}

/** Aday başvurusunu geri çeker (yalnızca alındı veya inceleniyor aşamasında). */
export async function geriCek(payload: Payload, kullanici: Kullanici, basvuruId: number | string) {
  const req = await istekOlustur(payload, kullanici)
  return payload.update({
    collection: 'basvurular',
    id: basvuruId,
    data: { durum: 'geri-cekti' },
    user: kullanici as never,
    overrideAccess: false,
    req,
  })
}
