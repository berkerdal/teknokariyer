/**
 * Worker giriş noktası: OpenNext'in ürettiği Worker'ı sarar.
 *
 * Neden: Next.js rota gruplarının adları parantezlidir; JS parçaları `/_next/static/chunks/app/(frontend)/...` altında
 * durur. Tarayıcı parantezleri `%28`/`%29` olarak kodlayıp ister. Cloudflare'in statik dosya sunucusu kodlanmış adı
 * bulamaz, istek Next'e düşer, Next de çözülmüş adrese 307 ile yönlendirir: sonsuz döngü (tarayıcıda “too many
 * redirects”, sayfa etkileşimsiz kalır). Burada kodlanmış statik dosya adresi çözülüp dosya doğrudan depodan verilir.
 *
 * `.open-next/worker.js` derlemede üretildiği için bu dosya tip denetimi ve lint dışındadır (tsconfig, eslint).
 */
import isleyici from './.open-next/worker.js'

interface Ortam {
  ASSETS: { fetch: (istek: Request) => Promise<Response> }
}

export default {
  async fetch(istek: Request, env: Ortam, ctx: unknown): Promise<Response> {
    const url = new URL(istek.url)
    // wrangler.jsonc'deki run_worker_first ile bu yol önce buraya gelir: kodlanmış da kodlanmamış da depodan verilir.
    if (url.pathname.startsWith('/_next/static/')) {
      if (/%2[89]/i.test(url.pathname)) url.pathname = decodeURIComponent(url.pathname)
      const yanit = await env.ASSETS.fetch(new Request(url.toString(), istek))
      if (yanit.ok) return yanit
    }
    return isleyici.fetch(istek, env, ctx)
  },
}

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
