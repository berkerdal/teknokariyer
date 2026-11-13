/**
 * Hesap akışı: kayıt, doğrulama, giriş, şifre sıfırlama. E-postalar test posta kutusuna yazılır (dışarı çıkmaz).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { adayKaydi, epostaDogrula, girisYap, sifreSifirlamaIste, sifreYenile } from '@/servisler/hesap'

let payload: Payload
const ek = `h${Date.now().toString(36)}`
const eposta = `elif-${ek}@ornek.com`
const SIFRE = 'Deneme-2026x'

const kutu = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { equals: kime } }, sort: '-createdAt', limit: 10, overrideAccess: true })).docs
const anahtarBul = (html: string, yol: string) => decodeURIComponent(html.match(new RegExp(`${yol}\\?anahtar=([^"&<\\s]+)`))?.[1] ?? '')

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('aday kaydı', () => {
  it('eksik ve hatalı alanlar ayrı ayrı, Türkçe bildirilir', async () => {
    await expect(adayKaydi(payload, { ad: ' ', eposta: 'yanlis', sifre: 'kisa', aydinlatma: false, ticariIleti: false })).rejects.toMatchObject({
      alanlar: {
        ad: expect.stringContaining('Adını'),
        eposta: expect.stringContaining('biçiminde'),
        sifre: expect.stringContaining('en az 10 karakter'),
        aydinlatma: expect.stringContaining('aydınlatma'),
      },
    })
  })
  it('hesap aday olarak açılır, rızalar sürümüyle kaydedilir, doğrulama e-postası test kutusuna düşer', async () => {
    await adayKaydi(payload, { ad: 'Elif  Karaca', eposta: eposta.toUpperCase(), sifre: SIFRE, aydinlatma: true, ticariIleti: false })
    const { docs } = await payload.find({ collection: 'kullanicilar', where: { email: { equals: eposta } }, overrideAccess: true })
    expect(docs[0]).toMatchObject({ ad: 'Elif Karaca', rol: 'aday' })
    const rizalar = await payload.find({ collection: 'rizalar', where: { kullanici: { equals: docs[0]!.id } }, overrideAccess: true })
    expect(rizalar.docs.map((r) => [r.tur, r.metinSurumu])).toEqual([['aday-aydinlatma', '1.0']])
    const aday = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: docs[0]!.id } }, overrideAccess: true })
    expect(aday.docs[0]?.havuz?.gorunurluk).toBe('gizli')
    const posta = await kutu(eposta)
    expect(posta[0]?.konu).toBe('E-posta adresini doğrula')
  })
  it('aynı adresle ikinci kayıt hata vermez, yeni hesap açmaz, sahibine bilgi verir', async () => {
    await adayKaydi(payload, { ad: 'Başkası', eposta, sifre: SIFRE, aydinlatma: true, ticariIleti: true })
    const { totalDocs } = await payload.find({ collection: 'kullanicilar', where: { email: { equals: eposta } }, overrideAccess: true })
    expect(totalDocs).toBe(1)
    expect((await kutu(eposta))[0]?.konu).toBe('TeknoKariyer hesabın zaten var')
  })
})

describe('giriş ve doğrulama', () => {
  it('doğrulanmamış hesap giriş yapamaz; doğrulama sonrası girer', async () => {
    await expect(girisYap(payload, eposta, SIFRE)).rejects.toThrow(/doğrulanmadı/)
    const html = (await kutu(eposta)).find((p) => p.konu === 'E-posta adresini doğrula')!.html!
    expect(await epostaDogrula(payload, 'gecersiz')).toBe(false)
    expect(await epostaDogrula(payload, anahtarBul(html, '/dogrula'))).toBe(true)
    const s = await girisYap(payload, ` ${eposta.toUpperCase()} `, SIFRE)
    expect(s.rol).toBe('aday')
    expect(s.token.length).toBeGreaterThan(20)
  })
  it('hatalı şifre ile olmayan hesap aynı mesajı alır', async () => {
    const a = await girisYap(payload, eposta, 'Yanlis-12345').catch((e) => e.message)
    const b = await girisYap(payload, `yok-${ek}@ornek.com`, 'Yanlis-12345').catch((e) => e.message)
    expect(a).toBe('E-posta adresi veya şifre hatalı.')
    expect(b).toBe(a)
  })
})

describe('şifre sıfırlama', () => {
  it('kayıtlı olmayan adres için de aynı sonuç; kayıtlı adrese bağlantı gider ve yeni şifreyle girilir', async () => {
    await expect(sifreSifirlamaIste(payload, `yok-${ek}@ornek.com`)).resolves.toBeUndefined()
    await sifreSifirlamaIste(payload, eposta)
    const p = (await kutu(eposta)).find((x) => x.konu === 'Şifreni yenile')!
    const anahtar = anahtarBul(p.html!, '/sifre-yenile')
    await expect(sifreYenile(payload, anahtar, 'kisa')).rejects.toMatchObject({ alanlar: { sifre: expect.any(String) } })
    const s = await sifreYenile(payload, anahtar, 'Yeni-Sifre-2026')
    expect(s.rol).toBe('aday')
    await expect(sifreYenile(payload, anahtar, 'Baska-Sifre-2026')).rejects.toThrow(/süresi dolmuş|kullanılmış/)
    await expect(girisYap(payload, eposta, 'Yeni-Sifre-2026')).resolves.toMatchObject({ rol: 'aday' })
  })
})
