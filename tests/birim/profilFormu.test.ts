import { describe, expect, it } from 'vitest'
import { profilFormunuOku } from '@/alan/profilFormu'

const form = (v: Record<string, string | string[]>) => {
  const f = new FormData()
  for (const [k, d] of Object.entries(v)) for (const x of Array.isArray(d) ? d : [d]) f.append(k, x)
  return f
}

describe('profil formu (K28)', () => {
  it('yalnızca formdaki bölümler güncellenir; diğerleri hiç yazılmaz', () => {
    const { guncelleme } = profilFormunuOku(form({ profilBolumu: 'egitim', okul: '3', bolum: '12', mezuniyetAy: '6', mezuniyetYil: '2027' }))
    expect(Object.keys(guncelleme).sort()).toEqual(['bolum', 'gano', 'mezuniyet', 'okul', 'sinif'])
    expect(guncelleme.okul).toBe(3)
    expect(guncelleme.bolum).toBe(12) // okulun bölümü, profil bölümüyle karışmaz
    expect(guncelleme.mezuniyet).toBe('2027-06-15T09:00:00.000Z')
    expect(guncelleme.beceriler).toBeUndefined()
    expect(guncelleme.tercihler).toBeUndefined()
  })
  it('beceri ve dil ayrı bölümlerdir: biri kaydedilince öbürü boşalmaz', () => {
    const { guncelleme } = profilFormunuOku(form({ profilBolumu: 'beceriler', beceri: ['5:iyi', '7:uzman', 'x:iyi', '8:yanlis'] }))
    expect(guncelleme.beceriler).toEqual([{ beceri: 5, seviye: 'iyi' }, { beceri: 7, seviye: 'uzman' }])
    expect(guncelleme.diller).toBeUndefined()
  })
  it('birden çok bölüm aynı formda (sihirbaz adımı)', () => {
    const { guncelleme } = profilFormunuOku(form({ profilBolumu: ['deneyim', 'tercihler'], deneyimSeviyesi: 'ogrenci', model: ['hibrit', 'bilinmeyen'], tur: 'staj', ucretBeklentisi: '30.000' }))
    expect(guncelleme.deneyimSeviyesi).toBe('ogrenci')
    expect(guncelleme.tercihler).toMatchObject({ modeller: ['hibrit'], turler: ['staj'], ucretBeklentisi: 30000, tasinmayaAcik: false })
  })
  it('hatalar tam cümle ve Türkçe; yarım mezuniyet tarihi ve geçersiz GANO yakalanır', () => {
    const { hatalar } = profilFormunuOku(form({ profilBolumu: ['egitim', 'kimlik'], mezuniyetAy: '6', gano: '4,5', telefon: 'abc' }))
    expect(hatalar).toEqual({
      mezuniyetAy: 'Mezuniyet tarihi için hem ayı hem yılı seç.',
      gano: 'GANO 0 ile 4 arasında bir sayı olmalı (örneğin 3,12).',
      telefon: 'Telefon numaranı 0 5xx xxx xx xx biçiminde yaz.',
    })
  })
  it('iş deneyimi: zorunlu alanlar, tarih sırası, devam eden iş', () => {
    const satirlar = [
      { kurum: 'Kodpit', pozisyon: 'Stajyer', baslangicAy: 6, baslangicYil: 2025, devam: true },
      { kurum: 'Ratel', pozisyon: 'Destek', baslangicAy: 9, baslangicYil: 2025, bitisAy: 1, bitisYil: 2025 },
      { kurum: '', pozisyon: 'Boş' },
    ]
    const { guncelleme, hatalar } = profilFormunuOku(form({ profilBolumu: 'deneyimler', deneyimlerJson: JSON.stringify(satirlar) }))
    expect(guncelleme.deneyimler?.[0]).toMatchObject({ kurum: 'Kodpit', bitis: null })
    expect(hatalar['deneyim-1']).toMatch(/bitiş tarihi başlangıçtan önce/)
    expect(hatalar['deneyim-2']).toMatch(/kurum ve pozisyon/)
  })
  it('bağlantılar: şema eklenir, geçersiz adres reddedilir', () => {
    const { guncelleme, hatalar } = profilFormunuOku(
      form({ profilBolumu: 'baglantilar', baglantilarJson: JSON.stringify([{ ad: 'GitHub', adres: 'github.com/elif' }, { ad: 'Site', adres: 'javascript:alert(1)' }]) }),
    )
    expect(guncelleme.baglantilar).toEqual([{ ad: 'GitHub', adres: 'https://github.com/elif' }])
    expect(hatalar['baglanti-1']).toMatch(/geçerli değil/)
  })
})
