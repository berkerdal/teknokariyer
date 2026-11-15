/**
 * Site trafiği: olay yalnızca ölçülen yollarda ve tarayıcılarda yazılır; kişisel veri tutulmaz; gece işi biten günleri
 * özetler, ham olayları siler ve aynı günü ikinci kez sayarsa üstüne ekler.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { olayKaydet, trafikOzetle } from '@/servisler/trafik'

let payload: Payload
const SITE = 'https://kariyer.ornek.test'
const TEL = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
const dun = new Date(Date.now() - 2 * 86_400_000)

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('olay', () => {
  it('panel yolları ve botlar yazılmaz; yazılan olayda IP veya tarayıcı kimliği yok', async () => {
    expect(await olayKaydet(payload, { yol: '/hesabim', yonlendiren: '', ua: PC, kendiSite: SITE }, dun)).toBe(false)
    expect(await olayKaydet(payload, { yol: '/', yonlendiren: '', ua: 'Googlebot/2.1 (+http://www.google.com/bot.html) Mozilla', kendiSite: SITE }, dun)).toBe(false)
    expect(await olayKaydet(payload, { yol: '/?x=1', yonlendiren: 'https://www.google.com/', ua: TEL, kendiSite: SITE }, dun)).toBe(true)
    expect(await olayKaydet(payload, { yol: '/ilanlar', yonlendiren: `${SITE}/`, ua: TEL, kendiSite: SITE }, dun)).toBe(true)
    expect(await olayKaydet(payload, { yol: '/ilanlar', yonlendiren: '', isaret: 'linkedin', ua: PC, kendiSite: SITE, istatistik: { yeni: true, gununIlki: true, ayinIlki: true } }, dun)).toBe(true)
    const { docs } = await payload.find({ collection: 'trafik-olaylari', overrideAccess: true, limit: 10 })
    expect(docs.length).toBeGreaterThanOrEqual(3)
    expect(JSON.stringify(docs)).not.toMatch(/Mozilla|iPhone|Windows|x=1/)
  })

  it('gece işi özetler, ham olayları siler, tekrar çalışınca üstüne ekler', async () => {
    expect(await trafikOzetle(payload)).toBe(3)
    expect((await payload.count({ collection: 'trafik-olaylari', overrideAccess: true })).totalDocs).toBe(0)
    const satir = async (boyut: string, deger: string) =>
      (await payload.find({ collection: 'trafik-ozetleri', where: { and: [{ boyut: { equals: boyut } }, { deger: { equals: deger } }] }, overrideAccess: true })).docs[0]
    expect(await satir('toplam', '-')).toMatchObject({ goruntuleme: 3, ziyaret: 2, tekilGun: 1, tekilAy: 1, yeni: 1, izinli: 1 })
    expect(await satir('kaynak', 'linkedin')).toMatchObject({ ziyaret: 1 })
    expect(await satir('cihaz', 'mobil')).toMatchObject({ goruntuleme: 2, ziyaret: 1 })
    await olayKaydet(payload, { yol: '/', yonlendiren: '', ua: PC, kendiSite: SITE }, dun)
    expect(await trafikOzetle(payload)).toBe(1)
    expect(await satir('toplam', '-')).toMatchObject({ goruntuleme: 4, ziyaret: 3 })
  })
})
