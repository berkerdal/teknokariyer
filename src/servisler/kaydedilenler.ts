/**
 * Kaydedilen ilanlar (talimatlar 5: “Kaydetme ve hatırlatma”; kullanıcı isteği 15.11.2026).
 * - Yalnızca aday kaydeder; yalnızca yayındaki ilan kaydedilir. Kaydetme ve çıkarma tekrarlanırsa sonuç değişmez.
 * - Kaydedilen ilan sonradan kapanırsa kayıt durur, listede “Başvuruya kapandı” olarak görünür.
 * - Son başvuruya 2 gün kala bir kez hatırlatma e-postası (adaya başvurduysa gitmez).
 */
import type { Payload } from 'payload'
import { adayMi } from '@/erisim'
import { kalanGun } from '@/alan/ilan'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { kaydedilenIlanHatirlatmaEpostasi } from '@/altyapi/epostaSablonlari'
import { parcaliBul } from '@/altyapi/parcali'
import { IslemHatasi, kimlik, type Kullanici } from './ortak'

export const KAYDETME_HATIRLATMA_GUN = 2
export const EN_COK_KAYIT = 200

function aday(k: Kullanici | null): Kullanici {
  if (!k || !adayMi(k)) throw new IslemHatasi('İlan kaydetmek için aday hesabıyla giriş yapmalısın.', 403)
  return k
}

export async function ilanKaydet(payload: Payload, k: Kullanici | null, ilanId: number): Promise<void> {
  const a = aday(k)
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true, disableErrors: true, select: { durum: true } })
  if (!ilan || ilan.durum !== 'yayinda') throw new IslemHatasi('Bu ilan artık yayında olmadığı için kaydedilemiyor.', 404)
  const where = { and: [{ kullanici: { equals: a.id } }, { ilan: { equals: ilanId } }] }
  if ((await payload.count({ collection: 'kaydedilen-ilanlar', where, overrideAccess: true })).totalDocs) return
  if ((await payload.count({ collection: 'kaydedilen-ilanlar', where: { kullanici: { equals: a.id } }, overrideAccess: true })).totalDocs >= EN_COK_KAYIT)
    throw new IslemHatasi(`En fazla ${EN_COK_KAYIT} ilan kaydedebilirsin. Yer açmak için kaydedilenlerden eski ilanları çıkar.`, 400)
  try {
    await payload.create({ collection: 'kaydedilen-ilanlar', data: { kullanici: a.id, ilan: ilanId }, overrideAccess: true })
  } catch (e) {
    // Aynı anda iki istek: benzersiz dizin ikinciyi reddeder; sonuç yine “kayıtlı”.
    if ((await payload.count({ collection: 'kaydedilen-ilanlar', where, overrideAccess: true })).totalDocs) return
    throw e
  }
}

export async function kaydiKaldir(payload: Payload, k: Kullanici | null, ilanId: number): Promise<void> {
  const a = aday(k)
  await payload.delete({ collection: 'kaydedilen-ilanlar', where: { and: [{ kullanici: { equals: a.id } }, { ilan: { equals: ilanId } }] }, overrideAccess: true })
}

/** Adayın kaydettiği ilanların kimlikleri (liste ve ilan sayfasındaki düğmelerin durumu için). */
export async function kaydedilenIlanIdleri(payload: Payload, k: Kullanici | null): Promise<Set<number>> {
  if (!k || !adayMi(k)) return new Set()
  const { docs } = await payload.find({ collection: 'kaydedilen-ilanlar', where: { kullanici: { equals: k.id } }, select: { ilan: true }, limit: EN_COK_KAYIT, pagination: false, depth: 0, overrideAccess: true })
  return new Set(docs.map((d) => kimlik(d.ilan)))
}

/**
 * Son başvuruya en fazla 2 gün kalan, hatırlatılmamış kayıtlar için e-posta (zamanlanmış iş, mesai saatinde).
 * Başvurulmuş ilan için hatırlatma gönderilmez ama işaretlenir (bir daha bakılmasın).
 */
export async function kaydedilenHatirlatmalari(payload: Payload, simdi: Date, hatalar: string[]): Promise<number> {
  const { docs } = await payload.find({ collection: 'kaydedilen-ilanlar', where: { hatirlatildi: { exists: false } }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })
  if (!docs.length) return 0
  const ilanIdleri = [...new Set(docs.map((d) => kimlik(d.ilan)))]
  const ilanlar = await parcaliBul(ilanIdleri, (p) =>
    payload.find({ collection: 'ilanlar', where: { and: [{ id: { in: p } }, { durum: { equals: 'yayinda' } }] }, select: { pozisyonAdi: true, sonBasvuru: true, firma: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true }),
  )
  const yaklasan = new Map(ilanlar.filter((i) => { const g = kalanGun(new Date(i.sonBasvuru), simdi); return g >= 0 && g <= KAYDETME_HATIRLATMA_GUN }).map((i) => [i.id, i]))
  const hedef = docs.filter((d) => yaklasan.has(kimlik(d.ilan)))
  if (!hedef.length) return 0
  const firmaIdleri = [...new Set([...yaklasan.values()].map((i) => kimlik(i.firma)))]
  const kullaniciIdleri = [...new Set(hedef.map((d) => kimlik(d.kullanici)))]
  const [firmalar, kullanicilar, basvurular] = await Promise.all([
    parcaliBul(firmaIdleri, (p) => payload.find({ collection: 'firmalar', where: { id: { in: p } }, select: { kisaAd: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })),
    parcaliBul(kullaniciIdleri, (p) => payload.find({ collection: 'kullanicilar', where: { id: { in: p } }, select: { ad: true, email: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })),
    parcaliBul(kullaniciIdleri, (p) =>
      payload.find({ collection: 'basvurular', where: { and: [{ adayKullanici: { in: p } }, { ilan: { in: [...yaklasan.keys()] } }] }, select: { adayKullanici: true, ilan: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true }),
    ),
  ])
  const basvurdu = new Set(basvurular.map((b) => `${kimlik(b.adayKullanici)}:${kimlik(b.ilan)}`))
  let n = 0
  for (const d of hedef) {
    const ilan = yaklasan.get(kimlik(d.ilan))!
    const u = kullanicilar.find((x) => x.id === kimlik(d.kullanici))
    try {
      if (u && !basvurdu.has(`${u.id}:${ilan.id}`)) {
        const e = kaydedilenIlanHatirlatmaEpostasi({
          ad: u.ad,
          pozisyonAdi: ilan.pozisyonAdi,
          firma: firmalar.find((f) => f.id === kimlik(ilan.firma))?.kisaAd ?? '',
          sonGun: tarihYaz(ilan.sonBasvuru, true),
          kalan: kalanGun(new Date(ilan.sonBasvuru), simdi),
          adres: ilanAdresi({ id: ilan.id, pozisyonAdi: ilan.pozisyonAdi }),
        })
        await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
        n++
      }
      await payload.update({ collection: 'kaydedilen-ilanlar', id: d.id, data: { hatirlatildi: simdi.toISOString() }, overrideAccess: true })
    } catch (e) {
      hatalar.push(`Kaydedilen ilan ${d.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return n
}
