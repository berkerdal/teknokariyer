import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { excelOlustur, sayfaAdi, sutunAdi } from '@/altyapi/excel'

describe('Excel üretici', () => {
  it('sütun adları ve sayfa adı kuralları', () => {
    expect([0, 25, 26, 27, 701].map(sutunAdi)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ'])
    const k = new Set<string>()
    expect(sayfaAdi('Başvuru / Sonuç [özet]', k)).toBe('Başvuru   Sonuç  özet')
    expect(sayfaAdi('başvuru   sonuç  özet', k)).toBe('başvuru   sonuç  özet 2')
    expect(sayfaAdi('x'.repeat(40), k)).toHaveLength(31)
  })
  it('geçerli bir paket üretir: Türkçe metin, sayı hücresi, kaçış, kalın başlık', () => {
    const dosya = excelOlustur([{ ad: 'İlanlar', baslikli: true, satirlar: [['İlan', 'Başvuru'], ['Ar-Ge <Mühendisi> & “Şef”', 12], [null, 3.5]] }])
    const z = unzipSync(dosya)
    expect(Object.keys(z).sort()).toEqual(['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml'])
    const sayfa = strFromU8(z['xl/worksheets/sheet1.xml']!)
    expect(sayfa).toContain('<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">İlan</t></is></c>')
    expect(sayfa).toContain('Ar-Ge &lt;Mühendisi&gt; &amp; “Şef”')
    expect(sayfa).toContain('<c r="B2"><v>12</v></c>')
    expect(sayfa).toContain('<c r="B3"><v>3.5</v></c>')
    expect(sayfa).toContain('state="frozen"')
    expect(strFromU8(z['xl/workbook.xml']!)).toContain('name="İlanlar"')
  })
})
