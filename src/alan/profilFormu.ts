/**
 * Aday profil formlarının okunması ve denetlenmesi (K28).
 * Profil bölüm bölüm kaydedilir: formda hangi bölümler varsa (`profilBolumu` alanları) yalnızca onların alanları güncellenir;
 * başka bölümler hiçbir zaman boşaltılmaz. Düzenleme pencereleri ve profil sihirbazı aynı kuralları kullanır.
 * Saf modül: FormData benzeri bir girdi alır, güncelleme ve Türkçe alan hatalarını döndürür.
 */
import { CEFR, DENEYIM_SIRASI } from './eslesme'
import { SINIFLAR } from './basvuru'

export const PROFIL_BOLUMLERI = [
  'kimlik',
  'hakkinda',
  'egitim',
  'deneyim',
  'deneyimler',
  'beceriler',
  'diller',
  'tercihler',
  'sertifikalar',
  'baglantilar',
] as const
export type ProfilBolumu = (typeof PROFIL_BOLUMLERI)[number]

export interface FormOkuyucu {
  get(ad: string): unknown
  getAll(ad: string): unknown[]
}

export interface DeneyimSatiri {
  kurum: string
  pozisyon: string
  baslangic?: string | null
  bitis?: string | null
  aciklama?: string | null
}

/** Payload'a yazılacak kısmi profil (alan adları koleksiyondakiyle aynı). */
export interface ProfilGuncellemesiHam {
  telefon?: string | null
  cinsiyet?: string | null
  tanitim?: string | null
  okul?: number | null
  bolum?: number | null
  sinif?: string | null
  mezuniyet?: string | null
  gano?: number | null
  deneyimSeviyesi?: string | null
  deneyimler?: DeneyimSatiri[]
  beceriler?: Array<{ beceri: number; seviye: string }>
  diller?: Array<{ dil: number; seviye: string }>
  tercihler?: {
    turler: string[]
    modeller: string[]
    sehir: string | null
    tasinmayaAcik: boolean
    baslama: string | null
    ucretBeklentisi: number | null
  }
  sertifikalar?: Array<{
    ad: string
    kurum: string | null
    ay: number | null
    yil: number | null
    bitisAy: number | null
    bitisYil: number | null
    suresiz: boolean
    kimlikNo: string | null
    url: string | null
    beceriler: number[]
    dosya: number | null
  }>
  baglantilar?: Array<{ ad: string; adres: string }>
}

export interface ProfilFormuSonucu {
  guncelleme: ProfilGuncellemesiHam
  hatalar: Record<string, string>
}

const metin = (f: FormOkuyucu, k: string) => String(f.get(k) ?? '').trim()
const SEVIYELER = ['baslangic', 'orta', 'iyi', 'uzman']
const BU_YIL = new Date().getUTCFullYear()

/** “2026-06” → ISO tarih (ayın 15'i, saat dilimi kaymasın). Geçersizse null. */
export function ayYilTarihi(ay: unknown, yil: unknown): string | null {
  const a = Number(ay)
  const y = Number(yil)
  if (!(a >= 1 && a <= 12 && y >= 1950 && y <= BU_YIL + 10)) return null
  return new Date(Date.UTC(y, a - 1, 15, 9)).toISOString()
}

function jsonDizi(f: FormOkuyucu, ad: string): Array<Record<string, unknown>> {
  try {
    const d = JSON.parse(metin(f, ad) || '[]')
    return Array.isArray(d) ? d.filter((x) => x && typeof x === 'object') : []
  } catch {
    return []
  }
}

