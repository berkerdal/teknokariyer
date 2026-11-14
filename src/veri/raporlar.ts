/**
 * Rapor merkezi (K31, docs/raporlama.md 3). Sekiz hazır rapor; hepsi aynı veri yüküyle hesaplanır.
 * Raporlar kişisel veri içermez: aday adı, iletişim bilgisi, CV yoktur. Kişiye ait gruplar (üniversite, bölüm, şehir)
 * 5'ten küçükse gizlenir. Firma adları yer alabilir. Yayın ortamında test firmaları sayılmaz.
 */
import type { Firmalar, Ilanlar } from '@/payload-types'
import { ortam } from '@/altyapi/eposta'
import { DURUM_ADI, type IlanDurumu } from '@/alan/ilan'
import { ALT_TUR_ADI, TUR_ADI } from '@/alan/ilanFiltre'
import { ASAMA_ADI, type KurulumAsamasi } from '@/alan/kurulum'
import { normallestir } from '@/alan/metin'
import { aralikta, gruplariGizle, huni, GIZLEME_ESIGI, type Grup } from '@/alan/ozet'
import { donemAylari, type RaporDonemi } from '@/alan/raporDonemi'
import { KVKK_SONUC_ADI, KVKK_TALEP_TURLERI, cevapSuresi, kalanGun, type KvkkSonuc, type KvkkTalepTuru } from '@/alan/kvkk'
import type { Sayfa } from '@/altyapi/excel'
import { isSaati } from './yonetim'
import { payloadAl } from './payload'

export type Deger = string | number | null

export interface RaporTablosu {
  baslik: string
  aciklama?: string
  sutunlar: Array<{ ad: string; sayi?: boolean }>
  satirlar: Deger[][]
  bos?: string
}

export interface RaporOzeti {
  ad: string
  deger: Deger
  tanim: string
}

export interface Rapor {
  kod: string
  ad: string
  amac: string
  donem: string
  olusturma: string
  ozet: RaporOzeti[]
  tablolar: RaporTablosu[]
  notlar: string[]
}

export interface RaporTanimi {
  kod: string
  ad: string
  amac: string
  kimIcin: string
}

export const RAPORLAR: RaporTanimi[] = [
  { kod: 'faaliyet', ad: 'Dönem faaliyet raporu', amac: 'Ana göstergeler, aylık kırılım, sonuçlar ve aday kaynakları. Faaliyet raporu ve üniversite-sanayi iş birliği raporlarına veri sağlar.', kimIcin: 'Genel Müdürlük, Yönetim Kurulu' },
  { kod: 'ilanlar', ad: 'İlan raporu', amac: 'Dönemde yayında olan bütün ilanlar: firma, tür, süre, görüntülenme, başvuru ve sonuç.', kimIcin: 'Kurumsal iletişim' },
  { kod: 'firmalar', ad: 'Firma etkinlik raporu', amac: 'Firma başına ilan, başvuru ve sonuç; ilan vermeyen firmalar ve kurulum aşamaları.', kimIcin: 'Teknokent süreç yöneticileri' },
  { kod: 'sonuclar', ad: 'Başvuru ve sonuç raporu', amac: 'Başvuru hunisi; ilan türüne ve sektöre göre sonuçlar; işe yerleşme (olumlu sonuç) sayısı.', kimIcin: 'Genel Müdürlük' },
  { kod: 'yetenek', ad: 'Yetenek açığı raporu', amac: 'İlanlarda istenen beceriler ile CV havuzundaki aday arzının karşılaştırması.', kimIcin: 'Üniversite iş birliği, PAÜ' },
  { kod: 'kaynak', ad: 'Aday kaynak raporu', amac: 'Başvuranların üniversite, bölüm, şehir ve başvuru kanalı dağılımı; PAÜ oranı.', kimIcin: 'Üniversite iş birliği' },
  { kod: 'hizmet', ad: 'Hizmet raporu', amac: 'Onay süreleri, düzeltme oranı, liste talepleri, davet ve kurulum hızı.', kimIcin: 'Yönetici A.Ş. iç değerlendirme' },
  { kod: 'kvkk', ad: 'KVKK raporu', amac: 'Rıza sayıları, kişisel veriye erişim kayıtları, anonimleştirilen başvurular ve silinen kayıtlar.', kimIcin: 'KVKK sorumlusu' },
]

