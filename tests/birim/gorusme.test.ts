import { describe, expect, it } from 'vitest'
import { davetHatalari, gorusmeHali, gunSecenekleri, gorusmeZamani, icsKatla, saatAraligi, surenGorusmeMi, takvimDosyasi, trAn } from '@/alan/gorusme'

const simdi = new Date('2026-11-16T07:00:00Z') // TR 10.00
const saatSonra = (n: number) => new Date(simdi.getTime() + n * 3_600_000)

describe('trAn', () => {
  it('gün ve saat Türkiye saatiyle okunur', () => {
    expect(trAn('2026-11-18', '14:30')?.toISOString()).toBe('2026-11-18T11:30:00.000Z')
    expect(trAn('2026-02-31', '10:00')).toBeNull()
    expect(trAn('2026-11-18', '25:00')).toBeNull()
    expect(trAn('', '')).toBeNull()
  })
})

describe('davetHatalari', () => {
  const g = { secenekler: [saatSonra(24), null, null], sure: 45, bicim: 'yuz-yuze', yer: 'Pamukkale Teknokent, D Blok 208', not: '' }
  it('geçerli davette hata yok', () => expect(davetHatalari(g, simdi)).toEqual({}))
  it('seçenek: en az bir, 2 saatten erken değil, 60 günden geç değil, tekrar yok', () => {
    expect(davetHatalari({ ...g, secenekler: [null, null, null] }, simdi)).toHaveProperty('secenek0')
    expect(davetHatalari({ ...g, secenekler: [saatSonra(1), null, null] }, simdi)).toHaveProperty('secenek0')
    expect(davetHatalari({ ...g, secenekler: [saatSonra(24), saatSonra(61 * 24), null] }, simdi)).toHaveProperty('secenek1')
    expect(davetHatalari({ ...g, secenekler: [saatSonra(24), null, saatSonra(24)] }, simdi)).toHaveProperty('secenek2')
  })
  it('biçime göre yer: yüz yüzede adres, çevrim içinde https bağlantı, telefonda isteğe bağlı', () => {
    expect(davetHatalari({ ...g, yer: '' }, simdi)).toHaveProperty('yer')
    expect(davetHatalari({ ...g, bicim: 'cevrim-ici', yer: 'meet.google.com/abc' }, simdi)).toHaveProperty('yer')
    expect(davetHatalari({ ...g, bicim: 'cevrim-ici', yer: 'https://meet.google.com/abc-defg-hij' }, simdi)).toEqual({})
    expect(davetHatalari({ ...g, bicim: 'telefon', yer: '' }, simdi)).toEqual({})
    expect(davetHatalari({ ...g, sure: 50 }, simdi)).toHaveProperty('sure')
    expect(davetHatalari({ ...g, bicim: 'video' }, simdi)).toHaveProperty('bicim')
  })
})

describe('gorusmeHali', () => {
  const temel = { durum: 'bekliyor' as const, secenekler: [saatSonra(5), saatSonra(30)], secilen: null as Date | null, sure: 30 }
  it('seçeneklerin hepsi geçince süresi dolar', () => {
    expect(gorusmeHali(temel, simdi)).toBe('bekliyor')
    expect(gorusmeHali(temel, saatSonra(31))).toBe('suresi-doldu')
    expect(surenGorusmeMi(temel, saatSonra(31))).toBe(false)
  })
  it('kesinleşen görüşme bitince tamamlanır', () => {
    const g = { ...temel, durum: 'onaylandi' as const, secilen: saatSonra(5) }
    expect(gorusmeHali(g, saatSonra(5.4))).toBe('onaylandi')
    expect(gorusmeHali(g, saatSonra(5.5))).toBe('tamamlandi')
    expect(gorusmeHali({ ...g, durum: 'iptal' }, simdi)).toBe('iptal')
  })
})

describe('yazım', () => {
  it('gün listesi Türkiye gününden başlar, 61 gün', () => {
    const g = gunSecenekleri(new Date('2026-11-16T22:30:00Z')) // TR 17 Kasım 01.30
    expect(g).toHaveLength(61)
    expect(g[0]).toEqual({ deger: '2026-11-17', metin: '17 Kasım Salı (bugün)' })
    expect(g[1]!.metin).toBe('18 Kasım Çarşamba (yarın)')
  })
  it('Türkiye saatiyle tarih ve aralık', () => {
    expect(gorusmeZamani(new Date('2026-11-18T11:30:00Z'))).toBe('18 Kasım 2026 Çarşamba, 14.30')
    expect(saatAraligi(new Date('2026-11-18T11:30:00Z'), 45)).toBe('14.30–15.15')
  })
})

describe('takvim dosyası', () => {
  const t = {
    uid: 'gorusme-5-1@kariyer.pauteknokent.com.tr',
    yontem: 'PUBLISH' as const,
    sira: 0,
    baslangic: new Date('2026-11-18T11:30:00Z'),
    sure: 45,
    ozet: 'Görüşme: Yazılım Geliştirici, Arka Uç · Kodpit',
    aciklama: 'Satır 1\nSatır 2; noktalı virgül',
    yer: 'Pamukkale Teknokent, D Blok 208',
    duzenleyen: { ad: 'Kodpit · TeknoKariyer', eposta: 'kariyer@pauteknokent.com.tr' },
    olusturma: new Date('2026-11-16T07:00:00Z'),
  }
  it('RFC 5545: CRLF, UTC anlar, kaçış, alarm', () => {
    const ics = takvimDosyasi(t)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
    expect(ics).toContain('DTSTART:20261118T113000Z')
    expect(ics).toContain('DTEND:20261118T121500Z')
    expect(ics).toContain('METHOD:PUBLISH')
    expect(ics.replace(/\r\n /g, '')).toContain('DESCRIPTION:Satır 1\\nSatır 2\\; noktalı virgül')
    expect(ics.replace(/\r\n /g, '')).toContain('SUMMARY:Görüşme: Yazılım Geliştirici\\, Arka Uç · Kodpit')
    expect(ics).toContain('BEGIN:VALARM')
  })
  it('iptal aynı UID ile, sıra artar, alarm yok', () => {
    const ics = takvimDosyasi({ ...t, yontem: 'CANCEL', sira: 1 })
    expect(ics).toContain('METHOD:CANCEL')
    expect(ics).toContain('STATUS:CANCELLED')
    expect(ics).toContain('SEQUENCE:1')
    expect(ics).toContain(`UID:${t.uid}`)
    expect(ics).not.toContain('VALARM')
  })
  it('uzun satırlar 75 baytta katlanır, çok baytlı karakter bölünmez', () => {
    const satir = `DESCRIPTION:${'ğüşıöç'.repeat(20)}`
    const katli = icsKatla(satir)
    for (const s of katli.split('\r\n')) expect(new TextEncoder().encode(s).length).toBeLessThanOrEqual(75)
    expect(katli.split('\r\n').map((s, i) => (i ? s.slice(1) : s)).join('')).toBe(satir)
  })
})
