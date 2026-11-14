import { describe, expect, it } from 'vitest'
import { adresAdi, genelEpostaMi, huniSayilari, yetkiliDurumu } from '@/alan/kurulum'

describe('firma kurulumu', () => {
  it('huni ulaşılan basamağa kadar sayar; pasif firma sayılmaz', () => {
    expect(
      huniSayilari([
        { asama: 'iskelet', ilkIlan: false },
        { asama: 'davet', ilkIlan: false },
        { asama: 'profil-tamam', ilkIlan: false },
        { asama: 'devralindi', ilkIlan: true },
        { asama: 'pasif', ilkIlan: true },
      ]),
    ).toEqual([4, 3, 2, 2, 1])
  })
  it('genel kutuları ve eksik yetkiliyi ayırır', () => {
    expect(genelEpostaMi('info@firma.com.tr')).toBe(true)
    expect(genelEpostaMi('İletisim@firma.com')).toBe(true)
    expect(genelEpostaMi('ayse.kaya@firma.com.tr')).toBe(false)
    expect(yetkiliDurumu({ yetkiliAd: 'Ayşe Kaya', yetkiliEposta: 'info@firma.com' })).toBe('genel')
    expect(yetkiliDurumu({ yetkiliAd: '', yetkiliEposta: 'ayse@firma.com' })).toBe('eksik')
    expect(yetkiliDurumu({ yetkiliAd: 'Ayşe Kaya', yetkiliEposta: 'ayse@firma.com' })).toBe('tamam')
  })
  it('adres adı Türkçe harfleri sadeleştirir', () => {
    expect(adresAdi('Çiçek Makine Tekstil Ar-Ge')).toBe('cicek-makine-tekstil-ar-ge')
    expect(adresAdi('  3D Probox ')).toBe('3d-probox')
  })
})

import { siradakiHatirlatma } from '@/alan/hatirlatma'

describe('kurulum hatırlatmaları', () => {
  it('3., 7. ve 14. günde birer kez; kaçırılan günlerde yalnızca son eşik', () => {
    expect(siradakiHatirlatma(2, [])).toBeNull()
    expect(siradakiHatirlatma(3, [])).toBe(3)
    expect(siradakiHatirlatma(4, [3])).toBeNull()
    expect(siradakiHatirlatma(9, [])).toBe(7) // 3. gün kaçırıldıysa yalnızca 7. gün gider
    expect(siradakiHatirlatma(15, [3, 7])).toBe(14)
    expect(siradakiHatirlatma(30, [3, 7, 14])).toBeNull()
  })
})
