'use server'
/** İki aşamalı doğrulama eylemleri. Kurallar ve kayıt servistedir (src/servisler/ikiAdim.ts). */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import {
  bekleyenGirisAc,
  ikiAdimiKapat,
  ikiAdimiSifirla,
  ikinciAdimDogrula,
  kurtarmaKodlariniYenile,
  kurtarmaPaketle,
  kurulumuTamamla,
} from '@/servisler/ikiAdim'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { bekleyenGirisCerezi, bekleyenGirisSil, guvenliDonus, kurtarmaCereziSil, kurtarmaCereziYaz, kurtarmaCerezi, oturumAc, rolAnaSayfasi } from '@/veri/cerez'
import { kurtarmaAc } from '@/servisler/ikiAdim'
import { oturum, payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, siz: boolean): FormDurumu {
  const surum = Date.now()
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, surum }
  if (e instanceof IslemHatasi) return { genel: e.message, surum }
  console.error(e)
  return { genel: siz ? 'Beklenmeyen bir sorun oluştu. Yeniden deneyin.' : 'Beklenmeyen bir sorun oluştu. Yeniden dene.', surum }
}

const SURE_DOLDU = '/giris?ikinci=sure'

/** Girişte ikinci adım: uygulama kodu veya kurtarma kodu. */
export async function ikinciAdimEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect(SURE_DOLDU)
  let hedef: string
  try {
    const r = await ikinciAdimDogrula(await payloadAl(), g.kullaniciId, metin(f, 'kod'))
    await oturumAc(g.token, new Date(g.bitis))
    await bekleyenGirisSil()
    hedef = r.kurtarmaKullanildi ? `/hesap-guvenligi?kurtarma=${r.kalanKurtarma}` : g.donus
  } catch (e) {
    return hata(e, g.rol !== 'aday')
  }
  redirect(hedef)
}

/** Girişte ilk kurulum (firma ve kurum hesapları için zorunlu). */
export async function girisKurulumEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect(SURE_DOLDU)
  try {
    const kodlar = await kurulumuTamamla(await payloadAl(), g.kullaniciId, metin(f, 'kod'))
    await oturumAc(g.token, new Date(g.bitis))
    await bekleyenGirisSil()
    const { paket, son } = await kurtarmaPaketle(kodlar, g.donus)
    await kurtarmaCereziYaz(paket, son)
  } catch (e) {
    return hata(e, g.rol !== 'aday')
  }
  redirect('/giris/kurtarma-kodlari')
}

/** Oturum açıkken kurulum (adayın isteğe bağlı olarak açması). */
export async function hesapKurulumEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  try {
    const kodlar = await kurulumuTamamla(await payloadAl(), Number(k.id), metin(f, 'kod'))
    const { paket, son } = await kurtarmaPaketle(kodlar, '/hesap-guvenligi?sonuc=kuruldu')
    await kurtarmaCereziYaz(paket, son)
  } catch (e) {
    return hata(e, k.rol !== 'aday')
  }
  redirect('/giris/kurtarma-kodlari')
}

export async function kurtarmaYenileEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  try {
    const kodlar = await kurtarmaKodlariniYenile(await payloadAl(), k as never, metin(f, 'kod'))
    const { paket, son } = await kurtarmaPaketle(kodlar, '/hesap-guvenligi?sonuc=yenilendi')
    await kurtarmaCereziYaz(paket, son)
  } catch (e) {
    return hata(e, k.rol !== 'aday')
  }
  redirect('/giris/kurtarma-kodlari')
}

/** “Kodları kaydettim”: gösterim çerezi silinir, kişi gideceği yere geçer. */
export async function kurtarmaKaydedildiEylemi() {
  const v = await kurtarmaAc(await kurtarmaCerezi())
  await kurtarmaCereziSil()
  const k = await oturum()
  redirect(guvenliDonus(v?.donus, k ? rolAnaSayfasi(String(k.rol)) : '/'))
}

export async function ikiAdimKapatEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  try {
    await ikiAdimiKapat(await payloadAl(), k as never, metin(f, 'kod'))
  } catch (e) {
    return hata(e, false)
  }
  redirect('/hesap-guvenligi?sonuc=kapatildi')
}

/** Yönetici A.Ş. veya firmanın tam yetkilisi bir kişinin ikinci adımını sıfırlar. Sonuç sayfa düzeyinde gösterilir. */
export async function ikiAdimSifirlaEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris')
  const geri = guvenliDonus(f.get('geri'), '/')
  let eposta = true
  try {
    eposta = (await ikiAdimiSifirla(await payloadAl(), k as never, Number(metin(f, 'kullanici')))).eposta
  } catch (e) {
    return hata(e, true)
  }
  revalidatePath(geri.split('?')[0]!)
  redirect(`${geri}${geri.includes('?') ? '&' : '?'}sonuc=${eposta ? 'iki-adim-sifirlandi' : 'iki-adim-sifirlandi-epostasiz'}`)
}
