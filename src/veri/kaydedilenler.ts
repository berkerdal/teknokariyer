/** Kaydet düğmelerinin bağlamı: aday için kayıtlı ilanlar, ziyaretçi için giriş adresi, diğer roller için düğme yok. */
import { adayMi } from '@/erisim'
import type { KaydetBaglami } from '@/arayuz/KaydetDugmesi'
import { kaydedilenIlanIdleri } from '@/servisler/kaydedilenler'
import { oturum, payloadAl } from './payload'

export async function kaydetmeBaglami(): Promise<(ilanId: number, donus: string) => KaydetBaglami | null> {
  const k = await oturum()
  if (!k) return (_, donus) => ({ girisAdresi: `/giris?donus=${encodeURIComponent(donus)}` })
  if (!adayMi(k)) return () => null
  const kayitlar = await kaydedilenIlanIdleri(await payloadAl(), k)
  return (ilanId) => ({ kayitli: kayitlar.has(ilanId) })
}
