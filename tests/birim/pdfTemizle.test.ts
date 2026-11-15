import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFName, PDFString, StandardFonts } from 'pdf-lib'
import { SifreliPdfHatasi, pdfTemizle, temizlikVarMi } from '@/altyapi/pdfTemizle'
import { pdfFiligranla } from '@/altyapi/filigran'

/** İçinde betik, açılış komutu, program açan bağlantı, gömülü dosya ve zararsız bir web bağlantısı olan PDF. */
async function tehlikeliPdf() {
  const belge = await PDFDocument.create()
  const sayfa = belge.addPage([595, 842])
  const yazi = await belge.embedFont(StandardFonts.Helvetica)
  sayfa.drawText('Ayse Ornek - Yazilim Gelistirici', { x: 50, y: 780, size: 14, font: yazi })
  const ctx = belge.context
  // Açılışta çalışan betik
  belge.catalog.set(PDFName.of('OpenAction'), ctx.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of('app.alert("zararli")') }))
  // Belge düzeyinde adlandırılmış betik
  const jsEylem = ctx.register(ctx.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of('this.exportDataObject()') }))
  belge.catalog.set(PDFName.of('Names'), ctx.obj({ JavaScript: ctx.obj({ Names: [PDFString.of('a'), jsEylem] }) }))
  // Sayfa açılınca çalışan olay
  sayfa.node.set(PDFName.of('AA'), ctx.obj({ O: { S: 'JavaScript', JS: PDFString.of('app.launchURL("x")') } }))
  // Program açan ve web'e giden iki bağlantı
  const calistir = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 100, 20], A: { S: 'Launch', F: PDFString.of('cmd.exe') } }))
  const web = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 30, 100, 50], A: { S: 'URI', URI: PDFString.of('https://ornek.com') } }))
  sayfa.node.set(PDFName.of('Annots'), ctx.obj([calistir, web]))
  // Gömülü dosya
  await belge.attach(new TextEncoder().encode('MZ zararli program'), 'fatura.exe', { mimeType: 'application/octet-stream' })
  return belge.save({ useObjectStreams: false })
}
const metin = (b: Uint8Array) => new TextDecoder('latin1').decode(b)

describe('PDF etkisizleştirme (K34)', () => {
  it('betik, açılış komutu, program açma ve gömülü dosya çıkarılır; içerik ve web bağlantısı kalır', async () => {
    const once = await tehlikeliPdf()
    for (const iz of ['/JavaScript', '/OpenAction', '/Launch', '/EmbeddedFile', 'app.alert', 'cmd.exe', 'fatura.exe']) expect(metin(once)).toContain(iz)
    const { veri, rapor } = await pdfTemizle(once)
    expect(temizlikVarMi(rapor)).toBe(true)
    expect(rapor.betik).toBeGreaterThanOrEqual(3)
    expect(rapor.ek).toBeGreaterThanOrEqual(1)
    const sonra = metin(veri)
    for (const iz of ['/JavaScript', '/OpenAction', '/Launch', '/EmbeddedFile', '/AA', 'app.alert', 'cmd.exe', 'fatura.exe', 'exportDataObject']) expect(sonra).not.toContain(iz)
    expect(sonra).toContain('https://ornek.com')
    const yeni = await PDFDocument.load(veri)
    expect(yeni.getPageCount()).toBe(1)
  })

  it('temiz PDF’e dokunulmaz (rapor boş)', async () => {
    const b = await PDFDocument.create()
    b.addPage([595, 842])
    const { rapor } = await pdfTemizle(await b.save())
    expect(temizlikVarMi(rapor)).toBe(false)
  })

  it('şifreli PDF reddedilir', async () => {
    const b = await PDFDocument.create()
    b.addPage([595, 842])
    b.context.trailerInfo.Encrypt = b.context.obj({ Filter: 'Standard', V: 2, R: 3 })
    await expect(pdfTemizle(await b.save())).rejects.toBeInstanceOf(SifreliPdfHatasi)
  })

  it('filigranlı kopya da temizlenir (eski yüklemeler için)', async () => {
    const sonra = metin(await pdfFiligranla(await tehlikeliPdf(), 'Kodpit · 15.11.2026'))
    for (const iz of ['/JavaScript', '/OpenAction', '/Launch', '/EmbeddedFile', 'app.alert']) expect(sonra).not.toContain(iz)
  })
})
