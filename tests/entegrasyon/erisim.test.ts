/**
 * Erişim kurallarının kötüye kullanım denemeleriyle sınanması (talimatlar 12; CLAUDE.md 5: kiracı ayrımı).
 * Payload'ın yerel API'si overrideAccess: false ile, gerçek bir kullanıcı adına çağrılır.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'

let payload: Payload
const ek = Date.now().toString(36)
let firmaA: { id: number }, firmaB: { id: number }
let kullaniciA: any, degerlendiriciA: any, aday: any, adayIki: any
let ilanATaslak: any, ilanBTaslak: any, ilanBYayinda: any
let taksonomi: { aile: number; beceri: number }

const yarin = () => new Date(Date.now() + 5 * 86_400_000).toISOString()

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', data: { tur: tur as any, ad }, overrideAccess: true })
  taksonomi = { aile: (await t('pozisyon-ailesi', `Yazılım geliştirme ${ek}`)).id, beceri: (await t('beceri', `Flutter ${ek}`)).id }
  const firma = (ad: string) =>
    payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `${ad} A.Ş.`, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'D Blok 208' } as any })
  firmaA = await firma('FirmaA')
  firmaB = await firma('FirmaB')
  const k = (eposta: string, veri: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${eposta}-${ek}@ornek.com`, password: 'Deneme-12345', ad: eposta, ...veri } as any })
  kullaniciA = await k('firma-a', { rol: 'firma', firma: firmaA.id, firmaYetkisi: 'yonetici' })
  degerlendiriciA = await k('deger-a', { rol: 'firma', firma: firmaA.id, firmaYetkisi: 'degerlendirici' })
  aday = await k('aday', { rol: 'aday' })
  adayIki = await k('aday2', { rol: 'aday' })
  const ilan = (firma: number, durum: string) =>
    payload.create({
      collection: 'ilanlar',
      overrideAccess: true,
      data: {
        firma, pozisyonAdi: `Flutter Geliştirici ${ek}`, tur: 'is', altTur: 'tam-zamanli', aile: taksonomi.aile, model: 'hibrit',
        deneyim: '1-3', egitim: 'lisans', zorunluBeceriler: [taksonomi.beceri], sonBasvuru: yarin(), isTanimi: 'İş tanımı', nitelikler: 'Nitelikler', durum,
      } as any,
    })
  ilanATaslak = await ilan(firmaA.id, 'taslak')
  ilanBTaslak = await ilan(firmaB.id, 'taslak')
  ilanBYayinda = await ilan(firmaB.id, 'yayinda')
})

describe('kiracı ayrımı', () => {
  it('firma kullanıcısı başka firmanın taslak ilanını göremez, kendi taslağını ve diğerlerinin yayındaki ilanını görür', async () => {
    const { docs } = await payload.find({ collection: 'ilanlar', user: kullaniciA, overrideAccess: false, limit: 100, depth: 0 })
    const idler = docs.map((d) => d.id)
    expect(idler).toContain(ilanATaslak.id)
    expect(idler).toContain(ilanBYayinda.id)
    expect(idler).not.toContain(ilanBTaslak.id)
    await expect(payload.findByID({ collection: 'ilanlar', id: ilanBTaslak.id, user: kullaniciA, overrideAccess: false })).rejects.toThrow()
  })
  it('firma kullanıcısı başka firma adına ilan açamaz: firma alanı kendi firmasına çevrilir', async () => {
    const yeni = await payload.create({
      collection: 'ilanlar', user: kullaniciA, overrideAccess: false, depth: 0,
      data: { firma: firmaB.id, pozisyonAdi: 'Sahte ilan', tur: 'is', altTur: 'tam-zamanli', aile: taksonomi.aile, model: 'ofiste', deneyim: 'ogrenci', egitim: 'lisans', zorunluBeceriler: [taksonomi.beceri], sonBasvuru: yarin(), isTanimi: 'x', nitelikler: 'y' } as any,
    })
    expect(yeni.firma).toBe(firmaA.id)
    expect(yeni.durum).toBe('taslak')
  })
  it('firma kullanıcısı ilan durumunu kendisi "yayında" yapamaz (onay kuralı, K4)', async () => {
    const g = await payload.update({ collection: 'ilanlar', id: ilanATaslak.id, user: kullaniciA, overrideAccess: false, data: { durum: 'yayinda' } as any, depth: 0 })
    expect(g.durum).toBe('taslak')
  })
  it('firma kullanıcısı aday profillerini doğrudan okuyamaz (havuz yalnızca anonim uçtan)', async () => {
    await payload.create({ collection: 'adaylar', user: aday, overrideAccess: false, data: { havuz: { gorunurluk: 'aktif' } } as any })
    const { docs } = await payload.find({ collection: 'adaylar', user: kullaniciA, overrideAccess: false })
    expect(docs).toHaveLength(0)
  })
})

describe('roller', () => {
  it('kendi kendine kayıt olan kişi rolünü yönetici yapamaz', async () => {
    const yeni = await payload.create({
      collection: 'kullanicilar', overrideAccess: false,
      data: { email: `sinsi-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'Sinsi', rol: 'yonetici', firma: firmaA.id } as any,
    })
    expect(yeni.rol).toBe('aday')
    expect(yeni.firma ?? null).toBeNull()
  })
  it('aday kendi rolünü sonradan da değiştiremez', async () => {
    const g = await payload.update({ collection: 'kullanicilar', id: aday.id, user: aday, overrideAccess: false, data: { rol: 'yonetici' } as any })
    expect(g.rol).toBe('aday')
  })
})

describe('başvurular', () => {
  let basvuru: any
  it('aday yayındaki ilana başvurur; aynı ilana ikinci kez başvuramaz', async () => {
    const veri = { ilan: ilanBYayinda.id, profilKopyasi: { ad: 'Aday' }, aydinlatmaSurumu: '1.0' } as any
    basvuru = await payload.create({ collection: 'basvurular', user: aday, overrideAccess: false, data: veri })
    expect(basvuru.durum).toBe('alindi')
    expect(basvuru.firma).toBe(firmaB.id)
    await expect(payload.create({ collection: 'basvurular', user: aday, overrideAccess: false, data: veri })).rejects.toThrow(/daha önce başvurdun/)
  })
  it('taslak ilana başvurulamaz', async () => {
    await expect(
      payload.create({ collection: 'basvurular', user: adayIki, overrideAccess: false, data: { ilan: ilanBTaslak.id, profilKopyasi: {}, aydinlatmaSurumu: '1.0' } as any }),
    ).rejects.toThrow(/başvuru almıyor/)
  })
  it('aday ekip notlarını ve puanı göremez; başka adayın başvurusunu göremez', async () => {
    await payload.update({ collection: 'basvurular', id: basvuru.id, overrideAccess: true, data: { puan: 4, ekipNotlari: [{ not: 'Teknik görüşme' }] } as any })
    const kendi = await payload.findByID({ collection: 'basvurular', id: basvuru.id, user: aday, overrideAccess: false })
    expect((kendi as any).puan).toBeUndefined()
    expect((kendi as any).ekipNotlari).toBeUndefined()
    const { docs } = await payload.find({ collection: 'basvurular', user: adayIki, overrideAccess: false })
    expect(docs.map((d) => d.id)).not.toContain(basvuru.id)
  })
  it('başka firmanın kullanıcısı başvuruyu göremez', async () => {
    const { docs } = await payload.find({ collection: 'basvurular', user: kullaniciA, overrideAccess: false })
    expect(docs.map((d) => d.id)).not.toContain(basvuru.id)
  })
  it('aday başvurunun durumunu yalnızca geri çekebilir', async () => {
    await expect(payload.update({ collection: 'basvurular', id: basvuru.id, user: aday, overrideAccess: false, data: { durum: 'olumlu' } as any })).rejects.toThrow()
    const g = await payload.update({ collection: 'basvurular', id: basvuru.id, user: aday, overrideAccess: false, data: { durum: 'geri-cekti' } as any })
    expect(g.durum).toBe('geri-cekti')
  })
})

describe('firma içi yetki', () => {
  it('değerlendirici başvuru durumunu değiştiremez', async () => {
    const ilanA = await payload.update({ collection: 'ilanlar', id: ilanATaslak.id, overrideAccess: true, data: { durum: 'yayinda' } as any })
    const b = await payload.create({ collection: 'basvurular', user: adayIki, overrideAccess: false, data: { ilan: ilanA.id, profilKopyasi: {}, aydinlatmaSurumu: '1.0' } as any })
    const g = await payload.update({ collection: 'basvurular', id: b.id, user: degerlendiriciA, overrideAccess: false, data: { durum: 'olumsuz', puan: 3 } as any })
    expect(g.durum).toBe('alindi')
    expect(g.puan).toBe(3) // not ve puan yazabilir
  })
})

describe('işlem kayıtları ve e-posta', () => {
  it('ilan durumu değişince işlem kaydı yazılır; kayıt silinemez ve değiştirilemez', async () => {
    const { docs } = await payload.find({ collection: 'islem-kayitlari', where: { kayitId: { equals: String(ilanATaslak.id) } }, overrideAccess: true })
    expect(docs.length).toBeGreaterThan(0)
    const yonetici = await payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `yon-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'Yönetici', rol: 'yonetici' } as any })
    await expect(payload.delete({ collection: 'islem-kayitlari', id: docs[0].id, user: yonetici, overrideAccess: false })).rejects.toThrow()
    await expect(payload.update({ collection: 'islem-kayitlari', id: docs[0].id, user: yonetici, overrideAccess: false, data: { islem: 'değiştirildi' } })).rejects.toThrow()
  })
  it('test ortamında e-posta dışarı gitmez, test posta kutusuna yazılır', async () => {
    await payload.sendEmail({ to: `kisi-${ek}@ornek.com`, subject: `Deneme ${ek}`, html: '<p>Merhaba</p>' })
    const { docs } = await payload.find({ collection: 'test-postalar', where: { konu: { equals: `Deneme ${ek}` } }, overrideAccess: true })
    expect(docs).toHaveLength(1)
    expect(docs[0].kime).toBe(`kisi-${ek}@ornek.com`)
  })
})