const kimlik = (x: unknown) => Number(x && typeof x === 'object' ? (x as { id: number }).id : x)
const tarih = (iso: string | null | undefined) => (iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' }).format(new Date(iso)) : '')
const yuzde = (pay: number, payda: number) => (payda ? `%${(Math.round((pay / payda) * 1000) / 10).toLocaleString('tr-TR')}` : '—')
const grupSatirlari = (g: Grup[]): Deger[][] => g.map((x) => [x.ad, x.n === null ? `${GIZLEME_ESIGI}’ten az` : x.n])
const ortalama = (x: number[]) => (x.length ? Math.round((x.reduce((a, b) => a + b, 0) / x.length) * 10) / 10 : null)
const ortanca = (x: number[]) => {
  if (!x.length) return null
  const s = [...x].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return Math.round((s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2) * 10) / 10
}

async function veriYukle(d: RaporDonemi) {
  const payload = await payloadAl()
  const yayin = ortam() === 'yayin'
  const tum = <T,>(r: { docs: T[] }) => r.docs
  const bul = <T,>(collection: string, where: object, select: object, limit = 100000) =>
    payload.find({ collection: collection as never, where: where as never, select: select as never, limit, pagination: false, depth: 0, overrideAccess: true }).then((r) => tum(r) as T[])
  const icinde = (alan: string) => ({ and: [{ [alan]: { greater_than_equal: d.bas.toISOString() } }, { [alan]: { less_than: d.bit.toISOString() } }] })
  const [firmalar, ilanlar, basvurular, sektorler, havuz, adaylar, kayitlar, talepler, davetler, rizalar, ozetler, kvkk] = await Promise.all([
    bul<Firmalar>('firmalar', {}, { kisaAd: true, asama: true, testFirmasi: true, sektor: true }),
    bul<Ilanlar>('ilanlar', { durum: { not_equals: 'taslak' } }, { pozisyonAdi: true, firma: true, durum: true, tur: true, altTur: true, yayinTarihi: true, kapanisTarihi: true, goruntulenme: true, zorunluBeceriler: true, tercihBeceriler: true }),
    bul<{ id: number; ilan: unknown; firma: unknown; durum: string; kaynak?: string | null; profilKopyasi?: unknown; createdAt: string; adayKullanici?: unknown; anonimlestirildi?: string | null }>(
      'basvurular',
      {},
      { ilan: true, firma: true, durum: true, kaynak: true, profilKopyasi: true, createdAt: true, adayKullanici: true, anonimlestirildi: true },
      300000,
    ),
    bul<{ id: number; ad: string; tur: string }>('taksonomiler', { tur: { in: ['sektor', 'beceri'] } }, { ad: true, tur: true }),
    bul<{ beceriler?: Array<{ beceri: unknown }> | null }>('adaylar', { 'havuz.gorunurluk': { not_equals: 'gizli' } }, { beceriler: true }),
    bul<{ createdAt: string }>('kullanicilar', { and: [{ rol: { equals: 'aday' } }, icinde('createdAt')] }, { createdAt: true }),
    bul<{ islem: string; tur: string; kayitTuru?: string | null; kayitId?: string | null; ayrinti?: unknown; createdAt: string }>(
      'islem-kayitlari',
      icinde('createdAt'),
      { islem: true, tur: true, kayitTuru: true, kayitId: true, ayrinti: true, createdAt: true },
      200000,
    ),
    bul<{ durum: string; createdAt: string; sonucTarihi?: string | null }>('talepler', icinde('createdAt'), { durum: true, createdAt: true, sonucTarihi: true }),
    bul<{ createdAt: string; kullanildi?: string | null }>('davetler', icinde('createdAt'), { createdAt: true, kullanildi: true }),
    bul<{ tur: string; createdAt: string; geriAlinma?: string | null }>('rizalar', { or: [icinde('createdAt'), icinde('geriAlinma')] }, { tur: true, createdAt: true, geriAlinma: true }),
    bul<{ tarih: string; goruntulenme?: number | null }>('gunluk-ozetler', {}, { tarih: true, goruntulenme: true }),
    // Dönemde gelen veya dönemde sonuçlanan KVKK başvuruları (kişi bilgisi seçilmez)
    bul<{ tur: KvkkTalepTuru; kanal: string; basvuruTarihi: string; durum: string; sonuc?: KvkkSonuc | null; cevapTarihi?: string | null }>(
      'kvkk-talepleri',
      { or: [icinde('basvuruTarihi'), icinde('cevapTarihi'), { durum: { not_equals: 'sonuclandi' } }] },
      { tur: true, kanal: true, basvuruTarihi: true, durum: true, sonuc: true, cevapTarihi: true },
    ),
  ])
  const testFirma = new Set(firmalar.filter((f) => f.testFirmasi).map((f) => f.id))
  const sayilir = (firmaId: number) => !yayin || !testFirma.has(firmaId)
  const ilanListesi = ilanlar.filter((i) => sayilir(kimlik(i.firma)))
  const ilanIdleri = new Set(ilanListesi.map((i) => i.id))
  const bListesi = basvurular.filter((b) => ilanIdleri.has(kimlik(b.ilan)))
  return {
    firmalar: firmalar.filter((f) => sayilir(f.id)),
    ilanlar: ilanListesi,
    basvurular: bListesi,
    donemdeBasvuru: bListesi.filter((b) => aralikta(b.createdAt, d.bas, d.bit)),
    sektorAdi: new Map(sektorler.filter((t) => t.tur === 'sektor').map((t) => [t.id, t.ad])),
    beceriAdi: new Map(sektorler.filter((t) => t.tur === 'beceri').map((t) => [t.id, t.ad])),
    havuz,
    yeniAday: adaylar,
    kayitlar,
    talepler,
    davetler,
    rizalar,
    kvkk,
    goruntulenme: ozetler.filter((o) => {
      const t = new Date(`${o.tarih}T12:00:00+03:00`)
      return t >= d.bas && t < d.bit
    }),
    ozetBaslangici: ozetler.map((o) => o.tarih).sort()[0] ?? null,
  }
}
type Veri = Awaited<ReturnType<typeof veriYukle>>

const gecerli = (b: { durum: string }) => b.durum !== 'geri-cekti'
const yayinaGirdi = (i: Ilanlar, d: RaporDonemi) => aralikta(i.yayinTarihi, d.bas, d.bit)
/** Dönemin herhangi bir anında yayında olmuş ilan */
const donemdeYayinda = (i: Ilanlar, d: RaporDonemi) => Boolean(i.yayinTarihi) && new Date(i.yayinTarihi!) < d.bit && (!i.kapanisTarihi || new Date(i.kapanisTarihi) >= d.bas)

function kaynakGruplari(v: Veri) {
  const okul = new Map<string, number>()
  const bolum = new Map<string, number>()
  const sehir = new Map<string, number>()
  const kanal = new Map<string, number>()
  const KANAL: Record<string, string> = { portal: 'Portal içinden', linkedin: 'LinkedIn paylaşımı', google: 'Google', dogrudan: 'Doğrudan bağlantı' }
  let pau = 0
  let bilinen = 0
  for (const b of v.donemdeBasvuru.filter(gecerli)) {
    const p = (b.profilKopyasi ?? {}) as { okul?: string | null; bolum?: string | null; tercihler?: { sehir?: string } }
    const ekle = (m: Map<string, number>, k?: string | null) => k && m.set(k, (m.get(k) ?? 0) + 1)
    ekle(okul, p.okul)
    ekle(bolum, p.bolum)
    ekle(sehir, p.tercihler?.sehir)
    ekle(kanal, KANAL[String(b.kaynak ?? 'portal')] ?? 'Diğer')
    if (p.okul) {
      bilinen++
      if (normallestir(p.okul).includes('pamukkale')) pau++
    }
  }
  return { okul, bolum, sehir, kanal, pau, bilinen }
}

const HUNI_SUTUNLARI = [{ ad: 'Başvuru', sayi: true }, { ad: 'İncelendi', sayi: true }, { ad: 'Görüşme', sayi: true }, { ad: 'Teklif', sayi: true }, { ad: 'Olumlu', sayi: true }, { ad: 'Olumlu oranı', sayi: true }]
const huniSatiri = (durumlar: string[]): Deger[] => {
  const h = huni(durumlar)
  return [...h.map((x) => x.n), yuzde(h[4]!.n, h[0]!.n)]
}

function faaliyet(v: Veri, d: RaporDonemi): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const yeniIlan = v.ilanlar.filter((i) => yayinaGirdi(i, d))
  const bs = v.donemdeBasvuru.filter(gecerli)
  const olumlu = bs.filter((b) => b.durum === 'olumlu').length
  const ilanVeren = new Set(v.ilanlar.filter((i) => donemdeYayinda(i, d)).map((i) => kimlik(i.firma))).size
  const gor = v.goruntulenme.reduce((t, o) => t + (o.goruntulenme ?? 0), 0)
  const k = kaynakGruplari(v)
  const firmaBasvuru = new Map<number, number>()
  for (const b of bs) firmaBasvuru.set(kimlik(b.firma), (firmaBasvuru.get(kimlik(b.firma)) ?? 0) + 1)
  const firmaAdi = new Map(v.firmalar.map((f) => [f.id, f.kisaAd]))
  return {
    ozet: [
      { ad: 'Yayına giren ilan', deger: yeniIlan.length, tanim: `Dönemde yayına giren ilanlar (${yeniIlan.filter((i) => i.tur === 'is').length} iş, ${yeniIlan.filter((i) => i.tur === 'staj').length} staj)` },
      { ad: 'Başvuru', deger: bs.length, tanim: 'Dönemde gönderilen, geri çekilmemiş başvurular' },
      { ad: 'Yeni aday hesabı', deger: v.yeniAday.length, tanim: 'Dönemde açılan aday hesapları' },
      { ad: 'İlan veren firma', deger: ilanVeren, tanim: 'Dönemin herhangi bir anında yayında ilanı olan firmalar' },
      { ad: 'Olumlu sonuç', deger: olumlu, tanim: 'Dönemde gelen ve bugün “olumlu” durumunda olan başvurular (işe yerleşme)' },
      { ad: 'İlan görüntülenmesi', deger: gor, tanim: v.ozetBaslangici ? `Günlük kayıtların toplamı (kayıtlar ${tarih(`${v.ozetBaslangici}T12:00:00+03:00`)} tarihinden itibaren tutuluyor)` : 'Günlük kayıt henüz yok' },
    ],
    tablolar: [
      {
        baslik: 'Aylık kırılım',
        sutunlar: [{ ad: 'Ay' }, { ad: 'Yayına giren ilan', sayi: true }, { ad: 'Başvuru', sayi: true }, { ad: 'Yeni aday hesabı', sayi: true }, { ad: 'Olumlu sonuç', sayi: true }],
        satirlar: donemAylari(d).map((a) => [
          a.ad,
          v.ilanlar.filter((i) => aralikta(i.yayinTarihi, a.bas, a.bit)).length,
          bs.filter((b) => aralikta(b.createdAt, a.bas, a.bit)).length,
          v.yeniAday.filter((u) => aralikta(u.createdAt, a.bas, a.bit)).length,
          bs.filter((b) => b.durum === 'olumlu' && aralikta(b.createdAt, a.bas, a.bit)).length,
        ]),
      },
      { baslik: 'Başvuru hunisi', aciklama: 'Dönemde gelen başvuruların bugün ulaştığı aşama.', sutunlar: HUNI_SUTUNLARI, satirlar: [huniSatiri(v.donemdeBasvuru.map((b) => b.durum))] },
      {
        baslik: 'En çok başvuru alan firmalar',
        sutunlar: [{ ad: 'Firma' }, { ad: 'Başvuru', sayi: true }],
        satirlar: [...firmaBasvuru.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => [firmaAdi.get(id) ?? '', n]),
        bos: 'Dönemde başvuru yok.',
      },
      { baslik: 'Başvuranların üniversitesi', sutunlar: [{ ad: 'Üniversite' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.okul, 10)), bos: 'Dönemde başvuru yok.' },
      { baslik: 'Başvurunun geldiği yer', sutunlar: [{ ad: 'Kanal' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.kanal, 6)), bos: 'Dönemde başvuru yok.' },
    ],
    notlar: [k.bilinen >= GIZLEME_ESIGI ? `Okulu bilinen başvurularda Pamukkale Üniversitesi’nin payı ${yuzde(k.pau, k.bilinen)}.` : 'Okulu bilinen başvuru sayısı oran vermek için az.'],
  }
}

