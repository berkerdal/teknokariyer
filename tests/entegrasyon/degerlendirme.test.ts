/**
 * Başvuru değerlendirme (talimatlar 6, K6): kiracı ayrımı, rol yetkisi, adaya bildirim, ekip notu, filigranlı CV.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { basvur } from '@/servisler/basvuru'
import { basvuruCvsi, basvuruDurumuDegistir, basvuruyuAc, ekipNotuEkle, puanVer } from '@/servisler/degerlendirme'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { IslemHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `d${Date.now().toString(36)}`
let firmaK: any, degerlendirici: any, digerFirmaK: any, adayK: any, basvuru: any

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Go'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: ad, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'B Blok 1', guvenilir: true } as any })
  const [fa, fb] = await Promise.all([f('Değerlendiren Yazılım'), f('Başka')])
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('dfa', { rol: 'firma', firma: fa.id, firmaYetkisi: 'ilan-sorumlusu' })
  degerlendirici = await k('dfd', { rol: 'firma', firma: fa.id, firmaYetkisi: 'degerlendirici' })
  digerFirmaK = await k('dfb', { rol: 'firma', firma: fb.id, firmaYetkisi: 'yonetici' })
  adayK = await k('dad', { rol: 'aday' })
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: adayK.id, beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
  await profilGuncelle(payload, adayK, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `Go Geliştirici ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5 + 3 * 36e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  const { ilan } = await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)
  await yayinaGonder(payload, firmaK, ilan.id)
  const belge = await PDFDocument.create()
  belge.addPage([595, 842])
  const pdf = await belge.save({ useObjectStreams: false })
  const cv = await cvYukle(payload, adayK, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
  basvuru = await basvur(payload, adayK, { ilanId: ilan.id, cvDosyaId: cv.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false, kaynak: 'linkedin' })
})

describe('başvuru değerlendirme', () => {
  it('başvuru kaynağı kaydedilir; başka firma başvuruyu açamaz, durumunu değiştiremez, CV indiremez', async () => {
    expect(basvuru.kaynak).toBe('linkedin')
    await expect(basvuruyuAc(payload, digerFirmaK, basvuru.id)).rejects.toMatchObject({ durumKodu: 404 })
    await expect(basvuruDurumuDegistir(payload, digerFirmaK, basvuru.id, 'olumsuz')).rejects.toMatchObject({ durumKodu: 404 })
    await expect(basvuruCvsi(payload, digerFirmaK, basvuru.id)).rejects.toMatchObject({ durumKodu: 404 })
    await expect(basvuruyuAc(payload, adayK, basvuru.id)).rejects.toBeInstanceOf(IslemHatasi)
  })

  it('değerlendirici açınca durum değişmez; durum değiştiremez ama not ve puan ekler', async () => {
    expect((await basvuruyuAc(payload, degerlendirici, basvuru.id)).durum).toBe('alindi')
    await expect(basvuruDurumuDegistir(payload, degerlendirici, basvuru.id, 'gorusme')).rejects.toThrow(/yetkiniz yok/)
    await ekipNotuEkle(payload, degerlendirici, basvuru.id, 'Teknik görüşmede eşzamanlılığı sor.')
    const p = await puanVer(payload, degerlendirici, basvuru.id, 4)
    expect(p.puan).toBe(4)
    expect(p.ekipNotlari?.[0]?.not).toMatch(/eşzamanlılığı/)
    await expect(puanVer(payload, degerlendirici, basvuru.id, 7)).rejects.toThrow(/1 ile 5/)
  })

  it('ilan sorumlusu açınca “İnceleniyor” olur; görüşme ve olumsuz adaya e-posta gönderir', async () => {
    expect((await basvuruyuAc(payload, firmaK, basvuru.id)).durum).toBe('inceleniyor')
    const g = await basvuruDurumuDegistir(payload, firmaK, basvuru.id, 'gorusme')
    expect(g.bildirim).toBe(true)
    const o = await basvuruDurumuDegistir(payload, firmaK, basvuru.id, 'olumsuz', 'İlginiz için teşekkür ederiz.')
    expect(o.basvuru.durum).toBe('olumsuz')
    const postalar = await payload.find({ collection: 'test-postalar', where: { kime: { contains: `dad-${ek}` } }, overrideAccess: true, sort: '-createdAt' })
    const konular = postalar.docs.map((d: any) => d.konu)
    expect(konular.some((x: string) => x.startsWith('Görüşme aşaması'))).toBe(true)
    expect(konular.some((x: string) => x.startsWith('Başvurunun sonucu'))).toBe(true)
    expect(JSON.stringify(postalar.docs)).toMatch(/İlginiz için teşekkür ederiz/)
    await expect(basvuruDurumuDegistir(payload, firmaK, basvuru.id, 'geri-cekti')).rejects.toThrow(/Geçerli bir durum/)
  })

  it('CV filigranlı iner ve indirme işlem kaydına geçer', async () => {
    const { icerik, dosyaAdi } = await basvuruCvsi(payload, firmaK, basvuru.id)
    expect(dosyaAdi).toBe(`CV - Kişi dad.pdf`)
    expect(new TextDecoder('latin1').decode(icerik)).toMatch(/SourceSans3/)
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ kayitTuru: { equals: 'basvurular' } }, { islem: { equals: 'Başvurudaki CV indirildi' } }] }, overrideAccess: true })
    expect(kayit.totalDocs).toBeGreaterThan(0)
  })
})
