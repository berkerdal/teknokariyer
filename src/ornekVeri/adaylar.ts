/**
 * Firma paneli denemesi için kurgusal adaylar (K17: uydurma aday adları). Her biri profil, PDF CV, başvuru ve/veya
 * CV havuzu katılımıyla gelir. Gerçek akışı kullanır (profil, CV, başvuru ve rıza servisleri); kısa yol yok.
 * Hesaplar rastgele, kimsenin bilmediği bir şifreyle açılır: giriş yapılamaz. E-postalar `.test` alan adındadır.
 */
import type { Payload } from 'payload'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { FILIGRAN_YAZI_TIPI } from '@/altyapi/filigranYaziTipi'
import { basvur } from '@/servisler/basvuru'
import { cvYukle, havuzaKatil, profilGuncelle } from '@/servisler/profil'
import type { Kullanici } from '@/servisler/ortak'

type Taksonomi = (tur: 'beceri' | 'universite' | 'bolum' | 'dil', ad: string) => Promise<number>

interface OrnekAday {
  eposta: string
  ad: string
  okul: string
  bolum: string
  sinif?: string
  mezuniyet?: string
  deneyim: 'ogrenci' | 'yeni-mezun' | '1-3' | '3-5' | '5+'
  tanitim: string
  beceriler: Array<[string, 'baslangic' | 'orta' | 'iyi' | 'uzman']>
  diller: Array<[string, string]>
  modeller: Array<'ofiste' | 'hibrit' | 'uzaktan'>
  basvurular: Array<{ ilan: string; kaynak?: 'linkedin' | 'portal'; cevaplar: string[] }>
  havuz?: 'aktif' | 'acik'
}

const ADAYLAR: OrnekAday[] = [
  {
    eposta: 'deniz.kaya@kariyer.test', ad: 'Deniz Kaya', okul: 'Pamukkale Üniversitesi', bolum: 'Bilgisayar Mühendisliği', deneyim: '1-3',
    tanitim: 'İki yıldır Flutter ile mobil uygulama geliştiriyorum. Yayında iki uygulamam var.',
    beceriler: [['Dart', 'iyi'], ['Flutter', 'iyi'], ['REST API', 'iyi'], ['Git', 'iyi'], ['Firebase', 'orta']], diller: [['İngilizce', 'B2']], modeller: ['hibrit', 'ofiste'],
    basvurular: [{ ilan: 'Flutter Geliştirici', cevaplar: ['Bir ay içinde başlayabilirim.', 'Bir kargo takip uygulamasını Flutter ile baştan yazdım.'] }], havuz: 'acik',
  },
  {
    eposta: 'ece.yildirim@kariyer.test', ad: 'Ece Yıldırım', okul: 'Ege Üniversitesi', bolum: 'Yazılım Mühendisliği', deneyim: 'yeni-mezun', mezuniyet: '2026-06-30',
    tanitim: 'Yeni mezunum; bitirme projemde Flutter ve Firebase kullandım.',
    beceriler: [['Dart', 'orta'], ['Flutter', 'orta'], ['Git', 'orta']], diller: [['İngilizce', 'B1']], modeller: ['hibrit'],
    basvurular: [{ ilan: 'Flutter Geliştirici', kaynak: 'linkedin', cevaplar: ['Hemen başlayabilirim.', 'Bitirme projem bir etkinlik uygulamasıydı.'] }],
  },
  {
    eposta: 'mert.aksoy@kariyer.test', ad: 'Mert Aksoy', okul: 'Dokuz Eylül Üniversitesi', bolum: 'Elektrik-Elektronik Mühendisliği', deneyim: '3-5',
    tanitim: 'Gömülü sistemler ve Python ile otomasyon üzerine çalışıyorum; mobil geliştirmeye geçmek istiyorum.',
    beceriler: [['Python', 'uzman'], ['C', 'iyi'], ['Git', 'iyi']], diller: [['İngilizce', 'C1']], modeller: ['uzaktan'],
    basvurular: [{ ilan: 'Flutter Geliştirici', cevaplar: ['İki hafta içinde.', 'Endüstriyel bir sensör için Python ile veri toplama yazılımı geliştirdim.'] }],
  },
  {
    eposta: 'zeynep.arslan@kariyer.test', ad: 'Zeynep Arslan', okul: 'Pamukkale Üniversitesi', bolum: 'Bilgisayar Mühendisliği', sinif: '3. sınıf', deneyim: 'ogrenci', mezuniyet: '2028-06-30',
    tanitim: 'Yaz döneminde Teknokent’te staj yapmak istiyorum.',
    beceriler: [['Python', 'orta'], ['Git', 'orta'], ['Flutter', 'baslangic']], diller: [['İngilizce', 'B1']], modeller: ['ofiste', 'hibrit'],
    basvurular: [{ ilan: 'Yazılım Stajyeri', cevaplar: ['Evet'] }], havuz: 'aktif',
  },
  {
    eposta: 'can.ozturk@kariyer.test', ad: 'Can Öztürk', okul: 'Pamukkale Üniversitesi', bolum: 'Yönetim Bilişim Sistemleri', deneyim: 'yeni-mezun', mezuniyet: '2026-06-30',
    tanitim: 'Web uygulamaları ve veri tabanları üzerine çalışıyorum.',
    beceriler: [['React', 'iyi'], ['SQL', 'iyi'], ['Git', 'orta']], diller: [['İngilizce', 'B2'], ['Almanca', 'A2']], modeller: ['hibrit', 'uzaktan'],
    basvurular: [], havuz: 'aktif',
  },
]

