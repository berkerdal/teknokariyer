/**
 * Kural servisleri: talimatlardaki iş akışlarının uçtan uca denenmesi (yerel D1, geçici veritabanı).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { duraklat, duzeltmeIste, kapat, kopyala, onayla, sureUzat, suresiDolanlariKapat, yayinaGonder } from '@/servisler/ilanIslemleri'
import { basvur } from '@/servisler/basvuru'
import { goruntuleyenFirmaSayisi, havuzAra, havuzProfiliAc } from '@/servisler/havuz'
import { cvYukle, profilGuncelle } from '@/servisler/profil'

const PDF = new TextEncoder().encode('%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer<< /Size 2 /Root 1 0 R >>\nstartxref\n47\n%%EOF\n')

let payload: Payload
const ek = `s${Date.now().toString(36)}`
const gun = (n: number) => new Date(Date.now() + n * 86_400_000)
let firma: any, digerFirma: any, firmaKullanici: any, digerKullanici: any, yonetici: any, adayK: any, aday: any
let aile: number, beceri: number, okul: number, bolum: number

async function taslakIlan(firmaId: number, ad = 'Flutter Geliştirici', ekVeri: Record<string, unknown> = {}) {
  return payload.create({
    collection: 'ilanlar',
    overrideAccess: true,
    data: {
      firma: firmaId, pozisyonAdi: `${ad} ${ek}`, tur: 'is', altTur: 'tam-zamanli', aile, model: 'hibrit', deneyim: '1-3',
      egitim: 'lisans', zorunluBeceriler: [beceri], sonBasvuru: gun(10).toISOString(), isTanimi: 'İş', nitelikler: 'Nitelik',
      durum: 'taslak', ...ekVeri,
    } as any,
  })
}

beforeAll(async () => {
  payload = await getPayload({ config })
  aile = (await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'pozisyon-ailesi', ad: `Yazılım ${ek}` } as any })).id
  beceri = (await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'beceri', ad: `Dart ${ek}` } as any })).id
  okul = (await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'universite', ad: `PAÜ ${ek}` } as any })).id
  bolum = (await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'bolum', ad: `Bilgisayar ${ek}` } as any })).id
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: ad, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'D Blok 208' } as any })
  firma = await f('Kodpit')
  digerFirma = await f('Bulutfon')
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, ...v } as any })
  firmaKullanici = await k('firma', { rol: 'firma', firma: firma.id, firmaYetkisi: 'yonetici' })
  digerKullanici = await k('diger', { rol: 'firma', firma: digerFirma.id, firmaYetkisi: 'yonetici' })
  yonetici = await k('yonetici', { rol: 'yonetici' })
  adayK = await k('aday', { rol: 'aday' })
  aday = await payload.create({
    collection: 'adaylar', overrideAccess: true,
    data: { kullanici: adayK.id, cinsiyet: 'kadin', beceriler: [{ beceri, seviye: 'iyi' }], tercihler: { ucretBeklentisi: 50000 }, havuz: { gorunurluk: 'gizli' } } as any,
  })
})

describe('onay kuralı (K4) ve moderasyon', () => {
  it('ilk 3 ilan onaya gider; 3 onaydan sonra 4. ilan doğrudan yayınlanır', async () => {
    for (let i = 0; i < 3; i++) {
      const ilan = await taslakIlan(firma.id, `İlan ${i}`)
      const g = await yayinaGonder(payload, firmaKullanici, ilan.id)
      expect(g.durum).toBe('onayda')
      expect((await onayla(payload, yonetici, ilan.id)).durum).toBe('yayinda')
    }
    const f = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true })
    expect(f.onaylanmisIlanSayisi).toBe(3)
    const dorduncu = await taslakIlan(firma.id, 'Dördüncü')
    expect((await yayinaGonder(payload, firmaKullanici, dorduncu.id)).durum).toBe('yayinda')
  })
  it('firma kullanıcısı onay veremez; düzeltme istenen ilan gerekçesiyle geri döner ve yeniden gönderilir', async () => {
    const ilan = await taslakIlan(digerFirma.id)
    await yayinaGonder(payload, digerKullanici, ilan.id)
    await expect(onayla(payload, digerKullanici, ilan.id)).rejects.toThrow(/Yönetici A.Ş./)
    await expect(duzeltmeIste(payload, yonetici, ilan.id, '  ')).rejects.toThrow(/ne düzeltmesi/)
    const d = await duzeltmeIste(payload, yonetici, ilan.id, 'Metindeki e-posta adresini kaldırın.')
    expect(d.durum).toBe('duzeltme')
    expect(d.duzeltmeGerekcesi).toContain('e-posta')
    expect((await yayinaGonder(payload, digerKullanici, ilan.id)).durum).toBe('onayda')
  })
})

describe('ilan işlemleri (K1)', () => {
  it('süre en fazla 60 gün sonrasına uzatılır', async () => {
    const ilan = await taslakIlan(firma.id, 'Uzatma')
    await yayinaGonder(payload, firmaKullanici, ilan.id) // güvenilir değil ama 3 onaylı: doğrudan yayında
    await expect(sureUzat(payload, firmaKullanici, ilan.id, gun(61))).rejects.toThrow(/en fazla 60 gün/)
    await expect(sureUzat(payload, firmaKullanici, ilan.id, gun(5))).rejects.toThrow(/mevcut son başvuru/)
    const g = await sureUzat(payload, firmaKullanici, ilan.id, gun(30))
    expect(new Date(g.sonBasvuru).getTime()).toBeGreaterThan(gun(29).getTime())
  })
  it('başka firmanın ilanı kapatılamaz; durumu uymayan işlem anlaşılır hatayla reddedilir', async () => {
    const ilan = await taslakIlan(firma.id, 'Kapatma')
    await expect(duraklat(payload, firmaKullanici, ilan.id)).rejects.toThrow(/duraklatılamaz/)
    await yayinaGonder(payload, firmaKullanici, ilan.id)
    await expect(kapat(payload, digerKullanici, ilan.id, 'doldu')).rejects.toThrow(/yetkiniz yok/)
    expect((await kapat(payload, firmaKullanici, ilan.id, 'doldu')).durum).toBe('kapandi')
  })
  it('kopya taslak olarak açılır ve içeriği korur', async () => {
    const ilan = await taslakIlan(firma.id, 'Kopyalanacak')
    const k = await kopyala(payload, firmaKullanici, ilan.id)
    expect(k.durum).toBe('taslak')
    expect(k.pozisyonAdi).toBe(ilan.pozisyonAdi)
    expect(k.id).not.toBe(ilan.id)
  })
  it('son günü geçen ilan otomatik olarak "süresi doldu" olur', async () => {
    const ilan = await taslakIlan(firma.id, 'Süre')
    await yayinaGonder(payload, firmaKullanici, ilan.id)
    const sayi = await suresiDolanlariKapat(payload, gun(12))
    expect(sayi).toBeGreaterThan(0)
    expect((await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })).durum).toBe('suresi-doldu')
  })
})

describe('başvuru ve havuz (K24, K25, K5)', () => {
  let ilan: any
  let cvId: number
  beforeAll(async () => {
    ilan = await taslakIlan(firma.id, 'Başvurulacak', {
      onElemeSorulari: [{ soru: 'Haftada 2 gün ofiste çalışabilir misin?', tip: 'evet-hayir', eleyici: true, beklenenCevap: 'Evet' }],
    })
    await yayinaGonder(payload, firmaKullanici, ilan.id)
    ilan = await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })
  })
  it('profil eksikse ve CV seçilmemişse başvurulamaz; CV yalnızca gerçek PDF olabilir', async () => {
    const soruId = ilan.onElemeSorulari[0].id
    const g = { ilanId: ilan.id, cevaplar: { [soruId]: 'Evet' }, aydinlatmaOnay: true, havuzaKatil: false }
    await expect(basvur(payload, adayK, g)).rejects.toThrow(/profil bilgilerini tamamla/)
    await profilGuncelle(payload, adayK, { okul, bolum, deneyimSeviyesi: '1-3' })
    await expect(basvur(payload, adayK, g)).rejects.toThrow(/CV/)
    await expect(cvYukle(payload, adayK, { ad: 'Sahte', dosya: { veri: new TextEncoder().encode('<html>'), boyut: 6 } })).rejects.toThrow(/Yalnızca PDF/)
    cvId = (await cvYukle(payload, adayK, { ad: 'CV – Türkçe', dosya: { veri: PDF, boyut: PDF.length } })).id
    const dosya = await payload.findByID({ collection: 'dosyalar', id: cvId, overrideAccess: true })
    expect(dosya).toMatchObject({ tur: 'cv', taramaDurumu: 'bekliyor' })
    expect(dosya.filename).not.toContain('Kişi')
  })
  it('aydınlatma onayı ve sorular cevaplanmadan başvurulamaz', async () => {
    await expect(basvur(payload, adayK, { ilanId: ilan.id, cevaplar: {}, aydinlatmaOnay: false, havuzaKatil: false })).rejects.toThrow(/aydınlatma/)
    await expect(basvur(payload, adayK, { ilanId: ilan.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })).rejects.toThrow(/soruları cevapla/)
  })
  it('başvuru profil kopyasını dondurur, eleyici cevabı işaretler, havuz rızasını kaydeder', async () => {
    const soruId = ilan.onElemeSorulari[0].id
    const b = await basvur(payload, adayK, { ilanId: ilan.id, cvDosyaId: cvId, cevaplar: { [soruId]: 'Hayır' }, aydinlatmaOnay: true, havuzaKatil: true })
    expect(b.eleyiciUyari).toBe(true)
    expect((b.profilKopyasi as any).ad).toBe(adayK.ad)
    expect((b.profilKopyasi as any).tercihler.ucretBeklentisi).toBeUndefined()
    const rizalar = await payload.find({ collection: 'rizalar', where: { kullanici: { equals: adayK.id } }, overrideAccess: true })
    expect(rizalar.docs.map((r) => r.tur).sort()).toEqual(['basvuru-aydinlatma', 'havuz'])
    const a = await payload.findByID({ collection: 'adaylar', id: aday.id, overrideAccess: true })
    expect(a.havuz?.gorunurluk).toBe('acik')
    expect((await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })).basvuruSayisi).toBe(1)
    await expect(basvur(payload, adayK, { ilanId: ilan.id, cvDosyaId: cvId, cevaplar: { [soruId]: 'Evet' }, aydinlatmaOnay: true, havuzaKatil: false })).rejects.toThrow(/daha önce/)
  })
  it('havuz araması anonimdir ve cinsiyete göre filtrelenemez', async () => {
    await expect(havuzAra(payload, firmaKullanici, { cinsiyet: 'kadin' })).rejects.toThrow(/arama yapılamaz/)
    const sonuc = await havuzAra(payload, firmaKullanici, { beceriler: [beceri] })
    const bu = sonuc.find((s) => s.id === String(aday.id))
    expect(bu).toBeDefined()
    expect((bu as any).ad).toBeUndefined()
    expect((bu as any).eposta).toBeUndefined()
    expect(bu!.cinsiyet).toBe('kadin')
  })
  it('aday bir firmadan gizlenirse o firma onu bulamaz', async () => {
    await payload.update({ collection: 'adaylar', id: aday.id, overrideAccess: true, data: { havuz: { gizlenenFirmalar: [digerFirma.id] } } as any })
    const sonuc = await havuzAra(payload, digerKullanici, { beceriler: [beceri] })
    expect(sonuc.find((s) => s.id === String(aday.id))).toBeUndefined()
  })
  it('profil açılınca ad ve iletişim görünür; açılış kaydedilir; aday yalnızca sayıyı görür', async () => {
    const p = await havuzProfiliAc(payload, firmaKullanici, aday.id)
    expect(p.ad).toBe(adayK.ad)
    expect(p.eposta).toBe(adayK.email)
    await havuzProfiliAc(payload, firmaKullanici, aday.id) // aynı firma ikinci kez
    expect(await goruntuleyenFirmaSayisi(payload, adayK)).toBe(1)
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ tur: { equals: 'kisisel-veri' } }, { kayitId: { equals: String(aday.id) } }] }, overrideAccess: true })
    expect(kayit.totalDocs).toBe(2)
    await expect(havuzProfiliAc(payload, digerKullanici, aday.id)).rejects.toThrow(/havuzda değil/)
  })
})
