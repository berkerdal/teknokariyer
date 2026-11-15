/**
 * Cloudflare D1'e API üzerinden sorgu (betikler için). Hesap kimliği CF_HESAP'tan, veritabanı kimliği wrangler.jsonc'deki
 * D1 bağlantısından okunur. API anahtarı ortamdan gelir (CLOUDFLARE_API_TOKEN); bu çalışma ortamında vekil ekler.
 * Bir sorguda en fazla 100 bağlı parametre olabilir (D1 sınırı).
 */
import { readFileSync } from 'node:fs'

const hesap = process.env.CF_HESAP
if (!hesap) throw new Error('CF_HESAP (Cloudflare hesap kimliği) verilmeli.')
const wrangler = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
const vt = /"binding":\s*"D1"[\s\S]*?"database_id":\s*"([0-9a-f-]+)"/.exec(wrangler)?.[1]
if (!vt) throw new Error('wrangler.jsonc içinde D1 veritabanı kimliği bulunamadı.')

export async function d1Sorgu(metin: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const yanit = await fetch(`https://api.cloudflare.com/client/v4/accounts/${hesap}/d1/database/${vt}/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? 'vekil-ekler'}` },
    body: JSON.stringify({ sql: metin, params }),
  })
  const j = (await yanit.json()) as { success: boolean; errors?: Array<{ message: string }>; result?: Array<{ results: Record<string, unknown>[] }> }
  if (!j.success) throw new Error(`D1 hatası: ${j.errors?.map((e) => e.message).join('; ')}\nSorgu: ${metin.slice(0, 300)}`)
  return j.result?.[0]?.results ?? []
}
