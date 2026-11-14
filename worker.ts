/**
 * Worker giriş noktası: OpenNext'in ürettiği Worker'ı sarar.
 *
 * Neden: Next.js rota gruplarının adları parantezli, dinamik rotalar köşeli parantezlidir; JS parçaları `/_next/static/chunks/app/(frontend)/...` altında
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

const ZAMANLI_ANAHTAR = Symbol.for('teknokariyer.zamanli-anahtar')

export default {
  async fetch(istek: Request, env: Ortam, ctx: unknown): Promise<Response> {
    const url = new URL(istek.url)
    // Zamanlanmış iş adresi yalnızca aşağıdaki scheduled işleyicisinden çağrılır; dışarıdan gelen istek Next'e ulaşmaz.
    if (url.pathname === '/yonetim-islem/zamanli') return new Response(null, { status: 404 })
    // wrangler.jsonc'deki run_worker_first ile bu yol önce buraya gelir: kodlanmış da kodlanmamış da depodan verilir.
    if (url.pathname.startsWith('/_next/static/')) {
      // Rota adlarındaki ( ) [ ] gibi karakterler kodlanmış gelebilir; depoda dosyalar çözülmüş adlarıyla durur.
      if (url.pathname.includes('%')) {
        try {
          url.pathname = decodeURIComponent(url.pathname)
        } catch {
          /* bozuk kodlama: olduğu gibi denenir */
        }
      }
      const yanit = await env.ASSETS.fetch(new Request(url.toString(), istek))
      // 304 (tarayıcı önbelleği doğrulaması) de geçerli yanıttır; yalnızca dosya yoksa Next'e devredilir.
      // (İlk sürümde yalnızca 200 kabul ediliyordu: ikinci istekte 304 Next'e düşüp 307 döngüsü başlatıyordu.)
      if (yanit.status !== 404) return yanit
    }
    return isleyici.fetch(istek, env, ctx)
  },

  /**
   * Zamanlanmış işler (wrangler.jsonc → triggers.crons): süresi dolan ilanların kapanması, davet ve profil
   * hatırlatmaları. İstek ağa çıkmaz; aynı çalışma alanındaki Next uygulamasına tek kullanımlık rastgele anahtarla iletilir.
   */
  async scheduled(_olay: unknown, env: Ortam, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> {
    const anahtar = crypto.randomUUID()
    ;(globalThis as unknown as Record<symbol, string | undefined>)[ZAMANLI_ANAHTAR] = anahtar
    const istek = new Request('https://zamanli.ic/yonetim-islem/zamanli', { method: 'POST', headers: { 'x-tk-zamanli': anahtar } })
    const is = isleyici.fetch(istek, env, ctx).then(async (y: Response) => {
      const metin = await y.text()
      if (!y.ok) console.error('Zamanlanmış işler başarısız', y.status, metin.slice(0, 500))
      else console.log('Zamanlanmış işler tamamlandı', metin.slice(0, 500))
    })
    ctx.waitUntil(is)
    await is
  },
}

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
