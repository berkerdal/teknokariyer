'use server'
/**
 * Aday sunucu eylemleri: başvuru, geri çekme, CV, profil ve CV havuzu ayarları.
 * Kural mantığı servislerdedir; burada yalnızca form verisi okunur, oturum denetlenir ve sonuç arayüze döner.
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FormDurumu } from '@/arayuz/form'
import { CEFR, DENEYIM_SIRASI } from '@/alan/eslesme'
import { SINIFLAR } from '@/alan/basvuru'
import { adayMi } from '@/erisim'
import { basvur, geriCek } from '@/servisler/basvuru'
import { FormHatasi } from '@/servisler/hesap'
import { IslemHatasi, type Kullanici } from '@/servisler/ortak'
import {
  cvSil,
  cvYukle,
  gizlenenFirmalar,
  havuzaKatil,
  havuzGorunurlugu,
  havuzRizasiniGeriAl,
  kendiAdayKaydi,
  profilGuncelle,
  type ProfilGuncellemesi,
} from '@/servisler/profil'
import { oturum, payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '').trim()

async function aday(): Promise<Kullanici> {
  const k = await oturum()
  if (!k) throw new IslemHatasi('Oturumun kapanmış. Yeniden giriş yap.', 403)
  if (!adayMi(k)) throw new IslemHatasi('Bu işlem yalnızca aday hesabıyla yapılabilir.', 403)
  return k
}

function hataDurumu(e: unknown): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar }
  if (e instanceof IslemHatasi) return { genel: e.message }
  const m = (e as { data?: { errors?: Array<{ message?: string }> }; message?: string }) ?? {}
  console.error(e)
  return { genel: m.data?.errors?.[0]?.message ?? 'Beklenmeyen bir sorun oluştu. Biraz sonra yeniden dene.' }
}

/** Formdaki “eksik bilgi” alanlarından profil güncellemesi. Yalnızca formda sorulan eksikler okunur. */
function eksikGuncellemesi(f: FormData, eksikler: string[], mevcutDiller: NonNullable<ProfilGuncellemesi['diller']>) {
  const g: ProfilGuncellemesi = {}
  const hatalar: Record<string, string> = {}
  for (const e of eksikler) {
    if (e === 'okul') Number(metin(f, 'okul')) ? (g.okul = Number(metin(f, 'okul'))) : (hatalar.okul = 'Okulunu seç.')
    if (e === 'bolum') Number(metin(f, 'bolum')) ? (g.bolum = Number(metin(f, 'bolum'))) : (hatalar.bolum = 'Bölümünü seç.')
    if (e === 'deneyim') {
      const d = metin(f, 'deneyim')
      if ((DENEYIM_SIRASI as readonly string[]).includes(d)) g.deneyimSeviyesi = d as never
      else hatalar.deneyim = 'Deneyim düzeyini seç.'
    }
    if (e === 'sinif') {
      const s = metin(f, 'sinif')
      if ((SINIFLAR as readonly string[]).includes(s)) g.sinif = s
      else hatalar.sinif = 'Sınıfını seç.'
    }
    if (e === 'mezuniyet') {
      const ay = Number(metin(f, 'mezuniyetAy')), yil = Number(metin(f, 'mezuniyetYil'))
      if (ay >= 1 && ay <= 12 && yil >= 1970 && yil <= 2040) g.mezuniyet = new Date(Date.UTC(yil, ay - 1, 15, 9)).toISOString()
      else hatalar.mezuniyet = 'Mezuniyet ayını ve yılını seç.'
    }
    if (e.startsWith('dil:')) {
      const id = Number(e.slice(4))
      const s = metin(f, `dil-${id}`)
      if ((CEFR as readonly string[]).includes(s)) g.diller = [...(g.diller ?? mevcutDiller), { dil: id, seviye: s as never }]
      else hatalar[`dil-${id}`] = 'Dil seviyeni seç.'
    }
  }
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  return g
}

export type BasvuruDurumu = FormDurumu

