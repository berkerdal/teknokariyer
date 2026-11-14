'use server'
/** Yönetici A.Ş. kullanıcı eylemleri. Sonuç sayfa düzeyinde gösterilir (satır başka listeye geçebilir). */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { kurumKullanicisiEkle, kurumKullanicisiPasifligi, kurumRoluDegistir, teknikSorumluYap } from '@/servisler/kurumKullanicilari'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, f?: FormData): FormDurumu {
  const degerler = f ? { ad: metin(f, 'ad'), eposta: metin(f, 'eposta'), unvan: metin(f, 'unvan'), rol: metin(f, 'rol') } : undefined
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.', degerler }
}

export async function kurumKullanicisiEkleEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  try {
    await kurumKullanicisiEkle(await payloadAl(), k, { ad: metin(f, 'ad'), eposta: metin(f, 'eposta'), unvan: metin(f, 'unvan'), rol: metin(f, 'rol') })
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim/kullanicilar')
  redirect('/yonetim/kullanicilar?sonuc=eklendi')
}

export async function kurumKullanicisiIslemiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'kullanici'))
  const islem = metin(f, 'islem')
  const payload = await payloadAl()
  try {
    if (islem === 'rol') await kurumRoluDegistir(payload, k, id, metin(f, 'rol'))
    else if (islem === 'kapat') await kurumKullanicisiPasifligi(payload, k, id, true)
    else if (islem === 'ac') await kurumKullanicisiPasifligi(payload, k, id, false)
    else if (islem === 'teknik-ver') await teknikSorumluYap(payload, k, id, true)
    else if (islem === 'teknik-al') await teknikSorumluYap(payload, k, id, false)
    else return { genel: 'İşlem anlaşılamadı.' }
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim/kullanicilar')
  redirect(`/yonetim/kullanicilar?sonuc=${islem}`)
}
