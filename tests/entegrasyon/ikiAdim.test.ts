/**
 * İki aşamalı doğrulama:
 * - firma hesabında zorunlu; kurulum aynı anahtarı gösterir, anahtar şifreli saklanır ve API'den okunamaz;
 * - aynı kod iki kez kullanılamaz; kurtarma kodu bir kez geçer; 5 hatalı denemede kilit;
 * - giriş ve şifre işlemleri REST üzerinden kapalıdır (yerel API çalışır);
 * - sıfırlamayı kurum tam yetkilisi ve firmanın tam yetkilisi (yalnızca kendi ekibi) yapabilir, kimse kendini sıfırlayamaz;
 * - aday ikinci adımı kendisi açıp kapatabilir, firma kullanıcısı kapatamaz;
 * - bekleyen giriş paketi şifrelidir ve süresi dolunca açılmaz.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalReq, getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { hotp, zamanAdimi } from '@/alan/ikiAdim'
import { coz } from '@/altyapi/sifreleme'
import {
  bekleyenGirisAc,
  bekleyenGirisPaketle,
  ikiAdimDurumu,
  ikiAdimiKapat,
  ikiAdimiSifirla,
  ikinciAdimDogrula,
  kurtarmaKodlariniYenile,
  kurulumBilgisi,
  kurulumuTamamla,
} from '@/servisler/ikiAdim'

let payload: Payload
const ek = `ia${Date.now().toString(36)}`
let firmaA: any, firmaB: any, yonetici: any, uye: any, baskaFirmadan: any, aday: any

const k = (e: string, v: Record<string, unknown>) =>
  payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })

/** Kurulumu tamamlar; kullanılan zamanı ve gizli anahtarı döndürür. */
async function kur(u: any, an: Date) {
  const { gizli } = await kurulumBilgisi(payload, u.id)
  const kodlar = await kurulumuTamamla(payload, u.id, await hotp(gizli, zamanAdimi(an)), an)
  return { gizli, kodlar }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `${ad} ${ek}`, kisaAd: `${ad} ${ek}`, slug: `${ad.toLowerCase()}-${ek}`, konum: 'A Blok 3' } as any })
  const [fa, fb] = await Promise.all([f('IkiA'), f('IkiB')])
  firmaA = await k('iaf', { rol: 'firma', firma: fa.id, firmaYetkisi: 'yonetici' })
  uye = await k('iau', { rol: 'firma', firma: fa.id, firmaYetkisi: 'ilan-sorumlusu' })
  firmaB = await k('iab', { rol: 'firma', firma: fb.id, firmaYetkisi: 'yonetici' })
  baskaFirmadan = await k('iax', { rol: 'firma', firma: fb.id, firmaYetkisi: 'degerlendirici' })
  yonetici = await k('iay', { rol: 'yonetici' })
  aday = await k('iad', { rol: 'aday' })
})

