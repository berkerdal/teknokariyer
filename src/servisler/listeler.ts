/**
 * Seçim listeleri (taksonomi; talimatlar 8): beceri, pozisyon ailesi, sektör, üniversite, bölüm, dil.
 * Filtre ve eşleştirme bu listelere dayanır. Öğe silinmez; “seçilemez” yapılır (ilanlarda ve profillerde kalan
 * bağlantılar bozulmasın). Aynı şeyin ikinci yazımı eklenmez; eş anlamlı olarak tanımlanır.
 */
import type { Payload } from 'payload'
import { yoneticiMi } from '@/erisim'
import { benzerAdlar, mevcutlariAyir, talepOgeleri, TALEP_TUR_ADI } from '@/alan/talep'
import { normallestir } from '@/alan/metin'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export type ListeTuru = 'beceri' | 'pozisyon-ailesi' | 'sektor' | 'universite' | 'bolum' | 'dil'
export const LISTE_TURLERI: ListeTuru[] = ['beceri', 'pozisyon-ailesi', 'sektor', 'universite', 'bolum', 'dil']

function yetki(k: Kullanici) {
  if (!yoneticiMi(k)) throw new IslemHatasi('Listeleri yalnızca tam yetkili Yönetici A.Ş. kullanıcıları değiştirebilir.', 403)
}

async function turAdlari(payload: Payload, tur: ListeTuru) {
  const { docs } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: tur } }, select: { ad: true, esAnlamlilar: true }, limit: 20000, pagination: false, depth: 0, overrideAccess: true })
  return docs
}

export interface EklemeSonucu {
  eklenen: string[]
  zatenVar: string[]
  /** Aynı kökte (büyük olasılıkla aynı şey) olduğu için eklenmeyenler: öğe → listedeki ad */
  benzer: Array<{ ad: string; listede: string }>
}

/** Bir veya birden çok öğe ekler (her satıra bir öğe). Aynı köktekiler `yineDeEkle` olmadan eklenmez. */
export async function listeyeEkle(payload: Payload, k: Kullanici, tur: ListeTuru, metin: string, yineDeEkle = false): Promise<EklemeSonucu> {
  yetki(k)
  if (!LISTE_TURLERI.includes(tur)) throw new IslemHatasi('Liste türü anlaşılamadı.')
  const { ogeler, hata } = talepOgeleri(metin)
  if (hata) throw new FormHatasi({ ogeler: hata })
  const mevcut = await turAdlari(payload, tur)
  const tumAdlar = mevcut.flatMap((m) => [m.ad, ...(m.esAnlamlilar ?? []).map((e) => e.ad)])
  const { yeni, zatenVar } = mevcutlariAyir(ogeler, tumAdlar)
  const benzer: EklemeSonucu['benzer'] = []
  const eklenecek = yeni.filter((o) => {
    const b = benzerAdlar(o, mevcut.map((m) => m.ad)).find((x) => x.ayni)
    if (b && !yineDeEkle) benzer.push({ ad: o, listede: b.ad })
    return !b || yineDeEkle
  })
  const req = await istekOlustur(payload, k)
  for (const ad of eklenecek) await payload.create({ collection: 'taksonomiler', data: { tur, ad, aktif: true } as never, overrideAccess: true, req })
  if (eklenecek.length)
    await islemKaydet(req, { islem: `Listeye öğe eklendi (${TALEP_TUR_ADI[tur]?.tekil ?? tur})`, tur: 'ayarlar', kayitTuru: 'taksonomiler', ayrinti: { eklenen: eklenecek } })
  return { eklenen: eklenecek, zatenVar, benzer }
}

export interface OgeGuncelleme {
  ad: string
  esAnlamlilar: string[]
  aktif: boolean
}

export async function listeOgesiniGuncelle(payload: Payload, k: Kullanici, id: number, g: OgeGuncelleme) {
  yetki(k)
  const oge = await payload.findByID({ collection: 'taksonomiler', id, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!oge) throw new IslemHatasi('Öğe bulunamadı.', 404)
  const ad = g.ad.replace(/\s+/g, ' ').trim()
  if (ad.length < 2 || ad.length > 80) throw new FormHatasi({ ad: 'Adı 2 ile 80 karakter arasında yazın.' })
  // Tekrarlar atılır; ilk yazılan yazım korunur
  const es: string[] = []
  for (const e of g.esAnlamlilar.map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean))
    if (normallestir(e) !== normallestir(ad) && !es.some((x) => normallestir(x) === normallestir(e))) es.push(e)
  es.splice(20)
  const digerleri = (await turAdlari(payload, oge.tur as ListeTuru)).filter((m) => m.id !== id)
  const cakisan = (s: string) => digerleri.find((m) => [m.ad, ...(m.esAnlamlilar ?? []).map((e) => e.ad)].some((x) => normallestir(x) === normallestir(s)))
  const adCakisma = cakisan(ad)
  if (adCakisma) throw new FormHatasi({ ad: `“${ad}” listede “${adCakisma.ad}” olarak zaten var.` })
  for (const e of es) {
    const c = cakisan(e)
    if (c) throw new FormHatasi({ esAnlamlilar: `“${e}” başka bir öğede (“${c.ad}”) kullanılıyor. Bir yazım yalnızca bir öğeye ait olabilir.` })
  }
  const req = await istekOlustur(payload, k)
  const sonuc = await payload.update({ collection: 'taksonomiler', id, data: { ad, esAnlamlilar: es.map((e) => ({ ad: e })), aktif: g.aktif }, overrideAccess: true, req })
  await islemKaydet(req, {
    islem: 'Liste öğesi güncellendi',
    tur: 'ayarlar',
    kayitTuru: 'taksonomiler',
    kayitId: id,
    ayrinti: { once: { ad: oge.ad, aktif: oge.aktif }, sonra: { ad, aktif: g.aktif, esAnlamlilar: es } },
  })
  return sonuc
}
