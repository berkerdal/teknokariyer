/**
 * Firmanın başvuruları değerlendirmesi (talimatlar 6; prototip “Başvurular”).
 *
 * - Kiracı ayrımı: firma yalnızca kendi ilanlarına gelen başvuruları görür (erişim kuralı + burada ayrıca denetim).
 * - Durumu yalnızca firma yöneticisi ve ilan sorumlusu değiştirir; değerlendirici not ve puan ekler.
 * - Görüşme, teklif, olumlu ve olumsuz durumlarında adaya bildirim gider; firma kapatamaz.
 * - Firma başvuruyu ilk açtığında “Alındı” → “İnceleniyor” olur; aday başvurusunun incelendiğini görür.
 * - CV her indirildiğinde firma adı ve tarih filigranı eklenir ve indirme kayda geçer (K6).
 */
import type { Payload } from 'payload'
import type { Basvurular, Dosyalar, Firmalar, Ilanlar } from '@/payload-types'
import { firmaKimligi, firmaKullanicisiMi, firmaYetkisiVarMi, moderasyonYapabilirMi } from '@/erisim'
import { basvuruDurumuEpostasi } from '@/altyapi/epostaSablonlari'
import { dosyaIcerigi } from '@/altyapi/depolama'
import { filigranMetni, pdfFiligranla } from '@/altyapi/filigran'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

export const FIRMA_DURUMLARI = ['alindi', 'inceleniyor', 'gorusme', 'teklif', 'olumlu', 'olumsuz'] as const
export type FirmaDurumu = (typeof FIRMA_DURUMLARI)[number]
const BILDIRIMLI = ['gorusme', 'teklif', 'olumlu', 'olumsuz'] as const

/** Başvuruyu okur; başka firmanın başvurusuysa veya yoksa 404 (varlığı da belli edilmez). */
async function firmaninBasvurusu(payload: Payload, k: Kullanici, id: number): Promise<Basvurular> {
  if (!firmaKullanicisiMi(k) && !moderasyonYapabilirMi(k)) throw new IslemHatasi('Bu sayfa yalnızca firma kullanıcılarına açık.', 403)
  const b = await payload.findByID({ collection: 'basvurular', id, depth: 0, overrideAccess: false, user: k }).catch((): null => null)
  if (!b || (firmaKullanicisiMi(k) && kimlik(b.firma) !== Number(firmaKimligi(k)))) throw new IslemHatasi('Başvuru bulunamadı.', 404)
  return b
}

/** Firma başvuruyu açınca: “Alındı” ise “İnceleniyor” yapılır (durum yetkisi olan kullanıcıda). */
export async function basvuruyuAc(payload: Payload, k: Kullanici, id: number): Promise<Basvurular> {
  const b = await firmaninBasvurusu(payload, k, id)
  if (b.durum === 'alindi' && firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])) {
    const req = await istekOlustur(payload, k)
    return payload.update({ collection: 'basvurular', id, data: { durum: 'inceleniyor' }, overrideAccess: true, req, depth: 0 })
  }
  return b
}

