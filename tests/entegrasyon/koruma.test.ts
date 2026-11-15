/**
 * Bot koruması ve istek sınırlama:
 * - sınır dolunca Türkçe 429 hatası; başka kaynak ve sonraki pencere etkilenmez; IP adresi saklanmaz; eski sayaçlar silinir;
 * - Turnstile: geliştirmede kapalı, anahtar yoksa reddedilir, sunucu cevabına göre geçer/kalır, ulaşılamazsa reddedilir,
 *   yayında anahtarlar tanımlı değilse form reddedilir (sessizce kapanmaz).
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { eskiSayaclariSil, sinirDenetle } from '@/servisler/istekSiniri'
import { insanDogrula } from '@/altyapi/insanDogrulama'

let payload: Payload
const ek = Date.now().toString(36)

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('istek sınırı', () => {
  it('kayıtta 5 deneme geçer, 6. reddedilir; başka kaynak ve sonraki pencere etkilenmez; IP saklanmaz', async () => {
    const an = new Date('2030-01-01T10:05:00Z')
    const ip = `ip:203.0.113.${Number.parseInt(ek.slice(-2), 36) % 250}-${ek}`
    for (let i = 0; i < 5; i++) await sinirDenetle(payload, 'kayit', ip, false, an)
    await expect(sinirDenetle(payload, 'kayit', ip, false, an)).rejects.toMatchObject({ durumKodu: 429, message: expect.stringMatching(/55 dakika sonra yeniden dene/) })
    await sinirDenetle(payload, 'kayit', `${ip}-baska`, false, an)
    await sinirDenetle(payload, 'giris', ip, false, an) // başka eylem
    await sinirDenetle(payload, 'kayit', ip, false, new Date('2030-01-01T11:00:00Z')) // yeni pencere
    const { docs } = await payload.find({ collection: 'istek-sinirlari', limit: 100, overrideAccess: true })
    expect(JSON.stringify(docs)).not.toContain('203.0.113')
  })

  it('süresi biten sayaçlar silinir', async () => {
    const once = (await payload.count({ collection: 'istek-sinirlari', overrideAccess: true })).totalDocs
    expect(once).toBeGreaterThan(0)
    await eskiSayaclariSil(payload, new Date('2030-01-02T00:00:00Z'))
    expect((await payload.count({ collection: 'istek-sinirlari', where: { bitis: { less_than: '2030-01-02T00:00:00Z' } }, overrideAccess: true })).totalDocs).toBe(0)
  })
})

describe('Turnstile doğrulaması', () => {
  const eski = { ...process.env }
  afterEach(() => {
    process.env = { ...eski }
    vi.restoreAllMocks()
  })

  it('geliştirmede anahtar yoksa kapalı; yayında anahtar yoksa reddedilir', async () => {
    delete process.env.TURNSTILE_SITE_ANAHTARI
    delete process.env.TURNSTILE_GIZLI_ANAHTAR
    process.env.ORTAM = 'gelistirme'
    expect(await insanDogrula('x')).toBe('kapali')
    process.env.ORTAM = 'yayin'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await insanDogrula('x')).toBe('yapilandirilmamis')
  })

  it('anahtar varsa sunucu cevabına göre geçer veya kalır; boş anahtar ve ulaşılamayan sunucu reddedilir', async () => {
    process.env.TURNSTILE_SITE_ANAHTARI = 'site'
    process.env.TURNSTILE_GIZLI_ANAHTAR = 'gizli'
    const cevap = vi.spyOn(globalThis, 'fetch')
    cevap.mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
    expect(await insanDogrula('iyi', '198.51.100.7')).toBe('gecti')
    const govde = cevap.mock.calls[0]![1]!.body as FormData
    expect(govde.get('secret')).toBe('gizli')
    expect(govde.get('remoteip')).toBe('198.51.100.7')
    cevap.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] })))
    expect(await insanDogrula('kotu')).toBe('kaldi')
    expect(await insanDogrula('')).toBe('yok')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    cevap.mockRejectedValueOnce(new Error('ağ yok'))
    expect(await insanDogrula('iyi')).toBe('ulasilamadi')
  })

  it('test ortamında Cloudflare’in test anahtarları kullanılır', async () => {
    delete process.env.TURNSTILE_SITE_ANAHTARI
    delete process.env.TURNSTILE_GIZLI_ANAHTAR
    process.env.ORTAM = 'test'
    const cevap = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
    expect(await insanDogrula('test-anahtari')).toBe('gecti')
    expect((cevap.mock.calls[0]![1]!.body as FormData).get('secret')).toBe('1x0000000000000000000000000000000AA')
  })
})
