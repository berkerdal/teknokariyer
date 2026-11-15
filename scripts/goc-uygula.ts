/**
 * Göçleri Cloudflare D1'e API üzerinden, sırayla uygular (CLAUDE.md: Worker'ın ilk istekte göç çalıştırması eş zamanlı
 * isteklerde yarım kalıyordu). Trafik yeni koda geçmeden önce çalıştırılır.
 *
 * Kullanım:
 *   CF_HESAP=<hesap kimliği> pnpm exec tsx scripts/goc-uygula.ts            → yalnızca neyin uygulanacağını yazar
 *   CF_HESAP=<hesap kimliği> pnpm exec tsx scripts/goc-uygula.ts --uygula   → uygular
 *
 * API anahtarı ortamdan gelir (CLOUDFLARE_API_TOKEN). Bu çalışma ortamında vekil sunucu anahtarı kendisi ekler.
 * Veritabanı kimliği wrangler.jsonc'deki D1 bağlantısından okunur.
 * Göçler yalnızca `db.run(sql...)` ve `db.all(sql...)` kullanmalı ve parametre içermemelidir (Drizzle'ın ürettiği hâl).
 */
import { migrations } from '../src/migrations'
import { d1Sorgu as sorgu } from './d1'

const uygula = process.argv.includes('--uygula')

/** Drizzle `sql` nesnesini metne çevirir. Parametre varsa durur (göçlerde beklenmez). */
function metne(s: unknown): string {
  const parcalar = (s as { queryChunks?: unknown[] }).queryChunks
  if (!parcalar) throw new Error('Beklenmeyen sorgu nesnesi.')
  return parcalar
    .map((c) => {
      if (c && typeof c === 'object' && 'value' in c) return (c as { value: string[] }).value.join('')
      if (c && typeof c === 'object' && 'queryChunks' in c) return metne(c)
      throw new Error('Göçte parametreli sorgu var; bu betik desteklemiyor.')
    })
    .join('')
}

let sayac = 0
const db = {
  run: async (s: unknown) => {
    sayac++
    await sorgu(metne(s))
  },
  all: async (s: unknown) => sorgu(metne(s)),
}

const uygulanan = new Set((await sorgu('SELECT name FROM payload_migrations')).map((r) => String(r.name)))
const bekleyen = migrations.filter((m) => !uygulanan.has(m.name))
console.log(`Uygulanmış: ${[...uygulanan].join(', ') || 'yok'}`)
console.log(`Bekleyen: ${bekleyen.map((m) => m.name).join(', ') || 'yok'}`)
if (!uygula || !bekleyen.length) {
  if (bekleyen.length) console.log('Uygulamak için --uygula ile çalıştırın.')
  process.exit(0)
}
const batch = Number((await sorgu('SELECT coalesce(max(batch), 0) AS b FROM payload_migrations'))[0]?.b ?? 0) + 1
for (const m of bekleyen) {
  const bas = Date.now()
  sayac = 0
  await m.up({ db, payload: undefined, req: undefined } as never)
  await sorgu(`INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`, [m.name, batch])
  console.log(`Uygulandı: ${m.name} (${sayac} komut, ${Date.now() - bas} ms)`)
}
