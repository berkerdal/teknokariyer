/**
 * Yüklenen dosyaların ham içeriği (CV filigranı için). Sağlayıcıdan bağımsız: Cloudflare'de R2, Türkiye sunucusunda
 * S3 uyumlu depolama. Her yapılandırma (payload.config.ts / payload.config.node.ts) kendi okuyucusunu kaydeder.
 */
type Okuyucu = (anahtar: string) => Promise<Uint8Array | null>

const KUTU = '__teknokariyerDosyaOkuyucu'
const kutu = globalThis as unknown as Record<string, Okuyucu | undefined>

export function dosyaOkuyucusuAyarla(okuyucu: Okuyucu) {
  kutu[KUTU] = okuyucu
}

/** Dosyanın içeriği; dosya yoksa null. Okuyucu kaydedilmemişse hata verir (yapılandırma hatası). */
export async function dosyaIcerigi(anahtar: string): Promise<Uint8Array | null> {
  const okuyucu = kutu[KUTU]
  if (!okuyucu) throw new Error('Dosya okuyucusu kaydedilmemiş (payload yapılandırması).')
  return okuyucu(anahtar)
}
