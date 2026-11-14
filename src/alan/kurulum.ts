/**
 * Firma kurulumu (talimatlar 0.3; K3). Saf kurallar: huni, genel e-posta, adres adı, kişisel takip.
 */
import { normallestir } from './metin'

export type KurulumAsamasi = 'iskelet' | 'davet' | 'devralindi' | 'profil-tamam' | 'pasif'

export const ASAMA_ADI: Record<KurulumAsamasi, string> = {
  iskelet: 'İskelet',
  davet: 'Davet gönderildi',
  devralindi: 'Devralındı',
  'profil-tamam': 'Profil tamam',
  pasif: 'Pasif',
}

/** Huni basamakları; son basamak kayıttan değil ilanlardan hesaplanır. */
export const HUNI = ['iskelet', 'davet', 'devralindi', 'profil-tamam', 'ilk-ilan'] as const
export type HuniBasamagi = (typeof HUNI)[number]
export const HUNI_ADI: Record<HuniBasamagi, string> = { ...ASAMA_ADI, 'ilk-ilan': 'İlk ilan verildi' } as Record<HuniBasamagi, string>

/** Firmanın hunide ulaştığı en ileri basamak (0–4). Pasif firma huniye girmez (−1). */
export function huniBasamagi(f: { asama: string; ilkIlan: boolean }): number {
  if (f.asama === 'pasif') return -1
  if (f.ilkIlan) return 4
  return Math.max(0, HUNI.indexOf(f.asama as HuniBasamagi))
}

/** Her basamağa ulaşmış firma sayısı (ulaşılan basamak öncekileri de sayar: 121 → 64 → 41 …). */
export function huniSayilari(firmalar: Array<{ asama: string; ilkIlan: boolean }>): number[] {
  const sayi = HUNI.map(() => 0)
  for (const f of firmalar) {
    const b = huniBasamagi(f)
    for (let i = 0; i <= b; i++) sayi[i]!++
  }
  return sayi
}

const GENEL_ADLAR = ['info', 'bilgi', 'iletisim', 'contact', 'office', 'ofis', 'mail', 'hello', 'merhaba', 'destek', 'support', 'satis', 'sales', 'admin', 'webmaster', 'muhasebe', 'genel']

/** Davet kişiye özel olmalı: “info@” gibi genel kutular kişisel iş e-postası sayılmaz (talimatlar 0.3, 2). */
export function genelEpostaMi(eposta?: string | null): boolean {
  if (!eposta) return false
  const yerel = eposta.split('@')[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? ''
  return GENEL_ADLAR.includes(yerel)
}

export type YetkiliDurumu = 'tamam' | 'eksik' | 'genel'
export function yetkiliDurumu(f: { yetkiliAd?: string | null; yetkiliEposta?: string | null }): YetkiliDurumu {
  if (!f.yetkiliEposta?.trim() || !f.yetkiliAd?.trim()) return 'eksik'
  return genelEpostaMi(f.yetkiliEposta) ? 'genel' : 'tamam'
}

/** Firma sayfasının adres adı: “Kodpit Teknoloji” → “kodpit-teknoloji”. */
export function adresAdi(ad: string): string {
  return normallestir(ad)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Kişisel takip eşiği: davet veya devralma üzerinden bu kadar gün geçip ilerleme yoksa (3., 7., 14. gün hatırlatmalarından sonra). */
export const TAKIP_GUN = 14
