/**
 * Firmanın ilan işlemleri ve Yönetici A.Ş. moderasyonu (K1, K4; talimatlar 0.1, 4).
 */
import type { Payload } from 'payload'
import type { Ilanlar } from '@/payload-types'
import {
  islemYapilabilirMi,
  yayinaGonderSonucu,
  sonBasvuruTarihiHatasi,
  KAPATMA_NEDENLERI,
  type FirmaIslemi,
  type IlanDurumu,
  type KapatmaNedeni,
  VARSAYILAN_EN_UZUN_SURE_GUN,
  VARSAYILAN_ONAYLI_ILAN_SAYISI,
  ilanKopyasi,
} from '@/alan/ilan'
import { firmaKimligi, firmaYetkisiVarMi, moderasyonYapabilirMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { trGunBasi } from '@/alan/tarih'
import { IslemHatasi, ayarlar, istekOlustur, kimlik, type Kullanici } from './ortak'

const ISLEM_ADI: Record<FirmaIslemi, string> = {
  'yayina-gonder': 'yayına gönderilemez',
  duzenle: 'düzenlenemez',
  duraklat: 'duraklatılamaz',
  'yeniden-baslat': 'yeniden başlatılamaz',
  'sure-uzat': 'süresi uzatılamaz',
  kapat: 'kapatılamaz',
  'yeniden-yayinla': 'yeniden yayınlanamaz',
  kopyala: 'kopyalanamaz',
  sil: 'silinemez',
}

/** İlanı okur ve kullanıcının bu ilan üzerinde firma işlemi yapma yetkisini denetler. */
async function yetkiliIlan(payload: Payload, kullanici: Kullanici, ilanId: number | string, islem: FirmaIslemi): Promise<Ilanlar> {
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!ilan) throw new IslemHatasi('İlan bulunamadı.', 404)
  const kurum = moderasyonYapabilirMi(kullanici)
  const kendiFirmasi = firmaYetkisiVarMi(kullanici, ['yonetici', 'ilan-sorumlusu']) && kimlik(ilan.firma) === Number(firmaKimligi(kullanici))
  if (!kurum && !kendiFirmasi) throw new IslemHatasi('Bu ilan üzerinde işlem yetkiniz yok.', 403)
  if (!islemYapilabilirMi(islem, ilan.durum as IlanDurumu))
    throw new IslemHatasi(`Bu ilan şu anki durumunda ${ISLEM_ADI[islem]}.`, 409)
  return ilan
}

async function durumYaz(payload: Payload, kullanici: Kullanici, ilanId: number | string, veri: Partial<Ilanlar>): Promise<Ilanlar> {
  const req = await istekOlustur(payload, kullanici)
  return payload.update({ collection: 'ilanlar', id: ilanId, data: veri, overrideAccess: true, req, depth: 0 })
}

/** Taslak veya düzeltilmiş ilanı yayına gönderir. Sonuç: doğrudan yayın veya onay kuyruğu (K4). */
export async function yayinaGonder(payload: Payload, kullanici: Kullanici, ilanId: number | string) {
  const ilan = await yetkiliIlan(payload, kullanici, ilanId, 'yayina-gonder')
  const a = await ayarlar(payload)
  const hata = sonBasvuruTarihiHatasi(new Date(ilan.sonBasvuru), new Date(), a.enUzunSureGun ?? VARSAYILAN_EN_UZUN_SURE_GUN)
  if (hata === 'gecmis') throw new IslemHatasi('Son başvuru tarihi geçmiş. Yeni bir tarih seçip tekrar gönderin.')
  if (hata === 'cok-uzak') throw new IslemHatasi(`Son başvuru tarihi en fazla ${a.enUzunSureGun ?? VARSAYILAN_EN_UZUN_SURE_GUN} gün sonrası olabilir.`)
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(ilan.firma), depth: 0, overrideAccess: true })
  const sonuc = yayinaGonderSonucu(
    { guvenilir: Boolean(firma.guvenilir), onaylanmisIlanSayisi: firma.onaylanmisIlanSayisi ?? 0 },
    a.onayliIlanSayisi ?? VARSAYILAN_ONAYLI_ILAN_SAYISI,
  )
  return durumYaz(payload, kullanici, ilanId, {
    durum: sonuc,
    duzeltmeGerekcesi: null,
    ...(sonuc === 'yayinda' ? { yayinTarihi: new Date().toISOString() } : {}),
  })
}

export async function duraklat(payload: Payload, kullanici: Kullanici, ilanId: number | string) {
  await yetkiliIlan(payload, kullanici, ilanId, 'duraklat')
  return durumYaz(payload, kullanici, ilanId, { durum: 'duraklatildi' })
}

export async function yenidenBaslat(payload: Payload, kullanici: Kullanici, ilanId: number | string) {
  const ilan = await yetkiliIlan(payload, kullanici, ilanId, 'yeniden-baslat')
  if (new Date(ilan.sonBasvuru) < new Date()) throw new IslemHatasi('Son başvuru tarihi geçmiş. Önce süreyi uzatın.')
  return durumYaz(payload, kullanici, ilanId, { durum: 'yayinda' })
}