function ilanRaporu(v: Veri, d: RaporDonemi): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const liste = v.ilanlar.filter((i) => donemdeYayinda(i, d)).sort((a, b) => (b.yayinTarihi ?? '').localeCompare(a.yayinTarihi ?? ''))
  const firmaAdi = new Map(v.firmalar.map((f) => [f.id, f.kisaAd]))
  const sayac = new Map<number, { donem: number; olumlu: number; toplam: number }>()
  for (const b of v.basvurular.filter(gecerli)) {
    const s = sayac.get(kimlik(b.ilan)) ?? { donem: 0, olumlu: 0, toplam: 0 }
    s.toplam++
    if (aralikta(b.createdAt, d.bas, d.bit)) s.donem++
    if (b.durum === 'olumlu') s.olumlu++
    sayac.set(kimlik(b.ilan), s)
  }
  const basvurusuz = liste.filter((i) => !sayac.get(i.id)?.toplam).length
  return {
    ozet: [
      { ad: 'Dönemde yayında olan ilan', deger: liste.length, tanim: 'Dönemin herhangi bir anında başvuru almış veya yayında olmuş ilanlar' },
      { ad: 'Hiç başvuru almayan', deger: basvurusuz, tanim: 'Bu ilanlardan hiç başvuru almamış olanlar' },
      { ad: 'İlan başına başvuru', deger: liste.length ? Math.round((liste.reduce((t, i) => t + (sayac.get(i.id)?.toplam ?? 0), 0) / liste.length) * 10) / 10 : 0, tanim: 'Toplam başvuru / ilan sayısı' },
    ],
    tablolar: [
      {
        baslik: 'İlanlar',
        sutunlar: [
          { ad: 'İlan' },
          { ad: 'Firma' },
          { ad: 'Tür' },
          { ad: 'Çalışma şekli / staj türü' },
          { ad: 'Yayın' },
          { ad: 'Kapanış' },
          { ad: 'Durum' },
          { ad: 'Görüntülenme', sayi: true },
          { ad: 'Toplam başvuru', sayi: true },
          { ad: 'Dönemde başvuru', sayi: true },
          { ad: 'Olumlu sonuç', sayi: true },
        ],
        satirlar: liste.map((i) => [
          i.pozisyonAdi,
          firmaAdi.get(kimlik(i.firma)) ?? '',
          TUR_ADI[i.tur as 'is' | 'staj'] ?? '',
          ALT_TUR_ADI[i.altTur ?? ''] ?? '',
          tarih(i.yayinTarihi),
          tarih(i.kapanisTarihi),
          DURUM_ADI[i.durum as IlanDurumu],
          i.goruntulenme ?? 0,
          sayac.get(i.id)?.toplam ?? 0,
          sayac.get(i.id)?.donem ?? 0,
          sayac.get(i.id)?.olumlu ?? 0,
        ]),
        bos: 'Dönemde yayında olan ilan yok.',
      },
    ],
    notlar: ['Görüntülenme, ilanın yayına girdiği günden bugüne kadarki toplamdır.'],
  }
}

