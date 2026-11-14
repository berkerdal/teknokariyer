import { describe, expect, it } from 'vitest'
import { basvuruAlindiEpostasi, dogrulamaEpostasi, eposta } from '@/altyapi/epostaSablonlari'

describe('e-posta şablonu', () => {
  it('adaya “sen”, firmaya “siz” diye seslenir; alt bilgi de hitaba uyar (K9)', () => {
    const aday = dogrulamaEpostasi({ ad: 'Deniz', rol: 'aday' }, 'a')
    const firma = dogrulamaEpostasi({ ad: 'Ayşe', rol: 'firma' }, 'a')
    expect(aday.html).toContain('hesabınla ilgili bir işlem yapıldığı için aldın')
    expect(firma.html).toContain('hesabınızla ilgili bir işlem yapıldığı için aldınız')
    expect(firma.html).toContain('tarayıcınıza yapıştırın')
    expect(firma.html).not.toContain('/hesabim')
  })

  it('kullanıcıdan gelen metni kaçışlar', () => {
    const e = basvuruAlindiEpostasi({ ad: '<b>x</b>', rol: 'aday' }, { pozisyonAdi: '"><script>', firma: 'A & B' })
    expect(e.html).not.toContain('<script>')
    expect(e.html).not.toContain('<b>x</b>')
    expect(e.html).toContain('A &amp; B')
  })

  it('logoları PNG olarak site adresinden alır, alt metin verir ve düz metin sürümü üretir', () => {
    const e = eposta('Konu', ['Merhaba Deniz,', 'Ön izlemede görünecek cümle.'], { metin: 'Git', adres: 'https://ornek.test/x' })
    expect(e.html).toMatch(/src="[^"]+\/eposta\/teknokariyer-negatif\.png"[^>]+alt="TeknoKariyer/)
    expect(e.html).toContain('alt="Pamukkale Teknokent"')
    expect(e.html).not.toMatch(/\.svg"/)
    expect(e.html).toContain('Ön izlemede görünecek cümle.</div>')
    expect(e.metin).toContain('Git: https://ornek.test/x')
    expect(e.metin).toContain('Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş.')
  })
})
