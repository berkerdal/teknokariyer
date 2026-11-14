'use server'
/** Yönetici A.Ş. firma eylemleri. Yalnızca servisleri çağırır; yetki denetimi servistedir. */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { davetGonder, davetiIptalEt, davetiYenidenGonder } from '@/servisler/ekip'
import { firmaKaydiniGuncelle, firmaPasifligi, iskeletFirmaOlustur, takipNotuEkle, topluDavet, type KurumAlanlari } from '@/servisler/firmaYonetimi'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, f?: FormData): FormDurumu {
  const degerler = f ? Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, String(v)])) : undefined
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.', degerler }
}

function kayitGirdisi(f: FormData): KurumAlanlari {
  return {
    unvan: metin(f, 'unvan'),
    kisaAd: metin(f, 'kisaAd'),
    konum: metin(f, 'konum'),
    sektor: Number(metin(f, 'sektor')) || null,
    web: metin(f, 'web'),
    yetkiliAd: metin(f, 'yetkiliAd'),
    yetkiliEposta: metin(f, 'yetkiliEposta'),
    yetkiliTelefon: metin(f, 'yetkiliTelefon'),
    testFirmasi: f.get('testFirmasi') === 'on',
    guvenilir: f.get('guvenilir') === 'on',
  }
}

export async function firmaKaydiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'firma'))
  let hedef: string
  try {
    if (id) {
      await firmaKaydiniGuncelle(await payloadAl(), k, id, kayitGirdisi(f))
      hedef = `/yonetim/firmalar/${id}?sonuc=kaydedildi`
    } else {
      const yeni = await iskeletFirmaOlustur(await payloadAl(), k, kayitGirdisi(f))
      hedef = `/yonetim/firmalar/${yeni.id}?sonuc=olusturuldu`
    }
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function pasiflikEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'firma'))
  const pasif = metin(f, 'pasif') === '1'
  let hedef: string
  try {
    const s = await firmaPasifligi(await payloadAl(), k, id, pasif)
    hedef = `/yonetim/firmalar/${id}?sonuc=${pasif ? `pasif&kapanan=${s.kapanan}` : 'etkin'}`
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function takipNotuEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  try {
    await takipNotuEkle(await payloadAl(), k, Number(metin(f, 'firma')), metin(f, 'not'))
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim', 'layout')
  return { tamam: 'Not kaydedildi.', surum: Date.now() }
}

export async function yetkiliDavetEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'firma'))
  try {
    await davetGonder(await payloadAl(), k, { ad: metin(f, 'ad'), eposta: metin(f, 'eposta'), firmaYetkisi: metin(f, 'firmaYetkisi') || 'yonetici', firmaId: id })
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(`/yonetim/firmalar/${id}?sonuc=davet`)
}

export async function davetIslemiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'firma'))
  const islem = metin(f, 'islem')
  try {
    if (islem === 'yeniden') await davetiYenidenGonder(await payloadAl(), k, Number(metin(f, 'davet')))
    else if (islem === 'iptal') await davetiIptalEt(await payloadAl(), k, Number(metin(f, 'davet')))
    else return { genel: 'İşlem anlaşılamadı.' }
  } catch (e) {
    return hata(e)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(`/yonetim/firmalar/${id}?sonuc=${islem === 'yeniden' ? 'davet-yeniden' : 'davet-iptal'}`)
}

export async function topluDavetEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  try {
    const s = await topluDavet(await payloadAl(), k, f.getAll('firma').map(Number).filter(Boolean))
    revalidatePath('/yonetim', 'layout')
    const atlanan = s.atlanan.map((a) => `${a.firma}: ${a.neden}`)
    return {
      tamam: `${s.gonderilen.length} firmaya davet gönderildi${s.gonderilen.length ? ` (${s.gonderilen.join(', ')})` : ''}.${atlanan.length ? ` Gönderilemeyenler: ${atlanan.join(' ')}` : ''}`,
      surum: Date.now(),
    }
  } catch (e) {
    return hata(e)
  }
}
