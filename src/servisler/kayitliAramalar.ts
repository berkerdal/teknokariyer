/**
 * Kayıtlı aramalar (kurallar src/alan/kayitliArama.ts).
 * - Aday: ilan araması; “anlık” e-posta ilan yayına girdiği an (Ilanlar kancası → `yeniIlanBildirimleri`), “haftalık”
 *   özet zamanlanmış işte (`haftalikAramaBildirimleri`, mesai saatinde, son bildirimden 7 gün sonra).
 * - Firma: CV havuzu araması; haftalık e-postada yalnızca yeni uyan aday sayısı.
 * - Bir kişinin en fazla 10 araması olur; aynı arama ikinci kez kaydedilmez (sıklığı güncellenir).
 */
import type { Payload } from 'payload'
import type { Ilanlar, KayitliAramalar } from '@/payload-types'
import { adayMi, firmaYetkisiVarMi } from '@/erisim'
import { EN_FAZLA_ARAMA, HAFTALIK_EN_FAZLA_ILAN, haftalikZamaniMi, havuzSorgusu, ilanAramaOzeti, ilanAramayaUyarMi, ilanSorgusu, type AramaTuru, type Siklik } from '@/alan/kayitliArama'
import type { IlanOzeti, IlanTuru } from '@/alan/ilanFiltre'
import type { CalismaModeli, Deneyim } from '@/alan/eslesme'
import { suresiDolduMu } from '@/alan/ilan'
import { aramaAnlikEpostasi, aramaHaftalikEpostasi, havuzAramaEpostasi } from '@/altyapi/epostaSablonlari'
import { ortam } from '@/altyapi/eposta'
import { parcaliBul } from '@/altyapi/parcali'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { HAVUZ_YETKISI, havuzAra } from './havuz'
import { IslemHatasi, kimlik, type Kullanici } from './ortak'

function yetki(k: Kullanici | null, tur: AramaTuru): Kullanici {
  if (!k) throw new IslemHatasi('Aramayı kaydetmek için giriş yap.', 403)
  if (tur === 'ilan' && !adayMi(k)) throw new IslemHatasi('İlan araması aday hesabıyla kaydedilir.', 403)
  if (tur === 'havuz' && !firmaYetkisiVarMi(k, [...HAVUZ_YETKISI])) throw new IslemHatasi('CV havuzunda arama yetkiniz yok.', 403)
  return k
}

/** Aramayı kaydeder; aynı arama zaten kayıtlıysa yalnızca sıklığı güncellenir. */
export async function aramaKaydet(payload: Payload, k: Kullanici | null, g: { tur: AramaTuru; sorgu: string; siklik?: Siklik; ad?: string }) {
  const kullanici = yetki(k, g.tur)
  const { sorgu, ad } =
    g.tur === 'ilan'
      ? (() => {
          const s = ilanSorgusu(g.sorgu)
          return { sorgu: s.sorgu, ad: ilanAramaOzeti(s.filtre) }
        })()
      : (() => {
          const s = havuzSorgusu(g.sorgu)
          if (!s.beceriler.length) throw new IslemHatasi('Kaydetmek için en az bir beceri seçin.')
          return { sorgu: s.sorgu, ad: g.ad?.trim() || 'Havuz araması' }
        })()
  const siklik: Siklik = g.tur === 'havuz' ? 'haftalik' : g.siklik === 'anlik' ? 'anlik' : 'haftalik'
  const adi = (g.ad?.trim() || ad).slice(0, 120)
  const { docs } = await payload.find({ collection: 'kayitli-aramalar', where: { and: [{ kullanici: { equals: kullanici.id } }, { tur: { equals: g.tur } }] }, limit: 50, depth: 0, overrideAccess: true })
  const ayni = docs.find((d) => (d.sorgu ?? '') === sorgu)
  if (ayni) return payload.update({ collection: 'kayitli-aramalar', id: ayni.id, data: { siklik, ad: adi }, overrideAccess: true })
  if (docs.length >= EN_FAZLA_ARAMA) throw new IslemHatasi(`En fazla ${EN_FAZLA_ARAMA} arama kaydedebilirsin. Yenisini eklemek için birini sil.`, 409)
  return payload.create({ collection: 'kayitli-aramalar', data: { kullanici: kullanici.id, tur: g.tur, sorgu, ad: adi, siklik }, overrideAccess: true })
}

