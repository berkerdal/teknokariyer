'use server'
/** KVKK başvuruları ve hesap silme eylemleri. Yalnızca servisleri çağırır; yetki denetimi servistedir. */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { adayHesabiniSil } from '@/servisler/hesapSilme'
import { kvkkBasvurusuYap, kvkkHesabiSil, kvkkIncelemeyeAl, kvkkNotEkle, kvkkSonuclandir, kvkkTalebiKaydet } from '@/servisler/kvkk'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { adayOturumu } from '@/veri/aday'
import { oturumKapat } from '@/veri/cerez'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, f?: FormData, siz = true): FormDurumu {
  const degerler = f ? Object.fromEntries([...f.entries()].filter(([a, v]) => typeof v === 'string' && a !== 'sifre').map(([a, v]) => [a, String(v)])) : undefined
  // surum: form her sonuçta yeniden kurulur (React eylemden sonra formu sıfırlar; seçimler değerlerden geri gelir)
  const surum = Date.now()
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler, surum }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler, surum }
  console.error(e)
  return { genel: siz ? 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.' : 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden dene.', degerler, surum }
}

/* ---------- Aday ---------- */

export async function kvkkBasvuruEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await adayOturumu('/hesabim/hesap')
  let eposta = true
  try {
    eposta = (await kvkkBasvurusuYap(await payloadAl(), k, { tur: metin(f, 'tur'), aciklama: metin(f, 'aciklama') })).eposta
  } catch (e) {
    return hata(e, f, false)
  }
  revalidatePath('/hesabim/hesap')
  redirect(`/hesabim/hesap?kvkk=${eposta ? 'alindi' : 'alindi-epostasiz'}#kvkk`)
}

/** Aday kendi hesabını siler (K27). Şifre yeniden sorulur; onay kutusu işaretlenmeden silinmez. */
export async function hesabiSilEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await adayOturumu('/hesabim/hesap')
  const hatalar: Record<string, string> = {}
  if (!metin(f, 'sifre')) hatalar.sifre = 'Hesabının sana ait olduğunu doğrulamak için şifreni yaz.'
  if (f.get('onay') !== 'on') hatalar.onay = 'Silinen bilgilerin geri getirilemeyeceğini okuduğunu işaretle.'
  if (Object.keys(hatalar).length) return { hatalar, surum: Date.now() }
  const payload = await payloadAl()
  try {
    await payload.login({ collection: 'kullanicilar', data: { email: k.email, password: metin(f, 'sifre') }, overrideAccess: true })
  } catch (e) {
    if ((e as Error)?.name === 'LockedAuth') return { genel: 'Çok sayıda hatalı deneme yapıldı. Hesap 15 dakika kilitlendi; sonra yeniden dene.', surum: Date.now() }
    return { hatalar: { sifre: 'Şifre hatalı. Şifreni hatırlamıyorsan önce “Şifremi değiştir” bağlantısıyla yenile.' }, surum: Date.now() }
  }
  try {
    await adayHesabiniSil(payload, k, Number(k.id))
  } catch (e) {
    return hata(e, undefined, false)
  }
  await oturumKapat()
  redirect('/hesap-silindi')
}

/* ---------- Yönetici A.Ş. ---------- */

export async function kvkkKayitEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  let hedef: string
  try {
    const r = await kvkkTalebiKaydet(await payloadAl(), k, {
      tur: metin(f, 'tur'),
      aciklama: metin(f, 'aciklama'),
      kanal: metin(f, 'kanal'),
      ad: metin(f, 'ad'),
      eposta: metin(f, 'eposta'),
      basvuruTarihi: metin(f, 'basvuruTarihi'),
      kimlik: metin(f, 'kimlik'),
      alindiBildir: f.get('alindiBildir') === 'on',
    })
    hedef = `/yonetim/kvkk/${r.talep.id}?sonuc=kaydedildi${r.hesabaBaglandi ? '&hesap=1' : ''}${r.bildirildi === false ? '&eposta=0' : ''}`
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(hedef)
}

export async function kvkkIslemEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const id = Number(metin(f, 'talep'))
  const islem = metin(f, 'islem')
  const payload = await payloadAl()
  let sonuc = islem
  try {
    if (islem === 'incele') await kvkkIncelemeyeAl(payload, k, id, metin(f, 'kimlik') || undefined)
    else if (islem === 'not') await kvkkNotEkle(payload, k, id, metin(f, 'not'))
    else if (islem === 'sil') await kvkkHesabiSil(payload, k, id)
    else if (islem === 'sonuc') {
      const r = await kvkkSonuclandir(payload, k, id, { sonuc: metin(f, 'sonuc'), cevap: metin(f, 'cevap') })
      sonuc = r.eposta ? 'sonuclandi' : 'sonuclandi-epostasiz'
    } else throw new IslemHatasi('Bilinmeyen işlem.')
  } catch (e) {
    return hata(e, f)
  }
  revalidatePath('/yonetim', 'layout')
  redirect(`/yonetim/kvkk/${id}?sonuc=${sonuc}`)
}
