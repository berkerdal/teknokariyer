/**
 * Görüşme daveti: yalnızca firmanın tam yetkili ve ilan sorumlusu davet eder; kiracı ayrımı; davet başvuruyu “Görüşme”ye
 * taşır; süren görüşmede yeni davet aynı kaydı günceller; aday yalnızca kendi görüşmesini görür ve önerilen tarihlerden
 * birini seçer; kesinleşince iki tarafa takvim dosyası gider; başka tarih isteği, iptal, geri çekme ve hesap silme.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { basvur, geriCek } from '@/servisler/basvuru'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { adayHesabiniSil } from '@/servisler/hesapSilme'
import { gorusmeTakvimDosyasi, gorusmeTarihiSec, gorusmeYeniTarihIste, gorusmeyeDavetEt, gorusmeyiIptalEt } from '@/servisler/gorusme'

let payload: Payload
const ek = `gr${Date.now().toString(36)}`
let firmaK: any, degerlendirici: any, baskaFirmaK: any, aday1: any, aday2: any, ilan: any, b1: any, b2: any
const gunSonra = (n: number, saat = 11) => {
  const d = new Date(Date.now() + n * 86_400_000)
  d.setUTCHours(saat, 0, 0, 0)
  return d
}
const davet = (v: Partial<{ secenekler: Array<Date | null>; sure: number; bicim: string; yer: string; not: string }> = {}) => ({
  secenekler: [gunSonra(3), gunSonra(4), null],
  sure: 45,
  bicim: 'yuz-yuze',
  yer: 'Pamukkale Teknokent, D Blok 208',
  not: '',
  ...v,
})
const postalar = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, limit: 50, sort: 'createdAt' })).docs as any[]

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Elixir'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Gorusme ${ek}`, kisaAd: `Gorusme ${ek}`, slug: `gorusme-${ek}`, konum: 'D Blok 208', guvenilir: true } as any })
  const f2 = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Baska ${ek}`, kisaAd: `Baska ${ek}`, slug: `baska-gr-${ek}`, konum: 'B Blok 1' } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('grf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  degerlendirici = await k('grd', { rol: 'firma', firma: f.id, firmaYetkisi: 'degerlendirici' })
  baskaFirmaK = await k('grb', { rol: 'firma', firma: f2.id, firmaYetkisi: 'yonetici' })
  aday1 = await k('gra', { rol: 'aday' })
  aday2 = await k('grc', { rol: 'aday' })
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `Arka Uç ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  ilan = (await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, ilan.id)
  const basvuru = async (aday: any) => {
    await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: aday.id, beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
    await profilGuncelle(payload, aday, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
    const belge = await PDFDocument.create()
    belge.addPage([595, 842])
    const pdf = await belge.save({ useObjectStreams: false })
    const cv = await cvYukle(payload, aday, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
    return basvur(payload, aday, { ilanId: ilan.id, cvDosyaId: cv.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
  }
  b1 = await basvuru(aday1)
  b2 = await basvuru(aday2)
})

describe('davet', () => {
  it('yetki, kiracı ayrımı ve alan denetimi', async () => {
    await expect(gorusmeyeDavetEt(payload, degerlendirici, b1.id, davet())).rejects.toMatchObject({ durumKodu: 403 })
    await expect(gorusmeyeDavetEt(payload, baskaFirmaK, b1.id, davet())).rejects.toMatchObject({ durumKodu: 404 })
    await expect(gorusmeyeDavetEt(payload, aday1, b1.id, davet())).rejects.toMatchObject({ durumKodu: 403 })
    await expect(gorusmeyeDavetEt(payload, firmaK, b1.id, davet({ bicim: 'cevrim-ici', yer: 'zoom' }))).rejects.toMatchObject({ alanlar: { yer: expect.any(String) } })
  })

  it('davet başvuruyu “Görüşme”ye taşır ve adaya e-posta gider; süren görüşmede yeni davet aynı kaydı günceller', async () => {
    const g = await gorusmeyeDavetEt(payload, firmaK, b1.id, davet())
    expect(g).toMatchObject({ durum: 'bekliyor', sure: 45 })
    expect((await payload.findByID({ collection: 'basvurular', id: b1.id, overrideAccess: true })).durum).toBe('gorusme')
    const g2 = await gorusmeyeDavetEt(payload, firmaK, b1.id, davet({ secenekler: [gunSonra(5), null, null] }))
    expect(g2.id).toBe(g.id)
    expect(g2.secenekler).toHaveLength(1)
    const konular = (await postalar(`gra-${ek}`)).map((p) => p.konu)
    expect(konular).toContain(`Görüşme daveti: ${ilan.pozisyonAdi}`)
    expect(konular).toContain(`Görüşme tarihi değişti: ${ilan.pozisyonAdi}`)
    expect(konular.filter((k) => k.startsWith('Başvurunun durumu'))).toEqual([]) // genel durum e-postası ayrıca gitmez
  })
})

describe('adayın seçimi', () => {
  it('aday yalnızca kendi görüşmesini görür; önerilmeyen tarih seçilemez; seçince iki tarafa takvim dosyası gider', async () => {
    const g = (await payload.find({ collection: 'gorusmeler', where: { basvuru: { equals: b1.id } }, overrideAccess: true })).docs[0]!
    // Erişim kuralı: başka aday ve başka firma okuyamaz
    expect((await payload.find({ collection: 'gorusmeler', user: aday2, overrideAccess: false, where: { id: { equals: g.id } } })).docs).toEqual([])
    expect((await payload.find({ collection: 'gorusmeler', user: baskaFirmaK, overrideAccess: false, where: { id: { equals: g.id } } })).docs).toEqual([])
    expect((await payload.find({ collection: 'gorusmeler', user: aday1, overrideAccess: false, where: { id: { equals: g.id } } })).docs).toHaveLength(1)
    await expect(gorusmeTarihiSec(payload, aday2, g.id, g.secenekler![0]!.baslangic)).rejects.toMatchObject({ durumKodu: 404 })
    await expect(gorusmeTarihiSec(payload, aday1, g.id, gunSonra(9).toISOString())).rejects.toMatchObject({ alanlar: { secim: expect.any(String) } })
    await expect(gorusmeTakvimDosyasi(payload, aday1, g.id)).rejects.toMatchObject({ durumKodu: 409 })
    const secilen = new Date(g.secenekler![0]!.baslangic).toISOString()
    const s = await gorusmeTarihiSec(payload, aday1, g.id, secilen)
    expect(s).toMatchObject({ durum: 'onaylandi', takvimNo: 1 })
    await expect(gorusmeTarihiSec(payload, aday1, g.id, secilen)).rejects.toMatchObject({ durumKodu: 409 })
    const adayPostasi = (await postalar(`gra-${ek}`)).find((p) => p.konu.startsWith('Görüşme tarihi kesinleşti'))
    const firmaPostasi = (await postalar(`grf-${ek}`)).find((p) => p.konu.startsWith('Görüşme tarihi kesinleşti'))
    expect(adayPostasi?.ekler?.[0]).toMatchObject({ dosyaAdi: 'gorusme.ics', icerik: expect.stringContaining(`UID:gorusme-${g.id}-1@`) })
    expect(firmaPostasi?.ekler?.[0]?.icerik).toContain('METHOD:PUBLISH')
    expect((await postalar(`grd-${ek}`)).filter((p) => p.konu.includes('örüşme'))).toEqual([]) // değerlendiriciye görüşme bildirimi gitmez
    // Takvim dosyası: aday ve firma indirir, başka firma indiremez
    expect(await gorusmeTakvimDosyasi(payload, aday1, g.id)).toContain('BEGIN:VEVENT')
    expect(await gorusmeTakvimDosyasi(payload, firmaK, g.id)).toContain('BEGIN:VEVENT')
    await expect(gorusmeTakvimDosyasi(payload, baskaFirmaK, g.id)).rejects.toMatchObject({ durumKodu: 404 })
    await expect(gorusmeTakvimDosyasi(payload, aday2, g.id)).rejects.toMatchObject({ durumKodu: 404 })
  })

  it('kesinleşen saatte katılamayan aday başka tarih ister; firmaya iptal dosyası gider; firma yeni tarih önerir ve iptal eder', async () => {
    const g = (await payload.find({ collection: 'gorusmeler', where: { basvuru: { equals: b1.id } }, overrideAccess: true })).docs[0]!
    await expect(gorusmeYeniTarihIste(payload, aday1, g.id, 'olmaz')).rejects.toMatchObject({ alanlar: { not: expect.any(String) } })
    const y = await gorusmeYeniTarihIste(payload, aday1, g.id, 'Hafta içi 14.00’ten sonra uygunum.')
    expect(y).toMatchObject({ durum: 'yeni-tarih', secilen: null })
    const istek = (await postalar(`grf-${ek}`)).find((p) => p.konu.startsWith('Aday başka bir görüşme tarihi istiyor'))
    expect(istek?.ekler?.[0]?.icerik).toContain('METHOD:CANCEL')
    const yeni = await gorusmeyeDavetEt(payload, firmaK, b1.id, davet({ secenekler: [gunSonra(6, 12), null, null] }))
    expect(yeni).toMatchObject({ id: g.id, durum: 'bekliyor', adayNotu: null })
    await expect(gorusmeyiIptalEt(payload, degerlendirici, g.id, 'Pozisyon kapandı, görüşme yapılmayacak.')).rejects.toMatchObject({ durumKodu: 403 })
    await expect(gorusmeyiIptalEt(payload, baskaFirmaK, g.id, 'Pozisyon kapandı, görüşme yapılmayacak.')).rejects.toMatchObject({ durumKodu: 404 })
    await expect(gorusmeyiIptalEt(payload, firmaK, g.id, 'kısa')).rejects.toMatchObject({ alanlar: { neden: expect.any(String) } })
    expect(await gorusmeyiIptalEt(payload, firmaK, g.id, 'Pozisyon kapandı, görüşme yapılmayacak.')).toMatchObject({ durum: 'iptal' })
    expect((await postalar(`gra-${ek}`)).map((p) => p.konu)).toContain(`Görüşme iptal edildi: ${ilan.pozisyonAdi}`)
    await expect(gorusmeyiIptalEt(payload, firmaK, g.id, 'Pozisyon kapandı, görüşme yapılmayacak.')).rejects.toMatchObject({ durumKodu: 409 })
  })
})

describe('adayın ayrılması', () => {
  it('aday başvurusunu geri çekince süren görüşme iptal olur ve firmaya bildirilir', async () => {
    const g = await gorusmeyeDavetEt(payload, firmaK, b2.id, davet())
    // Görüşme durumundaki başvuru adayca geri çekilemiyorsa iptal denetimi servis üzerinden yapılır
    await payload.update({ collection: 'basvurular', id: b2.id, data: { durum: 'inceleniyor' }, overrideAccess: true })
    await geriCek(payload, aday2, b2.id)
    expect((await payload.findByID({ collection: 'gorusmeler', id: g.id, overrideAccess: true })).durum).toBe('iptal')
    expect((await postalar(`grf-${ek}`)).map((p) => p.konu)).toContain(`Görüşme iptal edildi: ${ilan.pozisyonAdi}`)
    await expect(gorusmeyeDavetEt(payload, firmaK, b2.id, davet())).rejects.toMatchObject({ durumKodu: 409 })
  })

  it('hesap silinince görüşme kayıtları silinir', async () => {
    await gorusmeyeDavetEt(payload, firmaK, b1.id, davet())
    await adayHesabiniSil(payload, aday1, aday1.id)
    expect((await payload.count({ collection: 'gorusmeler', where: { basvuru: { equals: b1.id } }, overrideAccess: true })).totalDocs).toBe(0)
  })
})
