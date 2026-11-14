/**
 * KVKK başvuruları ve hesap silme (K27):
 * - aday portal formundan başvurur, açık başvuru sınırı ve açıklama zorunluluğu uygulanır;
 * - elle kayıtta adres kayıtlı aday hesabına bağlanır, “kayıtlı e-posta” yalnızca kayıtlı adreste seçilebilir;
 * - kimlik doğrulanmadan cevap verilemez, cevap boş veya yer tutuculu olamaz; yalnızca tam yetkili yönetir;
 * - hesap silinince başvurular firmada kalır ama ad, iletişim, ön yazı ve CV gider; profil, dosyalar, havuz
 *   görüntülenmeleri, onaylar ve hesap silinir; işlem kaydında kişisel veri yoktur.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { cevapTaslagi } from '@/alan/kvkk'
import { trGunMetni } from '@/alan/tarih'
import { basvur } from '@/servisler/basvuru'
import { havuzProfiliAc } from '@/servisler/havuz'
import { adayHesabiniSil } from '@/servisler/hesapSilme'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { kvkkBasvurusuYap, kvkkHesabiSil, kvkkIncelemeyeAl, kvkkNotEkle, kvkkSonuclandir, kvkkTalebiKaydet } from '@/servisler/kvkk'
import { cvYukle, havuzaKatil, profilGuncelle } from '@/servisler/profil'
import { adayVeriDokumu } from '@/veri/adayDokumu'

let payload: Payload
const ek = `kv${Date.now().toString(36)}`
let yonetici: any, moderator: any, firmaK: any, ilan: any, aile: any, beceri: any, okul: any, bolum: any

const k = (e: string, v: Record<string, unknown>) =>
  payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })

async function pdf() {
  const b = await PDFDocument.create()
  b.addPage([595, 842])
  const v = await b.save({ useObjectStreams: false })
  return { veri: v, boyut: v.length }
}

/** Profili, CV'si, başvurusu ve havuz kaydı olan bir aday. */
async function tamAday(e: string) {
  const a = await k(e, { rol: 'aday' })
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: a.id, telefon: '0555 000 00 00', beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
  await profilGuncelle(payload, a, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3', baglantilar: [{ ad: 'GitHub', adres: 'https://github.com/ornek' }] } as any)
  const cv = await cvYukle(payload, a, { ad: 'CV', dosya: await pdf() })
  const b = await basvur(payload, a, { ilanId: ilan.id, cvDosyaId: cv.id, onYazi: 'Merhaba, ben Kişi.', cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
  await havuzaKatil(payload, a, 'acik')
  return { a, cv, b }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  ;[aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Rust'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `KVKK ${ek}`, kisaAd: `KVKK ${ek}`, slug: `kvkk-${ek}`, konum: 'A Blok 2', guvenilir: true } as any })
  yonetici = await k('kvy', { rol: 'yonetici' })
  moderator = await k('kvm', { rol: 'moderator' })
  firmaK = await k('kvf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `KVKK ilanı ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5 + 3 * 36e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  ilan = (await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, ilan.id)
})

describe('portal başvurusu', () => {
  it('aday başvurur; açıklama gereken türde açıklamasız reddedilir; açık başvuru sınırı 3', async () => {
    const a = await k('kva', { rol: 'aday' })
    await expect(kvkkBasvurusuYap(payload, a, { tur: 'duzeltme', aciklama: '' })).rejects.toThrow(/açıkla/)
    await expect(kvkkBasvurusuYap(payload, a, { tur: 'yok' })).rejects.toThrow(/konusunu/)
    const { talep } = await kvkkBasvurusuYap(payload, a, { tur: 'bilgi' })
    expect(talep).toMatchObject({ kanal: 'portal', kimlik: 'hesap', durum: 'alindi', basvuranEposta: a.email })
    await kvkkBasvurusuYap(payload, a, { tur: 'amac' })
    await kvkkBasvurusuYap(payload, a, { tur: 'aktarim' })
    await expect(kvkkBasvurusuYap(payload, a, { tur: 'bilgi' })).rejects.toThrow(/Sonuçlanmamış 3/)
    await expect(kvkkBasvurusuYap(payload, firmaK, { tur: 'bilgi' })).rejects.toThrow(/yalnızca aday/)
    const posta = await payload.find({ collection: 'test-postalar', where: { and: [{ kime: { equals: a.email } }, { konu: { equals: 'KVKK başvurun alındı' } }] }, overrideAccess: true })
    expect(posta.totalDocs).toBe(3)
  })
})

describe('Yönetici A.Ş. işlemleri', () => {
  it('elle kayıt: kayıtlı adres hesaba bağlanır; kayıtlı olmayan adreste “kayıtlı e-posta” seçilemez', async () => {
    const a = await k('kvb', { rol: 'aday' })
    const bugun = trGunMetni(new Date())
    const ortak = { tur: 'bilgi', kanal: 'eposta', basvuruTarihi: bugun }
    await expect(kvkkTalebiKaydet(payload, moderator, { ...ortak, ad: 'X Y', eposta: a.email, kimlik: 'kayitli-eposta' })).rejects.toThrow(/tam yetkili/)
    const r = await kvkkTalebiKaydet(payload, yonetici, { ...ortak, ad: 'Kişi kvb', eposta: a.email.toUpperCase(), kimlik: 'kayitli-eposta' })
    expect(r.hesabaBaglandi).toBe(true)
    await expect(kvkkTalebiKaydet(payload, yonetici, { ...ortak, ad: 'Dış Kişi', eposta: `dis-${ek}@ornek.com`, kimlik: 'kayitli-eposta' })).rejects.toThrow(/kayıtlı değil/)
    const yarin = trGunMetni(new Date(Date.now() + 2 * 864e5))
    await expect(kvkkTalebiKaydet(payload, yonetici, { ...ortak, basvuruTarihi: yarin, ad: 'Dış Kişi', eposta: `dis-${ek}@ornek.com`, kimlik: 'imzali' })).rejects.toThrow(/bugünden sonra/)
    const d = await kvkkTalebiKaydet(payload, yonetici, { ...ortak, ad: 'Dış Kişi', eposta: `dis-${ek}@ornek.com`, kimlik: 'dogrulanmadi' })
    expect(d.hesabaBaglandi).toBe(false)
    // kimlik doğrulanmadan ne incelemeye alınır ne cevaplanır
    await expect(kvkkSonuclandir(payload, yonetici, d.talep.id, { sonuc: 'kabul', cevap: 'Uzun bir cevap metni burada yer alıyor.' })).rejects.toThrow(/kimliği doğrulanmadan/)
    await expect(kvkkIncelemeyeAl(payload, yonetici, d.talep.id)).rejects.toThrow(/kimliğini doğrulayın/)
    await kvkkIncelemeyeAl(payload, yonetici, d.talep.id, 'imzali')
    await kvkkNotEkle(payload, yonetici, d.talep.id, 'Dilekçe teslim alındı.')
    // taslak yer tutucularıyla ve kısa cevapla gönderilemez
    await expect(kvkkSonuclandir(payload, yonetici, d.talep.id, { sonuc: 'ret', cevap: 'Hayır.' })).rejects.toThrow(/gerekçe/)
    await expect(kvkkSonuclandir(payload, yonetici, d.talep.id, { sonuc: 'kabul', cevap: cevapTaslagi('bilgi', 'kabul', 'siz') })).rejects.toThrow(/köşeli/)
    const s = await kvkkSonuclandir(payload, yonetici, d.talep.id, { sonuc: 'kabul', cevap: 'Hakkınızda işlediğimiz kişisel veri bulunmamaktadır; portalda hesabınız yoktur.' })
    expect(s.talep).toMatchObject({ durum: 'sonuclandi', sonuc: 'kabul', cevapGonderildi: true })
    await expect(kvkkSonuclandir(payload, yonetici, d.talep.id, { sonuc: 'kabul', cevap: 'Yeniden cevap vermeye çalışıyoruz burada.' })).rejects.toThrow(/zaten/)
    const posta = await payload.find({ collection: 'test-postalar', where: { kime: { equals: `dis-${ek}@ornek.com` } }, overrideAccess: true })
    expect(posta.docs[0]?.konu).toBe('KVKK başvurunuz sonuçlandı')
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ kayitTuru: { equals: 'kvkk-talepleri' } }, { kayitId: { equals: String(d.talep.id) } }] }, overrideAccess: true, limit: 20 })
    expect(kayit.docs.map((x) => x.islem)).toEqual(expect.arrayContaining(['KVKK başvurusu kaydedildi', 'KVKK başvurusu incelemeye alındı', 'KVKK başvurusuna not eklendi', 'KVKK başvurusu sonuçlandırıldı']))
  })

  it('veri dökümü firmanın iç notlarını içermez', async () => {
    const { a, b } = await tamAday('kvd')
    await payload.update({ collection: 'basvurular', id: b.id, data: { puan: 4, ekipNotlari: [{ not: 'Gizli ekip notu', yazan: firmaK.id }] } as any, overrideAccess: true })
    const d = (await adayVeriDokumu(payload, a.id))!
    expect(d.basvurular).toHaveLength(1)
    const metin = JSON.stringify(d)
    expect(metin).not.toMatch(/Gizli ekip notu|"puan"/)
    expect(d.basvurular[0]!.ilan).toBe(`KVKK ilanı ${ek}`)
    expect(await adayVeriDokumu(payload, firmaK.id)).toBeNull()
  })
})

