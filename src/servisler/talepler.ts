/**
 * Talepler: listede olmayan taksonomi öğesinin Yönetici A.Ş.’den istenmesi. Onay kuralı koleksiyon kancasındadır
 * (src/koleksiyonlar/Talepler.ts); burada talebin oluşturulması ve sonuçlandırılması var.
 */
import type { Payload } from 'payload'
import { TALEP_EN_FAZLA_BEKLEYEN, TALEP_TUR_ADI, mevcutlariAyir, talepOgeleri } from '@/alan/talep'
import { adayMi, firmaKullanicisiMi, moderasyonYapabilirMi } from '@/erisim'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export type TalepTuru = 'beceri' | 'pozisyon-ailesi' | 'bolum' | 'dil' | 'universite' | 'sektor'

export interface TalepGirdisi {
  tur: TalepTuru
  ogeler: string
  aciklama?: string
  kaynak?: string
}

export async function taksonomiTalebiOlustur(payload: Payload, k: Kullanici, g: TalepGirdisi) {
  if (!firmaKullanicisiMi(k) && !adayMi(k) && !moderasyonYapabilirMi(k)) throw new IslemHatasi('Talep göndermek için giriş yapın.', 403)
  if (!(g.tur in TALEP_TUR_ADI)) throw new IslemHatasi('Talep türü anlaşılamadı. Sayfayı yenileyip yeniden deneyin.')
  const { ogeler, hata } = talepOgeleri(g.ogeler)
  if (hata) throw new FormHatasi({ ogeler: hata })
  const { docs } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: g.tur } }, select: { ad: true }, limit: 10000, pagination: false, depth: 0, overrideAccess: true })
  const { yeni, zatenVar } = mevcutlariAyir(ogeler, docs.map((d) => d.ad))
  if (!yeni.length)
    throw new FormHatasi({ ogeler: `${zatenVar.join(', ')} zaten listede. Alana yazmaya başladığınızda önerilerde görünür; oradan seçebilirsiniz.` })
  const bekleyen = await payload.count({ collection: 'talepler', where: { and: [{ talepEden: { equals: k.id } }, { durum: { equals: 'bekliyor' } }] }, overrideAccess: true })
  if (bekleyen.totalDocs >= TALEP_EN_FAZLA_BEKLEYEN)
    throw new IslemHatasi('Sonuçlanmamış çok sayıda talebiniz var. Yönetici A.Ş. bunları inceledikten sonra yeni talep gönderebilirsiniz.', 409)
  const req = await istekOlustur(payload, k)
  const talep = await payload.create({
    collection: 'talepler',
    data: { taksonomiTuru: g.tur, oneriler: yeni.map((ad) => ({ ad })), aciklama: g.aciklama?.trim().slice(0, 500) || undefined, kaynak: g.kaynak?.slice(0, 120) } as never,
    overrideAccess: false,
    user: k,
    req,
  })
  return { talep, yeni, zatenVar }
}

/** Yönetici A.Ş.: talebi onaylar (kabul edilen öğeler listeye eklenir) veya gerekçeyle reddeder. */
export async function talebiSonuclandir(
  payload: Payload,
  k: Kullanici,
  talepId: number,
  karar: { onay: boolean; kabulEdilenler?: string[]; not?: string },
) {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Talepleri yalnızca Yönetici A.Ş. sonuçlandırır.', 403)
  const t = await payload.findByID({ collection: 'talepler', id: talepId, depth: 0, overrideAccess: true })
  if (t.durum !== 'bekliyor') throw new IslemHatasi('Bu talep daha önce sonuçlandırıldı.', 409)
  if (!karar.onay && !karar.not?.trim()) throw new FormHatasi({ not: 'Talep edene neden reddettiğinizi yazın.' })
  const kabul = karar.kabulEdilenler
  const oneriler = (t.oneriler ?? []).map((o) => ({ ad: o.ad, kabul: karar.onay && (!kabul || kabul.includes(o.ad)) }))
  const hepsi = oneriler.every((o) => o.kabul)
  const req = await istekOlustur(payload, k)
  return payload.update({
    collection: 'talepler',
    id: talepId,
    data: {
      oneriler,
      durum: !karar.onay ? 'reddedildi' : hepsi ? 'onaylandi' : 'kismen',
      sonucNotu: karar.not?.trim() || undefined,
      sonucTarihi: new Date().toISOString(),
      sonuclandiran: k.id,
    } as never,
    overrideAccess: true,
    req,
  })
}
