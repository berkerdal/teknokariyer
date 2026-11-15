import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calismaAnahtari, cronIfadeleri } from '@/alan/zamanlama'

describe('zamanlanmış işler', () => {
  it('Cloudflare (wrangler.jsonc) ve Node zamanlayıcısı aynı saatleri kullanır', () => {
    const w = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
    const crons = JSON.parse(/"crons":\s*(\[[^\]]*\])/.exec(w)![1]!) as string[]
    expect([...crons].sort()).toEqual([...cronIfadeleri()].sort())
  })
  it('çalışma anahtarı yalnızca belirlenen dakikada ve güne özgü', () => {
    expect(calismaAnahtari(new Date('2026-11-15T21:05:30Z'))).toBe('2026-11-15T21:05Z')
    expect(calismaAnahtari(new Date('2026-11-16T07:00:59Z'))).toBe('2026-11-16T07:00Z')
    expect(calismaAnahtari(new Date('2026-11-15T21:06:00Z'))).toBeNull()
  })
})