const adresGecerliMi = (a: string) => {
  try {
    const u = new URL(a)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export function profilFormunuOku(f: FormOkuyucu): ProfilFormuSonucu {
  const bolumler = new Set(f.getAll('profilBolumu').map(String).filter((b): b is ProfilBolumu => (PROFIL_BOLUMLERI as readonly string[]).includes(b)))
  const g: ProfilGuncellemesiHam = {}
  const h: Record<string, string> = {}

  if (bolumler.has('kimlik')) {
    const tel = metin(f, 'telefon')
    if (tel && !/^[+\d][\d\s()-]{6,19}$/.test(tel)) h.telefon = 'Telefon numaranı 0 5xx xxx xx xx biçiminde yaz.'
    g.telefon = tel || null
    const c = metin(f, 'cinsiyet')
    g.cinsiyet = ['kadin', 'erkek', 'belirtmek-istemiyor'].includes(c) ? c : null
  }
  if (bolumler.has('hakkinda')) {
    const t = metin(f, 'tanitim')
    if (t.length > 500) h.tanitim = `Tanıtım yazın en fazla 500 karakter olabilir; şu an ${t.length} karakter.`
    g.tanitim = t || null
  }
  if (bolumler.has('egitim')) {
    g.okul = Number(metin(f, 'okul')) || null
    g.bolum = Number(metin(f, 'bolum')) || null
    const s = metin(f, 'sinif')
    g.sinif = (SINIFLAR as readonly string[]).includes(s) ? s : null
    const ay = metin(f, 'mezuniyetAy')
    const yil = metin(f, 'mezuniyetYil')
    g.mezuniyet = ayYilTarihi(ay, yil)
    if ((ay || yil) && !g.mezuniyet) h.mezuniyetAy = 'Mezuniyet tarihi için hem ayı hem yılı seç.'
    const gano = metin(f, 'gano').replace(',', '.')
    if (gano && !(Number(gano) >= 0 && Number(gano) <= 4)) h.gano = 'GANO 0 ile 4 arasında bir sayı olmalı (örneğin 3,12).'
    g.gano = gano && !h.gano ? Number(gano) : null
  }
  if (bolumler.has('deneyim')) {
    const d = metin(f, 'deneyimSeviyesi')
    g.deneyimSeviyesi = (DENEYIM_SIRASI as readonly string[]).includes(d) ? d : null
  }
  if (bolumler.has('deneyimler')) {
    const satirlar = jsonDizi(f, 'deneyimlerJson').slice(0, 20)
    g.deneyimler = []
    satirlar.forEach((s, n) => {
      const kurum = String(s.kurum ?? '').trim().slice(0, 120)
      const pozisyon = String(s.pozisyon ?? '').trim().slice(0, 120)
      if (!kurum || !pozisyon) {
        h[`deneyim-${n}`] = `${n + 1}. deneyimde kurum ve pozisyon adını yaz.`
        return
      }
      const baslangic = ayYilTarihi(s.baslangicAy, s.baslangicYil)
      const bitis = s.devam ? null : ayYilTarihi(s.bitisAy, s.bitisYil)
      if (baslangic && bitis && bitis < baslangic) h[`deneyim-${n}`] = `${n + 1}. deneyimde bitiş tarihi başlangıçtan önce olamaz.`
      g.deneyimler!.push({ kurum, pozisyon, baslangic, bitis, aciklama: String(s.aciklama ?? '').trim().slice(0, 1000) || null })
    })
  }
  if (bolumler.has('beceriler')) {
    g.beceriler = f
      .getAll('beceri')
      .map((x) => String(x).split(':'))
      .filter(([id, sev]) => Number(id) && SEVIYELER.includes(sev!))
      .slice(0, 30)
      .map(([id, sev]) => ({ beceri: Number(id), seviye: sev! }))
  }
  if (bolumler.has('diller')) {
    g.diller = f
      .getAll('dil')
      .map((x) => String(x).split(':'))
      .filter(([id, sev]) => Number(id) && (CEFR as readonly string[]).includes(sev!))
      .slice(0, 10)
      .map(([id, sev]) => ({ dil: Number(id), seviye: sev! }))
  }
  if (bolumler.has('tercihler')) {
    const ucret = metin(f, 'ucretBeklentisi').replace(/\D/g, '')
    g.tercihler = {
      turler: f.getAll('tur').map(String).filter((x) => ['is', 'staj'].includes(x)),
      modeller: f.getAll('model').map(String).filter((x) => ['ofiste', 'hibrit', 'uzaktan'].includes(x)),
      sehir: metin(f, 'sehir').slice(0, 60) || null,
      tasinmayaAcik: Boolean(f.get('tasinmayaAcik')),
      baslama: metin(f, 'baslama').slice(0, 60) || null,
      ucretBeklentisi: ucret ? Number(ucret) : null,
    }
  }
  if (bolumler.has('sertifikalar')) {
    g.sertifikalar = []
    jsonDizi(f, 'sertifikalarJson')
      .slice(0, 20)
      .forEach((s, n) => {
        const r = sertifikaSatiri(s, n)
        if ('hata' in r) h[`sertifika-${n}`] = r.hata
        else g.sertifikalar!.push(r.sertifika)
      })
  }
  if (bolumler.has('baglantilar')) {
    g.baglantilar = []
    jsonDizi(f, 'baglantilarJson')
      .slice(0, 10)
      .forEach((s, n) => {
        const ad = String(s.ad ?? '').trim().slice(0, 80)
        let adres = String(s.adres ?? '').trim()
        if (adres && !/^https?:\/\//i.test(adres)) adres = `https://${adres}`
        if (!ad || !adres) return void (h[`baglanti-${n}`] = `${n + 1}. bağlantının adını ve adresini yaz.`)
        if (!adresGecerliMi(adres)) return void (h[`baglanti-${n}`] = `${n + 1}. bağlantının adresi geçerli değil (örneğin github.com/kullanici-adin).`)
        g.baglantilar!.push({ ad, adres: adres.slice(0, 300) })
      })
  }
  return { guncelleme: g, hatalar: h }
}

type SertifikaGirdisi = NonNullable<ProfilGuncellemesiHam['sertifikalar']>[number]
const sayiVeyaBos = (x: unknown) => (Number.isInteger(Number(x)) && Number(x) > 0 ? Number(x) : null)

/**
 * Sertifika satırı (LinkedIn'deki “Lisans ve sertifikalar” örnek alındı): ad ve veren kurum zorunlu; veriliş ve
 * geçerlilik bitişi ay/yıl; “süresi dolmaz” işaretliyse bitiş tarihi yok sayılır; doğrulama bağlantısı https ile
 * tamamlanır; en fazla 10 ilgili beceri; belge yüklenmiş dosyanın kimliği. Dosyanın adaya ait olduğu servis denetler.
 */
export function sertifikaSatiri(s: Record<string, unknown>, n: number): { sertifika: SertifikaGirdisi } | { hata: string } {
  const sira = `${n + 1}. sertifika`
  const ad = String(s.ad ?? '').trim().slice(0, 150)
  const kurum = String(s.kurum ?? '').trim().slice(0, 120)
  if (!ad || !kurum) return { hata: `${sira}: adını ve veren kurumu yaz.` }
  const ay = sayiVeyaBos(s.ay)
  const yil = sayiVeyaBos(s.yil)
  const suresiz = Boolean(s.suresiz)
  const bitisAy = suresiz ? null : sayiVeyaBos(s.bitisAy)
  const bitisYil = suresiz ? null : sayiVeyaBos(s.bitisYil)
  if ((ay && (ay < 1 || ay > 12)) || (bitisAy && (bitisAy < 1 || bitisAy > 12))) return { hata: `${sira}: ay geçerli değil.` }
  if (ay && !yil) return { hata: `${sira}: veriliş tarihinin yılını da seç.` }
  if (bitisAy && !bitisYil) return { hata: `${sira}: geçerlilik bitişinin yılını da seç.` }
  if (yil && (yil < 1950 || yil > BU_YIL)) return { hata: `${sira}: veriliş yılı geçerli değil.` }
  if (bitisYil && (bitisYil < 1950 || bitisYil > BU_YIL + 50)) return { hata: `${sira}: geçerlilik bitiş yılı geçerli değil.` }
  if (yil && bitisYil && bitisYil * 12 + (bitisAy ?? 12) < yil * 12 + (ay ?? 1)) return { hata: `${sira}: geçerlilik bitişi veriliş tarihinden önce olamaz.` }
  let url = String(s.url ?? '').trim()
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
  if (url && !adresGecerliMi(url)) return { hata: `${sira}: doğrulama bağlantısı geçerli değil (örneğin www.credly.com/badges/…).` }
  const beceriler = [...new Set((Array.isArray(s.beceriler) ? s.beceriler : []).map((x) => sayiVeyaBos(x)).filter((x): x is number => x !== null))].slice(0, 10)
  return {
    sertifika: {
      ad,
      kurum,
      ay,
      yil,
      bitisAy,
      bitisYil,
      suresiz,
      kimlikNo: String(s.kimlikNo ?? '').trim().slice(0, 80) || null,
      url: url ? url.slice(0, 300) : null,
      beceriler,
      dosya: sayiVeyaBos(s.dosya),
    },
  }
}
