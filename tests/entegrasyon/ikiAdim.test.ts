/**
 * İki aşamalı doğrulama (K33):
 * - firma ve kurum hesabında yeni cihazda e-posta kodu zorunlu; tanınan cihazda sorulmaz; aday için sorulmaz;
 * - e-posta kodu: yalnızca özeti saklanır, süresi dolar, 60 saniye ve saatte 5 sınırı, 5 hatada kilit;
 * - doğrulayıcı uygulama (önerilen): kuran kişiye yeni cihazda uygulama kodu sorulur; aynı kod iki kez geçmez;
 *   kurtarma kodu bir kez geçer; kaldırılabilir; anahtar şifreli ve API’den okunamaz;
 * - cihaz 90 gün tanınır, en fazla 10 cihaz; şifre yenilenince ve sıfırlamada unutulur;
 * - giriş ve şifre işlemleri REST üzerinden kapalıdır; sıfırlama yetkileri.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalReq, getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { CIHAZ_GUN, hotp, zamanAdimi } from '@/alan/ikiAdim'
import { coz } from '@/altyapi/sifreleme'
import {
  bekleyenGirisAc,
  bekleyenGirisPaketle,
  cihaziHatirla,
  cihazlariTemizle,
  cihazlariUnut,
  epostaKoduGonder,
  girisDogrulamaYontemi,
  guvenlikDurumu,
  ikiAdimiKapat,
  ikiAdimiSifirla,
  ikinciAdimDogrula,
  kurtarmaKodlariniYenile,
  kurulumBilgisi,
  kurulumuTamamla,
  taninanCihazlar,
} from '@/servisler/ikiAdim'

let payload: Payload
const ek = `ia${Date.now().toString(36)}`
let firmaA: any, yonetici: any, uye: any, baskaFirmadan: any, aday: any

const k = (e: string, v: Record<string, unknown>) =>
  payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })

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
  baskaFirmadan = await k('iax', { rol: 'firma', firma: fb.id, firmaYetkisi: 'degerlendirici' })
  yonetici = await k('iay', { rol: 'yonetici' })
  aday = await k('iad', { rol: 'aday' })
})

describe('yeni cihazda e-posta kodu', () => {
  it('firma ve kurumda yeni cihazda e-posta; aday için sorulmaz; tanınan cihazda sorulmaz', async () => {
    const an = new Date()
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'cihaz-1', an)).toBe('eposta')
    expect(await girisDogrulamaYontemi(payload, yonetici.id, undefined, an)).toBe('eposta')
    expect(await girisDogrulamaYontemi(payload, aday.id, 'cihaz-1', an)).toBe('yok')
    await cihaziHatirla(payload, firmaA.id, 'cihaz-1', 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', an)
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'cihaz-1', an)).toBe('yok')
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'cihaz-2', an)).toBe('eposta')
    const liste = await taninanCihazlar(payload, firmaA.id, 'cihaz-1', an)
    expect(liste).toEqual([expect.objectContaining({ ad: 'Chrome · Windows', buCihaz: true })])
    // 90 gün kullanılmayan cihaz tanınmaz
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'cihaz-1', new Date(an.getTime() + (CIHAZ_GUN + 1) * 86_400_000))).toBe('eposta')
    // şifre yenilenince unutulur
    await cihazlariTemizle(payload, firmaA.id)
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'cihaz-1', an)).toBe('eposta')
  })

  it('kod e-postayla gider, yalnızca özeti saklanır; doğru kod bir kez geçer; süre ve sıklık sınırı var', async () => {
    const an = new Date()
    const { kod, eposta } = await epostaKoduGonder(payload, uye.id, an)
    expect(eposta).toBe(true)
    const posta = await payload.find({ collection: 'test-postalar', where: { kime: { equals: uye.email } }, sort: '-createdAt', limit: 1, overrideAccess: true })
    expect(posta.docs[0]?.konu).toBe('TeknoKariyer giriş kodu')
    expect(posta.docs[0]?.metin).toContain(`${kod.slice(0, 3)} ${kod.slice(3)}`)
    const ham = (await payload.findByID({ collection: 'kullanicilar', id: uye.id, overrideAccess: true, showHiddenFields: true })) as any
    expect(JSON.stringify(ham.epostaKodu)).not.toContain(kod)
    await expect(epostaKoduGonder(payload, uye.id, new Date(an.getTime() + 10_000))).rejects.toThrow(/60 saniye/)
    await ikinciAdimDogrula(payload, uye.id, kod, 'eposta', new Date(an.getTime() + 20_000))
    await expect(ikinciAdimDogrula(payload, uye.id, kod, 'eposta', new Date(an.getTime() + 30_000))).rejects.toThrow(/süresi doldu/)
    // süresi dolan kod
    const ikinci = await epostaKoduGonder(payload, uye.id, new Date(an.getTime() + 61_000))
    await expect(ikinciAdimDogrula(payload, uye.id, ikinci.kod, 'eposta', new Date(an.getTime() + 61_000 + 11 * 60_000))).rejects.toThrow(/süresi doldu/)
    // saatte en fazla 5
    for (let i = 2; i < 5; i++) await epostaKoduGonder(payload, uye.id, new Date(an.getTime() + i * 61_000))
    await expect(epostaKoduGonder(payload, uye.id, new Date(an.getTime() + 5 * 61_000))).rejects.toThrow(/Bir saat/)
  })

  it('5 hatalı e-posta kodunda kilit; kilitte doğru kod da geçmez', async () => {
    const an = new Date(Date.now() + 2 * 3_600_000)
    const { kod } = await epostaKoduGonder(payload, baskaFirmadan.id, an)
    const yanlis = kod === '000000' ? '111111' : '000000'
    for (let i = 0; i < 4; i++) await expect(ikinciAdimDogrula(payload, baskaFirmadan.id, yanlis, 'eposta', an)).rejects.toThrow(/deneme hakkınız/)
    await expect(ikinciAdimDogrula(payload, baskaFirmadan.id, yanlis, 'eposta', an)).rejects.toThrow(/15 dakika/)
    await expect(ikinciAdimDogrula(payload, baskaFirmadan.id, kod, 'eposta', an)).rejects.toThrow(/dakika sonra/)
  })
})

describe('doğrulayıcı uygulama (önerilen)', () => {
  it('anahtar şifreli ve API’den okunamaz; kurulunca yeni cihazda uygulama kodu sorulur', async () => {
    const a = await kurulumBilgisi(payload, firmaA.id)
    expect((await kurulumBilgisi(payload, firmaA.id)).gizli).toBe(a.gizli)
    const ham = (await payload.findByID({ collection: 'kullanicilar', id: firmaA.id, overrideAccess: true, showHiddenFields: true })) as any
    expect(ham.totpGizli).not.toContain(a.gizli)
    expect(await coz(ham.totpGizli, 'iki-adim-gizli')).toBe(a.gizli)
    const kendisi = (await payload.findByID({ collection: 'kullanicilar', id: firmaA.id, overrideAccess: false, user: firmaA })) as any
    expect(kendisi.totpGizli).toBeUndefined()
    expect(kendisi.taninanCihazlar).toBeUndefined()
    const an = new Date()
    await expect(kurulumuTamamla(payload, firmaA.id, '000000', an)).rejects.toThrow(/tutmadı/)
    expect(await kurulumuTamamla(payload, firmaA.id, await hotp(a.gizli, zamanAdimi(an)), an)).toHaveLength(10)
    expect(await guvenlikDurumu(payload, firmaA.id)).toMatchObject({ uygulama: true, zorunlu: true, kalanKurtarma: 10 })
    expect(await girisDogrulamaYontemi(payload, firmaA.id, 'yeni', an)).toBe('uygulama')
  })

  it('aynı kod iki kez geçmez; kurtarma kodu bir kez geçer; yenilenince eskiler geçersiz', async () => {
    const an = new Date(Date.now() + 5 * 60_000)
    const { gizli, kodlar } = await kur(aday, an)
    expect(await girisDogrulamaYontemi(payload, aday.id, 'yeni', an)).toBe('uygulama') // aday kurduysa sorulur
    const sonra = new Date(an.getTime() + 60_000)
    const kod = await hotp(gizli, zamanAdimi(sonra))
    await ikinciAdimDogrula(payload, aday.id, kod, 'uygulama', sonra)
    await expect(ikinciAdimDogrula(payload, aday.id, kod, 'uygulama', sonra)).rejects.toThrow(/tutmadı/)
    expect(await ikinciAdimDogrula(payload, aday.id, kodlar[0]!.toUpperCase(), 'uygulama', sonra)).toEqual({ kurtarmaKullanildi: true, kalanKurtarma: 9 })
    await expect(ikinciAdimDogrula(payload, aday.id, kodlar[0]!, 'uygulama', sonra)).rejects.toThrow(/tutmadı/)
    const sonra2 = new Date(sonra.getTime() + 60_000)
    const yeni = await kurtarmaKodlariniYenile(payload, aday, await hotp(gizli, zamanAdimi(sonra2)), sonra2)
    await expect(ikinciAdimDogrula(payload, aday.id, kodlar[1]!, 'uygulama', sonra2)).rejects.toThrow(/tutmadı/)
    expect((await ikinciAdimDogrula(payload, aday.id, yeni[0]!, 'uygulama', sonra2)).kurtarmaKullanildi).toBe(true)
    // kaldırılınca aday için yeniden sorulmaz
    const sonra3 = new Date(sonra2.getTime() + 60_000)
    await ikiAdimiKapat(payload, aday, await hotp(gizli, zamanAdimi(sonra3)), sonra3)
    expect(await girisDogrulamaYontemi(payload, aday.id, 'yeni', sonra3)).toBe('yok')
  })
})

describe('cihaz yönetimi, sıfırlama ve dışarıdan giriş', () => {
  it('kişi tek cihazı veya hepsini unutabilir; en fazla 10 cihaz tutulur', async () => {
    const an = new Date()
    for (let i = 0; i < 12; i++) await cihaziHatirla(payload, uye.id, `c-${i}`, 'Firefox/120 Linux', new Date(an.getTime() + i * 1000))
    const liste = await taninanCihazlar(payload, uye.id, undefined, new Date(an.getTime() + 20_000))
    expect(liste).toHaveLength(10)
    await cihazlariUnut(payload, uye, liste[0]!.kimlik)
    expect(await taninanCihazlar(payload, uye.id, undefined, new Date(an.getTime() + 20_000))).toHaveLength(9)
    await cihazlariUnut(payload, uye)
    expect(await taninanCihazlar(payload, uye.id)).toHaveLength(0)
  })

  it('firma yöneticisi yalnızca kendi ekibini, kurum herkesi sıfırlar; kimse kendini sıfırlayamaz; cihazlar da unutulur', async () => {
    await cihaziHatirla(payload, uye.id, 'cihaz-u', null)
    await expect(ikiAdimiSifirla(payload, firmaA, firmaA.id)).rejects.toThrow(/Kendi/)
    await expect(ikiAdimiSifirla(payload, firmaA, baskaFirmadan.id)).rejects.toThrow(/yetkiniz yok/)
    await expect(ikiAdimiSifirla(payload, uye, firmaA.id)).rejects.toThrow(/yetkiniz yok/)
    expect(await ikiAdimiSifirla(payload, firmaA, uye.id)).toEqual({ eposta: true })
    expect(await girisDogrulamaYontemi(payload, uye.id, 'cihaz-u')).toBe('eposta')
    await expect(ikiAdimiSifirla(payload, firmaA, uye.id)).rejects.toThrow(/sıfırlanacak/)
    await ikiAdimiSifirla(payload, yonetici, firmaA.id)
    expect(await guvenlikDurumu(payload, firmaA.id)).toMatchObject({ uygulama: false })
  })

  it('giriş ve şifre işlemleri REST üzerinden kapalı, yerel API açık', async () => {
    const req = await createLocalReq({}, payload)
    ;(req as any).payloadAPI = 'REST'
    await expect(payload.login({ collection: 'kullanicilar', data: { email: aday.email, password: 'Deneme-12345' }, req })).rejects.toThrow(/giriş sayfasından/)
    const req2 = await createLocalReq({}, payload)
    ;(req2 as any).payloadAPI = 'REST'
    await expect(payload.forgotPassword({ collection: 'kullanicilar', data: { email: aday.email }, req: req2, disableEmail: true })).rejects.toThrow(/giriş sayfasından/)
    expect((await payload.login({ collection: 'kullanicilar', data: { email: aday.email, password: 'Deneme-12345' } })).token).toBeTruthy()
  })

  it('bekleyen giriş paketi şifreli ve süresi dolunca açılmaz', async () => {
    const simdi = new Date()
    const { paket } = await bekleyenGirisPaketle({ kullaniciId: 1, token: 'gizli-oturum-anahtari', bitis: simdi.toISOString(), rol: 'firma', donus: '/firma-paneli', yontem: 'eposta', testKodu: '123456' }, simdi)
    expect(paket).not.toContain('gizli-oturum-anahtari')
    expect(paket).not.toContain('123456')
    expect((await bekleyenGirisAc(paket, simdi))?.token).toBe('gizli-oturum-anahtari')
    expect(await bekleyenGirisAc(paket, new Date(simdi.getTime() + 11 * 60_000))).toBeNull()
    expect(await bekleyenGirisAc(paket.slice(0, -2) + 'xx', simdi)).toBeNull()
  })
})
