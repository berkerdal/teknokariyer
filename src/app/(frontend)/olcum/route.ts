/**
 * Sayfa görüntüleme ölçümü (çerezsiz; src/alan/trafik.ts). Tarayıcı `navigator.sendBeacon` ile yol, yönlendiren adres
 * ve bağlantıdaki kaynak işaretini gönderir. IP adresi ve tarayıcı kimliği saklanmaz; tarayıcı kimliğinden yalnızca
 * cihaz türü çıkarılır. Firma ve Yönetici A.Ş. kullanıcılarının gezinmesi sayılmaz (site trafiği değil, iş kullanımı).
 * Yanıt her zaman 204: ölçüm hatası ziyaretçiyi etkilemez.
 */
import { cookies } from 'next/headers'
import { olayKaydet } from '@/servisler/trafik'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

const bos = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

export async function POST(istek: Request) {
  try {
    // Başka sitelerden gönderilen istekleri sayma (tarayıcılar bu başlığı değiştirilemez biçimde ekler).
    const kaynakSite = istek.headers.get('sec-fetch-site')
    if (kaynakSite && kaynakSite !== 'same-origin') return bos()
    const govde = await istek.text()
    if (govde.length > 2048) return bos()
    const v = JSON.parse(govde) as { yol?: unknown; onceki?: unknown; isaret?: unknown }
    if (typeof v.yol !== 'string') return bos()
    if ((await cookies()).has('payload-token')) {
      const k = await oturum()
      if (k && k.rol !== 'aday') return bos()
    }
    await olayKaydet(await payloadAl(), {
      yol: v.yol,
      yonlendiren: typeof v.onceki === 'string' ? v.onceki.slice(0, 500) : '',
      isaret: typeof v.isaret === 'string' ? v.isaret.slice(0, 40) : null,
      ua: istek.headers.get('user-agent'),
      kendiSite: new URL(istek.url).origin,
    })
  } catch {
    // Bozuk gövde veya geçici veritabanı hatası: sessizce geç (ölçüm, sayfanın çalışmasını etkilemez).
  }
  return bos()
}
