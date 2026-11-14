/**
 * Adayın kendi profili: CV yükleme ve silme, profil güncelleme, CV havuzu ayarları (talimatlar 5, 7; K24).
 * Her işlem yalnızca oturumdaki adayın kendi kaydına uygulanır.
 */
import type { Payload } from 'payload'
import type { Adaylar } from '@/payload-types'
import { adayMi } from '@/erisim'
import { surum } from '@/metinler'
import { FormHatasi } from './hesap'
import { IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

export const EN_FAZLA_CV = 3
export const CV_EN_BUYUK = 5 * 1024 * 1024

export async function kendiAdayKaydi(payload: Payload, kullanici: Kullanici): Promise<Adaylar> {
  if (!adayMi(kullanici)) throw new IslemHatasi('Bu işlem yalnızca aday hesabıyla yapılabilir.', 403)
  const { docs } = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullanici.id } }, depth: 1, limit: 1, overrideAccess: true })
  if (docs[0]) return docs[0]
  // Eski hesaplarda profil kaydı yoksa açılır.
  return payload.create({ collection: 'adaylar', data: { kullanici: kullanici.id, havuz: { gorunurluk: 'gizli' } } as never, overrideAccess: true, depth: 1 })
}

/** Dosya gerçekten PDF mi? Tarayıcının bildirdiği türe güvenilmez: başlığa ve sondaki xref/%%EOF işaretlerine bakılır. */
export function pdfMi(b: Uint8Array): boolean {
  const metin = (x: Uint8Array) => Array.from(x, (c) => String.fromCharCode(c)).join('')
  if (b.length < 16 || metin(b.subarray(0, 5)) !== '%PDF-') return false
  const son = metin(b.subarray(Math.max(0, b.length - 1024)))
  return son.includes('%%EOF') && son.includes('xref')
}

export interface CvGirdisi {
  ad: string
  dosya: { veri: Uint8Array; boyut: number }
}

/** CV yükler ve profile ekler. En fazla 3 CV; yalnızca PDF, en fazla 5 MB. Dosya adı kişisel bilgi taşımaz. */
export async function cvYukle(payload: Payload, kullanici: Kullanici, g: CvGirdisi): Promise<{ id: number; ad: string }> {
  const aday = await kendiAdayKaydi(payload, kullanici)
  const mevcut = aday.cvler ?? []
  if (mevcut.length >= EN_FAZLA_CV) throw new FormHatasi({ cvDosya: `En fazla ${EN_FAZLA_CV} CV saklayabilirsin. Yenisini yüklemeden önce birini sil.` })
  if (!g.dosya.boyut) throw new FormHatasi({ cvDosya: 'Bir PDF dosyası seç.' })
  if (g.dosya.boyut > CV_EN_BUYUK) throw new FormHatasi({ cvDosya: 'Dosya 5 MB’tan büyük. PDF’i sıkıştırıp tekrar yükle.' })
  if (!pdfMi(g.dosya.veri)) throw new FormHatasi({ cvDosya: 'Yalnızca PDF yüklenebilir ve dosya bozuk olmamalı. Belgeni PDF olarak yeniden kaydedip tekrar dene.' })
  const ad = (g.ad.trim() || `CV ${mevcut.length + 1}`).slice(0, 60)

  const req = await istekOlustur(payload, kullanici)
  const dosya = await payload.create({
    collection: 'dosyalar',
    data: { tur: 'cv', sahip: kullanici.id } as never,
    file: { data: Buffer.from(g.dosya.veri), mimetype: 'application/pdf', name: `cv-${aday.kod ?? aday.id}-${Date.now()}.pdf`, size: g.dosya.boyut },
    overrideAccess: true,
    req,
  })
  await payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { cvler: [...mevcut.map((c) => ({ ad: c.ad, dosya: kimlik(c.dosya) })), { ad, dosya: dosya.id }] },
    overrideAccess: true,
    req,
  })
  return { id: dosya.id, ad }
}

/** CV’yi profilden çıkarır ve dosyayı siler. Başvurulara eklenmiş CV, başvuru kaydında kalır (firma başvuru anındakini görür). */
export async function cvSil(payload: Payload, kullanici: Kullanici, dosyaId: number) {
  const aday = await kendiAdayKaydi(payload, kullanici)
  const cvler = aday.cvler ?? []
  if (!cvler.some((c) => kimlik(c.dosya) === dosyaId)) throw new IslemHatasi('Bu CV senin CV’lerin arasında değil.', 403)
  const req = await istekOlustur(payload, kullanici)
  await payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { cvler: cvler.filter((c) => kimlik(c.dosya) !== dosyaId).map((c) => ({ ad: c.ad, dosya: kimlik(c.dosya) })) },
    overrideAccess: true,
    req,
  })
  const kullanimda = await payload.count({ collection: 'basvurular', where: { cv: { equals: dosyaId } }, overrideAccess: true })
  if (!kullanimda.totalDocs) await payload.delete({ collection: 'dosyalar', id: dosyaId, overrideAccess: true, req })
}

