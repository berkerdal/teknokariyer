'use server'
/**
 * Firma paneli sunucu eylemleri. Yalnızca servisleri çağırır; yetki ve kural denetimi servistedir.
 * Hitap “siz” (K9).
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { tarihYaz } from '@/arayuz/bicim'
import { KAPATMA_NEDENLERI, type KapatmaNedeni } from '@/alan/ilan'
import { trGunu } from '@/alan/tarih'
import { duraklat, kapat, kopyala, sureUzat, taslakSil, yayinaGonder, yenidenBaslat } from '@/servisler/ilanIslemleri'
import { ESASLI_ALAN_ADI } from '@/alan/ilan'
import { ilanFormunuOku } from '@/alan/ilanFormu'
import { ilanKaydet } from '@/servisler/ilanFormu'
import { basvuruDurumuDegistir, ekipNotuEkle, puanVer } from '@/servisler/degerlendirme'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar }
  if (e instanceof IslemHatasi) return { genel: e.message }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin; sorun sürerse Yönetici A.Ş.’ye bildirin.' }
}

const ISLEMLER = ['yayina-gonder', 'duraklat', 'yeniden-baslat', 'sure-uzat', 'kapat', 'kopyala', 'sil'] as const
type Islem = (typeof ISLEMLER)[number]

/** İlan listesindeki ve özet sayfasındaki tek ilan işlemleri. */
export async function ilanIslemiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const payload = await payloadAl()
  const islem = metin(f, 'islem') as Islem
  const ilanId = Number(metin(f, 'ilan'))
  if (!ISLEMLER.includes(islem) || !ilanId) return { genel: 'İşlem anlaşılamadı. Sayfayı yenileyip yeniden deneyin.' }
  let tamam: string
  let yonlendir: string | null = null
  try {
    switch (islem) {
      case 'yayina-gonder': {
        const i = await yayinaGonder(payload, k, ilanId)
        tamam =
          i.durum === 'yayinda'
            ? 'İlanınız yayına girdi; adaylar artık başvurabilir.'
            : 'İlanınız Yönetici A.Ş. onayına gönderildi. Onaylanınca kendiliğinden yayına girer.'
        break
      }
      case 'duraklat':
        await duraklat(payload, k, ilanId)
        tamam = 'İlan başvuru almayı geçici olarak durdurdu. İstediğiniz zaman yeniden başlatabilirsiniz.'
        break
      case 'yeniden-baslat':
        await yenidenBaslat(payload, k, ilanId)
        tamam = 'İlan yeniden başvuru almaya başladı.'
        break
      case 'sure-uzat': {
        const t = trGunu(metin(f, 'tarih'))
        if (!t) return { hatalar: { tarih: 'Takvimden yeni son başvuru gününü seçin.' } }
        await sureUzat(payload, k, ilanId, t)
        tamam = `Son başvuru tarihi ${tarihYaz(t, true)} olarak güncellendi.`
        break
      }
      case 'kapat': {
        const neden = metin(f, 'neden')
        if (!(neden in KAPATMA_NEDENLERI)) return { hatalar: { neden: 'İlanı neden kapattığınızı seçin.' } }
        await kapat(payload, k, ilanId, neden as KapatmaNedeni)
        tamam = 'İlan kapatıldı. İsterseniz daha sonra kopyalayıp yeniden yayınlayabilirsiniz.'
        break
      }
      case 'kopyala': {
        const yeni = await kopyala(payload, k, ilanId)
        yonlendir = `/firma-paneli/ilanlar/${yeni.id}?kopya=${ilanId}`
        tamam = 'İlan kopyalandı.'
        break
      }
      case 'sil':
        await taslakSil(payload, k, ilanId)
        tamam = 'Taslak silindi.'
        break
    }
  } catch (e) {
    // Listeden yayına gönderilen eksik ilan: pencerede alan alan ne eksik olduğu yazılır, “Düzenle” oraya götürür.
    if (e instanceof FormHatasi) return { genel: `İlanı yayına göndermeden önce şunları tamamlayın: ${Object.values(e.alanlar).join(' ')}` }
    return hata(e)
  }
  revalidatePath('/firma-paneli', 'layout')
  if (yonlendir) redirect(yonlendir)
  return { tamam, surum: Date.now() }
}

