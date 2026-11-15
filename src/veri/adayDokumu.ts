/**
 * Adayın kişisel verilerinin dökümü (KVKK m. 11/b; talimatlar 12). Aday kendi hesabından, Yönetici A.Ş. bir bilgi
 * başvurusu üzerine aynı dökümü alır. Firma ekibinin iç notları, puanları ve etiketleri adaya ait veri değildir ve
 * dökümde yer almaz.
 */
import type { Payload } from 'payload'
import { KVKK_DURUM_ADI, KVKK_SONUC_ADI, KVKK_TUR_ADI } from '@/alan/kvkk'

export async function adayVeriDokumu(payload: Payload, kullaniciId: number) {
  const ortak = { overrideAccess: true, depth: 0, limit: 1000 } as const
  const hesap = await payload.findByID({ collection: 'kullanicilar', id: kullaniciId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!hesap || hesap.rol !== 'aday') return null
  const [aday, basvurular, rizalar, kvkk, kaydedilenler] = await Promise.all([
    payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullaniciId } }, ...ortak, depth: 1 }),
    payload.find({
      collection: 'basvurular',
      where: { adayKullanici: { equals: kullaniciId } },
      ...ortak,
      select: { ilan: true, firma: true, durum: true, kaynak: true, profilKopyasi: true, onYazi: true, cevaplar: true, aydinlatmaSurumu: true, createdAt: true, updatedAt: true, cv: true },
      populate: { ilanlar: { pozisyonAdi: true }, firmalar: { kisaAd: true } },
      depth: 1,
    }),
    payload.find({ collection: 'rizalar', where: { kullanici: { equals: kullaniciId } }, ...ortak }),
    payload.find({ collection: 'kvkk-talepleri', where: { kullanici: { equals: kullaniciId } }, ...ortak, select: { tur: true, basvuruTarihi: true, durum: true, sonuc: true, cevap: true, cevapTarihi: true } }),
    payload.find({ collection: 'kaydedilen-ilanlar', where: { kullanici: { equals: kullaniciId } }, ...ortak, depth: 1, populate: { ilanlar: { pozisyonAdi: true } } }),
  ])
  const profil = aday.docs[0] ?? null
  const goruntulenme = profil ? (await payload.count({ collection: 'havuz-goruntulemeleri', where: { aday: { equals: profil.id } }, overrideAccess: true })).totalDocs : 0
  const ad = (x: unknown, alan: string) => (x && typeof x === 'object' ? ((x as Record<string, unknown>)[alan] ?? null) : null)
  return {
    olusturma: new Date().toISOString(),
    aciklama: 'TeknoKariyer’de senin hakkında tuttuğumuz kayıtların kopyası.',
    hesap: { ad: hesap.ad, eposta: hesap.email, rol: hesap.rol, olusturma: hesap.createdAt },
    profil,
    basvurular: basvurular.docs.map((b) => ({ ...b, ilan: ad(b.ilan, 'pozisyonAdi'), firma: ad(b.firma, 'kisaAd') })),
    kaydedilenIlanlar: kaydedilenler.docs.map((k) => ({ ilan: ad(k.ilan, 'pozisyonAdi'), tarih: k.createdAt, hatirlatma: k.hatirlatildi ?? null })),
    havuzProfilAcilmaSayisi: goruntulenme,
    onaylar: rizalar.docs.map((r) => ({ tur: r.tur, metinSurumu: r.metinSurumu, tarih: r.createdAt, geriAlinma: r.geriAlinma })),
    kvkkBasvurulari: kvkk.docs.map((t) => ({
      tur: KVKK_TUR_ADI[t.tur],
      tarih: t.basvuruTarihi,
      durum: KVKK_DURUM_ADI[t.durum],
      sonuc: t.sonuc ? KVKK_SONUC_ADI[t.sonuc] : null,
      cevap: t.cevap ?? null,
      cevapTarihi: t.cevapTarihi ?? null,
    })),
  }
}

export const dokumDosyaAdi = () => `teknokariyer-verilerim-${new Date().toISOString().slice(0, 10)}.json`
