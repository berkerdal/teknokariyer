/**
 * Firma raporu (K31): firmanın yalnızca kendi ilanları ve başvuruları. Kiracı ayrımı sorguda uygulanır (firma kimliği).
 * Başka firmalarla karşılaştırma gösterilmez; aday adı veya iletişim bilgisi yer almaz.
 */
import { DURUM_ADI, type IlanDurumu } from '@/alan/ilan'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { aralikta, huni } from '@/alan/ozet'
import type { RaporDonemi } from '@/alan/raporDonemi'
import { firmaKimligi, firmaKullanicisiMi } from '@/erisim'
import type { Kullanici } from '@/servisler/ortak'
import type { Rapor } from './raporlar'
import { payloadAl } from './payload'

const kimlik = (x: unknown) => Number(x && typeof x === 'object' ? (x as { id: number }).id : x)
const tarih = (iso: string | null | undefined) => (iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' }).format(new Date(iso)) : '')
const KANAL: Record<string, string> = { portal: 'Portal içinden', linkedin: 'LinkedIn paylaşımı', google: 'Google', dogrudan: 'Doğrudan bağlantı' }

export async function firmaRaporuHazirla(k: Kullanici, d: RaporDonemi): Promise<Rapor | null> {
  if (!firmaKullanicisiMi(k)) return null
  const firmaId = Number(firmaKimligi(k))
  const payload = await payloadAl()
  const [firma, ilanlar, basvurular] = await Promise.all([
    payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true }),
    payload.find({
      collection: 'ilanlar',
      where: { and: [{ firma: { equals: firmaId } }, { durum: { not_equals: 'taslak' } }] },
      select: { pozisyonAdi: true, durum: true, altTur: true, yayinTarihi: true, kapanisTarihi: true, goruntulenme: true },
      limit: 5000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({ collection: 'basvurular', where: { firma: { equals: firmaId } }, select: { ilan: true, durum: true, kaynak: true, createdAt: true }, limit: 100000, pagination: false, depth: 0, overrideAccess: true }),
  ])
  const donemde = basvurular.docs.filter((b) => aralikta(b.createdAt, d.bas, d.bit))
  const yayinda = ilanlar.docs.filter((i) => i.yayinTarihi && new Date(i.yayinTarihi) < d.bit && (!i.kapanisTarihi || new Date(i.kapanisTarihi) >= d.bas))
  const say = (ilanId: number, f: (b: (typeof basvurular.docs)[number]) => boolean, liste = basvurular.docs) => liste.filter((b) => kimlik(b.ilan) === ilanId && b.durum !== 'geri-cekti' && f(b)).length
  const h = huni(donemde.map((b) => String(b.durum)))
  const kanal = new Map<string, number>()
  for (const b of donemde) if (b.durum !== 'geri-cekti') kanal.set(KANAL[String(b.kaynak ?? 'portal')] ?? 'Diğer', (kanal.get(KANAL[String(b.kaynak ?? 'portal')] ?? 'Diğer') ?? 0) + 1)
  return {
    kod: 'firma',
    ad: `${firma.kisaAd} ilan raporu`,
    amac: 'İlanlarınızın görüntülenme, başvuru ve sonuç sayıları.',
    donem: d.ad,
    olusturma: new Date().toISOString(),
    ozet: [
      { ad: 'Yayında olan ilan', deger: yayinda.length, tanim: 'Dönemin herhangi bir anında yayında olan ilanlarınız' },
      { ad: 'Başvuru', deger: h[0]!.n, tanim: 'Dönemde gelen, geri çekilmemiş başvurular' },
      { ad: 'Görüşmeye çağrılan', deger: h[2]!.n, tanim: 'Bu başvurulardan bugün görüşme, teklif veya olumlu aşamasında olanlar' },
      { ad: 'Olumlu sonuç', deger: h[4]!.n, tanim: 'Bu başvurulardan olumlu sonuçlananlar' },
    ],
    tablolar: [
      {
        baslik: 'İlanlarınız',
        sutunlar: [
          { ad: 'İlan' },
          { ad: 'Çalışma şekli / staj türü' },
          { ad: 'Durum' },
          { ad: 'Yayın' },
          { ad: 'Kapanış' },
          { ad: 'Görüntülenme', sayi: true },
          { ad: 'Toplam başvuru', sayi: true },
          { ad: 'Dönemde başvuru', sayi: true },
          { ad: 'İncelenmemiş', sayi: true },
          { ad: 'Görüşme', sayi: true },
          { ad: 'Olumlu', sayi: true },
          { ad: 'Olumsuz', sayi: true },
        ],
        satirlar: yayinda
          .sort((a, b) => (b.yayinTarihi ?? '').localeCompare(a.yayinTarihi ?? ''))
          .map((i) => [
            i.pozisyonAdi,
            ALT_TUR_ADI[i.altTur ?? ''] ?? '',
            DURUM_ADI[i.durum as IlanDurumu],
            tarih(i.yayinTarihi),
            tarih(i.kapanisTarihi),
            i.goruntulenme ?? 0,
            say(i.id, () => true),
            say(i.id, () => true, donemde),
            say(i.id, (b) => b.durum === 'alindi'),
            say(i.id, (b) => ['gorusme', 'teklif'].includes(String(b.durum))),
            say(i.id, (b) => b.durum === 'olumlu'),
            say(i.id, (b) => b.durum === 'olumsuz'),
          ]),
        bos: 'Bu dönemde yayında ilanınız olmadı.',
      },
      {
        baslik: 'Başvuru hunisi',
        aciklama: 'Dönemde gelen başvuruların bugün ulaştığı aşama.',
        sutunlar: h.map((x) => ({ ad: x.ad, sayi: true })),
        satirlar: [h.map((x) => x.n)],
      },
      {
        baslik: 'Başvurular nereden geldi?',
        aciklama: 'LinkedIn paylaşımından gelenler, ilan işlemlerindeki paylaşım bağlantısıyla sayılır.',
        sutunlar: [{ ad: 'Kanal' }, { ad: 'Başvuru', sayi: true }],
        satirlar: [...kanal.entries()].sort((a, b) => b[1] - a[1]).map(([a, n]) => [a, n]),
        bos: 'Dönemde başvuru yok.',
      },
    ],
    notlar: ['Görüntülenme, ilanın yayına girdiği günden bugüne kadarki toplamdır.', 'Sayılar yalnızca firmanızın ilanlarından hesaplanır.', 'Raporda aday adı veya iletişim bilgisi yer almaz.'],
  }
}