/** Profil alanlarını günceller. Yalnızca izin verilen alanlar yazılır; kimlik ve havuz alanları buradan değişmez. */
export const PROFIL_ALANLARI = ['telefon', 'cinsiyet', 'tanitim', 'okul', 'bolum', 'sinif', 'mezuniyet', 'gano', 'deneyimSeviyesi', 'deneyimler', 'beceriler', 'diller', 'tercihler', 'sertifikalar', 'baglantilar', 'askerlik'] as const
export type ProfilGuncellemesi = Partial<Pick<Adaylar, (typeof PROFIL_ALANLARI)[number]>>

export async function profilGuncelle(payload: Payload, kullanici: Kullanici, veri: ProfilGuncellemesi): Promise<Adaylar> {
  const aday = await kendiAdayKaydi(payload, kullanici)
  const temiz = Object.fromEntries(Object.entries(veri).filter(([k, v]) => (PROFIL_ALANLARI as readonly string[]).includes(k) && v !== undefined))
  return payload.update({ collection: 'adaylar', id: aday.id, data: temiz, overrideAccess: true, req: await istekOlustur(payload, kullanici), depth: 1 })
}

/* ---------- CV havuzu (K24) ---------- */

export type Gorunurluk = 'aktif' | 'acik' | 'gizli'

/** Havuza katılır veya rızayı yeniler: rıza sürümüyle kaydedilir, 12 aylık süre yeniden başlar. */
export async function havuzaKatil(payload: Payload, kullanici: Kullanici, gorunurluk: Exclude<Gorunurluk, 'gizli'> = 'acik') {
  const aday = await kendiAdayKaydi(payload, kullanici)
  const req = await istekOlustur(payload, kullanici)
  await payload.create({ collection: 'rizalar', data: { kullanici: kullanici.id, tur: 'havuz', metinSurumu: surum('havuz') }, overrideAccess: true, req })
  return payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { havuz: { ...havuzAlani(aday), gorunurluk, rizaTarihi: new Date().toISOString() } },
    overrideAccess: true,
    req,
  })
}

/** Görünürlüğü değiştirir. Geçerli rıza yoksa “aktif” veya “açık” seçilemez (önce rıza). */
export async function havuzGorunurlugu(payload: Payload, kullanici: Kullanici, gorunurluk: Gorunurluk) {
  const aday = await kendiAdayKaydi(payload, kullanici)
  if (gorunurluk !== 'gizli' && !aday.havuz?.rizaTarihi) throw new IslemHatasi('Havuzda görünmek için önce açık rıza metnini onayla.', 400)
  return payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { havuz: { ...havuzAlani(aday), gorunurluk } },
    overrideAccess: true,
    req: await istekOlustur(payload, kullanici),
  })
}

/** Rızayı geri alır: profil havuzdan hemen çıkar, rıza tarihi silinir. Geri alma da kayda geçer. */
export async function havuzRizasiniGeriAl(payload: Payload, kullanici: Kullanici) {
  const aday = await kendiAdayKaydi(payload, kullanici)
  const req = await istekOlustur(payload, kullanici)
  await payload.create({
    collection: 'rizalar',
    data: { kullanici: kullanici.id, tur: 'havuz', metinSurumu: surum('havuz'), geriAlinma: new Date().toISOString() },
    overrideAccess: true,
    req,
  })
  return payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { havuz: { ...havuzAlani(aday), gorunurluk: 'gizli', rizaTarihi: null } },
    overrideAccess: true,
    req,
  })
}

/** Profili belirli firmalardan gizler (ör. mevcut işveren). */
export async function gizlenenFirmalar(payload: Payload, kullanici: Kullanici, firmaIdleri: number[]) {
  const aday = await kendiAdayKaydi(payload, kullanici)
  return payload.update({
    collection: 'adaylar',
    id: aday.id,
    data: { havuz: { ...havuzAlani(aday), gizlenenFirmalar: [...new Set(firmaIdleri)].slice(0, 20) } },
    overrideAccess: true,
    req: await istekOlustur(payload, kullanici),
  })
}

function havuzAlani(a: Adaylar) {
  return {
    gorunurluk: a.havuz?.gorunurluk ?? 'gizli',
    rizaTarihi: a.havuz?.rizaTarihi ?? null,
    gizlenenFirmalar: (a.havuz?.gizlenenFirmalar ?? []).map(kimlik),
  }
}
