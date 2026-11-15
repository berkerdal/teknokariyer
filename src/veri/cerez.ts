/**
 * Oturum çerezi: HttpOnly, SameSite=Lax, yayında Secure (talimatlar 12). Payload’un okuduğu adla yazılır.
 */
import { cookies } from 'next/headers'
import { payloadAl } from './payload'

async function cerezAdi() {
  const payload = await payloadAl()
  return `${payload.config.cookiePrefix || 'payload'}-token`
}

export async function oturumAc(token: string, bitis: Date) {
  ;(await cookies()).set(await cerezAdi(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: bitis,
  })
}

export async function oturumKapat() {
  ;(await cookies()).delete(await cerezAdi())
}

/** Giriş sonrası dönülecek adres: yalnızca site içi göreli adres kabul edilir (açık yönlendirme yok). */
export function guvenliDonus(donus: unknown, varsayilan: string): string {
  const d = typeof donus === 'string' ? donus : ''
  return d.startsWith('/') && !d.startsWith('//') && !d.startsWith('/\\') ? d : varsayilan
}

/** Girişten sonra gidilecek yer (kullanıcı isteği, 15.11.2026): aday portalın ana sayfasına, firma ve kurum kendi paneline. */
export const rolAnaSayfasi = (rol: string) => (rol === 'aday' ? '/' : rol === 'firma' ? '/firma-paneli' : '/yonetim')

/* İki aşamalı doğrulama: şifreli, kısa ömürlü çerezler (içerik src/servisler/ikiAdim.ts ile şifrelenir). */
const BEKLEYEN = 'tk-ikinci-adim'
const KURTARMA = 'tk-kurtarma-kodlari'
const kisaCerez = (son: Date) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', expires: son })

export async function bekleyenGirisYaz(paket: string, son: Date) {
  ;(await cookies()).set(BEKLEYEN, paket, kisaCerez(son))
}
export async function bekleyenGirisCerezi() {
  return (await cookies()).get(BEKLEYEN)?.value
}
export async function bekleyenGirisSil() {
  ;(await cookies()).delete(BEKLEYEN)
}
export async function kurtarmaCereziYaz(paket: string, son: Date) {
  ;(await cookies()).set(KURTARMA, paket, kisaCerez(son))
}
export async function kurtarmaCerezi() {
  return (await cookies()).get(KURTARMA)?.value
}
export async function kurtarmaCereziSil() {
  ;(await cookies()).delete(KURTARMA)
}

/** Cihaz anahtarı: tarayıcıya özgü rastgele değer (hesaba bağlı değil). Hesap yalnızca özetini “tanınan cihaz” olarak tutar. */
const CIHAZ = 'tk-cihaz'
export async function cihazAnahtari(olustur = false): Promise<string | undefined> {
  const c = await cookies()
  const v = c.get(CIHAZ)?.value
  if (v || !olustur) return v
  const yeni = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  c.set(CIHAZ, yeni, { ...kisaCerez(new Date(Date.now() + 400 * 86_400_000)) })
  return yeni
}
