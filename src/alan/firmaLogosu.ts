/**
 * Firma logosu adları ve adresleri (K37). Saf fonksiyonlar.
 *
 * - Depodaki ad firma kimliğini taşır: `firma-12-logo-20261115-143205.png`. Her yükleme yeni bir dosyadır; eski logo
 *   silinir. Adın içinde firma adı olmadığı için firma adı değişince dosya adı yanıltmaz.
 * - Herkese açık adres dosyanın kimliğidir: `/firma-logosu/37`. Adres her yüklemede değişir, bu yüzden tarayıcıya ve
 *   ara önbelleklere (Cloudflare) “bir yıl değişmez” denebilir; logo değişince yeni adres kullanılır.
 */
export type LogoTuru = 'image/png' | 'image/jpeg' | 'image/webp'

export const LOGO_UZANTI: Record<LogoTuru, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/** UTC zaman damgasıyla depo adı: firma-<id>-logo-YYYYMMDD-HHMMSS.<uzantı> */
export function logoDosyaAdi(firmaId: number | string, tur: LogoTuru, simdi = new Date()): string {
  const d = simdi.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  return `firma-${firmaId}-logo-${d}.${LOGO_UZANTI[tur]}`
}

/** Firma kaydındaki logo alanından (kimlik veya doldurulmuş belge) herkese açık adres. */
export function logoAdresi(logo: unknown): string | null {
  const id = logo && typeof logo === 'object' ? (logo as { id?: unknown }).id : logo
  return typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)) ? `/firma-logosu/${id}` : null
}
