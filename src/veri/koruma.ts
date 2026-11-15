/**
 * Formlar için ortak koruma: istek sınırı (IP özeti) ve bot doğrulaması (Turnstile). Sunucu eylemlerinde kullanılır.
 */
import { headers } from 'next/headers'
import type { SinirliEylem } from '@/alan/istekSiniri'
import { insanDogrula } from '@/altyapi/insanDogrulama'
import { sinirDenetle } from '@/servisler/istekSiniri'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from './payload'

/** İsteğin geldiği adres: Cloudflare'de `cf-connecting-ip`, başka sunucuda vekilin eklediği ilk adres. */
export async function istemciAdresi(): Promise<string> {
  const h = await headers()
  return h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'bilinmiyor'
}

/** IP adresine göre istek sınırı. */
export async function ipSiniri(eylem: SinirliEylem, siz = false) {
  await sinirDenetle(await payloadAl(), eylem, `ip:${await istemciAdresi()}`, siz)
}

/** Hesaba veya başka bir değere (ör. e-posta adresi) göre istek sınırı. */
export async function kaynakSiniri(eylem: SinirliEylem, kaynak: string, siz = false) {
  await sinirDenetle(await payloadAl(), eylem, kaynak, siz)
}

/** Turnstile doğrulaması; geçmezse formun üstünde görünen Türkçe hata. */
export async function insanDenetle(f: FormData, siz = false) {
  const sonuc = await insanDogrula(String(f.get('insan') ?? f.get('cf-turnstile-response') ?? ''), await istemciAdresi())
  if (sonuc === 'gecti' || sonuc === 'kapali') return
  if (sonuc === 'yok' || sonuc === 'kaldi')
    throw new FormHatasi({
      insan: siz
        ? 'Güvenlik doğrulaması tamamlanmadı. Formun altındaki doğrulamanın bitmesini bekleyip yeniden gönderin; sorun sürerse sayfayı yenileyin.'
        : 'Güvenlik doğrulaması tamamlanmadı. Formun altındaki doğrulamanın bitmesini bekleyip yeniden gönder; sorun sürerse sayfayı yenile.',
    })
  throw new IslemHatasi(
    siz
      ? 'Güvenlik doğrulaması şu an yapılamıyor. Biraz sonra yeniden deneyin; sorun sürerse info@pauteknokent.com.tr adresine bildirin.'
      : 'Güvenlik doğrulaması şu an yapılamıyor. Biraz sonra yeniden dene; sorun sürerse info@pauteknokent.com.tr adresine bildir.',
    400,
  )
}
