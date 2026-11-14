/**
 * İlan oluşturma ve düzenleme (K1: ilan yönetimi ürünün en özenli kısmı; firma ilan üzerinde tam kontrole sahip).
 *
 * - Taslak eksik kaydedilebilir; taslak dışındaki ilan her kayıtta tam olmalıdır (`ilanEksikleri`).
 * - Yayındaki veya duraklatılmış ilanda esaslı alanlar (pozisyon adı, tür, çalışma şekli, ücret) güvenilir olmayan
 *   firmada hemen yayına girmez: `bekleyenDegisiklik` alanında Yönetici A.Ş. onayını bekler (talimatlar 0.1).
 *   Diğer değişiklikler hemen yansır.
 * - Her kayıt bir sürüm oluşturur (sürüm geçmişi).
 */
import type { Payload } from 'payload'
import type { Ilanlar } from '@/payload-types'
import { ESASLI_ALANLAR, duzenlemeSonucu, ilanEksikleri, sonBasvuruTarihiHatasi, type EsasliAlan } from '@/alan/ilan'
import type { IlanFormVerisi } from '@/alan/ilanFormu'
import { firmaKimligi, firmaYetkisiVarMi, moderasyonYapabilirMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { yetkiliIlan } from './ilanIslemleri'
import { FormHatasi, IslemHatasi, ayarlar, istekOlustur, kimlik, type Kullanici } from './ortak'

export interface KayitSonucu {
  ilan: Ilanlar
  /** Onay bekleyen esaslı alanlar (boşsa her şey hemen yansıdı) */
  onayaGiden: EsasliAlan[]
}

export interface BekleyenDegisiklik {
  alanlar: Partial<Record<EsasliAlan, unknown>>
  tarih: string
  isteyen: number | string
  /** Yönetici A.Ş. onaylamadıysa: firma gerekçeyi bir sonraki kayda kadar görür. */
  reddedildi?: boolean
  gerekce?: string
}

const YAYINDAKI = ['yayinda', 'duraklatildi']

async function tarihDenetle(payload: Payload, v: IlanFormVerisi, eski?: Ilanlar) {
  if (!v.sonBasvuru || v.sonBasvuru === eski?.sonBasvuru) return
  const a = await ayarlar(payload)
  const hata = sonBasvuruTarihiHatasi(new Date(v.sonBasvuru), new Date(), a.enUzunSureGun ?? undefined)
  if (hata === 'gecmis') throw new FormHatasi({ sonBasvuru: 'Son başvuru tarihi yarın veya daha sonraki bir gün olmalıdır.' })
  if (hata === 'cok-uzak') throw new FormHatasi({ sonBasvuru: `Son başvuru tarihi en fazla ${a.enUzunSureGun ?? 60} gün sonrası olabilir.` })
}

/** Karşılaştırma için kaydı formdaki biçime indirger (ilişkiler kimlik, dizi satırları kimliksiz). */
function karsilastirmaBicimi(i: Ilanlar): Record<string, unknown> {
  const id = (x: unknown) => kimlik(x)
  return {
    pozisyonAdi: i.pozisyonAdi,
    tur: i.tur ?? null,
    altTur: i.altTur ?? null,
    ucretEnAz: i.ucretEnAz ?? null,
    ucretEnCok: i.ucretEnCok ?? null,
    ucretGorunur: Boolean(i.ucretGorunur),
    aile: i.aile ? id(i.aile) : null,
  }
}

export async function ilanKaydet(payload: Payload, kullanici: Kullanici, ilanId: number | null, veri: IlanFormVerisi): Promise<KayitSonucu> {
  if (!moderasyonYapabilirMi(kullanici) && !firmaYetkisiVarMi(kullanici, ['yonetici', 'ilan-sorumlusu']))
    throw new IslemHatasi('İlan oluşturma ve düzenleme yetkiniz yok. Firma yöneticinizden yetki isteyin.', 403)
  const req = await istekOlustur(payload, kullanici)

  if (ilanId === null) {
    await tarihDenetle(payload, veri)
    const ilan = await payload.create({
      collection: 'ilanlar',
      data: { ...veri, firma: Number(firmaKimligi(kullanici)), durum: 'taslak' } as unknown as Ilanlar,
      overrideAccess: false,
      user: kullanici,
      req,
      depth: 0,
    })
    return { ilan, onayaGiden: [] }
  }

  const eski = await yetkiliIlan(payload, kullanici, ilanId, 'duzenle')
  await tarihDenetle(payload, veri, eski)
  if (eski.durum !== 'taslak') {
    const eksik = ilanEksikleri(veri as unknown as Record<string, unknown>)
    if (Object.keys(eksik).length) throw new FormHatasi(eksik)
  }

  let yeni: Partial<IlanFormVerisi> & { bekleyenDegisiklik?: BekleyenDegisiklik | null } = { ...veri }
  let onayaGiden: EsasliAlan[] = []
  if (YAYINDAKI.includes(eski.durum)) {
    const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(eski.firma), depth: 0, overrideAccess: true })
    const guvenilir = Boolean(firma.guvenilir) || moderasyonYapabilirMi(kullanici)
    const sonuc = duzenlemeSonucu(karsilastirmaBicimi(eski), { ...karsilastirmaBicimi(eski), ...pick(veri, ESASLI_ALANLAR) }, guvenilir)
    onayaGiden = sonuc.onaya
    if (onayaGiden.length) {
      const alanlar = Object.fromEntries(onayaGiden.map((a) => [a, veri[a as keyof IlanFormVerisi]]))
      for (const a of onayaGiden) delete (yeni as Record<string, unknown>)[a]
      yeni = { ...yeni, bekleyenDegisiklik: { alanlar, tarih: new Date().toISOString(), isteyen: kullanici.id } }
    } else if ((eski.bekleyenDegisiklik as unknown as BekleyenDegisiklik | null)?.reddedildi) {
      yeni = { ...yeni, bekleyenDegisiklik: null } // reddedilen değişikliğin notu bir sonraki kayıtta kalkar
    }
  }
  const ilan = await payload.update({
    collection: 'ilanlar',
    id: ilanId,
    data: yeni as unknown as Ilanlar,
    overrideAccess: true, // yetki yukarıda denetlendi; bekleyen değişiklik alanını servis yazar
    req,
    depth: 0,
  })
  if (onayaGiden.length)
    await islemKaydet(req, { islem: 'İlanda onay bekleyen değişiklik', tur: 'ilan', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { alanlar: onayaGiden } })
  return { ilan, onayaGiden }
}

