/**
 * Firma profili (talimatlar 3; K3). Firma yalnızca kendi profilinin tanıtım alanlarını düzenler; unvan, kısa ad,
 * Teknokent'teki yeri, kurulum aşaması ve güvenilirlik Yönetici A.Ş.'ye aittir.
 * Profil logo, kısa tanıtım ve sektör dolunca “yayına hazır” olur ve herkese açık firma sayfasında görünür.
 */
import type { Payload } from 'payload'
import type { Firmalar } from '@/payload-types'
import { firmaKimligi, firmaYetkisiVarMi, yoneticiMi } from '@/erisim'
import { logoDosyaAdi } from '@/alan/firmaLogosu'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { logoyuKirp } from '@/altyapi/logoKirp'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export const CALISAN_ARALIKLARI = ['1–9', '10–49', '50–99', '100–249', '250+'] as const
export const LOGO_EN_BUYUK = 1024 * 1024

export interface FirmaProfiliGirdisi {
  kisaTanitim: string
  uzunTanitim: string
  web: string
  sektor: number | null
  teknolojiler: number[]
  calismaModelleri: string[]
  yanHaklar: string[]
  kurulusYili: number | null
  calisanAraligi: string | null
}

function yetki(k: Kullanici) {
  if (!firmaYetkisiVarMi(k, ['yonetici'])) throw new IslemHatasi('Firma profilini yalnızca firmanın tam yetkili kullanıcıları düzenleyebilir.', 403)
  return Number(firmaKimligi(k))
}