async function ornekCv(a: OrnekAday): Promise<Uint8Array> {
  const belge = await PDFDocument.create()
  belge.registerFontkit(fontkit)
  const yazi = await belge.embedFont(Uint8Array.from(atob(FILIGRAN_YAZI_TIPI), (c) => c.charCodeAt(0)), { subset: true })
  const s = belge.addPage([595, 842])
  let y = 780
  const satir = (t: string, boy = 11, renk = rgb(0.1, 0.1, 0.1)) => {
    s.drawText(t, { x: 56, y, size: boy, font: yazi, color: renk })
    y -= boy + 10
  }
  satir('ÖRNEK CV · Kurgusal aday (test ortamı)', 9, rgb(0.6, 0.3, 0.1))
  satir(a.ad, 22)
  satir(`${a.bolum}, ${a.okul}${a.sinif ? `, ${a.sinif}` : ''}`, 12)
  y -= 8
  satir('Hakkımda', 13)
  satir(a.tanitim)
  y -= 8
  satir('Beceriler', 13)
  satir(a.beceriler.map(([b]) => b).join(', '))
  satir('Diller', 13)
  satir(a.diller.map(([d, s2]) => `${d} ${s2}`).join(', '))
  return belge.save({ useObjectStreams: false })
}

export async function ornekAdaylariYukle(payload: Payload, taksonomi: Taksonomi, kodpitId: number | undefined): Promise<number> {
  if (!kodpitId) return 0
  let sayi = 0
  for (const a of ADAYLAR) {
    // Yarıda kalmış bir yükleme kaldığı yerden tamamlanır: her adım ayrıca denetlenir.
    const { docs: var_ } = await payload.find({ collection: 'kullanicilar', where: { email: { equals: a.eposta } }, limit: 1, depth: 0, overrideAccess: true })
    const kullanici = (var_[0] ??
      (await payload.create({
        collection: 'kullanicilar',
        overrideAccess: true,
        disableVerificationEmail: true,
        data: { email: a.eposta, password: `${crypto.randomUUID()}Aa1!`, ad: a.ad, rol: 'aday', _verified: true } as never,
      }))) as unknown as Kullanici
    if (!var_[0]) sayi++
    let aday = (await payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullanici.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    if (!aday) aday = await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: kullanici.id, havuz: { gorunurluk: 'gizli' } } as never })
    await profilGuncelle(payload, kullanici, {
      okul: await taksonomi('universite', a.okul),
      bolum: await taksonomi('bolum', a.bolum),
      sinif: a.sinif,
      mezuniyet: a.mezuniyet,
      deneyimSeviyesi: a.deneyim,
      tanitim: a.tanitim,
      beceriler: await Promise.all(a.beceriler.map(async ([b, s]) => ({ beceri: await taksonomi('beceri', b), seviye: s }))),
      diller: await Promise.all(a.diller.map(async ([d, s]) => ({ dil: await taksonomi('dil', d), seviye: s as never }))),
      tercihler: { turler: ['is', 'staj'], modeller: a.modeller, sehir: 'Denizli' },
    } as never)
    const cvId = aday.cvler?.[0]?.dosya
      ? Number(typeof aday.cvler[0].dosya === 'object' ? aday.cvler[0].dosya.id : aday.cvler[0].dosya)
      : (await cvYukle(payload, kullanici, { ad: 'CV', dosya: await ornekCv(a).then((veri) => ({ veri, boyut: veri.length })) })).id
    for (const b of a.basvurular) {
      const { docs } = await payload.find({ collection: 'ilanlar', where: { and: [{ firma: { equals: kodpitId } }, { pozisyonAdi: { equals: b.ilan } }, { durum: { equals: 'yayinda' } }] }, limit: 1, depth: 0, overrideAccess: true })
      const ilan = docs[0]
      if (!ilan) continue
      const onceki = await payload.count({ collection: 'basvurular', where: { and: [{ ilan: { equals: ilan.id } }, { adayKullanici: { equals: kullanici.id } }] }, overrideAccess: true })
      if (onceki.totalDocs) continue
      const cevaplar = Object.fromEntries((ilan.onElemeSorulari ?? []).map((q, n) => [q.id ?? String(n), b.cevaplar[n] ?? 'Evet']))
      await basvur(payload, kullanici, { ilanId: ilan.id, cvDosyaId: cvId, cevaplar, aydinlatmaOnay: true, havuzaKatil: false, kaynak: b.kaynak ?? 'portal' })
    }
    if (a.havuz && !aday.havuz?.rizaTarihi) await havuzaKatil(payload, kullanici, a.havuz)
  }
  return sayi
}
