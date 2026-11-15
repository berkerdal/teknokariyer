'use server'
/** İki aşamalı doğrulama eylemleri (K33). Kurallar ve kayıt servistedir (src/servisler/ikiAdim.ts). */
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { ortam } from '@/altyapi/eposta'
import {
  bekleyenGirisAc,
  bekleyenGirisPaketle,
  cihaziHatirla,
  cihazlariUnut,
  epostaKoduGonder,
  ikiAdimiKapat,
  ikiAdimiSifirla,
  ikinciAdimDogrula,
  kurtarmaAc,
  kurtarmaKodlariniYenile,
  kurtarmaPaketle,
  kurulumuTamamla,
} from '@/servisler/ikiAdim'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import {
  bekleyenGirisCerezi,
  bekleyenGirisSil,
  bekleyenGirisYaz,
  cihazAnahtari,
  guvenliDonus,
  kurtarmaCereziSil,
  kurtarmaCereziYaz,
  kurtarmaCerezi,
  oturumAc,
  rolAnaSayfasi,
} from '@/veri/cerez'
import { oturum, payloadAl } from '@/veri/payload'
import { ipSiniri } from '@/veri/koruma'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, siz: boolean, ek: Partial<FormDurumu> = {}): FormDurumu {
  const surum = Date.now()
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, surum, ...ek }
  if (e instanceof IslemHatasi) return { genel: e.message, surum, ...ek }
  console.error(e)
  return { genel: siz ? 'Beklenmeyen bir sorun oluştu. Yeniden deneyin.' : 'Beklenmeyen bir sorun oluştu. Yeniden dene.', surum, ...ek }
}

const SURE_DOLDU = '/giris?ikinci=sure'

/** Girişte ikinci adım: e-posta kodu, uygulama kodu veya kurtarma kodu. İstenirse cihaz 90 gün hatırlanır. */
export async function ikinciAdimEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect(SURE_DOLDU)
  const hatirla = f.get('hatirla') === 'on'
  let hedef: string
  try {
    await ipSiniri('ikinci-adim', g.rol !== 'aday')
    const payload = await payloadAl()
    const r = await ikinciAdimDogrula(payload, g.kullaniciId, metin(f, 'kod'), g.yontem)
    if (hatirla) await cihaziHatirla(payload, g.kullaniciId, (await cihazAnahtari(true))!, (await headers()).get('user-agent'))
    await oturumAc(g.token, new Date(g.bitis))
    await bekleyenGirisSil()
    hedef = r.kurtarmaKullanildi ? `/hesap-guvenligi?kurtarma=${r.kalanKurtarma}` : g.donus
  } catch (e) {
    return hata(e, g.rol !== 'aday', { degerler: { hatirla: hatirla ? 'on' : '' } })
  }
  redirect(hedef)
}

/** E-posta kodunu yeniden gönderir (60 saniyede bir, saatte en fazla 5). */
export async function epostaKoduYenidenEylemi(_: FormDurumu): Promise<FormDurumu> {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g || g.yontem !== 'eposta') redirect(SURE_DOLDU)
  const siz = g.rol !== 'aday'
  try {
    const r = await epostaKoduGonder(await payloadAl(), g.kullaniciId)
    const { kullaniciId, token, bitis, rol, donus, yontem, adres } = g
    const { paket, son } = await bekleyenGirisPaketle({ kullaniciId, token, bitis, rol, donus, yontem, adres, testKodu: ortam() !== 'yayin' ? r.kod : undefined })
    await bekleyenGirisYaz(paket, son)
    return {
      tamam: r.eposta ? 'Yeni kod gönderildi. Önceki kod artık geçersiz.' : siz ? 'Kod oluşturuldu, ancak e-posta gönderilemedi. Biraz sonra yeniden deneyin.' : 'Kod oluşturuldu, ancak e-posta gönderilemedi. Biraz sonra yeniden dene.',
      surum: Date.now(),
    }
  } catch (e) {
    return hata(e, siz)
  }
}

/** Doğrulayıcı uygulama kurulumu (önerilen; oturum açıkken, her rol). */
export async function hesapKurulumEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  try {
    const payload = await payloadAl()
    const kodlar = await kurulumuTamamla(payload, Number(k.id), metin(f, 'kod'))
    // Kurulumu yapılan cihaz tanınır; kişi hemen yeniden kod girmek zorunda kalmaz
    await cihaziHatirla(payload, Number(k.id), (await cihazAnahtari(true))!, (await headers()).get('user-agent'))
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
    return hata(e, k.rol !== 'aday')
  }
  redirect('/hesap-guvenligi?sonuc=kapatildi')
}

/** Tek bir cihazı (`cihaz` boşsa hepsini) unutur. */
export async function cihazUnutEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  const cihaz = metin(f, 'cihaz')
  try {
    await cihazlariUnut(await payloadAl(), k as never, cihaz || undefined)
  } catch (e) {
    return hata(e, k.rol !== 'aday')
  }
  redirect(`/hesap-guvenligi?sonuc=${cihaz ? 'cihaz-unutuldu' : 'cihazlar-unutuldu'}`)
}

/** Yönetici A.Ş. veya firmanın tam yetkilisi bir kişinin doğrulamasını sıfırlar. Sonuç sayfa düzeyinde gösterilir. */
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
