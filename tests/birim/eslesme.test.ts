import { describe, expect, it } from 'vitest'
import { eslesmeHesapla, type EslesmeProfili, type IlanKosullari } from '@/alan/eslesme'

const gomulu: IlanKosullari = {
  zorunluBeceriler: ['C', 'STM32', 'RTOS', 'Git'],
  tercihBeceriler: ['CAN bus', 'Python'],
  model: 'ofiste',
  bolumler: ['Elektrik-Elektronik Mühendisliği', 'Bilgisayar Mühendisliği'],
  deneyim: '1-3',
  diller: [{ dil: 'İngilizce', seviye: 'B1' }],
}
const elif: EslesmeProfili = {
  beceriler: ['C', 'Python', 'Git', 'Linux', 'STM32'],
  modeller: ['ofiste', 'hibrit'],
  bolum: 'Bilgisayar Mühendisliği',
  deneyim: 'ogrenci',
  diller: [{ dil: 'İngilizce', seviye: 'B2' }],
}

describe('açıklanabilir eşleşme', () => {
  it('gerekçeli kısa özet üretir, yüzde değil', () => {
    const s = eslesmeHesapla(gomulu, elif, 'aday')
    expect(s.kisa).toBe('4 zorunlu beceriden 3’ü var (eksik: RTOS)')
    expect(s.satirlar[0]!.metin).toBe('İlanın istediği 4 zorunlu beceriden 3’ü profilinde var.')
    expect(s.kisa).not.toMatch(/%/)
    expect(s.eksikZorunlu).toEqual(['RTOS'])
  })
  it('aday bakışında "sen", firma bakışında "aday" der (K9)', () => {
    const mod = { ...gomulu, model: 'uzaktan' as const }
    expect(eslesmeHesapla(mod, elif, 'aday').satirlar.some((s) => s.metin === 'İlan uzaktan çalışmayı öngörüyor; sen ofiste veya hibrit çalışmayı tercih ediyorsun.')).toBe(true)
    expect(eslesmeHesapla(mod, elif, 'firma').satirlar.some((s) => s.metin === 'İlan uzaktan çalışmayı öngörüyor; aday ofiste veya hibrit çalışmayı tercih ediyor.')).toBe(true)
  })
  it('deneyim ve dil eksiklerini söyler', () => {
    const s = eslesmeHesapla({ ...gomulu, diller: [{ dil: 'İngilizce', seviye: 'C1' }] }, elif, 'aday')
    expect(s.satirlar.map((x) => x.metin)).toContain('Bu ilan “1–3 yıl” deneyim düzeyini arıyor; senin deneyim düzeyin “Öğrenci”.')
    expect(s.satirlar.map((x) => x.metin)).toContain('İlan İngilizce için C1 seviyesi istiyor; senin seviyen B2.')
  })
  it('beceri adları büyük/küçük harfe duyarsız eşleşir', () => {
    const s = eslesmeHesapla({ ...gomulu, zorunluBeceriler: ['git', 'c'] }, elif, 'firma')
    expect(s.eksikZorunlu).toEqual([])
  })
  it('sıralama puanı daha uygun adayı öne alır', () => {
    const tam: EslesmeProfili = { ...elif, beceriler: [...elif.beceriler, 'RTOS', 'CAN bus'], deneyim: '1-3' }
    expect(eslesmeHesapla(gomulu, tam, 'firma').siralamaPuani).toBeGreaterThan(eslesmeHesapla(gomulu, elif, 'firma').siralamaPuani)
    expect(eslesmeHesapla(gomulu, tam, 'firma').siralamaPuani).toBe(100)
  })
  it('profil tipinde cinsiyet yok (K25): eşleşmeye giremez', () => {
    // @ts-expect-error cinsiyet EslesmeProfili tipinde tanımlı değil
    const p: EslesmeProfili = { ...elif, cinsiyet: 'kadin' }
    expect(eslesmeHesapla(gomulu, p, 'firma')).toEqual(eslesmeHesapla(gomulu, elif, 'firma'))
  })
})