async function kendiAramasi(payload: Payload, k: Kullanici | null, id: number) {
  if (!k) throw new IslemHatasi('Giriş yapmalısın.', 403)
  const a = await payload.findByID({ collection: 'kayitli-aramalar', id, depth: 0, overrideAccess: true, disableErrors: true })
  if (!a || kimlik(a.kullanici) !== Number(k.id)) throw new IslemHatasi('Arama bulunamadı.', 404)
  return a
}

export async function aramaSikligi(payload: Payload, k: Kullanici | null, id: number, siklik: Siklik) {
  const a = await kendiAramasi(payload, k, id)
  if (a.tur === 'havuz') throw new IslemHatasi('Havuz aramaları haftada bir bildirilir.', 400)
  return payload.update({ collection: 'kayitli-aramalar', id, data: { siklik: siklik === 'anlik' ? 'anlik' : 'haftalik' }, overrideAccess: true })
}

export async function aramaSil(payload: Payload, k: Kullanici | null, id: number) {
  await kendiAramasi(payload, k, id)
  await payload.delete({ collection: 'kayitli-aramalar', id, overrideAccess: true })
}

export async function kisininAramalari(payload: Payload, k: Kullanici, tur: AramaTuru): Promise<KayitliAramalar[]> {
  const { docs } = await payload.find({ collection: 'kayitli-aramalar', where: { and: [{ kullanici: { equals: k.id } }, { tur: { equals: tur } }] }, sort: '-createdAt', limit: 50, depth: 0, overrideAccess: true })
  return docs
}

/* ---------- Bildirimler ---------- */

const taksonomiAdi = (x: unknown) => (x && typeof x === 'object' ? ((x as { ad?: string }).ad ?? undefined) : undefined)

/** Yayındaki ilanların özetleri (görünür firmalar); arama eşleşmesi için. */
async function ilanOzetleri(payload: Payload, where: Record<string, unknown>): Promise<Array<IlanOzeti & { yayinTarihi?: string }>> {
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { and: [{ durum: { equals: 'yayinda' } }, where] } as never,
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    select: { pozisyonAdi: true, firma: true, tur: true, altTur: true, model: true, deneyim: true, aile: true, ucretliStaj: true, pauOncelik: true, sonBasvuru: true, yayinTarihi: true, arama: true },
    populate: { taksonomiler: { ad: true } },
  })
  const firmalar = new Map(
    (
      await parcaliBul([...new Set(docs.map((d) => kimlik(d.firma)))], (p) =>
        payload.find({ collection: 'firmalar', where: { id: { in: p } }, select: { kisaAd: true, slug: true, konum: true, asama: true, testFirmasi: true }, limit: p.length, depth: 0, overrideAccess: true }),
      )
    )
      .filter((f) => f.asama !== 'pasif' && (!f.testFirmasi || ortam() !== 'yayin'))
      .map((f) => [f.id, f]),
  )
  const simdi = new Date()
  return docs.flatMap((i: Partial<Ilanlar> & { id: number }) => {
    const f = firmalar.get(kimlik(i.firma))
    if (!f || suresiDolduMu(new Date(i.sonBasvuru!), simdi)) return []
    return [
      {
        id: i.id,
        pozisyonAdi: i.pozisyonAdi!,
        firma: { id: f.id, ad: f.kisaAd, slug: f.slug, konum: f.konum },
        tur: i.tur as IlanTuru,
        altTur: i.altTur ?? '',
        model: i.model as CalismaModeli,
        deneyim: i.deneyim as Deneyim,
        aile: taksonomiAdi(i.aile),
        ucretliStaj: Boolean(i.ucretliStaj),
        pauOncelik: Boolean(i.pauOncelik),
        sonBasvuru: i.sonBasvuru!,
        yayinTarihi: i.yayinTarihi ?? undefined,
        arama: i.arama ?? '',
      },
    ]
  })
}

async function kullanicilar(payload: Payload, idler: number[]) {
  const liste = await parcaliBul([...new Set(idler)], (p) =>
    payload.find({ collection: 'kullanicilar', where: { id: { in: p } }, select: { ad: true, email: true, pasif: true, rol: true }, limit: p.length, depth: 0, overrideAccess: true }),
  )
  return new Map(liste.filter((u) => !u.pasif).map((u) => [u.id, u]))
}

/**
 * İlan yayına girince (ilk kez) “anlık” aramalara uyanlara e-posta gider. Hata yayını durdurmaz; dönen sayı gönderilen
 * e-posta sayısıdır.
 */
