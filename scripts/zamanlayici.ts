/**
 * Node sunucusunda zamanlanmış işler (Cloudflare'deki Cron Triggers'ın karşılığı; K2, docs/goc-rehberi.md).
 * Uygulamayla aynı imajdan ayrı bir süreç olarak çalışır (docker-compose → zamanlayici). İşleri HTTP'ye çıkmadan,
 * Payload'un yerel API'siyle doğrudan çalıştırır; dışarıya açık bir adres ve gizli anahtar gerekmez.
 * Saatler `src/alan/zamanlama.ts`. İşler tekrar çalıştırılabilir; ikinci çalışma yalnızca biriken işi yapar.
 *
 *   pnpm exec tsx scripts/zamanlayici.ts            → sürekli çalışır, saati gelince işleri çalıştırır
 *   ZAMANLAYICI_SIMDI=1 pnpm exec tsx scripts/zamanlayici.ts → işleri hemen bir kez çalıştırır ve çıkar
 */
import { getPayload } from 'payload'
// `@payload-config` takma adı tsconfig'de Cloudflare yapılandırmasına çözülür; zamanlayıcı yalnızca Node'da çalışır.
// Uzantı `.js` yazılır: `.node` sonekini Node yerel eklenti sanıp `.ts` aramıyor.
import config from '../src/payload.config.node.js'
import { calismaAnahtari, cronIfadeleri } from '../src/alan/zamanlama'
import { zamanliIsleriCalistir } from '../src/servisler/zamanli'

const payload = await getPayload({ config })

async function calistir(neden: string) {
  const bas = Date.now()
  try {
    const sonuc = await zamanliIsleriCalistir(payload)
    if (sonuc.hatalar.length) console.error(`[zamanlayıcı] ${neden}: hatalarla bitti`, sonuc.hatalar)
    else console.log(`[zamanlayıcı] ${neden}: tamamlandı (${Date.now() - bas} ms)`, JSON.stringify(sonuc))
  } catch (e) {
    console.error(`[zamanlayıcı] ${neden}: çalışmadı`, e)
  }
}

if (process.env.ZAMANLAYICI_SIMDI === '1') {
  await calistir('elle')
  process.exit(0)
}

console.log(`[zamanlayıcı] başladı; çalışma saatleri (UTC cron): ${cronIfadeleri().join(', ')}`)
let son: string | null = null
let calisiyor = false
setInterval(async () => {
  const anahtar = calismaAnahtari(new Date())
  if (!anahtar || anahtar === son || calisiyor) return
  son = anahtar
  calisiyor = true
  await calistir(anahtar)
  calisiyor = false
}, 20_000)