/** Son başvuru tarihini uzatır; en fazla ayarlardaki gün sınırı kadar ileri (talimatlar 0.1). */
export async function sureUzat(payload: Payload, kullanici: Kullanici, ilanId: number | string, yeniTarih: Date) {
  const ilan = await yetkiliIlan(payload, kullanici, ilanId, 'sure-uzat')
  const a = await ayarlar(payload)
  const sinir = a.enUzunSureGun ?? VARSAYILAN_EN_UZUN_SURE_GUN
  const hata = sonBasvuruTarihiHatasi(yeniTarih, new Date(), sinir)
  if (hata === 'gecmis') throw new IslemHatasi('Yeni tarih yarın veya daha sonrası olmalı.')
  if (hata === 'cok-uzak') throw new IslemHatasi(`Yeni tarih en fazla ${sinir} gün sonrası olabilir.`)
  if (yeniTarih <= new Date(ilan.sonBasvuru)) throw new IslemHatasi('Yeni tarih, mevcut son başvuru tarihinden sonra olmalı.')
  return durumYaz(payload, kullanici, ilanId, { sonBasvuru: yeniTarih.toISOString() })
}

export async function kapat(payload: Payload, kullanici: Kullanici, ilanId: number | string, neden: KapatmaNedeni) {
  if (!(neden in KAPATMA_NEDENLERI)) throw new IslemHatasi('Bir kapatma nedeni seçin.')
  await yetkiliIlan(payload, kullanici, ilanId, 'kapat')
  return durumYaz(payload, kullanici, ilanId, { durum: 'kapandi', kapanisNedeni: neden })
}

/** İlanı kopyalayıp yeni taslak açar: tarih, durum ve sayaçlar sıfırlanır. Kapanmış ilanı “yeniden yayınlama” da budur. */
export async function kopyala(payload: Payload, kullanici: Kullanici, ilanId: number | string) {
  const ilan = await yetkiliIlan(payload, kullanici, ilanId, 'kopyala')
  const req = await istekOlustur(payload, kullanici)
  const kopya = ilanKopyasi(ilan as unknown as Record<string, unknown>)
  delete kopya.arama
  // Son başvuru tarihi zorunlu; kopyada geçici olarak yarına ayarlanır, firma yayına göndermeden önce seçer.
  const yarin = new Date(Date.now() + 86_400_000).toISOString()
  return payload.create({
    collection: 'ilanlar',
    data: { ...(kopya as Partial<Ilanlar>), sonBasvuru: yarin, durum: 'taslak' } as Ilanlar,
    overrideAccess: true,
    req,
    depth: 0,
  })
}

/* ---------- Moderasyon (Yönetici A.Ş.) ---------- */

function moderasyonYetkisi(kullanici: Kullanici) {
  if (!moderasyonYapabilirMi(kullanici)) throw new IslemHatasi('İlan onayı yalnızca Yönetici A.Ş. tarafından yapılır.', 403)
}

/** Onaydaki ilanı yayınlar ve firmanın onaylanmış ilan sayısını artırır (K4). */
export async function onayla(payload: Payload, kullanici: Kullanici, ilanId: number | string) {
  moderasyonYetkisi(kullanici)
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true })
  if (ilan.durum !== 'onayda') throw new IslemHatasi('Yalnızca onaydaki ilan onaylanabilir.', 409)
  const req = await istekOlustur(payload, kullanici)
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(ilan.firma), depth: 0, overrideAccess: true })
  await payload.update({
    collection: 'firmalar',
    id: firma.id,
    data: { onaylanmisIlanSayisi: (firma.onaylanmisIlanSayisi ?? 0) + 1 },
    overrideAccess: true,
    req,
  })
  return payload.update({
    collection: 'ilanlar',
    id: ilanId,
    data: { durum: 'yayinda', yayinTarihi: new Date().toISOString(), duzeltmeGerekcesi: null },
    overrideAccess: true,
    req,
    depth: 0,
  })
}

/** Ret yerine düzeltme ister: gerekçe firmaya yazılır, ilan düzeltilip yeniden gönderilebilir. */
export async function duzeltmeIste(payload: Payload, kullanici: Kullanici, ilanId: number | string, gerekce: string) {
  moderasyonYetkisi(kullanici)
  if (!gerekce?.trim()) throw new IslemHatasi('Firmaya ne düzeltmesi gerektiğini yazın.')
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true })
  if (ilan.durum !== 'onayda') throw new IslemHatasi('Yalnızca onaydaki ilan için düzeltme istenebilir.', 409)
  const req = await istekOlustur(payload, kullanici)
  return payload.update({
    collection: 'ilanlar',
    id: ilanId,
    data: { durum: 'duzeltme', duzeltmeGerekcesi: gerekce.trim() },
    overrideAccess: true,
    req,
    depth: 0,
  })
}

/** Yayından kaldırma (şikâyet sonrası). */
export async function yayindanKaldir(payload: Payload, kullanici: Kullanici, ilanId: number | string, gerekce: string) {
  moderasyonYetkisi(kullanici)
  const req = await istekOlustur(payload, kullanici)
  await islemKaydet(req, { islem: 'İlan yayından kaldırıldı', tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { gerekce } })
  return payload.update({ collection: 'ilanlar', id: ilanId, data: { durum: 'kapandi', kapanisNedeni: 'moderasyon' }, overrideAccess: true, req, depth: 0 })
}

/* ---------- Zamanlanmış iş ---------- */

/** Son başvuru günü geçmiş yayındaki ve duraklatılmış ilanları "süresi doldu" yapar (ölü ilan kalmaz; talimatlar 1). */
export async function suresiDolanlariKapat(payload: Payload, simdi = new Date()): Promise<number> {
  const bugunBasi = trGunBasi(simdi).toISOString() // Türkiye saatiyle bugünün başı
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { and: [{ durum: { in: ['yayinda', 'duraklatildi'] } }, { sonBasvuru: { less_than: bugunBasi } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  for (const ilan of docs)
    await payload.update({ collection: 'ilanlar', id: ilan.id, data: { durum: 'suresi-doldu', kapanisNedeni: 'sure' }, overrideAccess: true })
  return docs.length
}
