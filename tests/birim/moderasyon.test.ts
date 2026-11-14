import { describe, expect, it } from 'vitest'
import { ilanTara } from '@/alan/moderasyon'

describe('ilan onayında otomatik tarama', () => {
  it('temiz ilanda tek bir “bulunmadı” satırı döner', () => {
    expect(ilanTara({ pozisyonAdi: 'Gömülü Yazılım Mühendisi', isTanimi: '- STM32 ile yazılım geliştireceksin.', nitelikler: '- C deneyimi' })).toEqual([
      { tur: 'temiz', metin: expect.stringMatching(/bulunmadı/) },
    ])
  })
  it('portal dışı iletişim bilgisini yeriyle işaretler', () => {
    const b = ilanTara({ pozisyonAdi: 'Yazılımcı', isTanimi: 'Başvurular için ik@firma.com.tr adresine yazın veya 0532 123 45 67 numarasını arayın.' })
    expect(b.map((x) => x.metin)).toEqual([expect.stringMatching(/^İş tanımında bir e-posta/), expect.stringMatching(/^İş tanımında bir telefon/)])
  })
  it('yaş, cinsiyet, medeni hâl ve ücretsiz çalışma ifadelerini Türkçe harften bağımsız yakalar', () => {
    const b = ilanTara({
      pozisyonAdi: 'Satış Temsilcisi',
      nitelikler: '- 25-35 yaş arası\n- BAYAN ADAY tercih edilir\n- Bekâr olmak',
      isTanimi: 'İlk hafta ücretsiz deneme çalışması yapılır.',
    }).map((x) => x.metin)
    expect(b.some((m) => m.includes('yaş aralığı'))).toBe(true)
    expect(b.some((m) => m.includes('cinsiyet şartı'))).toBe(true)
    expect(b.some((m) => m.includes('medeni hâl'))).toBe(true)
    expect(b.some((m) => m.includes('ücretsiz deneme çalışması'))).toBe(true)
  })
  it('ön eleme sorularını da tarar', () => {
    expect(ilanTara({ pozisyonAdi: 'X', sorular: ['Evli misiniz?'] })[0]!.metin).toMatch(/^1\. ön eleme sorusunda/)
  })
})

describe('yaş sınırı kalıpları', () => {
  it('“30 yaşından küçük” ve “18 ile 25 yaş” yakalanır; “5 yıl deneyim” yakalanmaz', () => {
    expect(ilanTara({ pozisyonAdi: 'X', nitelikler: '30 yaşından küçük olmak' })[0]!.metin).toMatch(/yaş sınırı/)
    expect(ilanTara({ pozisyonAdi: 'X', nitelikler: '18 ile 25 yaş arası' })[0]!.metin).toMatch(/yaş aralığı/)
    expect(ilanTara({ pozisyonAdi: 'X', nitelikler: 'En az 5 yıl deneyim, 2 yabancı dil' })[0]!.tur).toBe('temiz')
  })
})
