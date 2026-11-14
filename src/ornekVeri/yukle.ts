/**
 * Test ortamı için örnek veri (K13, K17).
 * - Firmalar gerçek rehber kayıtlarıdır ve “test firması” olarak işaretlenir: yayın ortamında hiçbir zaman görünmez.
 * - İlanlar, kişiler ve sayılar örnektir; tarihler yükleme gününe göre kaydırılır.
 * - Tekrar çalıştırılabilir: var olan kayıt yeniden oluşturulmaz.
 * - Yayın ortamında çalışmaz.
 * - Giriş yapılabilen örnek hesaplar yalnızca ORNEK_SIFRE verilirse açılır (parola depoda tutulmaz).
 */
import { ilanKopyasi } from '@/alan/ilan'
import type { Payload } from 'payload'
import { DENEYIM_ADI, MODEL_ADI } from '@/alan/eslesme'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { ortam } from '@/altyapi/eposta'
import veri from './veri.json'

type Tur = 'beceri' | 'pozisyon-ailesi' | 'sektor' | 'universite' | 'bolum' | 'dil'
const tersi = <T extends string>(k: Record<T, string>) => Object.fromEntries(Object.entries(k).map(([a, b]) => [b, a])) as Record<string, T>
const DENEYIM = tersi(DENEYIM_ADI)
const MODEL = tersi(MODEL_ADI)
const ALT_TUR = { ...tersi(ALT_TUR_ADI), 'Proje bazlı': 'proje' } as Record<string, string>
const SEVIYE: Record<string, 'baslangic' | 'orta' | 'iyi' | 'uzman'> = { Başlangıç: 'baslangic', Orta: 'orta', İyi: 'iyi', Uzman: 'uzman' }
const EGITIM = (s: string) => (s.startsWith('Önlisans') ? 'onlisans' : s.startsWith('Yüksek') ? 'yuksek-lisans' : 'lisans')
const GUN = 86_400_000

const TEMEL_UNIVERSITELER = [
  'Pamukkale Üniversitesi', 'Ege Üniversitesi', 'Dokuz Eylül Üniversitesi', 'İzmir Yüksek Teknoloji Enstitüsü',
  'Muğla Sıtkı Koçman Üniversitesi', 'Afyon Kocatepe Üniversitesi', 'Uşak Üniversitesi', 'Süleyman Demirel Üniversitesi',
  'Orta Doğu Teknik Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Hacettepe Üniversitesi', 'Boğaziçi Üniversitesi',
  'Bilkent Üniversitesi', 'Yıldız Teknik Üniversitesi', 'Anadolu Üniversitesi (Açıköğretim)',
]
const TEMEL_BOLUMLER = [
  'Bilgisayar Mühendisliği', 'Yazılım Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Makine Mühendisliği',
  'Endüstri Mühendisliği', 'Biyomedikal Mühendisliği', 'Mekatronik Mühendisliği', 'İnşaat Mühendisliği',
  'Tekstil Mühendisliği', 'Kimya Mühendisliği', 'Yönetim Bilişim Sistemleri', 'İstatistik', 'Matematik', 'Fizik',
  'İşletme', 'İktisat', 'Bilgisayar Programcılığı', 'Elektronik Teknolojisi', 'Grafik Tasarım', 'Endüstriyel Tasarım',
]

interface OrnekIlan {
  firma: string
  poz: string
  tur: string
  alt: string
  aile: string
  model: string
  deneyim: string
  egitim: string
  bolumler: string[]
  zorunlu: string[]
  tercih: string[]
  dil: string[][]
  pozSayi?: number
  sonGun: number
  yayinGun: number
  ucret?: string | null
  yanHak: string[]
  is: string[]
  nitelik: string[]
  sorular?: number
  staj?: { donem?: string; sgk?: string; belge?: string }
  ucretliStaj?: boolean
  pau?: boolean
  basvuru?: number
}

export interface YuklemeSonucu {
  taksonomi: number
  firma: number
  ilan: number
  kullanici: number
}