function pick<T extends object>(o: T, anahtarlar: readonly string[]): Partial<T> {
  return Object.fromEntries(anahtarlar.filter((k) => k in o).map((k) => [k, (o as Record<string, unknown>)[k]])) as Partial<T>
}

/** Yönetici A.Ş.: bekleyen esaslı değişikliği yayına alır veya reddeder. */
export async function bekleyenDegisikligiSonuclandir(payload: Payload, kullanici: Kullanici, ilanId: number, onay: boolean, gerekce = '') {
  if (!moderasyonYapabilirMi(kullanici)) throw new IslemHatasi('Değişiklik onayı yalnızca Yönetici A.Ş. tarafından yapılır.', 403)
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true })
  const b = ilan.bekleyenDegisiklik as unknown as BekleyenDegisiklik | null
  if (!b?.alanlar || b.reddedildi) throw new IslemHatasi('Bu ilanda onay bekleyen değişiklik yok.', 409)
  if (!onay && !gerekce.trim()) throw new IslemHatasi('Firmaya değişikliği neden onaylamadığınızı yazın.')
  const req = await istekOlustur(payload, kullanici)
  const sonuc = await payload.update({
    collection: 'ilanlar',
    id: ilanId,
    data: (onay
      ? { ...b.alanlar, bekleyenDegisiklik: null }
      : { bekleyenDegisiklik: { ...b, reddedildi: true, gerekce: gerekce.trim() } }) as unknown as Partial<Ilanlar>,
    overrideAccess: true,
    req,
    depth: 0,
  })
  await islemKaydet(req, {
    islem: onay ? 'Bekleyen değişiklik onaylandı' : 'Bekleyen değişiklik reddedildi',
    tur: 'moderasyon',
    kayitTuru: 'ilanlar',
    kayitId: ilanId,
    ayrinti: { alanlar: Object.keys(b.alanlar), gerekce: gerekce || undefined },
  })
  return sonuc
}
