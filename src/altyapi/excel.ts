/**
 * Küçük .xlsx üreticisi (K31 raporlar). Excel'in açtığı en yalın paket: çalışma kitabı, sayfalar, kalın başlık stili.
 * Metinler satır içi (inlineStr), sayılar sayı hücresi olarak yazılır. Sağlayıcıdan bağımsızdır; Worker'da da çalışır.
 */
import { strToU8, zipSync } from 'fflate'

export type Hucre = string | number | null | undefined

export interface Sayfa {
  /** Sayfa adı: en fazla 31 karakter; [ ] : * ? / \ kullanılamaz */
  ad: string
  satirlar: Hucre[][]
  /** İlk satır başlık mı (kalın ve dondurulmuş) */
  baslikli?: boolean
}

const kacis = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // XML 1.0'da geçersiz denetim karakterleri atılır
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

export function sutunAdi(i: number): string {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

export function sayfaAdi(ad: string, kullanilan: Set<string>): string {
  let s = ad.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sayfa'
  let n = 2
  while (kullanilan.has(s.toLocaleLowerCase('tr'))) s = `${s.slice(0, 28)} ${n++}`
  kullanilan.add(s.toLocaleLowerCase('tr'))
  return s
}

function sayfaXml(s: Sayfa): string {
  const genislik = new Map<number, number>()
  const satirlar = s.satirlar.map((satir, r) => {
    const hucreler = satir
      .map((h, c) => {
        if (h === null || h === undefined || h === '') return ''
        const ref = `${sutunAdi(c)}${r + 1}`
        genislik.set(c, Math.max(genislik.get(c) ?? 8, Math.min(60, String(h).length + 2)))
        const stil = s.baslikli && r === 0 ? ' s="1"' : ''
        if (typeof h === 'number' && Number.isFinite(h)) return `<c r="${ref}"${stil}><v>${h}</v></c>`
        return `<c r="${ref}" t="inlineStr"${stil}><is><t xml:space="preserve">${kacis(String(h))}</t></is></c>`
      })
      .join('')
    return `<row r="${r + 1}">${hucreler}</row>`
  })
  const sutunlar = [...genislik.entries()].sort((a, b) => a[0] - b[0]).map(([c, g]) => `<col min="${c + 1}" max="${c + 1}" width="${g}" customWidth="1"/>`)
  const dondur = s.baslikli ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${dondur}${sutunlar.length ? `<cols>${sutunlar.join('')}</cols>` : ''}<sheetData>${satirlar.join('')}</sheetData></worksheet>`
}

export function excelOlustur(sayfalar: Sayfa[]): Uint8Array {
  const kullanilan = new Set<string>()
  const adlar = sayfalar.map((s) => sayfaAdi(s.ad, kullanilan))
  const dosyalar: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sayfalar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${adlar.map((ad, i) => `<sheet name="${kacis(ad)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sayfalar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sayfalar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
    'xl/styles.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ),
  }
  sayfalar.forEach((s, i) => (dosyalar[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sayfaXml(s))))
  return zipSync(dosyalar, { level: 6 })
}