function firmaRaporu(v: Veri, d: RaporDonemi): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const etkin = v.firmalar.filter((f) => f.asama !== 'pasif')
  const ilanVermis = new Set(v.ilanlar.filter((i) => i.yayinTarihi).map((i) => kimlik(i.firma)))
  const satir = etkin.map((f) => {
    const ilanlari = v.ilanlar.filter((i) => kimlik(i.firma) === f.id)
    const bs = v.donemdeBasvuru.filter((b) => kimlik(b.firma) === f.id && gecerli(b))
    return {
      f,
      yeni: ilanlari.filter((i) => yayinaGirdi(i, d)).length,
      yayinda: ilanlari.filter((i) => i.durum === 'yayinda').length,
      basvuru: bs.length,
      olumlu: bs.filter((b) => b.durum === 'olumlu').length,
    }
  })
  const sirali = satir.sort((a, b) => b.basvuru - a.basvuru || b.yeni - a.yeni || a.f.kisaAd.localeCompare(b.f.kisaAd, 'tr'))
  const asamalar = new Map<string, number>()
  for (const f of etkin) asamalar.set(ASAMA_ADI[f.asama as KurulumAsamasi], (asamalar.get(ASAMA_ADI[f.asama as KurulumAsamasi]) ?? 0) + 1)
  return {
    ozet: [
      { ad: 'Etkin firma', deger: etkin.length, tanim: 'Pasif olmayan firma kayıtları' },
      { ad: 'Dönemde ilan veren', deger: satir.filter((s) => s.yeni > 0).length, tanim: 'Dönemde en az bir ilanı yayına giren firmalar' },
      { ad: 'Hiç ilan vermeyen', deger: etkin.filter((f) => !ilanVermis.has(f.id)).length, tanim: 'Portalda hiç ilan yayınlamamış etkin firmalar' },
    ],
    tablolar: [
      {
        baslik: 'Firmalar',
        sutunlar: [{ ad: 'Firma' }, { ad: 'Kurulum aşaması' }, { ad: 'Dönemde yayına giren ilan', sayi: true }, { ad: 'Şu an yayında', sayi: true }, { ad: 'Dönemde başvuru', sayi: true }, { ad: 'Olumlu sonuç', sayi: true }],
        satirlar: sirali.map((s) => [s.f.kisaAd, ASAMA_ADI[s.f.asama as KurulumAsamasi], s.yeni, s.yayinda, s.basvuru, s.olumlu]),
      },
      { baslik: 'Kurulum aşamaları', sutunlar: [{ ad: 'Aşama' }, { ad: 'Firma', sayi: true }], satirlar: [...asamalar.entries()].map(([a, n]) => [a, n]) },
    ],
    notlar: ['Kurulum aşaması bugünkü durumdur.'],
  }
}

