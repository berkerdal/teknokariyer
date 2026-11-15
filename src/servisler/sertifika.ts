/**
 * Sertifika belgeleri (kullanıcı isteği, 15.11.2026; LinkedIn'deki “Lisans ve sertifikalar” örnek alındı).
 * - Aday belgeyi (PDF veya PNG/JPEG/WebP, en fazla 5 MB) sertifika formunda hemen yükler; kayıt profil kaydedilince
 *   sertifikaya bağlanır. PDF etkisizleştirilir (K34); görselin türü uzantıdan değil ilk baytlardan denetlenir.
 * - Profil kaydında belge kimliğinin adaya ait bir sertifika belgesi olduğu denetlenir. Profilde ve hiçbir başvuruda
 *   kullanılmayan belgeler silinir (vazgeçilen yüklemeler depoda kalmaz).
 * - Firma belgeyi yalnızca başvurudaki (`basvurular.belgeler`) veya havuzdaki profilde görebilir; açılış kayda geçer.
 */
import type { Payload } from 'payload'
import type { Adaylar } from '@/payload-types'
import { adayMi } from '@/erisim'
import { dosyaIcerigi } from '@/altyapi/depolama'
import { pdfFiligranla, filigranMetni } from '@/altyapi/filigran'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { SifreliPdfHatasi, pdfTemizle } from '@/altyapi/pdfTemizle'
import { parcaliBul } from '@/altyapi/parcali'
import { gorselTuru } from './firmaProfili'
import { FormHatasi } from './hesap'
import { IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'
import { kendiAdayKaydi, pdfMi } from './profil'

export const BELGE_EN_BUYUK = 5 * 1024 * 1024
const EN_FAZLA_BELGE = 30

export type BelgeTuru = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'
const UZANTI: Record<BelgeTuru, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export async function sertifikaBelgesiYukle(payload: Payload, k: Kullanici, g: { veri: Uint8Array; boyut: number }): Promise<{ id: number; tur: BelgeTuru }> {
  if (!adayMi(k)) throw new IslemHatasi('Sertifika belgesini yalnızca aday yükleyebilir.', 403)
  const aday = await kendiAdayKaydi(payload, k)
  if (!g.boyut) throw new FormHatasi({ belge: 'Bir dosya seç.' })
  if (g.boyut > BELGE_EN_BUYUK) throw new FormHatasi({ belge: 'Dosya 5 MB’tan büyük. Daha küçük bir dosya seç.' })
  const sayi = await payload.count({ collection: 'dosyalar', where: { and: [{ sahip: { equals: k.id } }, { tur: { equals: 'sertifika' } }] }, overrideAccess: true })
  if (sayi.totalDocs >= EN_FAZLA_BELGE) throw new FormHatasi({ belge: `En fazla ${EN_FAZLA_BELGE} sertifika belgesi saklayabilirsin.` })
  let veri = g.veri
  let tur: BelgeTuru | null = gorselTuru(g.veri)
  if (!tur) {
    if (!pdfMi(g.veri)) throw new FormHatasi({ belge: 'Belge PDF, PNG, JPEG veya WebP olmalı.' })
    try {
      veri = (await pdfTemizle(g.veri)).veri
    } catch (e) {
      if (e instanceof SifreliPdfHatasi) throw new FormHatasi({ belge: 'Bu PDF parola korumalı. Belgeyi parolasız PDF olarak yeniden kaydedip tekrar yükle.' })
      throw new FormHatasi({ belge: 'PDF okunamadı. Belgeyi PDF olarak yeniden kaydedip tekrar dene.' })
    }
    tur = 'application/pdf'
  }
  const dosya = await payload.create({
    collection: 'dosyalar',
    data: { tur: 'sertifika', sahip: k.id, taramaDurumu: 'temiz' } as never,
    file: { data: Buffer.from(veri), mimetype: tur, name: `sertifika-${aday.kod ?? aday.id}-${Date.now()}.${UZANTI[tur]}`, size: veri.length },
    overrideAccess: true,
    req: await istekOlustur(payload, k),
  })
  return { id: dosya.id, tur }
}

type SertifikaSatiri = NonNullable<Adaylar['sertifikalar']>[number]

/** Kayıttan önce: belge adaya ait sertifika belgesi değilse bağlantı düşer; beceri listede yoksa düşer. */
export async function sertifikalariDenetle<T extends { dosya?: unknown; beceriler?: unknown }>(payload: Payload, k: Kullanici, satirlar: T[]): Promise<T[]> {
  const dosyaIdleri = [...new Set(satirlar.map((s) => Number(s.dosya)).filter((x) => x > 0))]
  const beceriIdleri = [...new Set(satirlar.flatMap((s) => (Array.isArray(s.beceriler) ? s.beceriler.map(Number) : [])).filter((x) => x > 0))]
  const [dosyalar, beceriler] = await Promise.all([
    parcaliBul(dosyaIdleri, (p) => payload.find({ collection: 'dosyalar', where: { and: [{ id: { in: p } }, { sahip: { equals: k.id } }, { tur: { equals: 'sertifika' } }] }, select: { tur: true }, limit: p.length, depth: 0, overrideAccess: true })),
    parcaliBul(beceriIdleri, (p) => payload.find({ collection: 'taksonomiler', where: { and: [{ id: { in: p } }, { tur: { equals: 'beceri' } }] }, select: { ad: true }, limit: p.length, depth: 0, overrideAccess: true })),
  ])
  const gecerliDosya = new Set(dosyalar.map((d) => d.id))
  const gecerliBeceri = new Set(beceriler.map((b) => b.id))
  return satirlar.map((s) => ({
    ...s,
    dosya: gecerliDosya.has(Number(s.dosya)) ? Number(s.dosya) : null,
    beceriler: (Array.isArray(s.beceriler) ? s.beceriler.map(Number) : []).filter((b) => gecerliBeceri.has(b)),
  }))
}

/** Profilde ve hiçbir başvuruda kullanılmayan sertifika belgelerini siler. Silinen sayısını döner. */
export async function sahipsizBelgeleriSil(payload: Payload, kullaniciId: number): Promise<number> {
  const { docs: belgeler } = await payload.find({ collection: 'dosyalar', where: { and: [{ sahip: { equals: kullaniciId } }, { tur: { equals: 'sertifika' } }] }, select: { tur: true }, limit: 100, depth: 0, overrideAccess: true })
  if (!belgeler.length) return 0
  const { docs: profil } = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullaniciId } }, select: { sertifikalar: true }, limit: 1, depth: 0, overrideAccess: true })
  const kullanilan = new Set((profil[0]?.sertifikalar ?? []).map((s: SertifikaSatiri) => (s.dosya ? kimlik(s.dosya) : 0)))
  let n = 0
  for (const b of belgeler) {
    if (kullanilan.has(b.id)) continue
    const basvuruda = await payload.count({ collection: 'basvurular', where: { belgeler: { contains: b.id } }, overrideAccess: true })
    if (basvuruda.totalDocs) continue
    await payload.delete({ collection: 'dosyalar', id: b.id, overrideAccess: true }).catch((e: unknown) => console.error('Sertifika belgesi silinemedi', b.id, e))
    n++
  }
  return n
}

