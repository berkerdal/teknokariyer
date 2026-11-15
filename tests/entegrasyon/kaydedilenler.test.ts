/**
 * Kaydedilen ilanlar: yalnızca aday kaydeder, yalnızca yayındaki ilan; tekrar kaydetmek ve çıkarmak sonucu değiştirmez;
 * * son başvuruya 2 gün kala bir kez hatırlatma gider, başvurulan ilan için gitmez;
 * hesap silinince kayıtlar silinir ve veri dökümünde görünür.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument } from 'pdf-lib'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { basvur } from '@/servisler/basvuru'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet as ilanFormuKaydet } from '@/servisler/ilanFormu'
import { ilanKaydet, kaydedilenHatirlatmalari, kaydedilenIlanIdleri, kaydiKaldir } from '@/servisler/kaydedilenler'
import { cvYukle, profilGuncelle } from '@/servisler/profil'
import { adayHesabiniSil } from '@/servisler/hesapSilme'
import { adayVeriDokumu } from '@/veri/adayDokumu'

let payload: Payload
const ek = `kd${Date.now().toString(36)}`
let firmaK: any, aday1: any, aday2: any, yakin: any, uzak: any, taslak: any
const gunSonra = (n: number, saatUtc = 7) => {
  const d = new Date(Date.now() + n * 86_400_000)
  d.setUTCHours(saatUtc, 0, 0, 0)
  return d
}
const postalar = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, limit: 50 })).docs.map((d: any) => d.konu as string)

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  const [aile, beceri, okul, bolum] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Rust'), t('universite', 'PAÜ'), t('bolum', 'Bilgisayar')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Kayit ${ek}`, kisaAd: `Kayit ${ek}`, slug: `kayit-${ek}`, konum: 'B Blok 1', guvenilir: true } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('kdf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  aday1 = await k('kda', { rol: 'aday' })
  aday2 = await k('kdb', { rol: 'aday' })
  const ilan = async (ad: string, gun: number, yayinla = true) => {
    const fd = new FormData()
    for (const [a, d] of [['pozisyonAdi', `${ad} ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'hibrit'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + gun * 864e5 + 3 * 36e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
      fd.append(a, d)
    const i = (await ilanFormuKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
    if (yayinla) await yayinaGonder(payload, firmaK, i.id)
    return i
  }
  yakin = await ilan('Yakın', 5)
  uzak = await ilan('Uzak', 30)
  taslak = await ilan('Taslak', 30, false)
  // aday2 yakın ilana başvurur (hatırlatma gitmemeli)
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: aday2.id, beceriler: [{ beceri: beceri.id, seviye: 'iyi' }], havuz: { gorunurluk: 'gizli' } } as any })
  await profilGuncelle(payload, aday2, { okul: okul.id, bolum: bolum.id, deneyimSeviyesi: '1-3' })
  const belge = await PDFDocument.create()
  belge.addPage([595, 842])
  const pdf = await belge.save({ useObjectStreams: false })
  const cv = await cvYukle(payload, aday2, { ad: 'CV', dosya: { veri: pdf, boyut: pdf.length } })
  await basvur(payload, aday2, { ilanId: yakin.id, cvDosyaId: cv.id, cevaplar: {}, aydinlatmaOnay: true, havuzaKatil: false })
})

describe('kaydetme', () => {
  it('yalnızca aday ve yalnızca yayındaki ilan; tekrar kaydetmek ve çıkarmak sonucu değiştirmez', async () => {
    await expect(ilanKaydet(payload, firmaK, yakin.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(ilanKaydet(payload, null, yakin.id)).rejects.toMatchObject({ durumKodu: 403 })
    await expect(ilanKaydet(payload, aday1, taslak.id)).rejects.toMatchObject({ durumKodu: 404 })
    await ilanKaydet(payload, aday1, yakin.id)
    await ilanKaydet(payload, aday1, yakin.id)
    await ilanKaydet(payload, aday1, uzak.id)
    expect([...(await kaydedilenIlanIdleri(payload, aday1))].sort()).toEqual([yakin.id, uzak.id].sort())
    await kaydiKaldir(payload, aday1, uzak.id)
    await kaydiKaldir(payload, aday1, uzak.id)
    expect([...(await kaydedilenIlanIdleri(payload, aday1))]).toEqual([yakin.id])
    // Başka adayın kaydı onu etkilemez; aday başkasının kaydını okuyamaz
    await ilanKaydet(payload, aday2, yakin.id)
    const okunan = await payload.find({ collection: 'kaydedilen-ilanlar', user: aday1, overrideAccess: false, depth: 0 })
    expect(okunan.docs.every((d: any) => d.kullanici === aday1.id)).toBe(true)
  })
})

describe('hatırlatma', () => {
  it('2 gün kala bir kez gider; başvurulan ilan için gitmez', async () => {
    const hatalar: string[] = []
    expect(await kaydedilenHatirlatmalari(payload, gunSonra(1), hatalar)).toBe(0) // 4 gün var
    expect(await kaydedilenHatirlatmalari(payload, gunSonra(3), hatalar)).toBe(1) // 2 gün kala: yalnızca aday1
    expect(await kaydedilenHatirlatmalari(payload, gunSonra(4), hatalar)).toBe(0) // ikinci kez gitmez
    expect(hatalar).toEqual([])
    expect((await postalar(`kda-${ek}`)).filter((k) => k.startsWith('Kaydettiğin'))).toEqual([`Kaydettiğin ilanın süresi doluyor: ${yakin.pozisyonAdi}`])
    expect(await postalar(`kdb-${ek}`)).not.toContainEqual(expect.stringMatching(/Kaydettiğin ilanın/))
  })
})

describe('KVKK', () => {
  it('veri dökümünde görünür; hesap silinince kayıtlar silinir', async () => {
    await ilanKaydet(payload, aday1, uzak.id)
    const dokum = await adayVeriDokumu(payload, aday1.id)
    expect(dokum!.kaydedilenIlanlar.map((k: any) => k.ilan).sort()).toEqual([yakin.pozisyonAdi, uzak.pozisyonAdi].sort())
    await adayHesabiniSil(payload, aday1, aday1.id)
    expect((await payload.count({ collection: 'kaydedilen-ilanlar', where: { kullanici: { equals: aday1.id } }, overrideAccess: true })).totalDocs).toBe(0)
  })
})
