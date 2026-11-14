/**
 * Raporlar (K31): firma raporu yalnızca firmanın kendi verisini içerir; yönetim raporlarında kişisel veri yoktur ve
 * 5'ten küçük kişi grupları gizlenir; dönem dışındaki başvuru sayılmaz.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { raporDonemi, type RaporDonemi } from '@/alan/raporDonemi'
import { basvur } from '@/servisler/basvuru'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { firmaRaporuHazirla } from '@/veri/firmaRaporu'
import { raporHazirla, raporSayfalari } from '@/veri/raporlar'

let payload: Payload
const ek = `rp${Date.now().toString(36)}`
let firmaA: any, firmaB: any, ilanA: any
const d = raporDonemi('bu-yil') as RaporDonemi

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Rust'), t('universite', `Gizli Üniversite`), t('bolum', 'Fizik')])
  const firma = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `${ad} ${ek}`, kisaAd: `${ad} ${ek}`, slug: `${ad}-${ek}`.toLowerCase(), konum: 'A Blok 1', guvenilir: true } as any })
  const [fa, fb] = await Promise.all([firma('Rapor A'), firma('Rapor B')])
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e} ${ek}`, _verified: true, ...v } as any })
  firmaA = await k('rpa', { rol: 'firma', firma: fa.id, firmaYetkisi: 'yonetici' })
  firmaB = await k('rpb', { rol: 'firma', firma: fb.id, firmaYetkisi: 'yonetici' })
  const ilan = async (u: any, ad: string) => {
    const fd = new FormData()
    for (const [a, v] of [['pozisyonAdi', `${ad} ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5 + 3 * 36e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
      fd.append(a, v)
    const { ilan: i } = await ilanKaydet(payload, u, null, ilanFormunuOku(fd).veri)
    await yayinaGonder(payload, u, i.id)
    return i
  }
  ilanA = await ilan(firmaA, 'Rapor ilanı A')
  await ilan(firmaB, 'Rapor ilanı B')
  // tek aday, nadir bir üniversiteden: raporda tek başına görünmemeli
  const aday = await k('rpc', { rol: 'aday' })
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: aday.id, beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
  await profilGuncelle(payload, aday, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
  const belge = await PDFDocument.create()
  belge.addPage([595, 842])
  const pdf = await belge.save({ useObjectStreams: false })
  const cv = await cvYukle(payload, aday, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
  await basvur(payload, aday, { ilanId: ilanA.id, cvDosyaId: cv.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
})

describe('firma raporu', () => {
  it('yalnızca firmanın kendi ilanlarını ve başvurularını içerir; aday adı yoktur', async () => {
    const r = (await firmaRaporuHazirla(firmaA, d))!
    const ilanlar = r.tablolar[0]!.satirlar.map((s) => s[0])
    expect(ilanlar).toContain(`Rapor ilanı A ${ek}`)
    expect(ilanlar).not.toContain(`Rapor ilanı B ${ek}`)
    expect(r.ozet.find((o) => o.ad === 'Başvuru')!.deger).toBe(1)
    expect(JSON.stringify(r)).not.toMatch(/Kişi rpc|@ornek\.com/)
    const b = (await firmaRaporuHazirla(firmaB, d))!
    expect(b.ozet.find((o) => o.ad === 'Başvuru')!.deger).toBe(0)
    expect(await firmaRaporuHazirla({ ...firmaA, rol: 'aday' } as any, d)).toBeNull()
  })
})

describe('yönetim raporları', () => {
  it('sekiz rapor hesaplanır; kişisel veri yoktur; tek kişilik üniversite grubu gizlenir', async () => {
    for (const kod of ['faaliyet', 'ilanlar', 'firmalar', 'sonuclar', 'yetenek', 'kaynak', 'hizmet', 'kvkk']) {
      const r = await raporHazirla(kod, d)
      expect(r, kod).not.toBeNull()
      expect(JSON.stringify(r), kod).not.toMatch(/Kişi rpc|rpc-.*@ornek\.com/)
      expect(raporSayfalari(r!, 'Kurum').length).toBe(1 + r!.tablolar.length)
    }
    const kaynak = (await raporHazirla('kaynak', d))!
    const okullar = kaynak.tablolar.find((t) => t.baslik === 'Üniversite')!.satirlar
    expect(okullar.some((s) => String(s[0]).includes('Gizli Üniversite'))).toBe(false)
    expect(await raporHazirla('olmayan', d)).toBeNull()
  })

  it('dönem dışındaki başvuru sayılmaz', async () => {
    const eski = raporDonemi('ozel', '2025-01-01', '2025-01-31') as RaporDonemi
    const r = (await firmaRaporuHazirla(firmaA, eski))!
    expect(r.ozet.find((o) => o.ad === 'Başvuru')!.deger).toBe(0)
  })
})
