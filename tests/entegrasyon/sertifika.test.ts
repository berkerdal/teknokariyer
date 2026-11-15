/**
 * Sertifika belgeleri: yalnızca aday yükler; PDF ve görsel kabul, başka tür reddedilir; başkasının belgesi profile
 * bağlanamaz; vazgeçilen belge silinir; başvuruya bağlanan belgeyi yalnızca o firma açar (filigranlı, kayıtlı);
 * hesap silinince başvurudan belge ve kimlik numarası düşer.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { basvur } from '@/servisler/basvuru'
import { basvuruBelgesi } from '@/servisler/degerlendirme'
import { adayHesabiniSil } from '@/servisler/hesapSilme'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { adayBelgesi, sertifikaBelgesiYukle } from '@/servisler/sertifika'

let payload: Payload
const ek = `sf${Date.now().toString(36)}`
let firmaK: any, digerFirmaK: any, moderator: any, aday: any, baskaAday: any, ilan: any, beceri: any, pdf: Uint8Array
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
const satir = (v: Record<string, unknown>): Record<string, unknown> => ({ ad: 'AWS Cloud Practitioner', kurum: 'Amazon', ay: 3, yil: 2025, bitisAy: null, bitisYil: null, suresiz: true, kimlikNo: 'KIM-1', url: 'https://ornek.test/dogrula', beceriler: [], dosya: null, ...v })
const varMi = async (id: number) => Boolean(await payload.findByID({ collection: 'dosyalar', id, overrideAccess: true, disableErrors: true }))

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  beceri = await t('beceri', 'Bulut')
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `${ad} ${ek}`, kisaAd: `${ad} ${ek}`, slug: `${ad}-${ek}`.toLowerCase(), konum: 'D Blok 1', guvenilir: true } as any })
  const [f1, f2] = await Promise.all([f('Belge'), f('Diger')])
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('sff', { rol: 'firma', firma: f1.id, firmaYetkisi: 'yonetici' })
  digerFirmaK = await k('sfd', { rol: 'firma', firma: f2.id, firmaYetkisi: 'yonetici' })
  moderator = await k('sfm', { rol: 'moderator' })
  aday = await k('sfa', { rol: 'aday' })
  baskaAday = await k('sfb', { rol: 'aday' })
  for (const a of [aday, baskaAday]) {
    await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: a.id, havuz: { gorunurluk: 'gizli' } } as any })
    await profilGuncelle(payload, a, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
  }
  const fd = new FormData()
  for (const [x, y] of [['pozisyonAdi', `Bulut ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(x, y)
  ilan = (await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, ilan.id)
  const belge = await PDFDocument.create()
  belge.addPage([595, 842])
  pdf = await belge.save({ useObjectStreams: false })
})

describe('yükleme ve profil', () => {
  it('yalnızca aday yükler; PDF ve görsel kabul edilir, başka tür reddedilir', async () => {
    await expect(sertifikaBelgesiYukle(payload, firmaK, { veri: PNG, boyut: PNG.length })).rejects.toMatchObject({ durumKodu: 403 })
    const metin = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    await expect(sertifikaBelgesiYukle(payload, aday, { veri: metin, boyut: metin.length })).rejects.toThrow()
    expect((await sertifikaBelgesiYukle(payload, aday, { veri: PNG, boyut: PNG.length })).tur).toBe('image/png')
    expect((await sertifikaBelgesiYukle(payload, aday, { veri: pdf, boyut: pdf.length })).tur).toBe('application/pdf')
  })

  it('başkasının belgesi ve listede olmayan beceri bağlanmaz; vazgeçilen belge silinir', async () => {
    const baskasinin = await sertifikaBelgesiYukle(payload, baskaAday, { veri: PNG, boyut: PNG.length })
    const benim = await sertifikaBelgesiYukle(payload, aday, { veri: pdf, boyut: pdf.length })
    const vazgecilen = await sertifikaBelgesiYukle(payload, aday, { veri: PNG, boyut: PNG.length })
    const a = await profilGuncelle(payload, aday, {
      sertifikalar: [satir({ dosya: baskasinin.id, beceriler: [beceri.id, 999999] }), satir({ ad: 'İkinci', dosya: benim.id })] as any,
    })
    expect(a.sertifikalar?.[0]?.dosya ?? null).toBeNull()
    expect((a.sertifikalar?.[0]?.beceriler ?? []).map((b: any) => b.id ?? b)).toEqual([beceri.id])
    expect((a.sertifikalar?.[1]?.dosya as any)?.id ?? a.sertifikalar?.[1]?.dosya).toBe(benim.id)
    expect(await varMi(vazgecilen.id)).toBe(false) // profilde ve başvuruda yok: silindi
    expect(await varMi(baskasinin.id)).toBe(true) // başkasının belgesine dokunulmaz
  })
})

describe('adresteki numarayı değiştirerek erişim', () => {
  it('aday yalnızca kendi belgesini açar; başkasınınki, CV ve olmayan numara “bulunamadı” döner', async () => {
    const benim = await sertifikaBelgesiYukle(payload, aday, { veri: pdf, boyut: pdf.length })
    const onunki = await sertifikaBelgesiYukle(payload, baskaAday, { veri: pdf, boyut: pdf.length })
    const cv = await cvYukle(payload, baskaAday, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
    expect((await adayBelgesi(payload, aday, benim.id)).tur).toBe('application/pdf')
    for (const id of [onunki.id, cv.id, 99999999, NaN]) await expect(adayBelgesi(payload, aday, id)).rejects.toMatchObject({ durumKodu: 404 })
    await expect(adayBelgesi(payload, null, benim.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(adayBelgesi(payload, firmaK, benim.id)).rejects.toMatchObject({ durumKodu: 403 })
  })

  it("Payload API'si üzerinden de başkasının CV'si ve belgesi okunamaz (aday, firma, moderatör)", async () => {
    const belge = await sertifikaBelgesiYukle(payload, baskaAday, { veri: pdf, boyut: pdf.length })
    const cv = await cvYukle(payload, baskaAday, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
    for (const kim of [aday, firmaK, moderator]) {
      const { docs } = await payload.find({ collection: 'dosyalar', user: kim, overrideAccess: false, depth: 0, where: { id: { in: [belge.id, cv.id] } } })
      expect(docs).toEqual([])
    }
    const sahibi = await payload.find({ collection: 'dosyalar', user: baskaAday, overrideAccess: false, depth: 0, where: { id: { in: [belge.id, cv.id] } } })
    expect(sahibi.docs).toHaveLength(2)
  })
})

describe('başvuru ve firma erişimi', () => {
  let basvuruId: number, belgeId: number
  it('başvuruya bağlanan belgeyi yalnızca o firma açar; PDF filigranlı, açılış kayda geçer', async () => {
    const cv = await cvYukle(payload, aday, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
    const b = await basvur(payload, aday, { ilanId: ilan.id, cvDosyaId: cv.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
    basvuruId = b.id
    const kayit = await payload.findByID({ collection: 'basvurular', id: b.id, depth: 0, overrideAccess: true })
    belgeId = (kayit.belgeler ?? []).map((x: any) => x.id ?? x)[0]
    expect(belgeId).toBeTruthy()
    expect((kayit.profilKopyasi as any).sertifikalar[1]).toMatchObject({ ad: 'İkinci', kurum: 'Amazon', kimlikNo: 'KIM-1', dosya: belgeId })
    expect((kayit.profilKopyasi as any).sertifikalar[0].beceriler).toEqual([beceri.ad])
    const r = await basvuruBelgesi(payload, firmaK, b.id, belgeId)
    expect(r.tur).toBe('application/pdf')
    expect(r.icerik.length).toBeGreaterThan(pdf.length) // filigran eklendi
    await expect(basvuruBelgesi(payload, digerFirmaK, b.id, belgeId)).rejects.toMatchObject({ durumKodu: 404 })
    const baskaBelge = await sertifikaBelgesiYukle(payload, baskaAday, { veri: pdf, boyut: pdf.length })
    await expect(basvuruBelgesi(payload, firmaK, b.id, baskaBelge.id)).rejects.toMatchObject({ durumKodu: 404 })
    const { totalDocs } = await payload.count({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: 'Sertifika belgesi açıldı' } }, { kayitId: { equals: String(b.id) } }] }, overrideAccess: true })
    expect(totalDocs).toBe(1)
  })

  it('profilden çıkarılan ama başvuruda olan belge silinmez; hesap silinince başvurudan düşer', async () => {
    await profilGuncelle(payload, aday, { sertifikalar: [] as any })
    expect(await varMi(belgeId)).toBe(true)
    await adayHesabiniSil(payload, aday, aday.id)
    const kayit = await payload.findByID({ collection: 'basvurular', id: basvuruId, depth: 0, overrideAccess: true })
    expect(kayit.belgeler ?? []).toEqual([])
    expect((kayit.profilKopyasi as any).sertifikalar[1]).toMatchObject({ ad: 'İkinci', kimlikNo: null, url: null, dosya: null })
    expect(await varMi(belgeId)).toBe(false)
  })
})
