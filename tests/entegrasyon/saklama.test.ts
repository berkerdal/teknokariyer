/**
 * Günlük özet ve KVKK saklama: özet her gün için bir kez yazılır ve kişisel veri içermez; saklama süresi dolan
 * başvurularda kişisel veri silinir, istatistik kalır; başka yerde kullanılan CV silinmez; eski işlem kayıtları silinir.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { basvur } from '@/servisler/basvuru'
import { gunlukOzetYaz } from '@/servisler/gunlukOzet'
import { kapat, yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { basvurulariAnonimlestir, eskiIslemKayitlariniSil } from '@/servisler/saklama'

let payload: Payload
const ek = `sk${Date.now().toString(36)}`
let firmaK: any, adayK: any, ilan: any, basvuru: any, cvId: number

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Go'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Saklama ${ek}`, kisaAd: `Saklama ${ek}`, slug: `saklama-${ek}`, konum: 'A Blok 1', guvenilir: true } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('skf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  adayK = await k('ska', { rol: 'aday' })
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: adayK.id, beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
  await profilGuncelle(payload, adayK, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `Saklanacak ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5 + 3 * 36e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  ilan = (await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, ilan.id)
  const belge = await PDFDocument.create()
  belge.addPage([595, 842])
  const pdf = await belge.save({ useObjectStreams: false })
  cvId = (await cvYukle(payload, adayK, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })).id
  basvuru = await basvur(payload, adayK, { ilanId: ilan.id, cvDosyaId: cvId, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
})

describe('günlük özet', () => {
  it('biten gün için bir kez yazılır; kişisel veri içermez', async () => {
    const yarin = new Date(Date.now() + 86_400_000)
    const tarih = await gunlukOzetYaz(payload, yarin)
    expect(tarih).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await gunlukOzetYaz(payload, yarin)).toBeNull()
    const o = (await payload.find({ collection: 'gunluk-ozetler', where: { tarih: { equals: tarih } }, overrideAccess: true })).docs[0]!
    expect(o.yayindakiIlan).toBeGreaterThan(0)
    expect(o.basvuru).toBeGreaterThan(0)
    const satir = (o.ilanlar as any[]).find((x) => x.id === ilan.id)
    expect(satir).toMatchObject({ basvuru: 1 })
    expect(JSON.stringify(o)).not.toMatch(/@|Kişi ska/)
  })
})

describe('KVKK saklama', () => {
  it('süresi dolmayan başvuruya dokunulmaz; dolunca kişisel veri silinir, istatistik kalır; profildeki CV silinmez', async () => {
    await kapat(payload, firmaK, ilan.id, 'doldu')
    const kapali = await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })
    expect(kapali.kapanisTarihi).toBeTruthy()
    expect((await basvurulariAnonimlestir(payload, new Date(), 12)).basvuru).toBe(0)
    const ileride = new Date(Date.now() + 400 * 86_400_000)
    const s = await basvurulariAnonimlestir(payload, ileride, 12)
    expect(s.basvuru).toBeGreaterThanOrEqual(1)
    const b = await payload.findByID({ collection: 'basvurular', id: basvuru.id, depth: 0, overrideAccess: true })
    expect(b.anonimlestirildi).toBeTruthy()
    expect(b.profilKopyasi).toEqual({ anonim: true })
    expect(b.cv ?? null).toBeNull()
    expect(b.adayKullanici ?? null).toBeNull()
    expect(b.durum).toBeTruthy()
    expect(b.kaynak).toBeTruthy()
    // CV adayın profilinde hâlâ kullanılıyor: silinmedi
    expect(await payload.findByID({ collection: 'dosyalar', id: cvId, overrideAccess: true }).catch((): null => null)).not.toBeNull()
    expect((await basvurulariAnonimlestir(payload, ileride, 12)).basvuru).toBe(0) // ikinci çalışma bir şey yapmaz
  })

  it('süresi dolan işlem kayıtları silinir ve silme kayda geçer', async () => {
    const once = await payload.count({ collection: 'islem-kayitlari', overrideAccess: true })
    expect(once.totalDocs).toBeGreaterThan(0)
    const silinen = await eskiIslemKayitlariniSil(payload, new Date(Date.now() + 30 * 31 * 86_400_000), 24)
    expect(silinen).toBe(once.totalDocs)
    const kalan = await payload.find({ collection: 'islem-kayitlari', overrideAccess: true })
    expect(kalan.docs.map((d) => d.islem)).toEqual(['Saklama süresi dolan işlem kayıtları silindi'])
  })
})
