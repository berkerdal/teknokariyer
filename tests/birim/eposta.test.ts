import { afterEach, describe, expect, it } from 'vitest'
import { epostaDisariCikabilirMi, ortam } from '@/altyapi/eposta'

const eski = process.env.ORTAM
afterEach(() => { process.env.ORTAM = eski })

describe('e-posta güvenliği (kurum talimatı: kullanıma alınana kadar e-posta gitmez)', () => {
  it('ORTAM tanımsız, test veya yanlış yazılmışsa e-posta dışarı çıkmaz', () => {
    for (const d of [undefined, '', 'test', 'TEST', 'yayın', 'production', 'gelistirme']) {
      if (d === undefined) delete process.env.ORTAM; else process.env.ORTAM = d
      expect(epostaDisariCikabilirMi()).toBe(false)
    }
  })
  it('yalnızca ORTAM=yayin dışarı çıkabilir', () => {
    process.env.ORTAM = 'yayin'
    expect(ortam()).toBe('yayin')
    expect(epostaDisariCikabilirMi()).toBe(true)
  })
})