function sonucRaporu(v: Veri): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const ilanTuru = new Map(v.ilanlar.map((i) => [i.id, i.tur as string]))
  const firmaSektor = new Map(v.firmalar.map((f) => [f.id, v.sektorAdi.get(kimlik(f.sektor)) ?? 'Sektör belirtilmemiş']))
  const durumlar = v.donemdeBasvuru.map((b) => b.durum)
  const h = huni(durumlar)
  const gruplu = (anahtar: (b: Veri['basvurular'][number]) => string) => {
    const m = new Map<string, string[]>()
    for (const b of v.donemdeBasvuru) m.set(anahtar(b), [...(m.get(anahtar(b)) ?? []), b.durum])
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length).map(([ad, ds]) => [ad, ...huniSatiri(ds)])
  }
  return {
    ozet: [
      { ad: 'Başvuru', deger: h[0]!.n, tanim: 'Dönemde gelen, geri çekilmemiş başvurular' },
      { ad: 'Görüşmeye çağrılan', deger: h[2]!.n, tanim: `Başvurulara oranı: ${yuzde(h[2]!.n, h[0]!.n)}` },
      { ad: 'Olumlu sonuç', deger: h[4]!.n, tanim: `İşe yerleşme. Başvurulara oranı: ${yuzde(h[4]!.n, h[0]!.n)}` },
      { ad: 'Geri çekilen', deger: durumlar.filter((x) => x === 'geri-cekti').length, tanim: 'Aday tarafından geri çekilen başvurular' },
    ],
    tablolar: [
      { baslik: 'Başvuru hunisi', sutunlar: HUNI_SUTUNLARI, satirlar: [huniSatiri(durumlar)] },
      { baslik: 'İlan türüne göre', sutunlar: [{ ad: 'İlan türü' }, ...HUNI_SUTUNLARI], satirlar: gruplu((b) => TUR_ADI[ilanTuru.get(kimlik(b.ilan)) as 'is' | 'staj'] ?? 'Bilinmiyor'), bos: 'Dönemde başvuru yok.' },
      { baslik: 'Sektöre göre', sutunlar: [{ ad: 'Sektör' }, ...HUNI_SUTUNLARI], satirlar: gruplu((b) => firmaSektor.get(kimlik(b.firma)) ?? 'Sektör belirtilmemiş'), bos: 'Dönemde başvuru yok.' },
    ],
    notlar: ['Portal başvurunun yalnızca bugünkü durumunu bilir: görüşmeden sonra olumsuz sonuçlanan başvuru “İncelendi” basamağında sayılır.'],
  }
}

function yetenekRaporu(v: Veri, d: RaporDonemi): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const zorunlu = new Map<number, number>()
  const tercih = new Map<number, number>()
  for (const i of v.ilanlar.filter((x) => donemdeYayinda(x, d))) {
    for (const b of i.zorunluBeceriler ?? []) zorunlu.set(kimlik(b), (zorunlu.get(kimlik(b)) ?? 0) + 1)
    for (const b of i.tercihBeceriler ?? []) tercih.set(kimlik(b), (tercih.get(kimlik(b)) ?? 0) + 1)
  }
  const arz = new Map<number, number>()
  for (const a of v.havuz) for (const b of a.beceriler ?? []) arz.set(kimlik(b.beceri), (arz.get(kimlik(b.beceri)) ?? 0) + 1)
  const idler = [...new Set([...zorunlu.keys(), ...tercih.keys()])]
  const satirlar = idler
    .map((id) => ({ ad: v.beceriAdi.get(id) ?? '', z: zorunlu.get(id) ?? 0, t: tercih.get(id) ?? 0, a: arz.get(id) ?? 0 }))
    .map((x) => ({ ...x, oran: x.z + x.t ? x.a / (x.z + x.t) : 0 }))
    .sort((a, b) => a.oran - b.oran || b.z - a.z)
  return {
    ozet: [
      { ad: 'İstenen farklı beceri', deger: idler.length, tanim: 'Dönemde yayında olan ilanlarda zorunlu veya tercih sebebi olarak istenen beceriler' },
      { ad: 'Havuzda aday', deger: v.havuz.length, tanim: 'Bugün CV havuzunda görünen adaylar' },
    ],
    tablolar: [
      {
        baslik: 'Beceri talebi ve arzı',
        aciklama: 'İlan başına aday azaldıkça açık büyür. En büyük açık en üstte.',
        sutunlar: [{ ad: 'Beceri' }, { ad: 'Zorunlu (ilan)', sayi: true }, { ad: 'Tercih (ilan)', sayi: true }, { ad: 'Havuzda aday', sayi: true }, { ad: 'İlan başına aday', sayi: true }],
        satirlar: satirlar.map((x) => [x.ad, x.z, x.t, x.a > 0 && x.a < GIZLEME_ESIGI ? `${GIZLEME_ESIGI}’ten az` : x.a, x.a > 0 && x.a < GIZLEME_ESIGI ? '—' : Math.round(x.oran * 10) / 10]),
        bos: 'Dönemde beceri isteyen ilan yok.',
      },
    ],
    notlar: ['Havuz sayıları bugünkü durumdur; havuza katılmayan adaylar sayılmaz.'],
  }
}

