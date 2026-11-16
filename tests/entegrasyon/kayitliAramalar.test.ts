/**
 * Kayıtlı aramalar: yalnızca aday ilan araması, yalnızca havuz yetkili firma kullanıcısı havuz araması kaydeder; aynı
 * arama ikinci kez kaydedilmez; en fazla 10; başkasının araması silinemez. “Anlık” aramaya uyan ilan yayına girince
 * e-posta gider, uymayana gitmez; haftalık özet 7 gün sonra yeni ilanları listeler; hesap silinince aramalar silinir.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet as ilanFormuKaydet } from '@/servisler/ilanFormu'
import { aramaKaydet, aramaSil, haftalikAramaBildirimleri, kisininAramalari } from '@/servisler/kayitliAramalar'
import { adayHesabiniSil } from '@/servisler/hesapSilme'

let payload: Payload
const ek = `ka${Date.now().toString(36)}`
let firmaK: any, degerlendirici: any, aday1: any, aday2: any, aile: any, beceri: any
const postalar = async (kime: string) =>
  (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, limit: 50, sort: 'createdAt' })).docs.map((d: any) => d.konu as string)
const ilanAc = async (ad: string, model: string) => {
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `${ad} ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', model], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  const i = (await ilanFormuKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, i.id)
  return i
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  ;[aile, beceri] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Elixir')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Arama ${ek}`, kisaAd: `Arama ${ek}`, slug: `arama-${ek}`, konum: 'B Blok 1', guvenilir: true } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('kaf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  degerlendirici = await k('kad', { rol: 'firma', firma: f.id, firmaYetkisi: 'degerlendirici' })
  aday1 = await k('ka1', { rol: 'aday' })
  aday2 = await k('ka2', { rol: 'aday' })
})

describe('kaydetme kuralları', () => {
  it('yalnızca aday ilan araması, yalnızca havuz yetkilisi havuz araması kaydeder; aynı arama tekrar kaydedilmez', async () => {
    await expect(aramaKaydet(payload, firmaK, { tur: 'ilan', sorgu: 'tur=is' })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(aramaKaydet(payload, null, { tur: 'ilan', sorgu: 'tur=is' })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(aramaKaydet(payload, degerlendirici, { tur: 'havuz', sorgu: `beceri=${beceri.id}` })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(aramaKaydet(payload, aday1, { tur: 'havuz', sorgu: `beceri=${beceri.id}` })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(aramaKaydet(payload, firmaK, { tur: 'havuz', sorgu: '' })).rejects.toThrow(/beceri/)
    const a = await aramaKaydet(payload, aday1, { tur: 'ilan', sorgu: `?model=uzaktan&ara=${ek}`, siklik: 'anlik' })
    expect(a.ad).toBe(`“${ek}” · Uzaktan`)
    const tekrar = await aramaKaydet(payload, aday1, { tur: 'ilan', sorgu: `ara=${ek}&model=uzaktan&sira=son-tarih`, siklik: 'anlik' })
    expect(tekrar.id).toBe(a.id)
    expect(await kisininAramalari(payload, aday1, 'ilan')).toHaveLength(1)
    expect((await aramaKaydet(payload, firmaK, { tur: 'havuz', sorgu: `beceri=${beceri.id}`, ad: 'Elixir bilenler' })).siklik).toBe('haftalik')
  })

  it('en fazla 10 arama; başkasının araması silinemez', async () => {
    for (let i = 0; i < 9; i++) await aramaKaydet(payload, aday1, { tur: 'ilan', sorgu: `ara=sinir${i}` })
    await expect(aramaKaydet(payload, aday1, { tur: 'ilan', sorgu: 'ara=fazla' })).rejects.toMatchObject({ durumKodu: 409 })
    const [ilk] = await kisininAramalari(payload, aday1, 'ilan')
    await expect(aramaSil(payload, aday2, ilk!.id)).rejects.toMatchObject({ durumKodu: 404 })
    await aramaSil(payload, aday1, ilk!.id)
    expect(await kisininAramalari(payload, aday1, 'ilan')).toHaveLength(9)
  })
})

describe('bildirimler', () => {
  it('anlık: uyan ilan yayına girince e-posta gider, uymayana gitmez; haftalık özet 7 gün sonra gelir', async () => {
    // Önceki testte silinen ilk aramayı yeniden kaydet (anlık, uzaktan + ek)
    await aramaKaydet(payload, aday1, { tur: 'ilan', sorgu: `model=uzaktan&ara=${ek}`, siklik: 'anlik' })
    await aramaKaydet(payload, aday2, { tur: 'ilan', sorgu: `ara=${ek}`, siklik: 'haftalik' })
    await ilanAc('Uzaktan Elixir', 'uzaktan')
    await ilanAc('Ofiste Elixir', 'ofiste')
    const p1 = await postalar(`ka1-${ek}`)
    expect(p1.filter((k) => k.startsWith('Yeni ilan:'))).toEqual([`Yeni ilan: Uzaktan Elixir ${ek} (Arama ${ek})`])
    expect((await postalar(`ka2-${ek}`)).filter((k) => k.startsWith('Yeni ilan:'))).toEqual([]) // haftalık
    const hatalar: string[] = []
    await haftalikAramaBildirimleri(payload, new Date(), hatalar)
    expect((await postalar(`ka2-${ek}`)).filter((k) => k.includes('yeni ilan'))).toEqual([]) // henüz 7 gün olmadı
    await haftalikAramaBildirimleri(payload, new Date(Date.now() + 8 * 864e5), hatalar)
    expect((await postalar(`ka2-${ek}`)).filter((k) => k.includes('yeni ilan'))).toEqual([`“${ek}” aramana uyan 2 yeni ilan`])
    expect(hatalar).toEqual([])
  })

  it('hesap silinince aramalar silinir', async () => {
    await adayHesabiniSil(payload, aday2, aday2.id)
    const { totalDocs } = await payload.count({ collection: 'kayitli-aramalar', where: { kullanici: { equals: aday2.id } }, overrideAccess: true })
    expect(totalDocs).toBe(0)
  })
})
