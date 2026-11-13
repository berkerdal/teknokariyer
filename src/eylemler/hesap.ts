'use server'
/**
 * Hesap sunucu eylemleri. Yalnızca hesap servisini çağırır; kural mantığı servistedir.
 */
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { FormHatasi, adayKaydi, girisYap, sifreSifirlamaIste, sifreYenile } from '@/servisler/hesap'
import { IslemHatasi } from '@/servisler/ortak'
import { guvenliDonus, oturumAc, oturumKapat, rolAnaSayfasi } from '@/veri/cerez'
import { payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hataDurumu(e: unknown, degerler?: Record<string, string>): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden dene.', degerler }
}

export async function girisEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const eposta = metin(f, 'eposta')
  let hedef: string
  try {
    const s = await girisYap(await payloadAl(), eposta, metin(f, 'sifre'))
    await oturumAc(s.token, s.bitis)
    hedef = guvenliDonus(f.get('donus'), rolAnaSayfasi(s.rol))
  } catch (e) {
    return hataDurumu(e, { eposta })
  }
  redirect(hedef)
}

export async function kayitEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const degerler = { ad: metin(f, 'ad'), eposta: metin(f, 'eposta'), ticariIleti: f.get('ticariIleti') ? '1' : '' }
  try {
    await adayKaydi(await payloadAl(), {
      ad: degerler.ad,
      eposta: degerler.eposta,
      sifre: metin(f, 'sifre'),
      aydinlatma: Boolean(f.get('aydinlatma')),
      ticariIleti: Boolean(f.get('ticariIleti')),
    })
  } catch (e) {
    return hataDurumu(e, degerler)
  }
  return { tamam: degerler.eposta.trim().toLowerCase() }
}

export async function sifreSifirlamaEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const eposta = metin(f, 'eposta')
  try {
    await sifreSifirlamaIste(await payloadAl(), eposta)
  } catch (e) {
    return hataDurumu(e, { eposta })
  }
  return { tamam: eposta.trim().toLowerCase() }
}

export async function sifreYenileEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  let hedef: string
  try {
    const s = await sifreYenile(await payloadAl(), metin(f, 'anahtar'), metin(f, 'sifre'))
    await oturumAc(s.token, s.bitis)
    hedef = rolAnaSayfasi(s.rol)
  } catch (e) {
    return hataDurumu(e)
  }
  redirect(hedef)
}

export async function cikisEylemi() {
  await oturumKapat()
  redirect('/')
}