function kaynakRaporu(v: Veri): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const k = kaynakGruplari(v)
  const tekil = new Set(v.donemdeBasvuru.filter((b) => gecerli(b) && b.adayKullanici).map((b) => kimlik(b.adayKullanici))).size
  return {
    ozet: [
      { ad: 'Başvuru', deger: v.donemdeBasvuru.filter(gecerli).length, tanim: 'Dönemde gelen, geri çekilmemiş başvurular' },
      { ad: 'Başvuran aday', deger: tekil, tanim: 'Dönemde en az bir başvuru yapan farklı aday (hesabını silenler hariç)' },
      { ad: 'PAÜ payı', deger: k.bilinen >= GIZLEME_ESIGI ? yuzde(k.pau, k.bilinen) : '—', tanim: 'Okulu bilinen başvurularda Pamukkale Üniversitesi’nin payı' },
    ],
    tablolar: [
      { baslik: 'Üniversite', sutunlar: [{ ad: 'Üniversite' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.okul, 20)), bos: 'Dönemde başvuru yok.' },
      { baslik: 'Bölüm', sutunlar: [{ ad: 'Bölüm' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.bolum, 20)), bos: 'Dönemde başvuru yok.' },
      { baslik: 'Tercih ettiği şehir', sutunlar: [{ ad: 'Şehir' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.sehir, 15)), bos: 'Şehir bilgisi olan başvuru yok.' },
      { baslik: 'Başvurunun geldiği yer', sutunlar: [{ ad: 'Kanal' }, { ad: 'Başvuru', sayi: true }], satirlar: grupSatirlari(gruplariGizle(k.kanal, 6)), bos: 'Dönemde başvuru yok.' },
    ],
    notlar: [`Kişiyi tanınır kılmamak için ${GIZLEME_ESIGI}’ten küçük gruplar “Diğer” satırında toplanır.`],
  }
}

function hizmetRaporu(v: Veri): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  // Onay süresi: ilanın onaya girişinden kararın verildiği ana kadar geçen iş saati (işlem kayıtlarından)
  const ilanKayitlari = v.kayitlar.filter((k) => k.kayitTuru === 'ilanlar' && (k.islem.startsWith('İlan durumu') || k.islem === 'İlan oluşturuldu')).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const onaydaGiris = new Map<string, string>()
  const sureler: number[] = []
  let onay = 0
  let duzeltme = 0
  for (const k of ilanKayitlari) {
    const sonra = (k.ayrinti as { sonra?: string } | null)?.sonra
    if (sonra === 'onayda') onaydaGiris.set(String(k.kayitId), k.createdAt)
    else if ((sonra === 'yayinda' || sonra === 'duzeltme') && onaydaGiris.has(String(k.kayitId))) {
      const giris = onaydaGiris.get(String(k.kayitId))!
      sureler.push(Math.round(isSaati(giris, new Date(k.createdAt)) * 10) / 10)
      onaydaGiris.delete(String(k.kayitId))
      if (sonra === 'yayinda') onay++
      else duzeltme++
    }
  }
  const talepSure = v.talepler.filter((t) => t.sonucTarihi).map((t) => (new Date(t.sonucTarihi!).getTime() - new Date(t.createdAt).getTime()) / 3_600_000)
  const davetGun = v.davetler.filter((t) => t.kullanildi).map((t) => (new Date(t.kullanildi!).getTime() - new Date(t.createdAt).getTime()) / 86_400_000)
  const TALEP: Record<string, string> = { bekliyor: 'Bekliyor', onaylandi: 'Onaylandı', kismen: 'Kısmen onaylandı', reddedildi: 'Reddedildi' }
  const talepDurum = new Map<string, number>()
  for (const t of v.talepler) talepDurum.set(TALEP[t.durum] ?? t.durum, (talepDurum.get(TALEP[t.durum] ?? t.durum) ?? 0) + 1)
  return {
    ozet: [
      { ad: 'Onay kararı', deger: onay + duzeltme, tanim: `${onay} onay, ${duzeltme} düzeltme isteği` },
      { ad: 'Ortanca onay süresi', deger: ortanca(sureler) === null ? '—' : `${ortanca(sureler)!.toLocaleString('tr-TR')} iş saati`, tanim: 'Onaya girişten karara; hafta sonu sayılmaz. Hedef 24 iş saati.' },
      { ad: 'Hedefi aşan karar', deger: sureler.filter((s) => s > 24).length, tanim: '24 iş saatinden uzun süren onay kararları' },
      { ad: 'Kabul edilen davet', deger: `${davetGun.length} / ${v.davetler.length}`, tanim: 'Dönemde gönderilen davetlerden kabul edilenler' },
    ],
    tablolar: [
      {
        baslik: 'Onay süreleri',
        sutunlar: [{ ad: 'Ölçü' }, { ad: 'Değer', sayi: true }],
        satirlar: [
          ['Karar sayısı', sureler.length],
          ['Ortalama (iş saati)', ortalama(sureler) ?? '—'],
          ['Ortanca (iş saati)', ortanca(sureler) ?? '—'],
          ['En uzun (iş saati)', sureler.length ? Math.max(...sureler) : '—'],
          ['Düzeltme oranı', yuzde(duzeltme, onay + duzeltme)],
        ],
      },
      { baslik: 'Liste talepleri', sutunlar: [{ ad: 'Sonuç' }, { ad: 'Talep', sayi: true }], satirlar: [...talepDurum.entries()].map(([a, n]) => [a, n]), bos: 'Dönemde liste talebi yok.' },
      {
        baslik: 'Davet ve kurulum',
        sutunlar: [{ ad: 'Ölçü' }, { ad: 'Değer', sayi: true }],
        satirlar: [
          ['Gönderilen davet', v.davetler.length],
          ['Kabul edilen', davetGun.length],
          ['Ortalama kabul süresi (gün)', ortalama(davetGun) ?? '—'],
          ['Ortalama talep sonuçlanma süresi (saat)', ortalama(talepSure) ?? '—'],
        ],
      },
    ],
    notlar: ['Onay süreleri işlem kayıtlarından hesaplanır; saklama süresi dolan kayıtlar hesaba girmez.'],
  }
}

