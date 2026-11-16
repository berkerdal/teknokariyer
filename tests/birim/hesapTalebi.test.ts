import { describe, expect, it } from 'vitest'
import { benzerFirmalar, talepHatalari } from '@/alan/hesapTalebi'

const g = { firmaAdi: 'Kodpit Yazılım', konum: '', yetkiliAd: 'Ayşe Demir', unvan: '', eposta: 'ayse@kodpit.com', telefon: '', not: '' }

describe('talepHatalari', () => {
  it('geçerli talepte hata yok', () => expect(talepHatalari(g)).toEqual({}))
  it('ad-soyad, e-posta, telefon ve not denetlenir', () => {
    const h = talepHatalari({ ...g, firmaAdi: ' ', yetkiliAd: 'Ayşe', eposta: 'ayse@', telefon: '1234', not: 'x'.repeat(1001) })
    expect(Object.keys(h).sort()).toEqual(['eposta', 'firmaAdi', 'not', 'telefon', 'yetkiliAd'])
    expect(talepHatalari({ ...g, telefon: '0258 215 50 01' })).toEqual({})
  })
})

describe('benzerFirmalar', () => {
  const firmalar = [
    { id: 1, kisaAd: 'Kodpit', unvan: 'Kodpit Bilişim Yazılım Ltd. Şti.' },
    { id: 2, kisaAd: 'Ratel', unvan: 'Ratel Bilişim Hizmetleri Ltd. Şti.' },
    { id: 3, kisaAd: 'Netinternet', unvan: 'Netinternet Bilişim A.Ş.' },
    { id: 4, kisaAd: 'Kodlama Evi', unvan: 'Kodlama Evi Ltd. Şti.' },
  ]
  it('şirket ekleri ve büyük-küçük harf farkı önemsenmez; eşit ad önce gelir', () => {
    expect(benzerFirmalar('KODPIT BİLİŞİM YAZILIM LTD. ŞTİ.', firmalar).map((f) => f.id)[0]).toBe(1)
    expect(benzerFirmalar('ratel', firmalar).map((f) => f.id)).toEqual([2])
  })
  it('ad içerilirse veya ilk kelime aynıysa aday sayılır; ilgisiz ad eşleşmez', () => {
    expect(benzerFirmalar('Netinternet Hosting', firmalar).map((f) => f.id)).toEqual([3])
    expect(benzerFirmalar('Kodlama Evi Akademi', firmalar).map((f) => f.id)).toEqual([4])
    expect(benzerFirmalar('Pamukkale Robotik', firmalar)).toEqual([])
    expect(benzerFirmalar('', firmalar)).toEqual([])
  })
})