describe('hesap silme (K27)', () => {
  it('aday kendi hesabını siler: başvuru firmada kalır, kimlik bilgileri ve CV gider; profil ve kayıtlar silinir', async () => {
    const { a, cv, b } = await tamAday('kvs')
    const profil = (await payload.find({ collection: 'adaylar', where: { kullanici: { equals: a.id } }, overrideAccess: true })).docs[0]!
    await havuzProfiliAc(payload, firmaK, profil.id)
    const baska = await k('kvx', { rol: 'aday' })
    await expect(adayHesabiniSil(payload, baska, a.id)).rejects.toThrow(/yetkiniz yok/)
    await expect(adayHesabiniSil(payload, yonetici, firmaK.id)).rejects.toThrow(/yalnızca aday/)

    const s = await adayHesabiniSil(payload, a, a.id)
    expect(s).toMatchObject({ basvuru: 1 })
    expect(s.cv).toBeGreaterThanOrEqual(1)

    const bs = await payload.findByID({ collection: 'basvurular', id: b.id, depth: 0, overrideAccess: true })
    expect(bs.adayKullanici ?? null).toBeNull()
    expect(bs.cv ?? null).toBeNull()
    expect(bs.onYazi ?? null).toBeNull()
    const p = bs.profilKopyasi as any
    expect(p).toMatchObject({ ad: null, eposta: null, telefon: null, baglantilar: [], hesapSilindi: true })
    expect(p.beceriler?.length).toBe(1) // değerlendirme bilgisi kalır
    expect(bs.durum).toBeTruthy()

    const yok = async (collection: any, where: any) => (await payload.count({ collection, where, overrideAccess: true })).totalDocs
    expect(await yok('kullanicilar', { id: { equals: a.id } })).toBe(0)
    expect(await yok('adaylar', { id: { equals: profil.id } })).toBe(0)
    expect(await yok('dosyalar', { id: { equals: cv.id } })).toBe(0)
    expect(await yok('rizalar', { kullanici: { equals: a.id } })).toBe(0)
    expect(await yok('havuz-goruntulemeleri', { aday: { equals: profil.id } })).toBe(0)
    expect(await yok('test-postalar', { kime: { equals: a.email } })).toBe(0)

    const kayit = (await payload.find({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: 'Aday hesabı silindi' } }, { kayitId: { equals: String(a.id) } }] }, overrideAccess: true })).docs[0]!
    expect(kayit.ayrinti).toMatchObject({ baslatan: 'aday', basvuru: 1 })
    expect(JSON.stringify(kayit)).not.toMatch(/Kişi kvs|@ornek/)
  })

  it('KVKK silme başvurusu üzerine yönetici siler; talep kaydı ve cevap adresi kalır', async () => {
    const { a, b } = await tamAday('kvt')
    const { talep } = await kvkkBasvurusuYap(payload, a, { tur: 'silme' })
    await expect(kvkkHesabiSil(payload, yonetici, talep.id)).rejects.toThrow(/incelemeye alın/)
    await kvkkIncelemeyeAl(payload, yonetici, talep.id)
    await expect(kvkkHesabiSil(payload, moderator, talep.id)).rejects.toThrow(/tam yetkili/)
    await kvkkHesabiSil(payload, yonetici, talep.id)
    const t = await payload.findByID({ collection: 'kvkk-talepleri', id: talep.id, depth: 0, overrideAccess: true })
    expect(t.kullanici ?? null).toBeNull()
    expect(t.basvuranEposta).toBe(a.email)
    expect(t.notlar?.at(-1)?.metin).toMatch(/Hesap silindi/)
    expect((await payload.findByID({ collection: 'basvurular', id: b.id, depth: 0, overrideAccess: true })).adayKullanici ?? null).toBeNull()
    const s = await kvkkSonuclandir(payload, yonetici, talep.id, { sonuc: 'kabul', cevap: cevapTaslagi('silme', 'kabul', 'sen') })
    expect(s.eposta).toBe(true)
    const kayit = (await payload.find({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: 'Aday hesabı silindi' } }, { kayitId: { equals: String(a.id) } }] }, overrideAccess: true, depth: 0 })).docs[0]!
    expect(kayit.ayrinti).toMatchObject({ baslatan: 'yonetici-as', kvkkTalebi: talep.id })
    expect(Number(kayit.kim)).toBe(yonetici.id)
  })
})
