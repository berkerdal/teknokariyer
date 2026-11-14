/**
 * Sistem ayarları (talimatlar 10). Panelde yalnızca gerçekten etkisi olan ayarlar değiştirilir; her değişiklik işlem
 * kaydına ve ayar sürüm geçmişine yazılır (global kancası).
 */
import type { Payload } from 'payload'
import { yoneticiMi } from '@/erisim'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export interface AyarGirdisi {
  onayliIlanSayisi: number
  enUzunSureGun: number
  hatirlatmaGunleri: number[]
  havuzRizaAy: number
}

const tamSayi = (n: number, en: number, cok: number) => Number.isInteger(n) && n >= en && n <= cok

export async function ayarlariGuncelle(payload: Payload, k: Kullanici, g: AyarGirdisi) {
  if (!yoneticiMi(k)) throw new IslemHatasi('Ayarları yalnızca tam yetkili Yönetici A.Ş. kullanıcıları değiştirebilir.', 403)
  const h: Record<string, string> = {}
  if (!tamSayi(g.onayliIlanSayisi, 0, 10)) h.onayliIlanSayisi = '0 ile 10 arasında bir sayı yazın. 0, ilanların hiç onaya gitmemesi demektir.'
  if (!tamSayi(g.enUzunSureGun, 7, 180)) h.enUzunSureGun = '7 ile 180 gün arasında bir sayı yazın.'
  const gunler = [...new Set(g.hatirlatmaGunleri)].sort((a, b) => a - b)
  if (!gunler.length || gunler.length > 5 || gunler.some((x) => !tamSayi(x, 1, 60)))
    h.hatirlatmaGunleri = 'En az bir, en fazla beş gün yazın; her biri 1 ile 60 arasında olsun. Örnek: 3, 7, 14'
  if (!tamSayi(g.havuzRizaAy, 1, 36)) h.havuzRizaAy = '1 ile 36 ay arasında bir sayı yazın.'
  if (Object.keys(h).length) throw new FormHatasi(h)
  const req = await istekOlustur(payload, k)
  const once = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
  return payload.updateGlobal({
    slug: 'ayarlar',
    data: {
      onayliIlanSayisi: g.onayliIlanSayisi,
      enUzunSureGun: g.enUzunSureGun,
      hatirlatmaGunleri: gunler.map((gun) => ({ gun })),
      saklama: { ...(once.saklama ?? {}), havuzRizaAy: g.havuzRizaAy },
    },
    overrideAccess: true,
    req,
  })
}
