/**
 * Zamanlanmış işler: davet hatırlatması 3., 7., 14. günde birer kez gider, yeni bağlantı çalışır ve eskisi geçersiz olur;
 * son hatırlatma süresi biten daveti uzatır; gece çalışması e-posta göndermez; profil hatırlatması devralan firmaya gider.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { davetGonder, davetiBul, davetiKabulEt } from '@/servisler/ekip'
import { iskeletFirmaOlustur } from '@/servisler/firmaYonetimi'
import { zamanliIsleriCalistir } from '@/servisler/zamanli'

let payload: Payload
const ek = `z${Date.now().toString(36)}`
let yonetici: any
// Türkiye saatiyle 10.00'a denk gelen, bugünden n gün sonraki an
const gunSonra = (n: number) => {
  const d = new Date(Date.now() + n * 86_400_000)
  d.setUTCHours(7, 0, 0, 0)
  return d
}
const anahtarlar = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, sort: 'createdAt', limit: 50 })).docs.map(
    (d: any) => ({ konu: d.konu as string, anahtar: decodeURIComponent(JSON.stringify(d).match(/anahtar=([A-Za-z0-9_%-]+)/)?.[1] ?? '') }),
  )
const kayit = (ad: string) =>
  ({ unvan: `${ad} ${ek} A.Ş.`, kisaAd: `${ad} ${ek}`, konum: 'A Blok 1', sektor: null as number | null, web: '', yetkiliAd: `${ad} Yetkili`, yetkiliEposta: `${ad.toLowerCase()}-${ek}@ornek.com`, yetkiliTelefon: '' })

beforeAll(async () => {
  payload = await getPayload({ config })
  yonetici = await payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `zy-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'ZY', rol: 'yonetici', _verified: true } as any })
})

describe('davet hatırlatmaları', () => {
  it('3., 7. ve 14. günde birer kez; yeni bağlantı çalışır, eskisi geçersiz; gece e-posta gitmez; son hatırlatma uzatır', async () => {
    const f = await iskeletFirmaOlustur(payload, yonetici, kayit('Hatirla'))
    const davet = await davetGonder(payload, yonetici, { ad: 'Hatirla Yetkili', eposta: `hatirla-${ek}@ornek.com`, firmaYetkisi: 'yonetici', firmaId: f.id })
    const kime = `hatirla-${ek}`
    expect(await anahtarlar(kime)).toHaveLength(1)

    await zamanliIsleriCalistir(payload, gunSonra(2))
    expect(await anahtarlar(kime)).toHaveLength(1) // henüz değil

    const gece = new Date(gunSonra(3).getTime() - 10 * 3_600_000) // Türkiye saatiyle 00.00
    expect((await zamanliIsleriCalistir(payload, gece)).davetHatirlatma).toBe(0)

    expect((await zamanliIsleriCalistir(payload, gunSonra(3))).davetHatirlatma).toBeGreaterThanOrEqual(1)
    await zamanliIsleriCalistir(payload, gunSonra(3)) // aynı gün ikinci çalışma göndermez
    const postalar = await anahtarlar(kime)
    expect(postalar).toHaveLength(2)
    expect(postalar[1]!.konu).toMatch(/davetiniz bekliyor/)
    expect('hata' in (await davetiBul(payload, postalar[0]!.anahtar))).toBe(true) // eski bağlantı geçersiz
    expect('davet' in (await davetiBul(payload, postalar[1]!.anahtar))).toBe(true)

    await zamanliIsleriCalistir(payload, gunSonra(7))
    await zamanliIsleriCalistir(payload, gunSonra(15))
    const son = await anahtarlar(kime)
    expect(son).toHaveLength(4)
    expect(son[3]!.konu).toMatch(/^Son hatırlatma/)
    const d = await payload.findByID({ collection: 'davetler', id: davet.id, overrideAccess: true })
    expect(d.hatirlatmalar?.map((h) => h.gun)).toEqual([3, 7, 14])
    expect(new Date(d.sonGecerlilik).getTime()).toBeGreaterThan(gunSonra(15).getTime()) // süresi biten davet uzatıldı
    expect((await zamanliIsleriCalistir(payload, gunSonra(20))).davetHatirlatma).toBe(0)
  })
})

describe('profil hatırlatmaları', () => {
  it('devralan ama profili tamamlamayan firmanın tam yetkilisine eksiklerle gider; bir kez', async () => {
    const f = await iskeletFirmaOlustur(payload, yonetici, kayit('Profil'))
    await davetGonder(payload, yonetici, { ad: 'Profil Yetkili', eposta: `profil-${ek}@ornek.com`, firmaYetkisi: 'yonetici', firmaId: f.id })
    const [ilk] = await anahtarlar(`profil-${ek}`)
    await davetiKabulEt(payload, ilk!.anahtar, { ad: 'Profil Yetkili', sifre: 'Deneme-Sifre-123' })
    await zamanliIsleriCalistir(payload, gunSonra(3))
    await zamanliIsleriCalistir(payload, gunSonra(3))
    const konular = (await anahtarlar(`profil-${ek}`)).map((p) => p.konu).filter((k) => k.includes('profilini tamamlayın'))
    expect(konular).toHaveLength(1)
    const posta = await payload.find({ collection: 'test-postalar', where: { and: [{ kime: { contains: `profil-${ek}` } }, { konu: { contains: 'profilini' } }] }, overrideAccess: true })
    expect(JSON.stringify(posta.docs[0])).toMatch(/logo, kısa tanıtım, sektör/)
  })
})
