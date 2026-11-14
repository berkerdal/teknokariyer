/**
 * İlan formu servisi (K1): taslak, tamlık, kiracı ayrımı, esaslı değişikliğin onaya düşmesi, kopya ve taslak silme.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { bekleyenDegisikligiSonuclandir, ilanKaydet } from '@/servisler/ilanFormu'
import { kopyala, taslakSil, yayinaGonder } from '@/servisler/ilanIslemleri'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `f${Date.now().toString(36)}`
let firma: any, diger: any, yonetici: any, degerlendirici: any, guvenilirFirma: any, guvenilirK: any
let aile: number, beceri: number, dil: number

const form = (alanlar: Array<[string, string]>) => {
  const f = new FormData()
  for (const [k, v] of alanlar) f.append(k, v)
  return ilanFormunuOku(f).veri
}
const tarih = (n: number) => new Date(Date.now() + n * 86_400_000 + 3 * 3600_000).toISOString().slice(0, 10)
const tamForm = (ad: string, ekler: Array<[string, string]> = []) =>
  form(([
    ['pozisyonAdi', ad], ['tur', 'is'], ['altTur', 'tam-zamanli'], ['aile', String(aile)], ['model', 'hibrit'], ['deneyim', '1-3'],
    ['egitim', 'lisans'], ['zorunluBeceri', String(beceri)], ['sonBasvuru', tarih(20)], ['isTanimi', '- İş'], ['nitelikler', '- Nitelik'],
    ['dilSarti', `${dil}:B1`], ['yanHak', 'Yemek kartı'], ['soruNo', '0'], ['soru-0', 'Ne zaman başlayabilirsin?'],
  ] as Array<[string, string]>).filter(([k]) => !ekler.some(([e]) => e === k)).concat(ekler))

beforeAll(async () => {
  payload = await getPayload({ config })
  const t = (tur: string, ad: string) => payload.create({ collection: 'taksonomiler', overrideAccess: true, data: { tur, ad: `${ad} ${ek}` } as any })
  aile = (await t('pozisyon-ailesi', 'Yazılım')).id
  beceri = (await t('beceri', 'Kotlin')).id
  dil = (await t('dil', 'İngilizce')).id
  const f = (ad: string, v = {}) => payload.create({ collection: 'firmalar', overrideAccess: true, data: { unvan: ad, kisaAd: ad, slug: `${ad}-${ek}`.toLowerCase(), konum: 'D Blok 1', ...v } as any })
  const fa = await f('FormA')
  const fb = await f('FormB')
  const fg = await f('FormG', { guvenilir: true })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: e, ...v } as any })
  firma = await k('fa', { rol: 'firma', firma: fa.id, firmaYetkisi: 'ilan-sorumlusu' })
  diger = await k('fb', { rol: 'firma', firma: fb.id, firmaYetkisi: 'yonetici' })
  degerlendirici = await k('fd', { rol: 'firma', firma: fa.id, firmaYetkisi: 'degerlendirici' })
  guvenilirK = await k('fg', { rol: 'firma', firma: fg.id, firmaYetkisi: 'yonetici' })
  guvenilirFirma = fg
  yonetici = await k('yon', { rol: 'yonetici' })
})

describe('ilan formu servisi', () => {
  it('taslak yalnızca pozisyon adıyla kaydedilir; eksik taslak yayına gönderilemez ve alan alan mesaj döner', async () => {
    const { ilan } = await ilanKaydet(payload, firma, null, form([['pozisyonAdi', `Taslak ${ek}`]]))
    expect(ilan.durum).toBe('taslak')
    expect(ilan.sonBasvuru ?? null).toBeNull()
    const hata = await yayinaGonder(payload, firma, ilan.id).catch((e) => e)
    expect(hata).toBeInstanceOf(FormHatasi)
    expect(Object.keys((hata as FormHatasi).alanlar)).toEqual(expect.arrayContaining(['tur', 'sonBasvuru', 'zorunluBeceriler', 'isTanimi']))
  })

  it('başka firmanın ilanı düzenlenemez; değerlendirici ilan açamaz (kiracı ayrımı, yetki)', async () => {
    const { ilan } = await ilanKaydet(payload, firma, null, tamForm(`A ilanı ${ek}`))
    await expect(ilanKaydet(payload, diger, ilan.id, tamForm('Ele geçirme'))).rejects.toBeInstanceOf(IslemHatasi)
    await expect(ilanKaydet(payload, degerlendirici, null, tamForm('Yetkisiz'))).rejects.toThrow(/yetkiniz yok/)
    const okunan = await payload.findByID({ collection: 'ilanlar', id: ilan.id, overrideAccess: true })
    expect(okunan.pozisyonAdi).toBe(`A ilanı ${ek}`)
  })

  it('yayına girmiş ilan eksik bırakılamaz', async () => {
    const { ilan } = await ilanKaydet(payload, guvenilirK, null, tamForm(`Tam ${ek}`))
    expect((await yayinaGonder(payload, guvenilirK, ilan.id)).durum).toBe('yayinda')
    const eksik = await ilanKaydet(payload, guvenilirK, ilan.id, form([['pozisyonAdi', `Tam ${ek}`]])).catch((e) => e)
    expect(eksik).toBeInstanceOf(FormHatasi)
  })

  it('yayındaki ilanda esaslı değişiklik onaya düşer, diğerleri hemen yansır; onay ve ret çalışır', async () => {
    const { ilan } = await ilanKaydet(payload, firma, null, tamForm(`Esas ${ek}`, [['ucretEnAz', '40.000'], ['ucretEnCok', '50.000']]))
    expect((await yayinaGonder(payload, firma, ilan.id)).durum).toBe('onayda')
    await payload.update({ collection: 'ilanlar', id: ilan.id, overrideAccess: true, data: { durum: 'yayinda' } as any })
    const s = await ilanKaydet(payload, firma, ilan.id, tamForm(`Yeni ad ${ek}`, [['ucretEnAz', '40.000'], ['ucretEnCok', '60.000'], ['isTanimi', '- Yeni iş tanımı']]))
    expect(s.onayaGiden.sort()).toEqual(['pozisyonAdi', 'ucretEnCok'])
    expect(s.ilan.pozisyonAdi).toBe(`Esas ${ek}`) // eski ad yayında kalır
    expect(s.ilan.isTanimi).toBe('- Yeni iş tanımı') // esaslı olmayan hemen yansır
    expect((s.ilan.bekleyenDegisiklik as any).alanlar.ucretEnCok).toBe(60000)
    await expect(bekleyenDegisikligiSonuclandir(payload, firma, ilan.id, true)).rejects.toThrow(/Yönetici A.Ş./)
    const onayli = await bekleyenDegisikligiSonuclandir(payload, yonetici, ilan.id, true)
    expect(onayli.pozisyonAdi).toBe(`Yeni ad ${ek}`)
    expect(onayli.bekleyenDegisiklik ?? null).toBeNull()
    // ret: gerekçe zorunlu, firma notu görür, bir sonraki kayıtta not kalkar
    await ilanKaydet(payload, firma, ilan.id, tamForm(`Üçüncü ad ${ek}`, [['ucretEnAz', '40.000'], ['ucretEnCok', '60.000']]))
    await expect(bekleyenDegisikligiSonuclandir(payload, yonetici, ilan.id, false)).rejects.toThrow(/neden/)
    const red = await bekleyenDegisikligiSonuclandir(payload, yonetici, ilan.id, false, 'Pozisyon adı ilanla uyuşmuyor.')
    expect((red.bekleyenDegisiklik as any).reddedildi).toBe(true)
    expect(red.pozisyonAdi).toBe(`Yeni ad ${ek}`)
    const sonra = await ilanKaydet(payload, firma, ilan.id, tamForm(`Yeni ad ${ek}`, [['ucretEnAz', '40.000'], ['ucretEnCok', '60.000']]))
    expect(sonra.ilan.bekleyenDegisiklik ?? null).toBeNull()
  })

  it('güvenilir firmada esaslı değişiklik de hemen yansır', async () => {
    const { ilan } = await ilanKaydet(payload, guvenilirK, null, tamForm(`G ${ek}`))
    await yayinaGonder(payload, guvenilirK, ilan.id)
    const s = await ilanKaydet(payload, guvenilirK, ilan.id, tamForm(`G yeni ${ek}`))
    expect(s.onayaGiden).toEqual([])
    expect(s.ilan.pozisyonAdi).toBe(`G yeni ${ek}`)
    expect(guvenilirFirma.guvenilir).toBe(true)
  })

  it('kopya: dil, yan hak ve soru satırlarıyla açılır, tarihi boş ve taslaktır; taslak silinir, yayınlanmış ilan silinemez', async () => {
    const { ilan } = await ilanKaydet(payload, firma, null, tamForm(`Kopya kaynağı ${ek}`))
    const kopya = await kopyala(payload, firma, ilan.id)
    expect(kopya.durum).toBe('taslak')
    expect(kopya.sonBasvuru ?? null).toBeNull()
    expect(kopya.diller).toHaveLength(1)
    expect(kopya.yanHaklar?.[0]?.ad).toBe('Yemek kartı')
    expect(kopya.onElemeSorulari).toHaveLength(1)
    await taslakSil(payload, firma, kopya.id)
    expect(await payload.findByID({ collection: 'ilanlar', id: kopya.id, overrideAccess: true }).catch(() => null)).toBeNull()
    await yayinaGonder(payload, firma, ilan.id)
    await expect(taslakSil(payload, firma, ilan.id)).rejects.toThrow(/silinemez/)
    await expect(taslakSil(payload, diger, ilan.id)).rejects.toThrow(/yetkiniz yok/)
  })

  it('geçmiş veya 60 günden uzak son başvuru tarihi alan hatasıyla reddedilir', async () => {
    await expect(ilanKaydet(payload, firma, null, form([['pozisyonAdi', 'X'], ['sonBasvuru', tarih(-2)]]))).rejects.toBeInstanceOf(FormHatasi)
    const uzak = await ilanKaydet(payload, firma, null, form([['pozisyonAdi', 'X'], ['sonBasvuru', tarih(90)]])).catch((e) => e)
    expect((uzak as FormHatasi).alanlar.sonBasvuru).toMatch(/en fazla/)
  })
})