export async function basvurEylemi(_: BasvuruDurumu, f: FormData): Promise<BasvuruDurumu> {
  let hedef: string
  try {
    const k = await aday()
    const payload = await payloadAl()
    const ilanId = Number(metin(f, 'ilan'))
    const a = await kendiAdayKaydi(payload, k)

    // 1. Bu ilanın gerektirdiği eksikler (sorulduysa) profile kaydedilir.
    const eksikler = metin(f, 'eksikler').split(',').filter(Boolean)
    if (eksikler.length) {
      const mevcut = (a.diller ?? []).map((d) => ({ dil: typeof d.dil === 'object' ? d.dil.id : d.dil, seviye: d.seviye }))
      await profilGuncelle(payload, k, eksikGuncellemesi(f, eksikler, mevcut))
    }

    // 2. Yeni CV seçildiyse önce yüklenir.
    let cvId = Number(metin(f, 'cv')) || undefined
    const dosya = f.get('cvDosya')
    if (dosya instanceof File && dosya.size > 0) {
      const y = await cvYukle(payload, k, { ad: metin(f, 'cvAd'), dosya: { veri: new Uint8Array(await dosya.arrayBuffer()), boyut: dosya.size } })
      cvId = y.id
    }

    // 3. Ön eleme cevapları
    const cevaplar: Record<string, string> = {}
    for (const [anahtar, deger] of f.entries()) if (anahtar.startsWith('soru:')) cevaplar[anahtar.slice(5)] = String(deger).slice(0, 1000)

    const havuz = Boolean(f.get('havuz'))
    const b = await basvur(payload, k, {
      ilanId,
      cvDosyaId: cvId,
      onYazi: metin(f, 'onYazi'),
      cevaplar,
      aydinlatmaOnay: Boolean(f.get('aydinlatma')),
      havuzaKatil: havuz,
    })
    revalidatePath('/hesabim')
    hedef = `/basvuru-tamam?b=${b.id}${havuz ? '&havuz=1' : ''}`
  } catch (e) {
    if (e instanceof IslemHatasi && /aydınlatma/.test(e.message)) return { hatalar: { aydinlatma: 'Başvurmak için aydınlatma metnini okuduğunu onayla.' } }
    return hataDurumu(e)
  }
  // Başarı ekranı ayrı adreste: sayfa yenilense de doğru görünür.
  redirect(hedef)
}

export async function geriCekEylemi(f: FormData) {
  const k = await aday()
  await geriCek(await payloadAl(), k, Number(metin(f, 'basvuru')))
  revalidatePath('/hesabim')
}

export async function cvYukleEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  try {
    const k = await aday()
    const dosya = f.get('cvDosya')
    if (!(dosya instanceof File) || !dosya.size) throw new FormHatasi({ cvDosya: 'Bir PDF dosyası seç.' })
    await cvYukle(await payloadAl(), k, { ad: metin(f, 'cvAd'), dosya: { veri: new Uint8Array(await dosya.arrayBuffer()), boyut: dosya.size } })
    revalidatePath('/hesabim/profil')
    return { tamam: 'CV yüklendi.' }
  } catch (e) {
    return hataDurumu(e)
  }
}

export async function cvSilEylemi(f: FormData) {
  const k = await aday()
  await cvSil(await payloadAl(), k, Number(metin(f, 'dosya')))
  revalidatePath('/hesabim/profil')
}

