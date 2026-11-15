'use server'
/**
 * Hesap sunucu eylemleri. Yalnızca hesap servisini çağırır; kural mantığı servistedir.
 */
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { FormHatasi, adayKaydi, girisYap, sifreSifirlamaIste, sifreYenile, type GirisSonucu } from '@/servisler/hesap'
import { bekleyenGirisPaketle, ikiAdimDurumu } from '@/servisler/ikiAdim'
import { IslemHatasi } from '@/servisler/ortak'
import { bekleyenGirisYaz, guvenliDonus, oturumAc, oturumKapat, rolAnaSayfasi } from '@/veri/cerez'
import { payloadAl } from '@/veri/payload'
import { davetiKabulEt } from '@/servisler/ekip'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hataDurumu(e: unknown, degerler?: Record<string, string>): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden dene.', degerler }
}

/**
 * Şifre doğrulandıktan sonra: ikinci adım gerekmiyorsa oturumu açar. Gerekiyorsa oturum anahtarını şifreli, kısa ömürlü
 * “bekleyen giriş” çerezine koyar ve ikinci adım (veya ilk kurulum) sayfasına yönlendirir. Dönülecek adresi verir.
 */
async function girisiSurdur(s: GirisSonucu, donus: string): Promise<string> {
  const payload = await payloadAl()
  const d = await ikiAdimDurumu(payload, s.kullaniciId)
  if (!d.gerekli) {
    await oturumAc(s.token, s.bitis)
    return donus
  }
  const { paket, son } = await bekleyenGirisPaketle({ kullaniciId: s.kullaniciId, token: s.token, bitis: s.bitis.toISOString(), rol: s.rol, donus })
  await bekleyenGirisYaz(paket, son)
  return d.kurulu ? '/giris/ikinci-adim' : '/giris/iki-adim-kurulum'
}

export async function girisEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const eposta = metin(f, 'eposta')
  let hedef: string
  try {
    const s = await girisYap(await payloadAl(), eposta, metin(f, 'sifre'))
    hedef = await girisiSurdur(s, guvenliDonus(f.get('donus'), rolAnaSayfasi(s.rol)))
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
    hedef = await girisiSurdur(s, rolAnaSayfasi(s.rol))
  } catch (e) {
    return hataDurumu(e)
  }
  redirect(hedef)
}

export async function cikisEylemi() {
  await oturumKapat()
  redirect('/')
}

/** Ekip davetini kabul eder, oturum açar ve firma paneline götürür. */
export async function davetKabulEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const degerler = { ad: metin(f, 'ad'), unvan: metin(f, 'unvan') }
  let hedef: string
  try {
    const payload = await payloadAl()
    const u = await davetiKabulEt(payload, metin(f, 'anahtar'), { ...degerler, sifre: metin(f, 'sifre') })
    const s = await girisYap(payload, u.email, metin(f, 'sifre'))
    // Firma hesabında ikinci adım zorunlu: ilk girişte kurulum sayfasına gider
    hedef = await girisiSurdur(s, '/firma-paneli?hosgeldiniz=1')
  } catch (e) {
    if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
    if (e instanceof IslemHatasi) return { genel: e.message, degerler }
    console.error(e)
    return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden deneyin.', degerler }
  }
  redirect(hedef)
}
