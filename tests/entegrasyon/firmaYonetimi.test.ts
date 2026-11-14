/**
 * Firma kurulumu (talimatlar 0.3; K3): iskelet kayıt yalnızca tam yetkili kurum kullanıcısında, tekrar kayıt reddi,
 * toplu davette genel/eksik yetkili atlanır, pasif firma ilanlarını kapatır, profil tamamlanınca aşama kendiliğinden ilerler.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { davetiKabulEt } from '@/servisler/ekip'
import { firmaPasifligi, iskeletFirmaOlustur, takipNotuEkle, topluDavet, type FirmaKaydiGirdisi } from '@/servisler/firmaYonetimi'
import { FormHatasi } from '@/servisler/ortak'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'

let payload: Payload
const ek = `fy${Date.now().toString(36)}`
let yonetici: any, moderator: any
const g = (ad: string, v: Partial<FirmaKaydiGirdisi> = {}): FirmaKaydiGirdisi => ({
  unvan: `${ad} ${ek} A.Ş.`,
  kisaAd: `${ad} ${ek}`,
  konum: 'C Blok 101',
  sektor: null,
  web: '',
  yetkiliAd: 'Ayşe Kaya',
  yetkiliEposta: `${ad.toLowerCase()}-${ek}@ornek.com`,
  yetkiliTelefon: '',
  ...v,
})

beforeAll(async () => {
  payload = await getPayload({ config })
  const k = (e: string, rol: string) => payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: e, rol, _verified: true } as any })
  yonetici = await k('fyy', 'yonetici')
  moderator = await k('fym', 'moderator')
})

describe('iskelet kayıt', () => {
  it('yalnızca tam yetkili kurum kullanıcısı açar; aynı firma ikinci kez açılamaz; e-posta denetlenir', async () => {
    await expect(iskeletFirmaOlustur(payload, moderator, g('Alfa'))).rejects.toMatchObject({ durumKodu: 403 })
    const f = await iskeletFirmaOlustur(payload, yonetici, g('Alfa'))
    expect(f.asama).toBe('iskelet')
    expect(f.slug).toBe(`alfa-${ek}`)
    const tekrar = await iskeletFirmaOlustur(payload, yonetici, g('ALFA', { unvan: `Başka ${ek}` })).catch((e) => e)
    expect(tekrar).toBeInstanceOf(FormHatasi)
    expect((tekrar as FormHatasi).alanlar.kisaAd).toMatch(/zaten kayıtlı/)
    const kotu = await iskeletFirmaOlustur(payload, yonetici, g('Beta', { yetkiliEposta: 'gecersiz' })).catch((e) => e)
    expect((kotu as FormHatasi).alanlar.yetkiliEposta).toBeTruthy()
  })
})

describe('toplu davet ve kurulum aşamaları', () => {
  it('genel ve eksik yetkili atlanır, uygun firmaya davet gider; kabul ve profil aşamayı ilerletir', async () => {
    const uygun = await iskeletFirmaOlustur(payload, yonetici, g('Gama'))
    const genel = await iskeletFirmaOlustur(payload, yonetici, g('Delta', { yetkiliEposta: `info@delta-${ek}.com` }))
    const eksik = await iskeletFirmaOlustur(payload, yonetici, g('Epsilon', { yetkiliAd: '', yetkiliEposta: '' }))
    const s = await topluDavet(payload, moderator, [uygun.id, genel.id, eksik.id])
    expect(s.gonderilen).toEqual([uygun.kisaAd])
    expect(s.atlanan.map((a) => a.firma).sort()).toEqual([genel.kisaAd, eksik.kisaAd].sort())
    expect((await payload.findByID({ collection: 'firmalar', id: uygun.id, overrideAccess: true })).asama).toBe('davet')
    // ikinci kez gönderilmez
    expect((await topluDavet(payload, moderator, [uygun.id])).atlanan[0]?.neden).toMatch(/iskelet aşamasında değil/)

    // daveti kabul et: anahtar e-postadaki bağlantıdan alınır
    const posta = await payload.find({ collection: 'test-postalar', where: { kime: { contains: `gama-${ek}` } }, overrideAccess: true, limit: 1, sort: '-createdAt' })
    const anahtar = decodeURIComponent(JSON.stringify(posta.docs[0]).match(/anahtar=([A-Za-z0-9_%-]+)/)![1]!)
    await davetiKabulEt(payload, anahtar, { ad: 'Ayşe Kaya', sifre: 'Deneme-Sifre-123' })
    expect((await payload.findByID({ collection: 'firmalar', id: uygun.id, overrideAccess: true })).asama).toBe('devralindi')

    // profil tamamlanınca (logo, kısa tanıtım, sektör) aşama kendiliğinden ilerler
    const sektor = await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'sektor', ad: `Yazılım ${ek}` } as any })
    const logo = await payload.create({
      collection: 'dosyalar',
      overrideAccess: true,
      data: { tur: 'logo', alt: 'logo' } as any,
      file: { data: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000050001a5f645400000000049454e44ae426082', 'hex'), mimetype: 'image/png', name: `l-${ek}.png`, size: 69 },
    })
    const sonra = await payload.update({ collection: 'firmalar', id: uygun.id, data: { kisaTanitim: 'Yazılım geliştiriyoruz.', sektor: sektor.id, logo: logo.id }, overrideAccess: true })
    expect(sonra.asama).toBe('profil-tamam')
  })
})

describe('takip notu ve pasiflik', () => {
  it('not yazanın adıyla eklenir; pasif firma ilanlarını kapatır, geri alınınca aşama ekibe göre belirlenir', async () => {
    const f = await iskeletFirmaOlustur(payload, yonetici, g('Zeta'))
    await expect(takipNotuEkle(payload, moderator, f.id, ' ')).rejects.toBeInstanceOf(FormHatasi)
    await takipNotuEkle(payload, moderator, f.id, 'Aradım, haftaya dolduracak.')
    const n = await payload.findByID({ collection: 'firmalar', id: f.id, overrideAccess: true })
    expect(n.takipNotlari?.[0]?.not).toBe('Aradım, haftaya dolduracak. (fym)')

    // firmanın bir kullanıcısı ve onaydaki bir ilanı
    const kul = await payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `fyz-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'Zeta Kişi', rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici', _verified: true } as any })
    const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
    const [aile, beceri] = await Promise.all([t('pozisyon-ailesi', 'Yazılım Z'), t('beceri', 'Zig Z')])
    const fd = new FormData()
    const son = new Date(Date.now() + 20 * 864e5 + 3 * 36e5).toISOString().slice(0, 10)
    for (const [a2, d] of [['pozisyonAdi', `Pasif deneme ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', son], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
      fd.append(a2, d)
    const { ilan } = await ilanKaydet(payload, kul, null, ilanFormunuOku(fd).veri)
    expect((await yayinaGonder(payload, kul, ilan.id)).durum).toBe('onayda')
    await expect(firmaPasifligi(payload, moderator, f.id, true)).rejects.toMatchObject({ durumKodu: 403 })
    const p = await firmaPasifligi(payload, yonetici, f.id, true)
    expect(p.asama).toBe('pasif')
    await expect(firmaPasifligi(payload, yonetici, f.id, true)).rejects.toMatchObject({ durumKodu: 409 })
    expect(p.kapanan).toBe(1)
    expect((await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })).durum).toBe('kapandi')
    const geri = await firmaPasifligi(payload, yonetici, f.id, false)
    expect(geri.asama).toBe('devralindi') // etkin kullanıcısı var, profili tamam değil
  })
})
