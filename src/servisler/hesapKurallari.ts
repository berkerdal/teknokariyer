/** Şifre ve e-posta kuralları: hem tarayıcıda (canlı kural listesi) hem sunucuda kullanılır. Saf modül. */

export const SIFRE_EN_AZ = 10
export const SIFRE_EN_COK = 128

export interface SifreKurali {
  metin: string
  uyuyor: (s: string) => boolean
}
export const SIFRE_KURALLARI: SifreKurali[] = [
  { metin: `En az ${SIFRE_EN_AZ} karakter`, uyuyor: (s) => s.length >= SIFRE_EN_AZ },
  { metin: 'Bir rakam veya simge', uyuyor: (s) => /[^\p{L}]/u.test(s) },
]

/** Şifre hatası (alan altında gösterilecek metin) veya null. */
export function sifreHatasi(sifre: string): string | null {
  if (!sifre) return 'Bir şifre belirle.'
  if (sifre.length > SIFRE_EN_COK) return `Şifre en fazla ${SIFRE_EN_COK} karakter olabilir.`
  const eksik = SIFRE_KURALLARI.filter((k) => !k.uyuyor(sifre))
  if (eksik.length) return `Şifre şu kurala uymuyor: ${eksik.map((k) => k.metin.toLocaleLowerCase('tr')).join(', ')}.`
  return null
}

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const epostaGecerliMi = (e: string) => EPOSTA.test(e) && e.length <= 254
export const epostaNormallestir = (e: string) => e.trim().toLowerCase()
