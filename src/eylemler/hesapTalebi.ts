'use server'
/** Firma hesap talebi: herkese açık form (Turnstile + istek sınırı) ve Yönetici A.Ş. kararları. */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { hesapTalebiDavet, hesapTalebiOlustur, hesapTalebiReddet } from '@/servisler/hesapTalebi'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { insanDenetle, ipSiniri } from '@/veri/koruma'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')
const ALANLAR = ['firmaAdi', 'konum', 'yetkiliAd', 'unvan', 'eposta', 'telefon', 'not'] as const

/** `surum`: form her hata sonucunda yeniden kurulur (React eylemden sonra formu sıfırlar; seçimler değerlerden geri gelir). */
function hata(e: unknown, degerler?: Record<string, string>): FormDurumu {
  const surum = Date.now()
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler, surum }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler, surum }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden deneyin.', degerler, surum }
}

export async function hesapTalebiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const degerler = Object.fromEntries(ALANLAR.map((a) => [a, metin(f, a)])) as Record<(typeof ALANLAR)[number], string>
  try {
    await ipSiniri('hesap-talebi', true)
    await insanDenetle(f, true)
    await hesapTalebiOlustur(await payloadAl(), { ...degerler, aydinlatma: f.get('aydinlatma') === '1' })
  } catch (e) {
    return hata(e, degerler)
  }
  return { tamam: degerler.eposta.trim() }
}

export async function hesapTalebiKarariEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'talep'))
  let hedef: string
  try {
    const payload = await payloadAl()
    if (metin(f, 'karar') === 'davet') {
      const r = await hesapTalebiDavet(payload, k, id, Number(metin(f, 'firma')))
      hedef = `/yonetim/firmalar/talepler?sonuc=davet&firma=${encodeURIComponent(r.firma.kisaAd)}`
    } else {
      const r = await hesapTalebiReddet(payload, k, id, metin(f, 'gerekce'))
      hedef = `/yonetim/firmalar/talepler?sonuc=red&eposta=${r.eposta ? '1' : '0'}`
    }
  } catch (e) {
    return hata(e, { karar: metin(f, 'karar'), firma: metin(f, 'firma'), gerekce: metin(f, 'gerekce') })
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}