function kvkkRaporu(v: Veri, d: RaporDonemi): Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> {
  const RIZA: Record<string, string> = { 'aday-aydinlatma': 'Aday aydınlatma metni', 'basvuru-aydinlatma': 'Başvuru aydınlatma metni', havuz: 'CV havuzu açık rızası', 'ozel-nitelikli': 'Özel nitelikli veri açık rızası', 'ticari-ileti': 'Ticari ileti onayı' }
  const verilen = new Map<string, number>()
  const geri = new Map<string, number>()
  for (const r of v.rizalar) {
    if (aralikta(r.createdAt, d.bas, d.bit)) verilen.set(r.tur, (verilen.get(r.tur) ?? 0) + 1)
    if (aralikta(r.geriAlinma, d.bas, d.bit)) geri.set(r.tur, (geri.get(r.tur) ?? 0) + 1)
  }
  const erisim = new Map<string, number>()
  // KVKK başvurusunun iş adımları erişim sayılmaz; yalnızca kişinin verisine bakılan işlemler (döküm, CV, profil) sayılır.
  const erisimMi = (x: { tur: string; islem: string; kayitTuru?: string | null }) =>
    x.tur === 'kisisel-veri' && (x.kayitTuru !== 'kvkk-talepleri' || x.islem.includes('veri dökümü')) && !x.islem.startsWith('Saklama süresi')
  for (const k of v.kayitlar.filter(erisimMi)) erisim.set(k.islem, (erisim.get(k.islem) ?? 0) + 1)
  const anonim = v.basvurular.filter((b) => aralikta(b.anonimlestirildi, d.bas, d.bit)).length
  const silinenKayit = v.kayitlar.filter((k) => k.islem === 'Saklama süresi dolan işlem kayıtları silindi').reduce((t, k) => t + Number((k.ayrinti as { adet?: number } | null)?.adet ?? 0), 0)
  const silinenHesap = v.kayitlar.filter((k) => k.islem === 'Aday hesabı silindi')
  const kendisiSildi = silinenHesap.filter((k) => (k.ayrinti as { baslatan?: string } | null)?.baslatan === 'aday').length
  // İlgili kişi başvuruları: dönemde gelenler, dönemde sonuçlananlar ve cevap süreleri
  const gelen = v.kvkk.filter((t) => aralikta(t.basvuruTarihi, d.bas, d.bit))
  const sonuclanan = v.kvkk.filter((t) => t.cevapTarihi && aralikta(t.cevapTarihi, d.bas, d.bit))
  const sureler = sonuclanan.map((t) => cevapSuresi(new Date(t.basvuruTarihi), new Date(t.cevapTarihi!)))
  const asan = sureler.filter((g) => g > 30).length
  const simdi = new Date()
  const acikGeciken = v.kvkk.filter((t) => t.durum !== 'sonuclandi' && kalanGun(new Date(t.basvuruTarihi), simdi) < 0).length
  return {
    ozet: [
      { ad: 'Verilen rıza ve onay', deger: [...verilen.values()].reduce((a, b) => a + b, 0), tanim: 'Dönemde metin sürümüyle kaydedilen onaylar' },
      { ad: 'Geri alınan rıza', deger: [...geri.values()].reduce((a, b) => a + b, 0), tanim: 'Dönemde geri alınan rızalar' },
      { ad: 'KVKK başvurusu', deger: gelen.length, tanim: 'Dönemde gelen ilgili kişi başvuruları' },
      { ad: 'Ortalama cevap süresi', deger: ortalama(sureler) === null ? '—' : `${ortalama(sureler)!.toLocaleString('tr-TR')} gün`, tanim: `Dönemde sonuçlanan başvurular; yasal sınır 30 gün${asan ? `, ${asan} başvuruda aşıldı` : ''}` },
      { ad: 'Silinen aday hesabı', deger: silinenHesap.length, tanim: `${kendisiSildi} hesabı aday kendisi, ${silinenHesap.length - kendisiSildi} hesabı Yönetici A.Ş. başvuru üzerine sildi` },
      { ad: 'Kişisel veri erişimi', deger: [...erisim.values()].reduce((a, b) => a + b, 0), tanim: 'CV indirme, havuz profili açma gibi kayda geçen erişimler' },
      { ad: 'Anonimleştirilen başvuru', deger: anonim, tanim: 'Saklama süresi dolduğu için kişisel verisi silinen başvurular' },
    ],
    tablolar: [
      {
        baslik: 'İlgili kişi başvuruları',
        aciklama: 'Konuya göre dönemde gelen ve sonuçlanan başvurular',
        sutunlar: [{ ad: 'Konu' }, { ad: 'Gelen', sayi: true }, { ad: 'Kabul', sayi: true }, { ad: 'Kısmen kabul', sayi: true }, { ad: 'Ret', sayi: true }],
        satirlar: KVKK_TALEP_TURLERI.map(([t, a]) => [
          a,
          gelen.filter((x) => x.tur === t).length,
          ...(['kabul', 'kismen', 'ret'] as KvkkSonuc[]).map((s) => sonuclanan.filter((x) => x.tur === t && x.sonuc === s).length),
        ]).filter((r) => (r.slice(1) as number[]).some((n) => n > 0)),
        bos: 'Dönemde KVKK başvurusu yok.',
      },
      { baslik: 'Rıza ve onaylar', sutunlar: [{ ad: 'Metin' }, { ad: 'Verilen', sayi: true }, { ad: 'Geri alınan', sayi: true }], satirlar: Object.entries(RIZA).map(([k, a]) => [a, verilen.get(k) ?? 0, geri.get(k) ?? 0]) },
      { baslik: 'Kişisel veri erişimleri', sutunlar: [{ ad: 'İşlem' }, { ad: 'Adet', sayi: true }], satirlar: [...erisim.entries()].sort((a, b) => b[1] - a[1]).map(([a, n]) => [a, n]), bos: 'Dönemde kayda geçen erişim yok.' },
      {
        baslik: 'Silme ve saklama süresi işlemleri',
        sutunlar: [{ ad: 'İşlem' }, { ad: 'Adet', sayi: true }],
        satirlar: [['Silinen aday hesabı', silinenHesap.length], ['Anonimleştirilen başvuru', anonim], ['Silinen işlem kaydı', silinenKayit]],
      },
    ],
    notlar: [
      `Sonuç sütunları (${Object.values(KVKK_SONUC_ADI).join(', ').toLocaleLowerCase('tr')}) dönemde sonuçlanan başvuruları sayar; başvuru daha önceki bir dönemde gelmiş olabilir.`,
      ...(acikGeciken ? [`Bugün itibarıyla ${acikGeciken} açık başvurunun yasal süresi geçti.`] : []),
    ],
  }
}