export async function basvuruDurumuDegistir(payload: Payload, k: Kullanici, id: number, durum: string, kisiselNot = '') {
  if (!(FIRMA_DURUMLARI as readonly string[]).includes(durum)) throw new IslemHatasi('Geçerli bir durum seçin.')
  if (!moderasyonYapabilirMi(k) && !firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu']))
    throw new IslemHatasi('Başvurunun durumunu değiştirme yetkiniz yok. Not ve puan ekleyebilirsiniz.', 403)
  const b = await firmaninBasvurusu(payload, k, id)
  if (b.durum === 'geri-cekti') throw new IslemHatasi('Aday bu başvuruyu geri çekti; durumu değiştirilemez.', 409)
  if (b.durum === durum) return { basvuru: b, bildirim: false }
  const req = await istekOlustur(payload, k)
  const yeni = await payload.update({ collection: 'basvurular', id, data: { durum: durum as FirmaDurumu }, overrideAccess: true, req, depth: 0 })
  let bildirim = false
  if ((BILDIRIMLI as readonly string[]).includes(durum) && b.adayKullanici) {
    const [aday, ilan, firma] = await Promise.all([
      payload.findByID({ collection: 'kullanicilar', id: kimlik(b.adayKullanici), depth: 0, overrideAccess: true }).catch((): null => null),
      payload.findByID({ collection: 'ilanlar', id: kimlik(b.ilan), depth: 0, overrideAccess: true }) as Promise<Ilanlar>,
      payload.findByID({ collection: 'firmalar', id: kimlik(b.firma), depth: 0, overrideAccess: true }) as Promise<Firmalar>,
    ])
    if (aday) {
      const e = basvuruDurumuEpostasi(aday, { durum: durum as (typeof BILDIRIMLI)[number], pozisyonAdi: ilan.pozisyonAdi, firma: firma.kisaAd, not: kisiselNot })
      await payload.sendEmail({ to: aday.email, subject: e.konu, html: e.html, text: e.metin })
      bildirim = true
    }
  }
  return { basvuru: yeni, bildirim }
}

/** Ekip notu (yalnızca firma ekibi ve Yönetici A.Ş. görür; aday görmez). Her rol ekleyebilir. */
export async function ekipNotuEkle(payload: Payload, k: Kullanici, id: number, not: string) {
  const metin = not.trim()
  if (!metin) throw new IslemHatasi('Notu yazın.')
  if (metin.length > 2000) throw new IslemHatasi('Not en fazla 2000 karakter olabilir.')
  const b = await firmaninBasvurusu(payload, k, id)
  const req = await istekOlustur(payload, k)
  return payload.update({
    collection: 'basvurular',
    id,
    data: { ekipNotlari: [...(b.ekipNotlari ?? []).map((n) => ({ not: n.not, yazan: kimlik(n.yazan) || undefined })), { not: metin, yazan: Number(k.id) }] },
    overrideAccess: true,
    req,
    depth: 0,
  })
}

export async function puanVer(payload: Payload, k: Kullanici, id: number, puan: number | null) {
  if (puan !== null && (!Number.isInteger(puan) || puan < 1 || puan > 5)) throw new IslemHatasi('Puan 1 ile 5 arasında olmalıdır.')
  await firmaninBasvurusu(payload, k, id)
  const req = await istekOlustur(payload, k)
  return payload.update({ collection: 'basvurular', id, data: { puan }, overrideAccess: true, req, depth: 0 })
}

/** Başvurudaki CV, firma adı ve tarih filigranıyla (K6). İndirme kayda geçer. */
export async function basvuruCvsi(payload: Payload, k: Kullanici, id: number): Promise<{ icerik: Uint8Array; dosyaAdi: string }> {
  const b = await firmaninBasvurusu(payload, k, id)
  if (!b.cv) throw new IslemHatasi('Bu başvuruda CV yok. Aday hesabını silmiş olabilir.', 404)
  const dosya = (await payload.findByID({ collection: 'dosyalar', id: kimlik(b.cv), depth: 0, overrideAccess: true }).catch((): null => null)) as Dosyalar | null
  const ham = dosya?.filename ? await dosyaIcerigi(dosya.filename) : null
  if (!ham) throw new IslemHatasi('CV dosyası bulunamadı. Aday dosyayı silmiş olabilir.', 404)
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(b.firma), depth: 0, overrideAccess: true })
  let icerik: Uint8Array
  try {
    icerik = await pdfFiligranla(ham, filigranMetni(firma.kisaAd, new Date()))
  } catch {
    throw new IslemHatasi('CV’ye filigran eklenemediği için dosya indirilemiyor. Bu durumu Yönetici A.Ş.’ye bildirin.', 409)
  }
  const req = await istekOlustur(payload, k)
  await islemKaydet(req, { islem: 'Başvurudaki CV indirildi', tur: 'kisisel-veri', kayitTuru: 'basvurular', kayitId: id, ayrinti: { firma: firma.kisaAd } })
  const ad = String((b.profilKopyasi as { ad?: string } | null)?.ad ?? 'aday')
  return { icerik, dosyaAdi: `CV - ${ad}.pdf` }
}
