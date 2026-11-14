/**
 * Taksonomi talepleri: talep eden bilgisi otomatik, listede olan reddedilir, onaylanınca listeye eklenir,
 * yalnızca Yönetici A.Ş. sonuçlandırır, herkes yalnızca kendi talebini görür.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { taksonomiTalebiOlustur, talebiSonuclandir } from '@/servisler/talepler'
import { FormHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `t${Date.now().toString(36)}`
let firmaK: any, adayK: any, yonetici: any, firma: any

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur: 'beceri', ad: `Rust ${ek}` } as any })
  firma = await payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: 'Talep A.Ş.', kisaAd: 'Talep', slug: `talep-${ek}`, konum: 'A Blok 1' } as any })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: e, ...v } as any })
  firmaK = await k('tf', { rol: 'firma', firma: firma.id, firmaYetkisi: 'ilan-sorumlusu' })
  adayK = await k('ta', { rol: 'aday' })
  yonetici = await k('ty', { rol: 'yonetici' })
})

describe('taksonomi talepleri', () => {
  it('talep eden ve firması otomatik bağlanır; listede olan öğe talepten çıkarılır', async () => {
    const s = await taksonomiTalebiOlustur(payload, firmaK, { tur: 'beceri', ogeler: `rust ${ek}\nZig ${ek}`, kaynak: 'ilan-formu' })
    expect(s.zatenVar).toEqual([`rust ${ek}`])
    expect(s.yeni).toEqual([`Zig ${ek}`])
    const t = await payload.findByID({ collection: 'talepler', id: s.talep.id, depth: 0, overrideAccess: true })
    expect(t.talepEden).toBe(firmaK.id)
    expect(t.firma).toBe(firma.id)
    expect(t.durum).toBe('bekliyor')
  })

  it('hepsi listede olan talep alan hatasıyla reddedilir', async () => {
    const h = await taksonomiTalebiOlustur(payload, firmaK, { tur: 'beceri', ogeler: `RUST ${ek}` }).catch((e) => e)
    expect(h).toBeInstanceOf(FormHatasi)
    expect((h as FormHatasi).alanlar.ogeler).toMatch(/zaten listede/)
  })

  it('firma sonuçlandıramaz; onay kabul edilen öğeleri listeye ekler, kabul edilmeyeni eklemez', async () => {
    const s = await taksonomiTalebiOlustur(payload, firmaK, { tur: 'pozisyon-ailesi', ogeler: `Robotik ${ek}\nYanlış ${ek}` })
    await expect(talebiSonuclandir(payload, firmaK, s.talep.id, { onay: true })).rejects.toThrow(/Yönetici A.Ş./)
    const t = await talebiSonuclandir(payload, yonetici, s.talep.id, { onay: true, kabulEdilenler: [`Robotik ${ek}`] })
    expect(t.durum).toBe('kismen')
    const liste = await payload.find({ collection: 'taksonomiler', where: { and: [{ tur: { equals: 'pozisyon-ailesi' } }, { ad: { like: ek } }] }, overrideAccess: true })
    expect(liste.docs.map((d) => d.ad)).toEqual([`Robotik ${ek}`])
    await expect(talebiSonuclandir(payload, yonetici, s.talep.id, { onay: true })).rejects.toThrow(/daha önce/)
  })

  it('ret gerekçe ister; aday da talep gönderebilir ve yalnızca kendi talebini görür', async () => {
    const s = await taksonomiTalebiOlustur(payload, adayK, { tur: 'universite', ogeler: `Deneme Üniversitesi ${ek}` })
    await expect(talebiSonuclandir(payload, yonetici, s.talep.id, { onay: false })).rejects.toBeInstanceOf(FormHatasi)
    const r = await talebiSonuclandir(payload, yonetici, s.talep.id, { onay: false, not: 'Bu üniversite YÖK listesinde yok.' })
    expect(r.durum).toBe('reddedildi')
    const adayinki = await payload.find({ collection: 'talepler', overrideAccess: false, user: adayK, depth: 0 })
    expect(adayinki.docs.every((d) => d.talepEden === adayK.id)).toBe(true)
    expect(adayinki.docs).toHaveLength(1)
  })
})
