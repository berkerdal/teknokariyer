import { describe, expect, it } from 'vitest'
import { YASAL_SURE_GUN, aciklamaZorunluMu, basvuruTarihiDenetle, cevapSuresi, cevapTaslagi, kalanGun, sonGun, talepSirasi, yerTutucuVarMi } from '@/alan/kvkk'
import { kopyadanKimligiCikar } from '@/servisler/hesapSilme'

// Türkiye saatiyle 14 Kasım 2026, 23.30 (UTC 20.30)
const gec = new Date('2026-11-14T20:30:00Z')

describe('yasal süre', () => {
  it('başvurunun Türkiye saatine göre gününden 30 takvim günü sayılır', () => {
    expect(YASAL_SURE_GUN).toBe(30)
    expect(sonGun(gec).toISOString()).toBe('2026-12-13T21:00:00.000Z') // TR 14 Aralık 00.00
    expect(kalanGun(gec, gec)).toBe(30)
    expect(kalanGun(gec, new Date('2026-12-14T08:00:00Z'))).toBe(0)
    expect(kalanGun(gec, new Date('2026-12-16T08:00:00Z'))).toBe(-2)
  })
  it('cevap süresi gün olarak hesaplanır; aynı gün 0', () => {
    expect(cevapSuresi(gec, new Date('2026-11-14T20:59:00Z'))).toBe(0)
    expect(cevapSuresi(gec, new Date('2026-11-14T21:01:00Z'))).toBe(1)
  })
  it('elle kayıtta gelecek tarih reddedilir, geçmiş kabul edilir', () => {
    expect(basvuruTarihiDenetle(new Date('2026-11-16T00:00:00Z'), gec)).toMatch(/bugünden sonra/)
    expect(basvuruTarihiDenetle(new Date('2026-10-01T00:00:00Z'), gec)).toBeNull()
  })
})

describe('kurallar', () => {
  it('düzeltme ve diğer türlerde açıklama zorunlu; bilgi ve silmede değil', () => {
    expect(aciklamaZorunluMu('duzeltme')).toBe(true)
    expect(aciklamaZorunluMu('diger')).toBe(true)
    expect(aciklamaZorunluMu('bilgi')).toBe(false)
    expect(aciklamaZorunluMu('silme')).toBe(false)
  })
  it('açık başvurular önce ve en eskisi üstte; sonuçlananlar en yeni cevaptan', () => {
    const t = (id: number, durum: 'alindi' | 'sonuclandi', basvuruTarihi: string, cevapTarihi?: string) => ({ id, durum, basvuruTarihi, cevapTarihi })
    const liste = [t(1, 'sonuclandi', '2026-10-01', '2026-10-05'), t(2, 'alindi', '2026-11-10'), t(3, 'alindi', '2026-11-01'), t(4, 'sonuclandi', '2026-10-01', '2026-10-20')]
    expect(liste.sort(talepSirasi).map((x) => x.id)).toEqual([3, 2, 4, 1])
  })
  it('taslaklarda doldurulacak yer tutucu var; ret taslağı Kurul’a başvuru yolunu yazar', () => {
    expect(yerTutucuVarMi(cevapTaslagi('duzeltme', 'kabul', 'sen'))).toBe(true)
    expect(cevapTaslagi('bilgi', 'ret', 'siz')).toMatch(/Kurulu’na şikâyette bulunabilirsiniz/)
    expect(cevapTaslagi('bilgi', 'kabul', 'sen')).toMatch(/Verilerimi indir/)
    expect(yerTutucuVarMi(cevapTaslagi('bilgi', 'kabul', 'sen'))).toBe(false)
    expect(cevapTaslagi('silme', 'kismen', 'sen')).toMatch(/bir kısmını/)
  })
})

describe('hesap silmede profil kopyası', () => {
  it('ad, iletişim ve bağlantılar çıkar; eğitim ve beceriler kalır', () => {
    const k = kopyadanKimligiCikar({ ad: 'Ayşe', eposta: 'a@b.c', telefon: '1', baglantilar: [{ ad: 'GitHub' }], okul: 'PAÜ', beceriler: [{ ad: 'Go' }] })
    expect(k).toEqual({ ad: null, eposta: null, telefon: null, baglantilar: [], hesapSilindi: true, okul: 'PAÜ', beceriler: [{ ad: 'Go' }] })
    expect(kopyadanKimligiCikar(null)).toMatchObject({ ad: null, hesapSilindi: true })
  })
})
