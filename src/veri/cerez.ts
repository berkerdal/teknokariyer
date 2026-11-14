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

export const rolAnaSayfasi = (rol: string) => (rol === 'aday' ? '/hesabim' : rol === 'firma' ? '/firma-paneli' : '/yonetim')
