'use server'
/**
 * Yönetici A.Ş. panelinin karar eylemleri. Yalnızca servisleri çağırır; yetki denetimi servistedir.
 * Sonuç, kayıt kuyruktan çıktığı için sayfa düzeyinde gösterilir (`?sonuc=`).
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { basvurusuzHatirlat, degisiklikKarari, ilanDuzeltmeIste, ilanOnayla, talepKarari, type OgeKarari } from '@/servisler/moderasyon'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { yonetimOturumu } from '@/veri/yonetim'
import { payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar }
  if (e instanceof IslemHatasi) return { genel: e.message }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.' }
}

const sonuc = (yol: string, s: Record<string, string>) => `${yol}?${new URLSearchParams(s).toString()}`

export async function ilanKarariEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const payload = await payloadAl()
  const ilanId = Number(metin(f, 'ilan'))
  const karar = metin(f, 'karar')
  let hedef: string
  try {
    if (karar === 'onay') {
      const s = await ilanOnayla(payload, k, ilanId, { kontroller: f.getAll('kontrol').map(String), guvenilirYap: f.get('guvenilir') === 'on' })
      hedef = sonuc('/yonetim/onay', { sonuc: 'onay', ilan: s.ilan.pozisyonAdi, eposta: s.eposta ? '1' : '0', guvenilir: f.get('guvenilir') === 'on' ? '1' : '0' })
    } else if (karar === 'duzelt') {
      const s = await ilanDuzeltmeIste(payload, k, ilanId, metin(f, 'not'))
      hedef = sonuc('/yonetim/onay', { sonuc: 'duzelt', ilan: s.ilan.pozisyonAdi, eposta: s.eposta ? '1' : '0' })
    } else return { genel: 'Karar anlaşılamadı. Sayfayı yenileyip yeniden deneyin.' }
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function degisiklikKarariEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const ilanId = Number(metin(f, 'ilan'))
  const onay = metin(f, 'karar') === 'onay'
  let hedef: string
  try {
    const s = await degisiklikKarari(await payloadAl(), k, ilanId, onay, metin(f, 'not'))
    hedef = sonuc('/yonetim/degisiklikler', { sonuc: onay ? 'onay' : 'ret', ilan: s.ilan.pozisyonAdi, eposta: s.eposta ? '1' : '0' })
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function talepKarariEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const talepId = Number(metin(f, 'talep'))
  const adet = Math.min(Number(metin(f, 'adet')) || 0, 20)
  const kararlar: OgeKarari[] = []
  for (let i = 0; i < adet; i++) {
    const karar = metin(f, `karar-${i}`)
    if (karar !== 'ekle' && karar !== 'ekleme') continue // karar verilmemiş öğe serviste hata olarak döner
    kararlar.push({ ad: metin(f, `oge-${i}`), kabul: karar === 'ekle', yeniAd: metin(f, `ad-${i}`), neden: metin(f, `neden-${i}`) })
  }
  let hedef: string
  try {
    const s = await talepKarari(await payloadAl(), k, talepId, kararlar, metin(f, 'not'))
    hedef = sonuc('/yonetim/talepler', {
      sonuc: 'tamam',
      eklenen: s.eklenenler.join(', '),
      eklenmeyen: s.reddedilenler.map((r) => r.ad).join(', '),
      eposta: s.eposta ? '1' : '0',
    })
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function hatirlatEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  let hedef: string
  try {
    const kisi = await basvurusuzHatirlat(await payloadAl(), k, Number(metin(f, 'ilan')))
    hedef = sonuc('/yonetim', { hatirlatma: String(kisi), ilan: metin(f, 'ad') })
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef) // satır “Hatırlatıldı”ya döner; sonuç sayfa düzeyinde gösterilir
}
