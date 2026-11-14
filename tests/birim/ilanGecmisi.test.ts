import { describe, expect, it } from 'vitest'
import { surumFarklari } from '@/alan/ilanGecmisi'

describe('ilan sürüm farkları', () => {
  it('ilk sürüm “oluşturuldu” olarak yazılır', () => {
    expect(surumFarklari(null, { pozisyonAdi: 'X' })[0]!.ad).toBe('İlan oluşturuldu')
  })
  it('kısa alanda eski ve yeni değer, uzun metinde yalnızca alan adı', () => {
    const f = surumFarklari(
      { pozisyonAdi: 'Flutter Geliştirici', durum: 'taslak', isTanimi: 'a', ucretEnAz: 40000 },
      { pozisyonAdi: 'Kıdemli Flutter Geliştirici', durum: 'onayda', isTanimi: 'b', ucretEnAz: 45000 },
    )
    expect(f).toContainEqual({ alan: 'pozisyonAdi', ad: 'Pozisyon adı', once: 'Flutter Geliştirici', sonra: 'Kıdemli Flutter Geliştirici' })
    expect(f).toContainEqual({ alan: 'durum', ad: 'Durum', once: 'Taslak', sonra: 'Onayda' })
    expect(f).toContainEqual({ alan: 'isTanimi', ad: 'İş tanımı' })
    expect(f.find((x) => x.alan === 'ucretEnAz')?.sonra).toBe('45.000')
  })
  it('ilişki nesnesi ile kimlik aynı sayılır; dizi satırı kimliği fark yaratmaz', () => {
    const f = surumFarklari(
      { zorunluBeceriler: [{ id: 5, ad: 'Dart', tur: 'beceri' }], yanHaklar: [{ id: 'a', ad: 'Yemek' }] },
      { zorunluBeceriler: [5], yanHaklar: [{ id: 'b', ad: 'Yemek' }] },
    )
    expect(f).toEqual([])
  })
})

describe('ilan sürüm farkları: seçenek adları', () => {
  it('kodlar yerine Türkçe adlar yazılır', () => {
    const f = surumFarklari({ tur: null, altTur: null, deneyim: null }, { tur: 'is', altTur: 'tam-zamanli', deneyim: '1-3' })
    expect(f.map((x) => x.sonra)).toEqual(['İş', 'Tam zamanlı', '1–3 yıl'])
  })
})
