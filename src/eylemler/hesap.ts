'use server'
/**
 * Hesap sunucu eylemleri. Yalnızca hesap servisini çağırır; kural mantığı servistedir.
 */
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { FormHatasi, adayKaydi, girisYap, sifreSifirlamaIste, sifreYenile, type GirisSonucu } from '@/servisler/hesap'
import { bekleyenGirisPaketle, cihazlariTemizle, epostaKoduGonder, girisDogrulamaYontemi } from '@/servisler/ikiAdim'
import { epostaMaskele } from '@/alan/ikiAdim'
import { ortam } from '@/altyapi/eposta'
import { IslemHatasi } from '@/servisler/ortak'
import { bekleyenGirisYaz, cihazAnahtari, guvenliDonus, oturumAc, oturumKapat, rolAnaSayfasi } from '@/veri/cerez'
import { payloadAl } from '@/veri/payload'
import { insanDenetle, ipSiniri, kaynakSiniri } from '@/veri/koruma'
import { davetiKabulEt } from '@/servisler/ekip'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hataDurumu(e: unknown, degerler?: Record<string, string>): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden dene.', degerler }
}

/**
 * Şifre doğrulandıktan sonra (K33): bu cihaz tanınıyorsa veya ikinci adım gerekmiyorsa oturumu açar. Gerekiyorsa oturum
 * anahtarını şifreli, kısa ömürlü “bekleyen giriş” çerezine koyar; e-posta yönteminde kodu gönderir ve ikinci adım
 * sayfasına yönlendirir. Dönülecek adresi verir.
 */
async function girisiSurdur(s: GirisSonucu, donus: string, eposta: string): Promise<string> {
  const payload = await payloadAl()
  const yontem = await girisDogrulamaYontemi(payload, s.kullaniciId, await cihazAnahtari(true))
  if (yontem === 'yok') {
    await oturumAc(s.token, s.bitis)
    return donus
  }
  let testKodu: string | undefined
  let oncekiKod = false
  if (yontem === 'eposta') {
    const r = await epostaKoduGonder(payload, s.kullaniciId, new Date(), true)
    oncekiKod = Boolean(r.onceki)
    // E-postalar yayın dışı ortamda dışarı çıkmaz; kod yalnızca orada ekranda gösterilir
    if (ortam() !== 'yayin') testKodu = r.kod ?? undefined
  }
  const { paket, son } = await bekleyenGirisPaketle({
    kullaniciId: s.kullaniciId,
    token: s.token,
    bitis: s.bitis.toISOString(),
    rol: s.rol,
    donus,
    yontem,
    adres: yontem === 'eposta' ? epostaMaskele(eposta) : undefined,
    testKodu,
    oncekiKod,
  })
  await bekleyenGirisYaz(paket, son)
  return '/giris/ikinci-adim'
}

export async function girisEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const eposta = metin(f, 'eposta')
  let hedef: string
  try {
    await ipSiniri('giris', f.get('firma') === '1')
    await insanDenetle(f, f.get('firma') === '1')
    const s = await girisYap(await payloadAl(), eposta, metin(f, 'sifre'))
    hedef = await girisiSurdur(s, guvenliDonus(f.get('donus'), rolAnaSayfasi(s.rol)), eposta)
  } catch (e) {
    return hataDurumu(e, { eposta })
  }
  redirect(hedef)
}

export async function kayitEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const degerler = { ad: metin(f, 'ad'), eposta: metin(f, 'eposta'), ticariIleti: f.get('ticariIleti') ? '1' : '' }
  try {
    await ipSiniri('kayit')
    await insanDenetle(f)
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
    await ipSiniri('sifre-sifirlama')
    await insanDenetle(f)
    // Aynı adrese bağlantı yağdırılmasın: adres başına da sınır
    await kaynakSiniri('sifre-sifirlama', `eposta:${eposta.trim().toLowerCase()}`)
    await sifreSifirlamaIste(await payloadAl(), eposta)
  } catch (e) {
    return hataDurumu(e, { eposta })
  }
  return { tamam: eposta.trim().toLowerCase() }
}

export async function sifreYenileEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  let hedef: string
  try {
    await ipSiniri('sifre-sifirlama')
    const payload = await payloadAl()
    const s = await sifreYenile(payload, metin(f, 'anahtar'), metin(f, 'sifre'))
    // Şifre yenilenince tanınan cihazlar unutulur; bu cihaz da yeniden doğrulanır
    await cihazlariTemizle(payload, s.kullaniciId)
    const u = await payload.findByID({ collection: 'kullanicilar', id: s.kullaniciId, depth: 0, overrideAccess: true })
    hedef = await girisiSurdur(s, rolAnaSayfasi(s.rol), u.email)
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
    await ipSiniri('davet', true)
    const payload = await payloadAl()
    const u = await davetiKabulEt(payload, metin(f, 'anahtar'), { ...degerler, sifre: metin(f, 'sifre') })
    const s = await girisYap(payload, u.email, metin(f, 'sifre'))
    // Firma hesabında yeni cihaz doğrulaması zorunlu: davet e-postasına kod gider
    hedef = await girisiSurdur(s, '/firma-paneli?hosgeldiniz=1', u.email)
  } catch (e) {
    if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
    if (e instanceof IslemHatasi) return { genel: e.message, degerler }
    console.error(e)
    return { genel: 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden deneyin.', degerler }
  }
  redirect(hedef)
}
