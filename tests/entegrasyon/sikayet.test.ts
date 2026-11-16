/**
 * İlan şikâyeti: yalnızca aday bildirir, yalnızca yayındaki ilan; aynı ilana açık bildirim tekrarlanmaz; günde en fazla 5;
 * “Başka bir sorun”da açıklama zorunlu; bildirenin kimliği firmaya gitmez. Moderasyon yetkilisi bir ilanın bildirimlerini
 * birlikte sonuçlandırır: kaldırmada ilan kapanır, firmaya mesaj ve bildirenlere sonuç e-postası gider.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { yayinaGonder } from '@/servisler/ilanIslemleri'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { sikayetEt, sikayetleriSonuclandir } from '@/servisler/sikayet'

let payload: Payload
const ek = `sk${Date.now().toString(36)}`
let firmaK: any, aday1: any, aday2: any, raporlayici: any, moderator: any, aile: any, beceri: any
const postalar = async (kime: string) => (await payload.find({ collection: 'test-postalar', where: { kime: { contains: kime } }, overrideAccess: true, limit: 50 })).docs.map((d: any) => ({ konu: d.konu as string, govde: JSON.stringify(d) }))
const ilanAc = async (ad: string) => {
  const fd = new FormData()
  for (const [a, d] of [['pozisyonAdi', `${ad} ${ek}`], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile.id)], ['model', 'ofiste'], ['deneyim', '1-3'], ['egitim', 'lisans'], ['zorunluBeceri', String(beceri.id)], ['sonBasvuru', new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik']])
    fd.append(a, d)
  const i = (await ilanKaydet(payload, firmaK, null, ilanFormunuOku(fd).veri)).ilan
  await yayinaGonder(payload, firmaK, i.id)
  return i
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  ;[aile, beceri] = await Promise.all([t('pozisyon-ailesi', 'Yazılım'), t('beceri', 'Haskell')])
  const f = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: `Sikayet ${ek}`, kisaAd: `Sikayet ${ek}`, slug: `sikayet-${ek}`, konum: 'C Blok 1', guvenilir: true } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: `Kişi ${e}`, _verified: true, ...v } as any })
  firmaK = await k('skf', { rol: 'firma', firma: f.id, firmaYetkisi: 'yonetici' })
  aday1 = await k('sk1', { rol: 'aday' })
  aday2 = await k('sk2', { rol: 'aday' })
  raporlayici = await k('skr', { rol: 'raporlayici' })
  moderator = await k('skm', { rol: 'moderator' })
})

describe('bildirme', () => {
  it('yalnızca aday; neden geçerli; “diğer”de açıklama zorunlu; aynı ilan iki kez bildirilmez', async () => {
    const ilan = await ilanAc('Sahte')
    await expect(sikayetEt(payload, firmaK, { ilanId: ilan.id, neden: 'sahte' })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(sikayetEt(payload, null, { ilanId: ilan.id, neden: 'sahte' })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(sikayetEt(payload, aday1, { ilanId: ilan.id, neden: 'yok' })).rejects.toMatchObject({ alanlar: { neden: expect.any(String) } })
    await expect(sikayetEt(payload, aday1, { ilanId: ilan.id, neden: 'diger', aciklama: 'kısa' })).rejects.toMatchObject({ alanlar: { aciklama: expect.any(String) } })
    await sikayetEt(payload, aday1, { ilanId: ilan.id, neden: 'ucret', aciklama: 'Eğitim ücreti istediler.' })
    await expect(sikayetEt(payload, aday1, { ilanId: ilan.id, neden: 'sahte' })).rejects.toMatchObject({ durumKodu: 409 })
    await sikayetEt(payload, aday2, { ilanId: ilan.id, neden: 'sahte' })
    // Firma ve aday bildirimleri okuyamaz; raporlayıcı da okuyamaz
    for (const kim of [firmaK, aday1, raporlayici]) await expect(payload.find({ collection: 'sikayetler', user: kim, overrideAccess: false })).rejects.toThrow(/izniniz yok/)
  })

  it('günde en fazla 5 bildirim', async () => {
    const ilanlar = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => ilanAc(`Sinir ${n}`)))
    for (const i of ilanlar.slice(0, 4)) await sikayetEt(payload, aday2, { ilanId: i.id, neden: 'yaniltici' }) // aday2'nin 1 bildirimi zaten var
    await expect(sikayetEt(payload, aday2, { ilanId: ilanlar[5]!.id, neden: 'yaniltici' })).rejects.toMatchObject({ durumKodu: 429 })
  })
})

describe('sonuçlandırma', () => {
  it('raporlayıcı karar veremez; uyarı ve kaldırmada mesaj zorunlu; kaldırma ilanı kapatır, firmaya ve bildirenlere e-posta gider', async () => {
    const { docs } = await payload.find({ collection: 'sikayetler', where: { neden: { equals: 'ucret' } }, overrideAccess: true, depth: 0, limit: 1, sort: '-createdAt' })
    const ilanId = Number(docs[0]!.ilan)
    await expect(sikayetleriSonuclandir(payload, raporlayici, ilanId, { sonuc: 'yersiz' })).rejects.toMatchObject({ durumKodu: 403 })
    await expect(sikayetleriSonuclandir(payload, moderator, ilanId, { sonuc: 'ilan-kaldirildi', firmaMesaji: 'kısa' })).rejects.toMatchObject({ alanlar: { firmaMesaji: expect.any(String) } })
    const r = await sikayetleriSonuclandir(payload, moderator, ilanId, { sonuc: 'ilan-kaldirildi', firmaMesaji: 'Adaylardan eğitim ücreti istemek yasaktır.' })
    expect(r).toMatchObject({ bildirim: 2, firmaya: 1, bildirene: 2 })
    const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, overrideAccess: true, depth: 0 })
    expect(ilan).toMatchObject({ durum: 'kapandi', kapanisNedeni: 'moderasyon' })
    const firmaPostasi = (await postalar(`skf-${ek}`)).find((p) => p.konu.startsWith('İlanınız yayından kaldırıldı'))!
    expect(firmaPostasi.govde).toContain('eğitim ücreti istemek yasaktır')
    expect(firmaPostasi.govde).not.toContain(`sk1-${ek}`) // bildirenin kimliği firmaya gitmez
    expect((await postalar(`sk1-${ek}`)).some((p) => p.konu.startsWith('Bildirimin sonuçlandı'))).toBe(true)
    await expect(sikayetleriSonuclandir(payload, moderator, ilanId, { sonuc: 'yersiz' })).rejects.toMatchObject({ durumKodu: 409 })
  })
})
