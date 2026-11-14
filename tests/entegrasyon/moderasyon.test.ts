/**
 * Yönetici A.Ş. kararları (K4): kontrol listesi zorunlu, düzeltme gerekçeli, güvenilir işaretini yalnızca tam
 * yetkili verir, kararlar firmanın ilgili kullanıcılarına e-postayla gider (değerlendiriciye ve ekipten çıkarılana gitmez).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { KONTROL_LISTESI } from '@/alan/moderasyon'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { basvurusuzHatirlat, degisiklikKarari, ilanDuzeltmeIste, ilanOnayla, talepKarari } from '@/servisler/moderasyon'
import { taksonomiTalebiOlustur } from '@/servisler/talepler'
import { FormHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `m${Date.now().toString(36)}`
const HEPSI = KONTROL_LISTESI.map(([k]) => k)
let aile: number, beceri: number
let sorumlu: any, ikinciK: any, yonetici: any, moderator: any, firma: any

const tarih = (gun: number) => new Date(Date.now() + gun * 864e5 + 3 * 36e5).toISOString().slice(0, 10)
const form = (ad: string, ekler: Array<[string, string]> = []) => {
  const fd = new FormData()
  const temel: Array<[string, string]> = [
    ['pozisyonAdi', ad], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile)], ['model', 'hibrit'], ['deneyim', '1-3'],
    ['egitim', 'lisans'], ['zorunluBeceri', String(beceri)], ['sonBasvuru', tarih(20)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik'],
  ]
  for (const [a, d] of temel.filter(([k]) => !ekler.some(([e]) => e === k)).concat(ekler)) fd.append(a, d)
  return ilanFormunuOku(fd).veri
}
const postalar = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, sort: '-createdAt', limit: 50 })).docs.map((d: any) => d.konu as string)

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  aile = (await t('pozisyon-ailesi', 'Yazılım')).id
  beceri = (await t('beceri', 'Elixir')).id
  const f = (ad: string) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `${ad} A.Ş.`, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'C Blok 3' } as any })
  firma = await f('Moderasyon')
  const ikinci = await f('İkinci')
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  sorumlu = await k('ms', { rol: 'firma', firma: firma.id, firmaYetkisi: 'ilan-sorumlusu' })
  await k('md', { rol: 'firma', firma: firma.id, firmaYetkisi: 'degerlendirici' })
  await k('mc', { rol: 'firma', firma: firma.id, firmaYetkisi: 'yonetici', pasif: true })
  ikinciK = await k('mi', { rol: 'firma', firma: ikinci.id, firmaYetkisi: 'yonetici' })
  yonetici = await k('my', { rol: 'yonetici' })
  moderator = await k('mm', { rol: 'moderator' })
})

describe('ilan onayı', () => {
  it('düzeltme gerekçe ister; gerekçe firmaya yazılır ve yalnızca ilanlarla ilgilenen etkin kullanıcılara e-posta gider', async () => {
    const { ilan } = await ilanKaydet(payload, sorumlu, null, form(`Düzeltilecek ${ek}`, [['isTanimi', '- Başvurular için ik@firma.com adresine yazın.']]))
    expect((await yayinaGonder(payload, sorumlu, ilan.id)).durum).toBe('onayda')
    await expect(ilanDuzeltmeIste(payload, moderator, ilan.id, '  ')).rejects.toBeInstanceOf(FormHatasi)
    await expect(ilanDuzeltmeIste(payload, sorumlu, ilan.id, 'Kendi ilanım')).rejects.toMatchObject({ durumKodu: 403 })
    const s = await ilanDuzeltmeIste(payload, moderator, ilan.id, 'E-posta adresini kaldırın.')
    expect(s.ilan.durum).toBe('duzeltme')
    expect(s.ilan.duzeltmeGerekcesi).toBe('E-posta adresini kaldırın.')
    expect(await postalar(`ms-${ek}`)).toContain(`İlanınızda düzeltme istendi: Düzeltilecek ${ek}`)
    // hesap açılışındaki doğrulama e-postası dışında bir şey almazlar
    expect(await postalar(`md-${ek}`)).not.toContain(`İlanınızda düzeltme istendi: Düzeltilecek ${ek}`)
    expect(await postalar(`mc-${ek}`)).not.toContain(`İlanınızda düzeltme istendi: Düzeltilecek ${ek}`)
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { and: [{ kayitId: { equals: String(ilan.id) } }, { tur: { equals: 'moderasyon' } }] }, overrideAccess: true })
    expect(kayit.docs.map((d) => d.islem)).toContain('İlan için düzeltme istendi')
  })

  it('kontrol listesi eksikse onay reddedilir; moderatör güvenilir işareti veremez; yönetici onaylayınca ilan yayına girer', async () => {
    const { ilan } = await ilanKaydet(payload, sorumlu, null, form(`Onaylanacak ${ek}`))
    await yayinaGonder(payload, sorumlu, ilan.id)
    const eksik = await ilanOnayla(payload, moderator, ilan.id, { kontroller: HEPSI.slice(1) }).catch((e) => e)
    expect(eksik).toBeInstanceOf(FormHatasi)
    expect((eksik as FormHatasi).alanlar.kontrol).toMatch(/yaş, cinsiyet/)
    await expect(ilanOnayla(payload, moderator, ilan.id, { kontroller: HEPSI, guvenilirYap: true })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(ilanOnayla(payload, sorumlu, ilan.id, { kontroller: HEPSI })).rejects.toMatchObject({ durumKodu: 403 })
    const s = await ilanOnayla(payload, yonetici, ilan.id, { kontroller: HEPSI, guvenilirYap: true })
    expect(s.ilan.durum).toBe('yayinda')
    expect(s.eposta).toBe(true)
    const f = await payload.findByID({ collection: 'firmalar', id: firma.id, overrideAccess: true })
    expect(f.guvenilir).toBe(true)
    expect(f.onaylanmisIlanSayisi).toBe(1)
    expect(await postalar(`ms-${ek}`)).toContain(`İlanınız yayına girdi: Onaylanacak ${ek}`)
    await expect(ilanOnayla(payload, yonetici, ilan.id, { kontroller: HEPSI })).rejects.toMatchObject({ durumKodu: 409 })
  })
})

describe('esaslı değişiklik ve hatırlatma', () => {
  it('reddedilen değişiklik gerekçe ister ve firmaya bildirilir; ilan eski hâliyle kalır', async () => {
    const { ilan } = await ilanKaydet(payload, ikinciK, null, form(`Eski ad ${ek}`))
    await yayinaGonder(payload, ikinciK, ilan.id)
    await ilanOnayla(payload, moderator, ilan.id, { kontroller: HEPSI })
    const s = await ilanKaydet(payload, ikinciK, ilan.id, form(`Yeni ad ${ek}`))
    expect(s.onayaGiden).toEqual(['pozisyonAdi'])
    await expect(degisiklikKarari(payload, moderator, ilan.id, false, '')).rejects.toBeInstanceOf(FormHatasi)
    const r = await degisiklikKarari(payload, moderator, ilan.id, false, 'Pozisyon adı iş tanımıyla uyuşmuyor.')
    expect(r.ilan.pozisyonAdi).toBe(`Eski ad ${ek}`)
    expect(await postalar(`mi-${ek}`)).toContain(`İlan değişikliğiniz onaylanmadı: Eski ad ${ek}`)
  })

  it('başvurusuz ilan için hatırlatma bir kez gönderilir; firma kullanıcısı gönderemez', async () => {
    const { ilan } = await ilanKaydet(payload, sorumlu, null, form(`Başvurusuz ${ek}`, [['sonBasvuru', tarih(3)]]))
    await yayinaGonder(payload, sorumlu, ilan.id) // firma artık güvenilir: doğrudan yayında
    await expect(basvurusuzHatirlat(payload, sorumlu, ilan.id)).rejects.toMatchObject({ durumKodu: 403 })
    expect(await basvurusuzHatirlat(payload, moderator, ilan.id)).toBe(1) // yalnızca etkin ilan sorumlusu
    await expect(basvurusuzHatirlat(payload, moderator, ilan.id)).rejects.toMatchObject({ durumKodu: 409 })
    expect((await postalar(`ms-${ek}`)).some((k) => k.startsWith('İlanınız henüz başvuru almadı'))).toBe(true)
  })
})

describe('liste talepleri', () => {
  it('kabul edilen öğe eklenir, talep edene sonuç e-postası gider; boş seçimle onay reddedilir', async () => {
    const t = await taksonomiTalebiOlustur(payload, sorumlu, { tur: 'beceri', ogeler: `Gleam ${ek}\nYanlis ${ek}` })
    await expect(talepKarari(payload, moderator, t.talep.id, { onay: true, kabulEdilenler: [] })).rejects.toBeInstanceOf(FormHatasi)
    const s = await talepKarari(payload, moderator, t.talep.id, { onay: true, kabulEdilenler: [`Gleam ${ek}`], not: 'Yazımı düzeltildi.' })
    expect(s.eklenenler).toEqual([`Gleam ${ek}`])
    expect(s.reddedilenler).toEqual([`Yanlis ${ek}`])
    expect(s.eposta).toBe(true)
    expect(await postalar(`ms-${ek}`)).toContain('Talebiniz sonuçlandı: 1 öğe eklendi')
  })
})
