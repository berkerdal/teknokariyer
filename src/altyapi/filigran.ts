/**
 * İndirilen CV'ye filigran (K6): her sayfanın altına küçük, gri bir satır — firma adı ve indirme tarihi.
 * Saf JavaScript (pdf-lib); Workers'ta ve Node'da aynı çalışır. Türkçe harfler için Source Sans 3 alt kümesi gömülür.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { FILIGRAN_YAZI_TIPI } from './filigranYaziTipi'

const yaziTipiBaytlari = () => Uint8Array.from(atob(FILIGRAN_YAZI_TIPI), (c) => c.charCodeAt(0))

export function filigranMetni(firmaAd: string, tarih: Date): string {
  const gun = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(tarih)
  return `${firmaAd} · ${gun} tarihinde TeknoKariyer’den indirildi. Yalnızca işe alım değerlendirmesinde kullanılabilir.`
}

export async function pdfFiligranla(pdf: Uint8Array, metin: string): Promise<Uint8Array> {
  const belge = await PDFDocument.load(pdf, { ignoreEncryption: true, updateMetadata: false })
  belge.registerFontkit(fontkit)
  const yazi = await belge.embedFont(yaziTipiBaytlari(), { subset: true })
  const boy = 7.5
  for (const sayfa of belge.getPages()) {
    const { width } = sayfa.getSize()
    const genislik = Math.min(yazi.widthOfTextAtSize(metin, boy), width - 24)
    const olcek = genislik < yazi.widthOfTextAtSize(metin, boy) ? (boy * genislik) / yazi.widthOfTextAtSize(metin, boy) : boy
    sayfa.drawText(metin, { x: (width - genislik) / 2, y: 10, size: olcek, font: yazi, color: rgb(0.42, 0.42, 0.42), opacity: 0.85 })
  }
  return belge.save({ useObjectStreams: false })
}
