/**
 * Zamanlanmış işlerin giriş noktası. Worker'ın `scheduled` işleyicisi (worker.ts) bu adresi ağa çıkmadan, aynı
 * çalışma alanı içinde çağırır ve her çağrı için rastgele, tek kullanımlık bir anahtar üretir. Anahtar dışarıdan
 * bilinemez; dışarıdan gelen istek 404 alır. Elle çalıştırma Yönetici A.Ş. panelindeki eylemle yapılır.
 */
import { payloadAl } from '@/veri/payload'
import { zamanliIsleriCalistir } from '@/servisler/zamanli'

export const dynamic = 'force-dynamic'

const ANAHTAR = Symbol.for('teknokariyer.zamanli-anahtar')

export async function POST(istek: Request) {
  const g = globalThis as unknown as Record<symbol, string | undefined>
  const beklenen = g[ANAHTAR]
  const gelen = istek.headers.get('x-tk-zamanli')
  if (!beklenen || !gelen || gelen !== beklenen) return new Response(null, { status: 404 })
  g[ANAHTAR] = undefined // tek kullanımlık
  const sonuc = await zamanliIsleriCalistir(await payloadAl())
  if (sonuc.hatalar.length) console.error('Zamanlanmış işlerde hata', sonuc.hatalar)
  return Response.json(sonuc)
}