/** Profil formu: bölüm bölüm kaydedilir (formdaki `bolumAdi` hangi alanların gönderildiğini söyler). */
export async function profilKaydetEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  try {
    const k = await aday()
    const payload = await payloadAl()
    const bolum = metin(f, 'bolumAdi')
    const g: ProfilGuncellemesi = {}
    const hatalar: Record<string, string> = {}
    if (bolum === 'kimlik') {
      const tel = metin(f, 'telefon')
      if (tel && !/^[+\d][\d\s()-]{6,19}$/.test(tel)) hatalar.telefon = 'Telefonu 0 5xx xxx xx xx biçiminde yaz.'
      g.telefon = tel || null
      const c = metin(f, 'cinsiyet')
      g.cinsiyet = (['kadin', 'erkek', 'belirtmek-istemiyor'].includes(c) ? c : null) as never
      const t = metin(f, 'tanitim')
      if (t.length > 500) hatalar.tanitim = 'Kısa tanıtım en fazla 500 karakter olabilir.'
      g.tanitim = t || null
    }
    if (bolum === 'egitim') {
      g.okul = Number(metin(f, 'okul')) || null
      g.bolum = Number(metin(f, 'bolum')) || null
      const s = metin(f, 'sinif')
      g.sinif = (SINIFLAR as readonly string[]).includes(s) ? s : null
      const ay = Number(metin(f, 'mezuniyetAy')), yil = Number(metin(f, 'mezuniyetYil'))
      g.mezuniyet = ay && yil ? new Date(Date.UTC(yil, ay - 1, 15, 9)).toISOString() : null
      const gano = metin(f, 'gano').replace(',', '.')
      if (gano && !(Number(gano) >= 0 && Number(gano) <= 4)) hatalar.gano = 'GANO 0 ile 4 arasında olmalı (ör. 3,12).'
      g.gano = gano ? Number(gano) : null
      const d = metin(f, 'deneyim')
      g.deneyimSeviyesi = ((DENEYIM_SIRASI as readonly string[]).includes(d) ? d : null) as never
    }
    if (bolum === 'beceriler') {
      g.beceriler = f
        .getAll('beceri')
        .map((x) => String(x).split(':'))
        .filter(([id, sev]) => Number(id) && ['baslangic', 'orta', 'iyi', 'uzman'].includes(sev!))
        .slice(0, 30)
        .map(([id, sev]) => ({ beceri: Number(id), seviye: sev as never }))
      g.diller = f
        .getAll('dil')
        .map((x) => String(x).split(':'))
        .filter(([id, sev]) => Number(id) && (CEFR as readonly string[]).includes(sev!))
        .slice(0, 10)
        .map(([id, sev]) => ({ dil: Number(id), seviye: sev as never }))
    }
    if (bolum === 'tercihler') {
      g.tercihler = {
        turler: f.getAll('tur').map(String).filter((x) => ['is', 'staj'].includes(x)) as never,
        modeller: f.getAll('model').map(String).filter((x) => ['ofiste', 'hibrit', 'uzaktan'].includes(x)) as never,
        sehir: metin(f, 'sehir').slice(0, 60) || null,
        tasinmayaAcik: Boolean(f.get('tasinmayaAcik')),
        baslama: metin(f, 'baslama').slice(0, 60) || null,
        ucretBeklentisi: Number(metin(f, 'ucretBeklentisi').replace(/\D/g, '')) || null,
      }
    }
    if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
    await profilGuncelle(payload, k, g)
    revalidatePath('/hesabim/profil')
    return { tamam: 'Kaydedildi.' }
  } catch (e) {
    return hataDurumu(e)
  }
}

export async function havuzEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  try {
    const k = await aday()
    const payload = await payloadAl()
    const islem = metin(f, 'islem')
    if (islem === 'katil') {
      if (!f.get('riza')) throw new FormHatasi({ riza: 'Havuza katılmak için açık rıza metnini okuyup onayla.' })
      await havuzaKatil(payload, k, metin(f, 'gorunurluk') === 'aktif' ? 'aktif' : 'acik')
    } else if (islem === 'gorunurluk') await havuzGorunurlugu(payload, k, metin(f, 'gorunurluk') as never)
    else if (islem === 'geri-al') await havuzRizasiniGeriAl(payload, k)
    else if (islem === 'gizle') await gizlenenFirmalar(payload, k, f.getAll('firma').map(Number).filter(Boolean))
    revalidatePath('/hesabim/havuz')
    return { tamam: islem === 'geri-al' ? 'Havuzdan çıktın.' : 'Kaydedildi.' }
  } catch (e) {
    return hataDurumu(e)
  }
}
