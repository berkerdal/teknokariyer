/**
 * PDF etkisizleştirme (K34). Yüklenen CV'den ve firmaya verilen her kopyadan, açanın bilgisayarında bir şey
 * çalıştırabilecek bütün etkin içerik çıkarılır; metin, görüntü, yazı tipi ve sayfa düzeni olduğu gibi kalır.
 *
 * Çıkarılanlar:
 * - Betikler (JavaScript eylemleri, belge düzeyindeki betik adları)
 * - Açılışta ve olaylarda çalışan komutlar (/OpenAction, /AA)
 * - Program açma, uzak dosya, form gönderme, veri içe alma, ortam oynatma eylemleri (Launch, GoToR, SubmitForm…)
 * - Gömülü dosyalar ve dosya ekleri (EmbeddedFiles, FileAttachment, /AF)
 * - XFA formları ve zengin ortam (RichMedia, Screen, Movie, Sound)
 * Bağlantılar (URI) ve belge içi gezinme (GoTo, Named) kalır.
 *
 * Saf JavaScript (pdf-lib); Workers'ta ve Node'da aynı çalışır. Şifreli PDF işlenemez: yüklemede reddedilir.
 */
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, PDFStream, type PDFObject } from 'pdf-lib'

const ad = (s: string) => PDFName.of(s)

/** Çalıştırılabilir veya dışarıya bağlanan eylem türleri */
const TEHLIKELI_EYLEMLER = new Set(['JavaScript', 'Launch', 'SubmitForm', 'ImportData', 'GoToR', 'GoToE', 'RichMediaExecute', 'Rendition', 'Sound', 'Movie'].map(ad))
/** Her sözlükten silinen anahtarlar */
const SILINEN_ANAHTARLAR = ['OpenAction', 'AA', 'JavaScript', 'EmbeddedFiles', 'AF', 'XFA', 'RichMediaContent', 'RichMediaSettings'].map(ad)
/** Bütünüyle kaldırılan nesne türleri (/Type) ve not türleri (/Subtype) */
const SILINEN_TURLER = new Set(['EmbeddedFile', 'Filespec'].map(ad))
const SILINEN_NOTLAR = new Set(['FileAttachment', 'RichMedia', 'Screen', 'Movie', 'Sound'].map(ad))

export interface TemizlikRaporu {
  betik: number
  komut: number
  ek: number
}

export const temizlikVarMi = (r: TemizlikRaporu) => r.betik + r.komut + r.ek > 0

/** Belgeyi yerinde temizler (filigran da bunu kullanır). */
export function belgeyiTemizle(belge: PDFDocument): TemizlikRaporu {
  const ctx = belge.context
  const rapor: TemizlikRaporu = { betik: 0, komut: 0, ek: 0 }
  const silinecek = new Set<string>()
  const refAdi = (r: PDFRef) => r.toString()

  const sozlukIsle = (d: PDFDict) => {
    const tur = d.get(ad('Type'))
    const altTur = d.get(ad('Subtype'))
    if ((tur instanceof PDFName && SILINEN_TURLER.has(tur)) || (altTur instanceof PDFName && SILINEN_NOTLAR.has(altTur))) return 'sil'
    const eylem = d.get(ad('S'))
    if (eylem instanceof PDFName && TEHLIKELI_EYLEMLER.has(eylem)) {
      const js = d.get(ad('JS'))
      if (js instanceof PDFRef) silinecek.add(refAdi(js))
      if (eylem === ad('JavaScript')) rapor.betik++
      else rapor.komut++
      // Eylem türünü ve verisini sil: türü olmayan eylemi okuyucular yok sayar
      for (const k of ['S', 'JS', 'F', 'Win', 'Mac', 'Unix', 'P', 'D', 'Fields', 'Flags', 'Next', 'T', 'TA', 'R', 'AN', 'OP', 'CMD'].map(ad)) d.delete(k)
    }
    for (const k of SILINEN_ANAHTARLAR) {
      if (!d.has(k)) continue
      const v = d.get(k)
      if (v instanceof PDFRef) silinecek.add(refAdi(v))
      if (k === ad('JavaScript')) rapor.betik++
      else if (k === ad('EmbeddedFiles') || k === ad('AF')) rapor.ek++
      else rapor.komut++
      d.delete(k)
    }
    return 'kalsin'
  }

  // 1. Önce içteki doğrudan sözlük ve dizileri, sonra nesnenin kendisini işle (iç içe betikler de sayılsın).
  //    Doğrudan gömülü kaldırılacak sözlük (ör. dizideki dosya eki notu) diziden çıkarılır.
  const gez = (o: PDFObject | undefined, derinlik = 0): 'sil' | 'kalsin' => {
    if (!o || derinlik > 40) return 'kalsin'
    if (o instanceof PDFDict) {
      for (const [k, v] of o.entries()) if (!(v instanceof PDFRef) && gez(v, derinlik + 1) === 'sil') o.delete(k)
      return sozlukIsle(o)
    }
    if (o instanceof PDFArray) {
      for (let i = o.size() - 1; i >= 0; i--) {
        const v = o.get(i)
        if (!(v instanceof PDFRef) && gez(v, derinlik + 1) === 'sil') {
          o.remove(i)
          rapor.ek++
        }
      }
    }
    return 'kalsin'
  }
  for (const [ref, nesne] of ctx.enumerateIndirectObjects()) {
    const d = nesne instanceof PDFDict ? nesne : nesne instanceof PDFStream ? nesne.dict : null
    if (!d) {
      gez(nesne)
      continue
    }
    if (gez(d) === 'sil') {
      silinecek.add(refAdi(ref))
      rapor.ek++
    }
  }

  // 2. Silinecek nesnelere giden bağlantıları kopar, nesneleri kaldır
  const kopar = (o: PDFObject | undefined, derinlik = 0): void => {
    if (!o || derinlik > 40) return
    if (o instanceof PDFDict) {
      for (const [k, v] of o.entries()) {
        if (v instanceof PDFRef && silinecek.has(refAdi(v))) o.delete(k)
        else if (!(v instanceof PDFRef)) kopar(v, derinlik + 1)
      }
    } else if (o instanceof PDFArray) {
      for (let i = o.size() - 1; i >= 0; i--) {
        const v = o.get(i)
        if (v instanceof PDFRef && silinecek.has(refAdi(v))) o.remove(i)
        else if (!(v instanceof PDFRef)) kopar(v, derinlik + 1)
      }
    }
  }
  for (const [, nesne] of ctx.enumerateIndirectObjects()) kopar(nesne instanceof PDFStream ? nesne.dict : nesne)
  kopar(belge.catalog)
  for (const [ref] of ctx.enumerateIndirectObjects()) if (silinecek.has(refAdi(ref))) ctx.delete(ref)
  return rapor
}

export class SifreliPdfHatasi extends Error {}

/** Yüklenen PDF'i temizleyip yeniden yazar. Şifreli PDF'te `SifreliPdfHatasi` fırlatır. */
export async function pdfTemizle(veri: Uint8Array): Promise<{ veri: Uint8Array; rapor: TemizlikRaporu }> {
  let belge: PDFDocument
  try {
    belge = await PDFDocument.load(veri, { updateMetadata: false })
  } catch (e) {
    if ((e as Error)?.name === 'EncryptedPDFError' || /encrypted/i.test(String((e as Error)?.message))) throw new SifreliPdfHatasi()
    throw e
  }
  const rapor = belgeyiTemizle(belge)
  return { veri: await belge.save({ useObjectStreams: false }), rapor }
}