export async function yeniIlanBildirimleri(payload: Payload, ilanId: number): Promise<number> {
  const [ilan] = await ilanOzetleri(payload, { id: { equals: ilanId } })
  if (!ilan) return 0
  const { docs } = await payload.find({ collection: 'kayitli-aramalar', where: { and: [{ tur: { equals: 'ilan' } }, { siklik: { equals: 'anlik' } }] }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })
  const uyan = docs.filter((a) => ilanAramayaUyarMi(ilan, a.sorgu ?? ''))
  if (!uyan.length) return 0
  const kisiler = await kullanicilar(payload, uyan.map((a) => kimlik(a.kullanici)))
  const gonderilen = new Set<number>() // aynı ilan aynı kişiye birden çok aramasından iki kez gitmez
  let n = 0
  for (const a of uyan) {
    const u = kisiler.get(kimlik(a.kullanici))
    if (!u || gonderilen.has(u.id)) continue
    gonderilen.add(u.id)
    const e = aramaAnlikEpostasi({ ad: u.ad, aramaAdi: a.ad, pozisyonAdi: ilan.pozisyonAdi, firma: ilan.firma.ad, sonGun: tarihYaz(ilan.sonBasvuru, true), adres: ilanAdresi(ilan) })
    await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
    await payload.update({ collection: 'kayitli-aramalar', id: a.id, data: { sonBildirim: new Date().toISOString() }, overrideAccess: true })
    n++
  }
  return n
}

/** Haftalık özetler: ilan aramaları (haftalık) ve firma havuz aramaları. Yeni sonuç yoksa e-posta gitmez. */
export async function haftalikAramaBildirimleri(payload: Payload, simdi: Date, hatalar: string[]): Promise<number> {
  const { docs } = await payload.find({ collection: 'kayitli-aramalar', where: { siklik: { equals: 'haftalik' } }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })
  const zamani = docs.filter((a) => haftalikZamaniMi(new Date(a.sonBildirim ?? a.createdAt), simdi))
  if (!zamani.length) return 0
  const kisiler = await kullanicilar(payload, zamani.map((a) => kimlik(a.kullanici)))
  const ilanlar = zamani.some((a) => a.tur === 'ilan') ? await ilanOzetleri(payload, {}) : []
  let n = 0
  for (const a of zamani) {
    const u = kisiler.get(kimlik(a.kullanici))
    const son = new Date(a.sonBildirim ?? a.createdAt)
    try {
      if (u && a.tur === 'ilan') {
        const yeni = ilanlar.filter((i) => i.yayinTarihi && new Date(i.yayinTarihi) > son && ilanAramayaUyarMi(i, a.sorgu ?? '')).sort((x, y) => (y.yayinTarihi ?? '').localeCompare(x.yayinTarihi ?? ''))
        if (yeni.length) {
          const e = aramaHaftalikEpostasi({
            ad: u.ad,
            aramaAdi: a.ad,
            ilanlar: yeni.slice(0, HAFTALIK_EN_FAZLA_ILAN).map((i) => ({ pozisyonAdi: i.pozisyonAdi, firma: i.firma.ad })),
            fazla: Math.max(0, yeni.length - HAFTALIK_EN_FAZLA_ILAN),
            aramaAdresi: a.sorgu ? `?${a.sorgu}` : '',
          })
          await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
          n++
        }
      } else if (u && a.tur === 'havuz' && u.rol === 'firma') {
        const s = havuzSorgusu(a.sorgu ?? '')
        const tam = await payload.findByID({ collection: 'kullanicilar', id: u.id, depth: 0, overrideAccess: true })
        const uyan = s.beceriler.length && firmaYetkisiVarMi(tam as Kullanici, [...HAVUZ_YETKISI]) ? await havuzAra(payload, tam as Kullanici, { beceriler: s.beceriler, beceriKosulu: s.kosul }) : []
        const idler = uyan.map((x) => Number(x.id))
        const yeniler = idler.length
          ? await parcaliBul(idler, (p) => payload.find({ collection: 'adaylar', where: { and: [{ id: { in: p } }, { 'havuz.rizaTarihi': { greater_than: son.toISOString() } }] }, select: { kod: true }, limit: p.length, depth: 0, overrideAccess: true }))
          : []
        if (yeniler.length) {
          const e = havuzAramaEpostasi({ ad: u.ad, aramaAdi: a.ad, sayi: yeniler.length, aramaAdresi: a.sorgu ? `?${a.sorgu}` : '' })
          await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
          n++
        }
      }
      await payload.update({ collection: 'kayitli-aramalar', id: a.id, data: { sonBildirim: simdi.toISOString() }, overrideAccess: true })
    } catch (e) {
      hatalar.push(`Kayıtlı arama ${a.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return n
}
