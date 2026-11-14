/**
 * Zamanlanmış işler (Worker `scheduled` işleyicisi veya Yönetici A.Ş.'nin elle çalıştırması).
 * Her iş tekrar çalıştırılabilir: aynı hatırlatma iki kez gitmez, kapanmış ilan yeniden kapanmaz.
 *
 * - Süresi dolan ilanların kapanması (talimatlar 1: ölü ilan kalmaz)
 * - Davet hatırlatmaları: 3., 7., 14. gün (talimatlar 0.3, 6)
 * - Profil tamamlama hatırlatmaları: devralındıktan sonra 3., 7., 14. gün
 */
import type { Payload } from 'payload'
import { SON_HATIRLATMA_UZATMA_GUN, siradakiHatirlatma } from '@/alan/hatirlatma'
import { trGunFarki } from '@/alan/tarih'
import { profilHatirlatmaEpostasi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { davetHatirlat } from './ekip'
import { suresiDolanlariKapat } from './ilanIslemleri'
import { istekOlustur, kimlik } from './ortak'

export const PROFIL_HATIRLATMA_ISLEMI = 'Profil tamamlama hatırlatması gönderildi'

export interface ZamanliSonuc {
  kapananIlan: number
  davetHatirlatma: number
  profilHatirlatma: number
  hatalar: string[]
}

async function davetHatirlatmalari(payload: Payload, simdi: Date, hatalar: string[]): Promise<number> {
  const { docs } = await payload.find({ collection: 'davetler', where: { kullanildi: { exists: false } }, limit: 2000, pagination: false, depth: 0, overrideAccess: true })
  let n = 0
  for (const d of docs) {
    const gun = siradakiHatirlatma(trGunFarki(new Date(d.createdAt), simdi), (d.hatirlatmalar ?? []).map((h) => h.gun ?? 0))
    if (gun === null) continue
    try {
      if (await davetHatirlat(payload, d.id, gun, gun === 14, SON_HATIRLATMA_UZATMA_GUN, simdi)) n++
    } catch (e) {
      hatalar.push(`Davet ${d.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return n
}

async function profilHatirlatmalari(payload: Payload, simdi: Date, hatalar: string[]): Promise<number> {
  const { docs: firmalar } = await payload.find({ collection: 'firmalar', where: { and: [{ asama: { equals: 'devralindi' } }, { yayinaHazir: { not_equals: true } }] }, limit: 2000, pagination: false, depth: 0, overrideAccess: true })
  if (!firmalar.length) return 0
  const ids = firmalar.map((f) => f.id)
  const [davetler, kayitlar] = await Promise.all([
    payload.find({ collection: 'davetler', where: { and: [{ firma: { in: ids } }, { kullanildi: { exists: true } }] }, select: { firma: true, kullanildi: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: PROFIL_HATIRLATMA_ISLEMI } }, { kayitId: { in: ids.map(String) } }] }, select: { kayitId: true, ayrinti: true }, limit: 10000, pagination: false, depth: 0, overrideAccess: true }),
  ])
  const req = await istekOlustur(payload, null)
  let n = 0
  for (const f of firmalar) {
    const devralma = davetler.docs.filter((d) => kimlik(d.firma) === f.id).map((d) => d.kullanildi!).sort()[0]
    if (!devralma) continue
    const gonderilen = kayitlar.docs.filter((k) => k.kayitId === String(f.id)).map((k) => Number((k.ayrinti as { gun?: number } | null)?.gun ?? 0))
    const gun = siradakiHatirlatma(trGunFarki(new Date(devralma), simdi), gonderilen)
    if (gun === null) continue
    try {
      const eksikler = [!f.logo && 'logo', !f.kisaTanitim?.trim() && 'kısa tanıtım', !f.sektor && 'sektör'].filter((x): x is string => Boolean(x))
      const { docs: yoneticiler } = await payload.find({
        collection: 'kullanicilar',
        where: { and: [{ firma: { equals: f.id } }, { firmaYetkisi: { equals: 'yonetici' } }, { pasif: { not_equals: true } }] },
        select: { ad: true, email: true },
        limit: 20,
        depth: 0,
        overrideAccess: true,
      })
      for (const u of yoneticiler) {
        const e = profilHatirlatmaEpostasi({ ad: u.ad, firma: f.kisaAd, eksikler, son: gun === 14 })
        await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
      }
      await islemKaydet(req, { islem: PROFIL_HATIRLATMA_ISLEMI, tur: 'kurulum', kayitTuru: 'firmalar', kayitId: f.id, ayrinti: { gun, alici: yoneticiler.length } })
      n++
    } catch (e) {
      hatalar.push(`Firma ${f.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return n
}

/** Hatırlatma e-postaları yalnızca Türkiye saatiyle 09.00–19.00 arasında gider (gece yarısı çalışan iş e-posta göndermez). */
export const mesaiSaatiMi = (simdi: Date) => {
  const saat = (simdi.getUTCHours() + 3) % 24
  return saat >= 9 && saat < 19
}

/** Bütün zamanlanmış işleri sırayla çalıştırır. Bir işin hatası diğerlerini durdurmaz. */
export async function zamanliIsleriCalistir(payload: Payload, simdi = new Date(), hatirlatmalar = mesaiSaatiMi(simdi)): Promise<ZamanliSonuc> {
  const hatalar: string[] = []
  const guvenli = async (ad: string, is: () => Promise<number>) => {
    try {
      return await is()
    } catch (e) {
      hatalar.push(`${ad}: ${e instanceof Error ? e.message : String(e)}`)
      return 0
    }
  }
  const kapananIlan = await guvenli('Süre dolumu', () => suresiDolanlariKapat(payload, simdi))
  const davetHatirlatma = hatirlatmalar ? await guvenli('Davet hatırlatmaları', () => davetHatirlatmalari(payload, simdi, hatalar)) : 0
  const profilHatirlatma = hatirlatmalar ? await guvenli('Profil hatırlatmaları', () => profilHatirlatmalari(payload, simdi, hatalar)) : 0
  const sonuc = { kapananIlan, davetHatirlatma, profilHatirlatma, hatalar }
  await islemKaydet(await istekOlustur(payload, null), { islem: 'Zamanlanmış işler çalıştı', tur: 'ayarlar', ayrinti: sonuc }).catch((): undefined => undefined)
  return sonuc
}
