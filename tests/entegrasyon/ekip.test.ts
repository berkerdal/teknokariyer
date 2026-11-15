/**
 * Ekip ve davetler (talimatlar 0.3, 2) ve firma profili: yetki, tek kullanımlık davet, son yönetici koruması,
 * pasif kullanıcının girişi, logo dosya türü denetimi.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { davetGonder, davetiBul, davetiIptalEt, davetiKabulEt, ekibeGeriAl, ekiptenCikar, yetkiDegistir } from '@/servisler/ekip'
import UPNG from '@pdf-lib/upng'
import { firmaLogosuYukle, firmaProfiliGuncelle, webAdresi } from '@/servisler/firmaProfili'
import { girisYap } from '@/servisler/hesap'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `e${Date.now().toString(36)}`
let firma: any, yonetici: any, sorumlu: any, digerYonetici: any, sektor: number
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

async function sonDavetAnahtari(eposta: string): Promise<string> {
  const { docs } = await payload.find({ collection: 'test-postalar', where: { kime: { equals: eposta } }, sort: '-createdAt', limit: 1, overrideAccess: true })
  const m = /davet\?anahtar=([A-Za-z0-9_%-]+)/.exec(String((docs[0] as any)?.html ?? ''))
  return decodeURIComponent(m?.[1] ?? '')
}

beforeAll(async () => {
  payload = await getPayload({ config })
  sektor = (await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'sektor', ad: `Yazılım ${ek}` } as any })).id
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: ad, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'C Blok 3', asama: 'iskelet' } as any })
  firma = await f('Ekip')
  const diger = await f('Diger')
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  yonetici = await k('ey', { rol: 'firma', firma: firma.id, firmaYetkisi: 'yonetici' })
  sorumlu = await k('es', { rol: 'firma', firma: firma.id, firmaYetkisi: 'ilan-sorumlusu' })
  digerYonetici = await k('dy', { rol: 'firma', firma: diger.id, firmaYetkisi: 'yonetici' })
})

describe('davetler', () => {
  const eposta = () => `yeni-${ek}@firma.com.tr`
  it('yalnızca tam yetkili davet eder; mevcut hesap ve bekleyen davet reddedilir', async () => {
    await expect(davetGonder(payload, sorumlu, { ad: 'Yeni Kişi', eposta: eposta(), firmaYetkisi: 'degerlendirici' })).rejects.toThrow(/tam yetkili/)
    await expect(davetGonder(payload, yonetici, { ad: 'X', eposta: 'gecersiz', firmaYetkisi: 'patron' })).rejects.toBeInstanceOf(FormHatasi)
    await expect(davetGonder(payload, yonetici, { ad: 'Diğer Kişi', eposta: `dy-${ek}@ornek.com`, firmaYetkisi: 'degerlendirici' })).rejects.toThrow(/başka bir hesap/)
    const d = await davetGonder(payload, yonetici, { ad: 'Yeni Kişi', eposta: eposta(), firmaYetkisi: 'degerlendirici' })
    expect(d.anahtarOzeti).toMatch(/^[0-9a-f]{64}$/)
    await expect(davetGonder(payload, yonetici, { ad: 'Yeni Kişi', eposta: eposta(), firmaYetkisi: 'degerlendirici' })).rejects.toThrow(/geçerli bir davet/)
    expect((await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true })).asama).toBe('davet')
  })

  it('başka firma daveti iptal edemez; bağlantı tek kullanımlık; kabul eden firma hesabıyla girer', async () => {
    const anahtar = await sonDavetAnahtari(eposta())
    expect(anahtar.length).toBeGreaterThan(30)
    const bulunan = await davetiBul(payload, anahtar)
    if ('hata' in bulunan) throw new Error('davet bulunamadı')
    await expect(davetiIptalEt(payload, digerYonetici, bulunan.davet.id)).rejects.toMatchObject({ durumKodu: 404 })
    expect(await davetiBul(payload, `${anahtar}x`)).toEqual({ hata: 'yok' })
    await expect(davetiKabulEt(payload, anahtar, { ad: 'Yeni Kişi', sifre: 'kisa' })).rejects.toBeInstanceOf(FormHatasi)
    const u = await davetiKabulEt(payload, anahtar, { ad: 'Yeni Kişi', unvan: 'Yazılım Ekip Lideri', sifre: 'Guvenli-Sifre-2026' })
    expect(u).toMatchObject({ rol: 'firma', firmaYetkisi: 'degerlendirici', unvan: 'Yazılım Ekip Lideri' })
    await expect(davetiKabulEt(payload, anahtar, { ad: 'Yeni Kişi', sifre: 'Guvenli-Sifre-2026' })).rejects.toThrow(/daha önce kabul/)
    expect((await girisYap(payload, eposta(), 'Guvenli-Sifre-2026')).rol).toBe('firma')
    expect((await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true })).asama).toBe('devralindi')
  })
})

describe('ekip üyeleri', () => {
  it('son tam yetkili korunur; çıkarılan üye giriş yapamaz, geri alınınca girer', async () => {
    await expect(yetkiDegistir(payload, yonetici, yonetici.id, 'degerlendirici')).rejects.toThrow(/en az bir tam yetkili/)
    await expect(ekiptenCikar(payload, yonetici, yonetici.id)).rejects.toThrow(/son tam yetkili/)
    await expect(ekiptenCikar(payload, digerYonetici, sorumlu.id)).rejects.toMatchObject({ durumKodu: 404 })
    await ekiptenCikar(payload, yonetici, sorumlu.id)
    await expect(girisYap(payload, `es-${ek}@ornek.com`, 'Deneme-12345')).rejects.toBeInstanceOf(IslemHatasi)
    await ekibeGeriAl(payload, yonetici, sorumlu.id)
    expect((await girisYap(payload, `es-${ek}@ornek.com`, 'Deneme-12345')).rol).toBe('firma')
    await yetkiDegistir(payload, yonetici, sorumlu.id, 'yonetici')
    await yetkiDegistir(payload, yonetici, yonetici.id, 'ilan-sorumlusu') // artık başka bir tam yetkili var
  })
})

describe('firma profili', () => {
  beforeAll(async () => {
    // Oturum her istekte yeniden okunur; testte de güncel yetkiler okunur.
    yonetici = await payload.findByID({ collection: 'kullanicilar', id: yonetici.id, overrideAccess: true, depth: 0 })
    sorumlu = await payload.findByID({ collection: 'kullanicilar', id: sorumlu.id, overrideAccess: true, depth: 0 })
  })
  it('web adresi tamamlanır; geçersiz adres ve yetkisiz düzenleme reddedilir', async () => {
    expect(webAdresi('firma.com.tr')).toBe('https://firma.com.tr')
    expect(webAdresi('http://a.b/c/')).toBe('http://a.b/c')
    expect(webAdresi('olmaz')).toBe('')
    const g = { kisaTanitim: 'Kısa tanıtım', uzunTanitim: '', web: 'ekip.com.tr', sektor, teknolojiler: [] as number[], calismaModelleri: ['hibrit'], yanHaklar: ['Yemek kartı'], kurulusYili: 2015, calisanAraligi: '10–49' }
    await expect(firmaProfiliGuncelle(payload, digerYonetici, g).then((f) => f.id)).resolves.not.toBe(firma.id)
    await expect(firmaProfiliGuncelle(payload, yonetici, g)).rejects.toThrow(/tam yetkili/) // yonetici artık ilan sorumlusu
    const f = await firmaProfiliGuncelle(payload, sorumlu, g)
    expect(f.web).toBe('https://ekip.com.tr')
    expect(f.yayinaHazir).toBe(false) // logo yok
  })

  it('logo yalnızca gerçek görsel olabilir; logo ile profil yayına hazır olur', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    await expect(firmaLogosuYukle(payload, sorumlu, { veri: svg, boyut: svg.length })).rejects.toThrow(/SVG/)
    await firmaLogosuYukle(payload, sorumlu, { veri: PNG, boyut: PNG.length })
    const f = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true, depth: 1 })
    expect((f.logo as any).alt).toBe('Ekip logosu')
    expect(f.yayinaHazir).toBe(true)
  })

  it('Yönetici A.Ş. başka firmaya logo yükler; dosya adı firma kimliğini taşır, eski logo silinir (K37)', async () => {
    const kurum = await payload.create({
      collection: 'kullanicilar',
      overrideAccess: true,
      data: { email: `ky-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'Kurum Yönetici', rol: 'yonetici', _verified: true } as any,
    })
    const moderator = await payload.create({
      collection: 'kullanicilar',
      overrideAccess: true,
      data: { email: `km-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'Kurum Moderatör', rol: 'moderator', _verified: true } as any,
    })
    const once = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true, depth: 0 })
    const eskiId = once.logo as number
    // Firma kullanıcısı ve moderatör başka firmayı hedefleyemez
    await expect(firmaLogosuYukle(payload, digerYonetici, { veri: PNG, boyut: PNG.length }, firma.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(firmaLogosuYukle(payload, moderator, { veri: PNG, boyut: PNG.length }, firma.id)).rejects.toMatchObject({ durumKodu: 403 })
    const yeni = await firmaLogosuYukle(payload, kurum, { veri: PNG, boyut: PNG.length }, firma.id)
    expect(yeni.filename).toMatch(new RegExp(`^firma-${firma.id}-logo-\\d{8}-\\d{6}(-\\d+)?\\.png$`))
    const sonra = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true, depth: 0 })
    expect(sonra.logo).toBe(yeni.id)
    expect(await payload.findByID({ collection: 'dosyalar', id: eskiId, overrideAccess: true, disableErrors: true })).toBeNull()
  })

  it('logonun çevresindeki beyaz boşluk yüklemede kırpılır; kırpılan PNG olarak saklanır ve kayda geçer', async () => {
    // 300×300 beyaz zeminde 240×40 lacivert şerit (geniş logo, kare dosya)
    const w = 300
    const p = new Uint8Array(w * w * 4).fill(255)
    for (let y = 130; y < 170; y++) for (let x = 30; x < 270; x++) p.set([33, 85, 173, 255], (y * w + x) * 4)
    const dosya = new Uint8Array(UPNG.encode([p.buffer as ArrayBuffer], w, w, 0))
    const yeni = await firmaLogosuYukle(payload, sorumlu, { veri: dosya, boyut: dosya.length })
    expect(yeni.mimeType).toBe('image/png')
    expect([yeni.width, yeni.height]).toEqual([260, 60]) // şerit 240×40 + her yanda %4 (10 px) pay
    const { docs } = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: 'Firma logosu değişti' } }, { kayitId: { equals: String(firma.id) } }] }, sort: '-createdAt', limit: 1, overrideAccess: true })
    expect((docs[0]?.ayrinti as any)?.kirpildi).toBe("300×300 → 260×60")
  })
})
