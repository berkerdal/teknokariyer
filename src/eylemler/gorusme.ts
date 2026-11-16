'use server'
/** Görüşme daveti eylemleri (servis src/servisler/gorusme.ts). */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { trAn } from '@/alan/gorusme'
import { gorusmeTarihiSec, gorusmeYeniTarihIste, gorusmeyeDavetEt, gorusmeyiIptalEt } from '@/servisler/gorusme'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { adayOturumu } from '@/veri/aday'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

/** `surum`: form her hata sonucunda yeniden kurulur (React eylemden sonra formu sıfırlar; değerler `degerler`den geri gelir). */
function hata(e: unknown, degerler?: Record<string, string>): FormDurumu {
  const surum = Date.now()
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler, surum }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler, surum }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.', degerler, surum }
}

const degerler = (f: FormData) => Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === 'string').map(([a, v]) => [a, String(v)]))

export async function gorusmeDavetEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const basvuru = Number(metin(f, 'basvuru'))
  try {
    const eksik: Record<string, string> = {}
    const secenekler = [0, 1, 2].map((i) => {
      const gun = metin(f, `gun${i}`)
      const saat = metin(f, `saat${i}`)
      if (!gun && !saat) return null
      const an = gun && saat ? trAn(gun, saat) : null
      if (!an) eksik[`secenek${i}`] = 'Bu seçenek için günü ve saati birlikte seçin.'
      return an
    })
    if (Object.keys(eksik).length) throw new FormHatasi(eksik)
    await gorusmeyeDavetEt(await payloadAl(), k, basvuru, { secenekler, sure: Number(metin(f, 'sure')), bicim: metin(f, 'bicim'), yer: metin(f, 'yer'), not: metin(f, 'not') })
  } catch (e) {
    return hata(e, degerler(f))
  }
  revalidatePath('/firma-paneli', 'layout')
  redirect(`/firma-paneli/basvurular/${basvuru}?gorusme=${metin(f, 'degisiklik') ? 'degisti' : 'davet'}#gorusme`)
}

export async function gorusmeIptalEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await firmaOturumu()
  const basvuru = Number(metin(f, 'basvuru'))
  try {
    await gorusmeyiIptalEt(await payloadAl(), k, Number(metin(f, 'gorusme')), metin(f, 'neden'))
  } catch (e) {
    return hata(e, degerler(f))
  }
  revalidatePath('/firma-paneli', 'layout')
  redirect(`/firma-paneli/basvurular/${basvuru}?gorusme=iptal#gorusme`)
}

export async function gorusmeSecEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await adayOturumu()
  const id = Number(metin(f, 'gorusme'))
  try {
    await gorusmeTarihiSec(await payloadAl(), k, id, metin(f, 'secim'))
  } catch (e) {
    return hata(e, degerler(f))
  }
  revalidatePath('/hesabim', 'layout')
  redirect(`/hesabim/gorusme/${id}?sonuc=secildi`)
}

export async function gorusmeYeniTarihEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await adayOturumu()
  const id = Number(metin(f, 'gorusme'))
  try {
    await gorusmeYeniTarihIste(await payloadAl(), k, id, metin(f, 'not'))
  } catch (e) {
    return hata(e, degerler(f))
  }
  revalidatePath('/hesabim', 'layout')
  redirect(`/hesabim/gorusme/${id}?sonuc=istendi`)
}
