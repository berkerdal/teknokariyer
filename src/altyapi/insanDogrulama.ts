/**
 * Bot koruması: Cloudflare Turnstile (talimatlar 12). Kayıt, giriş ve şifre yenileme formlarında.
 *
 * - Yayın: TURNSTILE_SITE_ANAHTARI ve TURNSTILE_GIZLI_ANAHTAR gerekir. Eksikse doğrulama başarısız sayılır (kapalı hata);
 *   aksi hâlde yapılandırma unutulduğunda bot koruması sessizce kapanırdı.
 * - Test ortamı: anahtar verilmediyse Cloudflare'in herkese açık test anahtarları kullanılır (her zaman geçer, araç
 *   ekranda “yalnızca test” yazar). Akış yine uçtan uca çalışır.
 * - Geliştirme: anahtar verilmediyse bot koruması kapalıdır.
 * Sağlayıcı değişirse (ör. Türkiye'deki sunucu) yalnızca bu dosya ve `InsanDogrulama` bileşeni değişir; Turnstile
 * Cloudflare dışındaki sunucularda da çalışır.
 */
import { ortam } from './eposta'

export const TEST_SITE_ANAHTARI = '1x00000000000000000000AA'
const TEST_GIZLI_ANAHTAR = '1x0000000000000000000000000000000AA'
const DOGRULAMA_ADRESI = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

function anahtarlar(): { site: string; gizli: string } | null {
  const site = process.env.TURNSTILE_SITE_ANAHTARI
  const gizli = process.env.TURNSTILE_GIZLI_ANAHTAR
  if (site && gizli) return { site, gizli }
  const o = ortam()
  if (o === 'test') return { site: TEST_SITE_ANAHTARI, gizli: TEST_GIZLI_ANAHTAR }
  if (o === 'yayin') return { site: '', gizli: '' }
  return null
}

/** Formlara verilecek site anahtarı; bot koruması kapalıysa null. */
export function insanDogrulamaSiteAnahtari(): string | null {
  return anahtarlar()?.site ?? null
}

export type InsanSonucu = 'gecti' | 'kapali' | 'yok' | 'kaldi' | 'yapilandirilmamis' | 'ulasilamadi'

/** Formdan gelen Turnstile anahtarını Cloudflare'e doğrulatır. */
export async function insanDogrula(token: string | null | undefined, ip?: string): Promise<InsanSonucu> {
  const a = anahtarlar()
  if (!a) return 'kapali'
  if (!a.gizli) {
    console.error('Turnstile anahtarları yayın ortamında tanımlı değil; formlar reddediliyor.')
    return 'yapilandirilmamis'
  }
  if (!token) return 'yok'
  const govde = new FormData()
  govde.set('secret', a.gizli)
  govde.set('response', token)
  if (ip && ip !== 'bilinmiyor') govde.set('remoteip', ip)
  try {
    const r = await fetch(process.env.TURNSTILE_DOGRULAMA_ADRESI || DOGRULAMA_ADRESI, { method: 'POST', body: govde, signal: AbortSignal.timeout(8000) })
    const j = (await r.json()) as { success?: boolean }
    return j.success ? 'gecti' : 'kaldi'
  } catch (e) {
    console.error('Turnstile doğrulama sunucusuna ulaşılamadı', e)
    return 'ulasilamadi'
  }
}