/** Web adresini https ile tamamlar; geçersizse hata. */
export function webAdresi(ham: string): string | null {
  const s = ham.trim()
  if (!s) return null
  const tam = /^https?:\/\//i.test(s) ? s : `https://${s}`
  try {
    const u = new URL(tam)
    if (!u.hostname.includes('.') || !['http:', 'https:'].includes(u.protocol)) return ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

export async function firmaProfiliGuncelle(payload: Payload, k: Kullanici, g: FirmaProfiliGirdisi): Promise<Firmalar> {
  const firmaId = yetki(k)
  const hatalar: Record<string, string> = {}
  if (g.kisaTanitim.length > 300) hatalar.kisaTanitim = 'Kısa tanıtım en fazla 300 karakter olabilir.'
  if (g.uzunTanitim.length > 4000) hatalar.uzunTanitim = '“Burada çalışmak nasıl?” metni en fazla 4000 karakter olabilir.'
  const web = webAdresi(g.web)
  if (web === '') hatalar.web = 'Web adresini www.firmaniz.com.tr biçiminde yazın.'
  const yil = new Date().getFullYear()
  if (g.kurulusYili !== null && (!Number.isInteger(g.kurulusYili) || g.kurulusYili < 1950 || g.kurulusYili > yil))
    hatalar.kurulusYili = `Kuruluş yılını 1950 ile ${yil} arasında dört haneli yazın.`
  if (g.calisanAraligi && !(CALISAN_ARALIKLARI as readonly string[]).includes(g.calisanAraligi)) hatalar.calisanAraligi = 'Çalışan sayısı aralığını listeden seçin.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  const req = await istekOlustur(payload, k)
  const sonuc = await payload.update({
    collection: 'firmalar',
    id: firmaId,
    data: {
      kisaTanitim: g.kisaTanitim.trim() || null,
      uzunTanitim: g.uzunTanitim.trim() || null,
      web,
      sektor: g.sektor,
      teknolojiler: g.teknolojiler.slice(0, 30),
      calismaModelleri: g.calismaModelleri.filter((m) => ['ofiste', 'hibrit', 'uzaktan'].includes(m)) as Firmalar['calismaModelleri'],
      yanHaklar: [...new Set(g.yanHaklar.map((y) => y.trim()).filter(Boolean))].slice(0, 20).map((ad) => ({ ad })),
      kurulusYili: g.kurulusYili,
      calisanAraligi: g.calisanAraligi as Firmalar['calisanAraligi'],
    },
    overrideAccess: true, // yetki yukarıda denetlendi; Yönetici A.Ş. alanları veride yok
    req,
    depth: 0,
  })
  await islemKaydet(req, { islem: 'Firma profili güncellendi', tur: 'kurulum', kayitTuru: 'firmalar', kayitId: firmaId })
  return sonuc
}

/** Dosyanın ilk baytlarından görsel türü (uzantıya güvenilmez). */
export function gorselTuru(b: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

/**
 * Firma logosu (K37). Firmanın tam yetkilisi kendi firmasına, Yönetici A.Ş. tam yetkilisi herhangi bir firmaya yükler.
 * Depodaki ad firma kimliğini taşır (`firma-12-logo-…png`); eski logo dosyası silinir. Herkese açık adres dosya
 * kimliğidir (`/firma-logosu/<id>`), her yüklemede değiştiği için uzun süre önbelleklenebilir.
 * Çevredeki boşluk yüklemede kırpılır (`logoyuKirp`); PNG ve JPEG kırpılınca PNG olarak saklanır, WebP olduğu gibi kalır.
 */
export async function firmaLogosuYukle(payload: Payload, k: Kullanici, dosya: { veri: Uint8Array; boyut: number }, hedefFirmaId?: number) {
  let firmaId: number
  if (hedefFirmaId !== undefined) {
    if (!yoneticiMi(k)) throw new IslemHatasi('Firma logosunu yalnızca tam yetkili Yönetici A.Ş. kullanıcıları değiştirebilir.', 403)
    firmaId = hedefFirmaId
  } else firmaId = yetki(k)
  if (!dosya.boyut) throw new FormHatasi({ logo: 'Bir logo dosyası seçin.' })
  if (dosya.boyut > LOGO_EN_BUYUK) throw new FormHatasi({ logo: 'Logo dosyası 1 MB’tan büyük olamaz.' })
  const gelenTur = gorselTuru(dosya.veri)
  if (!gelenTur) throw new FormHatasi({ logo: 'Logo PNG, JPEG veya WebP biçiminde olmalı. SVG güvenlik nedeniyle kabul edilmiyor.' })
  // Çevredeki beyaz veya saydam boşluk kırpılır; logo kutuda büyük görünür (src/alan/logoKirpma.ts).
  const kirpma = logoyuKirp(dosya.veri, gelenTur, LOGO_EN_BUYUK)
  const tur = kirpma.tur
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!firma) throw new IslemHatasi('Firma bulunamadı.', 404)
  const req = await istekOlustur(payload, k)
  const l = firma.logo
  const eski: number | null = l == null ? null : typeof l === 'number' ? l : l.id
  const yeni = await payload.create({
    collection: 'dosyalar',
    data: { tur: 'logo', alt: `${firma.kisaAd} logosu`, sahip: k.id } as never,
    file: { data: Buffer.from(kirpma.veri), mimetype: tur, name: logoDosyaAdi(firmaId, tur), size: kirpma.veri.byteLength },
    overrideAccess: true,
    req,
  })
  await payload.update({ collection: 'firmalar', id: firmaId, data: { logo: yeni.id }, overrideAccess: true, req })
  if (eski) {
    // Eski logo başka bir firmada kullanılmıyorsa silinir (depoda sahipsiz dosya kalmasın).
    const baska = await payload.count({ collection: 'firmalar', where: { logo: { equals: eski } }, overrideAccess: true, req })
    if (!baska.totalDocs)
      await payload.delete({ collection: 'dosyalar', id: eski, overrideAccess: true, req }).catch((): null => null)
  }
  await islemKaydet(req, {
    islem: 'Firma logosu değişti',
    tur: 'kurulum',
    kayitTuru: 'firmalar',
    kayitId: firmaId,
    ...(kirpma.kirpildi ? { ayrinti: { kirpildi: `${kirpma.once!.w}×${kirpma.once!.h} → ${kirpma.sonra!.w}×${kirpma.sonra!.h}` } } : {}),
  })
  return yeni
}