export async function ornekVeriYukle(payload: Payload, simdi = new Date()): Promise<YuklemeSonucu> {
  if (ortam() === 'yayin') throw new Error('Örnek veri yayın ortamına yüklenmez.')
  const sonuc: YuklemeSonucu = { taksonomi: 0, firma: 0, ilan: 0, kullanici: 0 }
  const onbellek = new Map<string, number>()

  async function taksonomi(tur: Tur, ad: string): Promise<number> {
    const anahtar = `${tur}:${ad}`
    if (onbellek.has(anahtar)) return onbellek.get(anahtar)!
    const { docs } = await payload.find({ collection: 'taksonomiler', where: { and: [{ tur: { equals: tur } }, { ad: { equals: ad } }] }, limit: 1, overrideAccess: true })
    const id = docs[0]?.id ?? (await payload.create({ collection: 'taksonomiler', data: { tur, ad }, overrideAccess: true })).id
    if (!docs[0]) sonuc.taksonomi++
    onbellek.set(anahtar, id)
    return id
  }

  /* Temel listeler: başvuruda okul ve bölüm seçilebilsin. Kalıcı çözüm, Yönetici A.Ş.'nin tam YÖK listesini içe aktarması. */
  for (const ad of TEMEL_UNIVERSITELER) await taksonomi('universite', ad)
  for (const ad of TEMEL_BOLUMLER) await taksonomi('bolum', ad)
  for (const ad of ['İngilizce', 'Almanca', 'Fransızca', 'Rusça', 'Arapça']) await taksonomi('dil', ad)

  /* Firmalar */
  const firmaId = new Map<string, number>()
  for (const [slug, f] of Object.entries(veri.firmalar) as Array<[string, { ad: string; unvan: string; sektor: string; konum: string; web?: string }]>) {
    const { docs } = await payload.find({ collection: 'firmalar', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
    if (docs[0]) {
      firmaId.set(slug, docs[0].id)
      continue
    }
    const yeni = await payload.create({
      collection: 'firmalar',
      overrideAccess: true,
      data: {
        unvan: f.unvan,
        kisaAd: f.ad,
        slug,
        konum: f.konum,
        sektor: await taksonomi('sektor', f.sektor),
        web: f.web,
        kisaTanitim: `${f.ad}, Pamukkale Teknokent’te ${f.sektor.toLocaleLowerCase('tr')} alanında çalışan bir firma. (Örnek tanıtım metni; gerçek metni firma yazacak.)`,
        asama: 'profil-tamam',
        testFirmasi: true,
      } as never,
    })
    firmaId.set(slug, yeni.id)
    sonuc.firma++
  }

  /* İlanlar */
  for (const i of veri.ilanlar as OrnekIlan[]) {
    const pozisyonAdi = i.poz as string
    const firma = firmaId.get(i.firma)!
    const { docs } = await payload.find({
      collection: 'ilanlar',
      where: { and: [{ firma: { equals: firma } }, { pozisyonAdi: { equals: pozisyonAdi } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (docs[0]) continue
    const tarih = (gun: number) => new Date(simdi.getTime() + gun * GUN).toISOString()
    const ucret = typeof i.ucret === 'string' ? i.ucret.match(/([\d.]+)–([\d.]+)/) : null
    const staj = i.tur === 'Staj'
    await payload.create({
      collection: 'ilanlar',
      overrideAccess: true,
      data: {
        firma,
        pozisyonAdi,
        tur: staj ? 'staj' : 'is',
        altTur: ALT_TUR[i.alt] ?? 'tam-zamanli',
        aile: await taksonomi('pozisyon-ailesi', i.aile),
        model: MODEL[i.model],
        deneyim: DENEYIM[i.deneyim],
        egitim: EGITIM(i.egitim),
        bolumler: await Promise.all(i.bolumler.map((b) => taksonomi('bolum', b))),
        zorunluBeceriler: await Promise.all(i.zorunlu.map((b) => taksonomi('beceri', b))),
        tercihBeceriler: await Promise.all(i.tercih.map((b) => taksonomi('beceri', b))),
        diller: await Promise.all(i.dil.map(async ([d, s]) => ({ dil: await taksonomi('dil', d), seviye: s }))),
        pozisyonSayisi: i.pozSayi ?? 1,
        sonBasvuru: tarih(i.sonGun),
        yayinTarihi: tarih(i.yayinGun),
        ...(ucret ? { ucretEnAz: Number(ucret[1].replace(/\./g, '')), ucretEnCok: Number(ucret[2].replace(/\./g, '')), ucretGorunur: true } : {}),
        yanHaklar: i.yanHak.map((ad) => ({ ad })),
        isTanimi: i.is.map((m) => `- ${m}`).join('\n'),
        nitelikler: i.nitelik.map((m) => `- ${m}`).join('\n'),
        onElemeSorulari: Array.from({ length: i.sorular ?? 0 }, (_, n) =>
          n === 0
            ? { soru: staj ? 'Staj dönemi boyunca haftada en az 3 tam gün çalışabilir misin?' : 'Ne zaman işe başlayabilirsin?', tip: staj ? 'evet-hayir' : 'kisa', eleyici: false }
            : { soru: 'Bu alanda yaptığın bir projeyi kısaca anlatır mısın?', tip: 'kisa', eleyici: false },
        ),
        ...(staj
          ? {
              stajDonemi: i.staj?.donem,
              ucretliStaj: Boolean(i.ucretliStaj),
              sgk: i.staj?.sgk?.startsWith('Firma') ? 'firma' : 'okul',
              stajBelgesi: i.staj?.belge !== 'İmzalanmıyor',
              pauOncelik: Boolean(i.pau),
            }
          : {}),
        durum: 'yayinda',
        basvuruSayisi: i.basvuru ?? 0,
      } as never,
    })
    sonuc.ilan++
  }

  /*
   * Firma panelinin her durumu denenebilsin diye Kodpit'e farklı durumlarda kurgusal ilanlar (K17). Flutter ilanının
   * kopyası olarak açılır; yalnızca pozisyon adı, durum ve tarih değişir.
   */
  const kodpit = firmaId.get('kodpit')
  const temel = kodpit
    ? (await payload.find({ collection: 'ilanlar', where: { and: [{ firma: { equals: kodpit } }, { pozisyonAdi: { equals: 'Flutter Geliştirici' } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    : undefined
  if (temel) {
    const tarih = (gun: number) => new Date(simdi.getTime() + gun * GUN).toISOString()
    const ekler: Array<Record<string, unknown>> = [
      { pozisyonAdi: 'Kıdemli Flutter Geliştirici', durum: 'taslak', sonBasvuru: tarih(30) },
      { pozisyonAdi: 'Backend Geliştirici (Node.js)', durum: 'onayda', sonBasvuru: tarih(35) },
      {
        pozisyonAdi: 'Arayüz Tasarımcısı',
        durum: 'duzeltme',
        sonBasvuru: tarih(28),
        duzeltmeGerekcesi: 'Ücret aralığının en az değeri en çok değerinden büyük görünüyor. Aralığı düzeltip yeniden gönderin.',
      },
      { pozisyonAdi: 'Front-end Geliştirici', durum: 'duraklatildi', sonBasvuru: tarih(12), yayinTarihi: tarih(-10) },
      { pozisyonAdi: 'Test Uzmanı', durum: 'kapandi', kapanisNedeni: 'doldu', sonBasvuru: tarih(5), yayinTarihi: tarih(-40) },
    ]
    for (const e of ekler) {
      const var_ = await payload.count({ collection: 'ilanlar', where: { and: [{ firma: { equals: kodpit } }, { pozisyonAdi: { equals: e.pozisyonAdi } }] }, overrideAccess: true })
      if (var_.totalDocs) continue
      const kopya = ilanKopyasi(temel as unknown as Record<string, unknown>)
      delete kopya.arama
      await payload.create({ collection: 'ilanlar', overrideAccess: true, data: { ...kopya, basvuruSayisi: 0, ...e } as never })
      sonuc.ilan++
    }
  }

  /* Örnek aday (kurgusal kişi). Yalnızca ORNEK_SIFRE verilirse giriş yapılabilir hesap açılır. */
  const sifre = process.env.ORNEK_SIFRE
  if (sifre) {
    const a = veri.aday
    const { docs } = await payload.find({ collection: 'kullanicilar', where: { email: { equals: a.eposta } }, limit: 1, overrideAccess: true })
    if (!docs[0]) {
      const k = await payload.create({
        collection: 'kullanicilar',
        overrideAccess: true,
        disableVerificationEmail: true,
        data: { email: a.eposta, password: sifre, ad: a.ad, rol: 'aday', _verified: true } as never,
      })
      await payload.create({
        collection: 'adaylar',
        overrideAccess: true,
        data: {
          kullanici: k.id,
          tanitim: a.tanitim,
          okul: await taksonomi('universite', a.okul),
          bolum: await taksonomi('bolum', a.bolum),
          sinif: a.sinif,
          deneyimSeviyesi: 'ogrenci',
          beceriler: await Promise.all(Object.entries(a.beceriler).map(async ([b, s]) => ({ beceri: await taksonomi('beceri', b), seviye: SEVIYE[s as string] }))),
          diller: await Promise.all((a.diller as string[][]).map(async ([d, s]) => ({ dil: await taksonomi('dil', d), seviye: s }))),
          tercihler: { turler: ['staj', 'is'], modeller: (a.modeller as string[]).map((m) => MODEL[m]), sehir: 'Denizli' },
          havuz: { gorunurluk: 'gizli' },
        } as never,
      })
      sonuc.kullanici++
    }
    /* Örnek firma kullanıcısı (kurgusal kişi, Kodpit'in firma yöneticisi). `.test` alan adı gerçek bir kişiye ait olamaz. */
    const fk = { eposta: 'kodpit@kariyer.test', ad: 'Selin Aydemir' }
    const varMi = await payload.count({ collection: 'kullanicilar', where: { email: { equals: fk.eposta } }, overrideAccess: true })
    if (kodpit && !varMi.totalDocs) {
      await payload.create({
        collection: 'kullanicilar',
        overrideAccess: true,
        disableVerificationEmail: true,
        data: { email: fk.eposta, password: sifre, ad: fk.ad, rol: 'firma', firma: kodpit, firmaYetkisi: 'yonetici', _verified: true } as never,
      })
      sonuc.kullanici++
    }
  }
  return sonuc
}