const HESAPLAR: Record<string, (v: Veri, d: RaporDonemi) => Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'>> = {
  faaliyet,
  ilanlar: ilanRaporu,
  firmalar: firmaRaporu,
  sonuclar: (v) => sonucRaporu(v),
  yetenek: yetenekRaporu,
  kaynak: (v) => kaynakRaporu(v),
  hizmet: (v) => hizmetRaporu(v),
  kvkk: kvkkRaporu,
}

export async function raporHazirla(kod: string, d: RaporDonemi): Promise<Rapor | null> {
  const t = RAPORLAR.find((r) => r.kod === kod)
  const hesap = HESAPLAR[kod]
  if (!t || !hesap) return null
  const v = await veriYukle(d)
  const h = hesap(v, d)
  const gizlilik = `Raporda aday adı veya iletişim bilgisi yer almaz; kişiyi tanınır kılabilecek ${GIZLEME_ESIGI}’ten küçük gruplar gösterilmez.`
  return { kod, ad: t.ad, amac: t.amac, donem: d.ad, olusturma: new Date().toISOString(), ...h, notlar: [...h.notlar, gizlilik] }
}

/** Raporu Excel sayfalarına çevirir: ilk sayfa özet ve notlar, sonra her tablo ayrı sayfa. */
export function raporSayfalari(r: Pick<Rapor, 'ad' | 'donem' | 'olusturma' | 'ozet' | 'tablolar' | 'notlar'>, kurum: string): Sayfa[] {
  const olusturma = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(r.olusturma))
  return [
    {
      ad: 'Özet',
      satirlar: [
        [r.ad],
        ['Dönem', r.donem],
        ['Oluşturma', olusturma],
        ['Kurum', kurum],
        [],
        ['Gösterge', 'Değer', 'Tanım'],
        ...r.ozet.map((o) => [o.ad, o.deger, o.tanim]),
        [],
        ...r.notlar.map((n) => ['Not', n]),
        ['Not', 'Raporda aday adı veya iletişim bilgisi yer almaz.'],
      ],
    },
    ...r.tablolar.map((t) => ({ ad: t.baslik, baslikli: true, satirlar: [t.sutunlar.map((s) => s.ad), ...t.satirlar] })),
  ]
}
