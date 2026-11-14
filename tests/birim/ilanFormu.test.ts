import { describe, expect, it } from 'vitest'
import { ilanFormunuOku, tutarOku } from '@/alan/ilanFormu'
import { ilanEksikleri } from '@/alan/ilan'

const form = (alanlar: Array<[string, string]>) => {
  const f = new FormData()
  for (const [k, v] of alanlar) f.append(k, v)
  return f
}

describe('ilan formu', () => {
  it('taslak için yalnızca pozisyon adı gerekir; eksik alanlar kaydı engellemez', () => {
    const { veri, hatalar } = ilanFormunuOku(form([['pozisyonAdi', 'Flutter Geliştirici']]))
    expect(hatalar).toEqual({})
    expect(veri.pozisyonAdi).toBe('Flutter Geliştirici')
    expect(veri.sonBasvuru).toBeNull()
    expect(Object.keys(ilanEksikleri(veri as never))).toContain('sonBasvuru')
  })

  it('pozisyon adı boşsa Türkçe ve ne yapılacağını söyleyen hata verir', () => {
    expect(ilanFormunuOku(form([])).hatalar.pozisyonAdi).toMatch(/Pozisyon adını yazın/)
  })

  it('tutarları noktalı yazımla okur; harfli tutarı ve ters aralığı reddeder', () => {
    expect(tutarOku('60.000')).toBe(60000)
    expect(tutarOku('45 000 ₺')).toBe(45000)
    expect(tutarOku('')).toBeNull()
    expect(Number.isNaN(tutarOku('altmış bin'))).toBe(true)
    const { hatalar } = ilanFormunuOku(form([['pozisyonAdi', 'X'], ['ucretEnAz', '80.000'], ['ucretEnCok', '60.000']]))
    expect(hatalar.ucretEnAz).toMatch(/büyük olamaz/)
  })

  it('tarihi Türkiye günü olarak okur; bozuk tarihi alan hatasıyla bildirir', () => {
    const iyi = ilanFormunuOku(form([['pozisyonAdi', 'X'], ['sonBasvuru', '2026-12-20']]))
    expect(iyi.veri.sonBasvuru).toBe('2026-12-19T21:00:00.000Z')
    expect(ilanFormunuOku(form([['pozisyonAdi', 'X'], ['sonBasvuru', '20.12.2026']])).hatalar.sonBasvuru).toBeDefined()
  })

  it('ilan türüne uymayan çalışma şeklini kabul etmez', () => {
    const r = ilanFormunuOku(form([['pozisyonAdi', 'X'], ['tur', 'staj'], ['altTur', 'tam-zamanli']]))
    expect(r.veri.altTur).toBeNull()
    expect(r.hatalar.altTur).toMatch(/staj türü/)
  })

  it('beceri, dil ve yan hak listelerini tekilleştirir; tercih listesinde zorunlu beceri tekrar etmez', () => {
    const { veri } = ilanFormunuOku(
      form([
        ['pozisyonAdi', 'X'],
        ['zorunluBeceri', '5'], ['zorunluBeceri', '5'], ['zorunluBeceri', '6'],
        ['tercihBeceri', '6'], ['tercihBeceri', '7'],
        ['dilSarti', '17:B1'], ['dilSarti', '17:C1'], ['dilSarti', '18:Z9'],
        ['yanHak', 'Yemek kartı'], ['yanHak', ' Yemek kartı '], ['yanHak', ''],
      ]),
    )
    expect(veri.zorunluBeceriler).toEqual([5, 6])
    expect(veri.tercihBeceriler).toEqual([7])
    expect(veri.diller).toEqual([{ dil: 17, seviye: 'B1' }])
    expect(veri.yanHaklar).toEqual([{ ad: 'Yemek kartı' }])
  })

  it('ön eleme soruları: boş satır atlanır, eleyici soruda beklenen cevap, seçmelide en az iki seçenek istenir', () => {
    const { veri, hatalar } = ilanFormunuOku(
      form([
        ['pozisyonAdi', 'X'],
        ['soruNo', '0'], ['soru-0', 'Haftada 2 gün ofiste çalışabilir misin?'], ['soruTip-0', 'evet-hayir'], ['soruEleyici-0', 'on'],
        ['soruNo', '1'], ['soru-1', ''],
        ['soruNo', '2'], ['soru-2', 'Hangi çatıyı kullanıyorsun?'], ['soruTip-2', 'secmeli'], ['soruSecenekler-2', 'Flutter'],
      ]),
    )
    expect(veri.onElemeSorulari).toHaveLength(2)
    expect(hatalar['soruBeklenen-0']).toBeDefined()
    expect(hatalar['soruSecenekler-2']).toMatch(/en az iki/)
  })

  it('staj alanları yalnızca staj ilanında okunur', () => {
    const is = ilanFormunuOku(form([['pozisyonAdi', 'X'], ['tur', 'is'], ['ucretliStaj', 'on'], ['stajDonemi', 'Yaz']]))
    expect(is.veri.ucretliStaj).toBe(false)
    expect(is.veri.stajDonemi).toBeNull()
  })
})
