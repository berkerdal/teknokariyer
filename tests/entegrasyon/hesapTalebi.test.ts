/**
 * Firma hesap talebi: alan denetimi ve aydınlatma onayı; aynı adresten açık talep tekrarlanmaz (sonuç dışarıya belli
 * edilmez); yalnızca moderasyon yetkilisi sonuçlandırır; davette firmaya tam yetkili daveti gider, boş yetkili bilgisi
 * talepten dolar; ret gerekçe ister ve talep edene e-posta gider; sonuçlanan talep yeniden sonuçlandırılamaz.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { hesapTalebiDavet, hesapTalebiOlustur, hesapTalebiReddet } from '@/servisler/hesapTalebi'

let payload: Payload
const ek = `ht${Date.now().toString(36)}`
let firma: any, firmaK: any, raporlayici: any, moderator: any
const postalar = async (kime: string) => (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, limit: 50 })).docs.map((d: any) => d.konu as string)
const girdi = (e: string, v: Record<string, unknown> = {}) => ({ firmaAdi: `Talep ${ek} Yazılım Ltd. Şti.`, konum: 'B Blok 12', yetkiliAd: 'Deniz Kaya', unvan: 'Kurucu', eposta: `${e}-${ek}@ornek.com`, telefon: '', not: '', aydinlatma: true, ...v })

beforeAll(async () => {
  payload = await getPayload({ config })
  firma = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Talep ${ek} Yazılım Ltd. Şti.`, kisaAd: `Talep ${ek}`, slug: `talep-${ek}`, konum: 'B Blok 12' } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  const f2 = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Baska ${ek}`, kisaAd: `Baska ${ek}`, slug: `baska-${ek}`, konum: 'C Blok 1' } as any })
  firmaK = await k('htf', { rol: 'firma', firma: f2.id, firmaYetkisi: 'yonetici' })
  raporlayici = await k('htr', { rol: 'raporlayici' })
  moderator = await k('htm', { rol: 'moderator' })
})

describe('talep oluşturma', () => {
  it('alanlar ve aydınlatma onayı denetlenir', async () => {
    await expect(hesapTalebiOlustur(payload, girdi('a', { yetkiliAd: 'Deniz', aydinlatma: false }))).rejects.toMatchObject({ alanlar: { yetkiliAd: expect.any(String), aydinlatma: expect.any(String) } })
  })
  it('talep kaydedilir, alındı e-postası gider; aynı adresten açık talep tekrarlanmaz', async () => {
    const t = await hesapTalebiOlustur(payload, girdi('b', { eposta: ` B-${ek}@Ornek.com ` }))
    expect(t).toMatchObject({ durum: 'yeni', eposta: `b-${ek}@ornek.com`, aydinlatmaSurumu: expect.any(String) })
    expect(await hesapTalebiOlustur(payload, girdi('b'))).toBeNull()
    expect((await payload.count({ collection: 'hesap-talepleri', where: { eposta: { equals: `b-${ek}@ornek.com` } }, overrideAccess: true })).totalDocs).toBe(1)
    expect((await postalar(`b-${ek}`)).length).toBe(1)
  })
  it('talepleri kurum dışından kimse okuyamaz', async () => {
    const r = await payload.find({ collection: 'hesap-talepleri', user: firmaK, overrideAccess: false }).catch(() => ({ docs: [] as unknown[] }))
    expect(r.docs).toEqual([])
  })
})

describe('sonuçlandırma', () => {
  it('yalnızca moderasyon yetkilisi; davette tam yetkili daveti gider ve yetkili bilgisi dolar', async () => {
    const t = (await hesapTalebiOlustur(payload, girdi('c')))!
    await expect(hesapTalebiDavet(payload, raporlayici, t.id, firma.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(hesapTalebiDavet(payload, firmaK, t.id, firma.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(hesapTalebiDavet(payload, moderator, t.id, 0)).rejects.toMatchObject({ alanlar: { firma: expect.any(String) } })
    await hesapTalebiDavet(payload, moderator, t.id, firma.id)
    const d = await payload.find({ collection: 'davetler', where: { firma: { equals: firma.id } }, overrideAccess: true })
    expect(d.docs).toHaveLength(1)
    expect(d.docs[0]).toMatchObject({ eposta: `c-${ek}@ornek.com`, firmaYetkisi: 'yonetici' })
    const f = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true })
    expect(f).toMatchObject({ yetkiliAd: 'Deniz Kaya', yetkiliEposta: `c-${ek}@ornek.com` })
    expect(await payload.findByID({ collection: 'hesap-talepleri', id: t.id, overrideAccess: true })).toMatchObject({ durum: 'davet', sonuclandiran: expect.anything() })
    await expect(hesapTalebiReddet(payload, moderator, t.id, 'Bu talep artık geçersiz sayılmalı.')).rejects.toMatchObject({ durumKodu: 409 })
  })
  it('ret gerekçe ister; gerekçe talep edene e-postayla gider', async () => {
    const t = (await hesapTalebiOlustur(payload, girdi('d')))!
    await expect(hesapTalebiReddet(payload, moderator, t.id, 'kısa')).rejects.toMatchObject({ alanlar: { gerekce: expect.any(String) } })
    expect(await hesapTalebiReddet(payload, moderator, t.id, 'Firmanız Teknokent kayıtlarında bulunamadı.')).toEqual({ eposta: true })
    expect(await payload.findByID({ collection: 'hesap-talepleri', id: t.id, overrideAccess: true })).toMatchObject({ durum: 'red', retGerekcesi: 'Firmanız Teknokent kayıtlarında bulunamadı.' })
    expect((await postalar(`d-${ek}`)).length).toBe(2)
    // Reddedilen adres yeniden talep açabilir
    expect(await hesapTalebiOlustur(payload, girdi('d'))).not.toBeNull()
  })
})
