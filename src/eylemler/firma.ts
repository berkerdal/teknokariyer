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
import { IslemHatasi } from '@/servisler/ortak'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown): FormDurumu {
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
    return hata(e)
  }
  revalidatePath('/firma-paneli', 'layout')
  if (yonlendir) redirect(yonlendir)
  return { tamam, surum: Date.now() }
}