/**
 * Belgenin içeriği. Firma için PDF'e firma adı ve tarih filigranı eklenir (K6 ile aynı kural) ve açılış kayda geçer.
 */
export async function belgeHazirla(
  payload: Payload,
  dosyaId: number,
  firma: { k: Kullanici; ad: string; kayit: { kayitTuru: 'basvurular' | 'adaylar'; kayitId: number } } | null,
): Promise<{ icerik: Uint8Array; tur: BelgeTuru; dosyaAdi: string }> {
  const dosya = await payload.findByID({ collection: 'dosyalar', id: dosyaId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!dosya || dosya.tur !== 'sertifika' || !dosya.filename) throw new IslemHatasi('Belge bulunamadı. Aday belgeyi kaldırmış olabilir.', 404)
  const ham = await dosyaIcerigi(dosya.filename)
  if (!ham) throw new IslemHatasi('Belge bulunamadı. Aday belgeyi kaldırmış olabilir.', 404)
  const tur = dosya.mimeType as BelgeTuru
  let icerik = ham
  if (firma && tur === 'application/pdf') {
    try {
      icerik = await pdfFiligranla(ham, filigranMetni(firma.ad, new Date()))
    } catch {
      throw new IslemHatasi('Belgeye filigran eklenemediği için açılamıyor. Bu durumu Yönetici A.Ş.’ye bildirin.', 409)
    }
  }
  if (firma) {
    const req = await istekOlustur(payload, firma.k)
    await islemKaydet(req, { islem: 'Sertifika belgesi açıldı', tur: 'kisisel-veri', kayitTuru: firma.kayit.kayitTuru, kayitId: firma.kayit.kayitId, ayrinti: { firma: firma.ad, dosya: dosyaId } })
  }
  return { icerik, tur, dosyaAdi: `sertifika-${dosyaId}.${UZANTI[tur] ?? 'pdf'}` }
}