describe('kurulum ve doğrulama', () => {
  it('firma hesabında zorunlu; kurulum aynı anahtarı gösterir; anahtar şifreli ve API’den okunamaz', async () => {
    expect(await ikiAdimDurumu(payload, firmaA.id)).toMatchObject({ gerekli: true, kurulu: false, zorunlu: true })
    expect(await ikiAdimDurumu(payload, aday.id)).toMatchObject({ gerekli: false, zorunlu: false })
    const a = await kurulumBilgisi(payload, firmaA.id)
    const b = await kurulumBilgisi(payload, firmaA.id)
    expect(b.gizli).toBe(a.gizli)
    const ham = (await payload.findByID({ collection: 'kullanicilar', id: firmaA.id, overrideAccess: true, showHiddenFields: true })) as any
    expect(ham.totpGizli).not.toContain(a.gizli)
    expect(await coz(ham.totpGizli, 'iki-adim-gizli')).toBe(a.gizli)
    const kendisi = (await payload.findByID({ collection: 'kullanicilar', id: firmaA.id, overrideAccess: false, user: firmaA })) as any
    expect(kendisi.totpGizli).toBeUndefined()
    expect(kendisi.kurtarmaKodlari).toBeUndefined()
  })

  it('yanlış kodla kurulmaz; doğru kodla kurulur ve 10 kurtarma kodu verir', async () => {
    const an = new Date()
    const { gizli } = await kurulumBilgisi(payload, firmaA.id)
    await expect(kurulumuTamamla(payload, firmaA.id, '000000', an)).rejects.toThrow(/tutmadı/)
    const kodlar = await kurulumuTamamla(payload, firmaA.id, await hotp(gizli, zamanAdimi(an)), an)
    expect(kodlar).toHaveLength(10)
    expect(await ikiAdimDurumu(payload, firmaA.id)).toMatchObject({ kurulu: true, kalanKurtarma: 10 })
    await expect(kurulumBilgisi(payload, firmaA.id)).rejects.toThrow(/zaten kurulu/)
  })

  it('aynı kod iki kez kullanılamaz; kurtarma kodu bir kez geçer; 5 hatada kilit', async () => {
    const an = new Date(Date.now() + 5 * 60_000) // kurulumdan sonraki adımlar
    const { gizli, kodlar } = await kur(uye, an)
    const sonraki = new Date(an.getTime() + 60_000)
    const kod = await hotp(gizli, zamanAdimi(sonraki))
    await ikinciAdimDogrula(payload, uye.id, kod, sonraki)
    await expect(ikinciAdimDogrula(payload, uye.id, kod, sonraki)).rejects.toThrow(/tutmadı/)
    const r = await ikinciAdimDogrula(payload, uye.id, kodlar[0]!.toUpperCase(), sonraki)
    expect(r).toEqual({ kurtarmaKullanildi: true, kalanKurtarma: 9 })
    await expect(ikinciAdimDogrula(payload, uye.id, kodlar[0]!, sonraki)).rejects.toThrow(/tutmadı/)
    // başarılı kurtarma sayacı sıfırladı; yeniden kullanılan kurtarma kodu 1. hata, üç hata daha, beşincisi kilit
    for (let i = 0; i < 3; i++) await expect(ikinciAdimDogrula(payload, uye.id, '111111', sonraki)).rejects.toThrow(/deneme hakkınız/)
    await expect(ikinciAdimDogrula(payload, uye.id, '111111', sonraki)).rejects.toThrow(/15 dakika/)
    // kilit sürerken doğru kod da geçmez
    await expect(ikinciAdimDogrula(payload, uye.id, await hotp(gizli, zamanAdimi(sonraki) + 1), sonraki)).rejects.toThrow(/dakika sonra/)
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ kayitId: { equals: String(uye.id) } }, { kayitTuru: { equals: 'kullanicilar' } }] }, overrideAccess: true, limit: 20 })
    expect(kayit.docs.map((x) => x.islem)).toEqual(expect.arrayContaining(['İki aşamalı doğrulama kuruldu', 'Kurtarma koduyla giriş yapıldı', 'İki aşamalı doğrulama hatalı kodlar yüzünden kilitlendi']))
  })

  it('kurtarma kodları güncel kodla yenilenir, eskiler geçersiz olur', async () => {
    const an = new Date(Date.now() + 20 * 60_000)
    const { gizli, kodlar } = await kur(baskaFirmadan, an)
    const sonra = new Date(an.getTime() + 60_000)
    const yeni = await kurtarmaKodlariniYenile(payload, baskaFirmadan, await hotp(gizli, zamanAdimi(sonra)), sonra)
    expect(yeni).toHaveLength(10)
    await expect(ikinciAdimDogrula(payload, baskaFirmadan.id, kodlar[0]!, sonra)).rejects.toThrow(/tutmadı/)
    expect((await ikinciAdimDogrula(payload, baskaFirmadan.id, yeni[0]!, sonra)).kurtarmaKullanildi).toBe(true)
  })
})

