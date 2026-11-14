import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { filigranMetni, pdfFiligranla } from '@/altyapi/filigran'

describe('CV filigranı (K6)', () => {
  it('metin firma adı ve Türkiye günüyle yazılır', () => {
    expect(filigranMetni('Kodpit Teknoloji', new Date('2026-11-14T22:30:00Z'))).toMatch(/^Kodpit Teknoloji · 15\.11\.2026 tarihinde TeknoKariyer’den indirildi/)
  })
  it('her sayfaya Türkçe harfli filigran ekler; sayfa sayısı değişmez', async () => {
    const belge = await PDFDocument.create()
    belge.addPage([595, 842])
    belge.addPage([595, 842])
    const once = await belge.save()
    const sonra = await pdfFiligranla(once, filigranMetni('Şirinoğlu Yazılım İnovasyon', new Date()))
    const okunan = await PDFDocument.load(sonra)
    expect(okunan.getPageCount()).toBe(2)
    expect(sonra.length).toBeGreaterThan(once.length)
    expect(new TextDecoder('latin1').decode(sonra)).toMatch(/SourceSans3/)
  })
  it('bozuk dosyada hata verir (sessizce filigransız dosya dönmez)', async () => {
    await expect(pdfFiligranla(new TextEncoder().encode('PDF değil'), 'x')).rejects.toThrow()
  })
})