/**
 * İlan formu: “Kaydet” veya “Kaydet ve önizle”. Yeni ilan ilk kayıtta kendi adresine yönlenir (adreste kimlik olsun,
 * sayfa yenilense de taslak kaybolmasın).
 */
export async function ilanFormuEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const payload = await payloadAl()
  const ilanId = Number(metin(f, 'ilanId')) || null
  const onizle = metin(f, 'hedef') === 'onizle'
  const { veri, hatalar } = ilanFormunuOku(f)
  if (Object.keys(hatalar).length) return { hatalar }
  let sonuc: Awaited<ReturnType<typeof ilanKaydet>>
  try {
    sonuc = await ilanKaydet(payload, k, ilanId, veri)
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/firma-paneli', 'layout')
  if (onizle) redirect(`/firma-paneli/ilanlar/${sonuc.ilan.id}/onizleme`)
  if (ilanId === null) redirect(`/firma-paneli/ilanlar/${sonuc.ilan.id}?kaydedildi=1`)
  const tamam = sonuc.onayaGiden.length
    ? `Değişiklikler kaydedildi. ${sonuc.onayaGiden.map((a) => ESASLI_ALAN_ADI[a]).join(', ')} değişikliği Yönetici A.Ş. onayından sonra yayına girecek; diğer değişiklikler yayına yansıdı.`
    : sonuc.ilan.durum === 'taslak'
      ? 'Taslak kaydedildi.'
      : ['yayinda', 'duraklatildi'].includes(sonuc.ilan.durum)
        ? 'Değişiklikler kaydedildi ve yayındaki ilana yansıdı.'
        : 'Değişiklikler kaydedildi.'
  return { tamam, surum: Date.now() }
}

/** Önizleme sayfasından yayına gönderme. Eksik varsa alan listesi döner; başarıda ilan listesine yönlenir. */
export async function yayinaGonderEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const ilanId = Number(metin(f, 'ilan'))
  let durum: string
  try {
    durum = (await yayinaGonder(await payloadAl(), k, ilanId)).durum
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/firma-paneli', 'layout')
  redirect(`/firma-paneli/ilanlar?gonderildi=${ilanId}&sonuc=${durum}`)
}

/* ---------- Başvuru değerlendirme ---------- */

const DURUM_TAMAM: Record<string, string> = {
  alindi: 'Başvuru “Alındı” durumuna geri alındı.',
  inceleniyor: 'Başvuru “İnceleniyor” olarak işaretlendi.',
  gorusme: 'Başvuru görüşme aşamasına alındı. Adaya bildirim gönderildi.',
  teklif: 'Başvuru teklif aşamasına alındı. Adaya bildirim gönderildi.',
  olumlu: 'Başvuru olumlu sonuçlandı. Adaya bildirim gönderildi.',
  olumsuz: 'Başvuru olumsuz sonuçlandı. Adaya nazik bir bildirim gönderildi.',
}

export async function basvuruDurumuEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const id = Number(metin(f, 'basvuru'))
  const durum = metin(f, 'durum')
  try {
    const s = await basvuruDurumuDegistir(await payloadAl(), k, id, durum, metin(f, 'not'))
    revalidatePath('/firma-paneli', 'layout')
    return { tamam: s.bildirim ? DURUM_TAMAM[durum] : (DURUM_TAMAM[durum] ?? 'Durum güncellendi.').replace(' Adaya bildirim gönderildi.', '').replace(' Adaya nazik bir bildirim gönderildi.', ''), surum: Date.now() }
  } catch (e) {
    return hata(e)
  }
}

export async function ekipNotuEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  try {
    await ekipNotuEkle(await payloadAl(), k, Number(metin(f, 'basvuru')), metin(f, 'not'))
  } catch (e) {
    const h = hata(e)
    return h.genel ? { hatalar: { not: h.genel } } : h
  }
  revalidatePath(`/firma-paneli/basvurular/${metin(f, 'basvuru')}`)
  return { tamam: 'Not eklendi. Notu yalnızca firma ekibiniz görür.', surum: Date.now() }
}

export async function puanEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const ham = metin(f, 'puan')
  try {
    await puanVer(await payloadAl(), k, Number(metin(f, 'basvuru')), ham ? Number(ham) : null)
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/firma-paneli/basvurular', 'layout')
  return { tamam: ham ? `Puan ${ham} olarak kaydedildi.` : 'Puan kaldırıldı.', surum: Date.now() }
}