describe('dışarıdan giriş ve sıfırlama', () => {
  it('giriş ve şifre işlemleri REST üzerinden kapalı, yerel API açık', async () => {
    const req = await createLocalReq({}, payload)
    ;(req as any).payloadAPI = 'REST'
    await expect(payload.login({ collection: 'kullanicilar', data: { email: aday.email, password: 'Deneme-12345' }, req })).rejects.toThrow(/giriş sayfasından/)
    const req2 = await createLocalReq({}, payload)
    ;(req2 as any).payloadAPI = 'REST'
    await expect(payload.forgotPassword({ collection: 'kullanicilar', data: { email: aday.email }, req: req2, disableEmail: true })).rejects.toThrow(/giriş sayfasından/)
    const s = await payload.login({ collection: 'kullanicilar', data: { email: aday.email, password: 'Deneme-12345' } })
    expect(s.token).toBeTruthy()
  })

  it('firma yöneticisi yalnızca kendi ekibini, kurum her kişiyi sıfırlar; kimse kendini sıfırlayamaz', async () => {
    await expect(ikiAdimiSifirla(payload, firmaA, firmaA.id)).rejects.toThrow(/Kendi/)
    await expect(ikiAdimiSifirla(payload, firmaA, baskaFirmadan.id)).rejects.toThrow(/yetkiniz yok/)
    await expect(ikiAdimiSifirla(payload, uye, firmaA.id)).rejects.toThrow(/yetkiniz yok/)
    expect(await ikiAdimiSifirla(payload, firmaA, uye.id)).toEqual({ eposta: true })
    expect(await ikiAdimDurumu(payload, uye.id)).toMatchObject({ kurulu: false, gerekli: true, kalanKurtarma: 0 })
    await expect(ikiAdimiSifirla(payload, firmaA, uye.id)).rejects.toThrow(/zaten kurulu değil/)
    await ikiAdimiSifirla(payload, yonetici, baskaFirmadan.id)
    const posta = await payload.find({ collection: 'test-postalar', where: { kime: { equals: uye.email } }, sort: '-createdAt', limit: 1, overrideAccess: true })
    expect(posta.docs[0]?.konu).toBe('İki aşamalı doğrulama sıfırlandı')
    void firmaB
  })

  it('aday açıp kapatabilir; firma kullanıcısı kapatamaz', async () => {
    const an = new Date(Date.now() + 40 * 60_000)
    const { gizli } = await kur(aday, an)
    expect(await ikiAdimDurumu(payload, aday.id)).toMatchObject({ gerekli: true, kurulu: true, zorunlu: false })
    const sonra = new Date(an.getTime() + 60_000)
    await ikiAdimiKapat(payload, aday, await hotp(gizli, zamanAdimi(sonra)), sonra)
    expect(await ikiAdimDurumu(payload, aday.id)).toMatchObject({ gerekli: false, kurulu: false })
    await expect(ikiAdimiKapat(payload, firmaA, '000000')).rejects.toThrow(/kapatılamaz/)
  })

  it('bekleyen giriş paketi şifreli ve süresi dolunca açılmaz', async () => {
    const simdi = new Date()
    const { paket } = await bekleyenGirisPaketle({ kullaniciId: 1, token: 'gizli-oturum-anahtari', bitis: simdi.toISOString(), rol: 'firma', donus: '/firma-paneli' }, simdi)
    expect(paket).not.toContain('gizli-oturum-anahtari')
    expect((await bekleyenGirisAc(paket, simdi))?.token).toBe('gizli-oturum-anahtari')
    expect(await bekleyenGirisAc(paket, new Date(simdi.getTime() + 11 * 60_000))).toBeNull()
    expect(await bekleyenGirisAc(paket.slice(0, -2) + 'xx', simdi)).toBeNull()
  })
})
