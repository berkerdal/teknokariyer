/**
 * Çerezsiz site trafiği ölçümü (talimatlar 9; kullanıcı isteği 15.11.2026). Saf kurallar.
 *
 * İlke: kişiyi tanıyacak hiçbir şey tutulmaz. IP adresi, çerez, tarayıcı kimliği, tam yönlendiren adres ve sorgu dizgisi
 * saklanmaz. Bu yüzden “tekil ziyaretçi” sayılamaz; onun yerine **ziyaret** sayılır: siteye dışarıdan (başka siteden,
 * arama motorundan veya doğrudan adres yazarak) gelinen her sayfa açılışı bir ziyarettir. Site içi gezinme yalnızca
 * sayfa görüntüleme olarak sayılır.
 *
 * İstatistik çerezine izin veren ziyaretçide (src/alan/cerez.ts) tarayıcı yalnızca üç işaret gönderir: ilk kez mi
 * geliyor, bugünün ilk açılışı mı, bu ayın ilk açılışı mı. Bunlardan günlük ve aylık tekil ziyaretçi ile yeni ziyaretçi
 * sayılır (yalnızca izin verenler için; izin oranı da tutulur). Kimlik yine yoktur.
 */

export type Kaynak = 'dogrudan' | 'arama' | 'linkedin' | 'sosyal' | 'kurum' | 'diger' | 'ic'
export type Cihaz = 'mobil' | 'tablet' | 'masaustu'

export const KAYNAK_ADI: Record<Kaynak, string> = {
  dogrudan: 'Doğrudan (adres yazılarak, yer imi, e-posta)',
  arama: 'Arama motorları',
  linkedin: 'LinkedIn',
  sosyal: 'Diğer sosyal medya',
  kurum: 'Teknokent ve PAÜ siteleri',
  diger: 'Diğer siteler',
  ic: 'Site içi gezinme',
}
export const CIHAZ_ADI: Record<Cihaz, string> = { mobil: 'Telefon', tablet: 'Tablet', masaustu: 'Bilgisayar' }

/** Ölçülmeyen yollar: paneller, hesap sayfaları ve teknik adresler (iç kullanım; site trafiği değil). */
const OLCULMEYEN = /^\/(hesabim|firma-paneli|yonetim|yonetim-islem|admin|api|_next|giris\/ikinci-adim|hesap-guvenligi|davet|dogrula|sifre|olcum|firma-logosu)(\/|$)/

/** Yolu sadeleştirir: sorgu ve # atılır, sondaki / kaldırılır, uzunluk sınırlanır. Ölçülmeyecekse null. */
export function yolNormallestir(ham: string): string | null {
  if (typeof ham !== 'string' || !ham.startsWith('/')) return null
  let yol = ham.split(/[?#]/)[0]!.replace(/\/{2,}/g, '/')
  if (yol.length > 1) yol = yol.replace(/\/$/, '')
  try {
    yol = decodeURIComponent(yol)
  } catch {
    return null
  }
  if (OLCULMEYEN.test(yol) || /[\s<>"']/.test(yol)) return null
  return yol.slice(0, 160)
}

const ARAMA = /(^|\.)(google|bing|yandex|duckduckgo|yahoo|ecosia|baidu|qwant|startpage|search\.brave)\./
const LINKEDIN = /(^|\.)(linkedin\.com|lnkd\.in)$/
const SOSYAL = /(^|\.)(facebook\.com|fb\.com|instagram\.com|t\.co|twitter\.com|x\.com|whatsapp\.com|wa\.me|youtube\.com|tiktok\.com|threads\.net|reddit\.com|eksisozluk\.com|t\.me|telegram\.org)$/
const KURUM = /(^|\.)(pauteknokent\.com\.tr|pauteknokent\.com|pauteknokent\.org|pau\.edu\.tr)$/

/** Site adı (www. olmadan, küçük harf) veya geçersizse null. */
export function siteAdi(adres: string): string | null {
  try {
    const u = new URL(adres)
    if (!/^https?:$/.test(u.protocol)) return null
    return u.hostname.toLowerCase().replace(/^www\./, '').slice(0, 80)
  } catch {
    return null
  }
}

/**
 * Kaynağı sınıflandırır. `isaret` bağlantıdaki `?kaynak=` veya `utm_source` değeridir (ör. LinkedIn paylaşımında
 * `?kaynak=linkedin`); yönlendiren adres gizlenmiş olsa da kaynağı gösterir.
 */
export function kaynakSiniflandir(yonlendiren: string, kendiSite: string, isaret?: string | null): { kaynak: Kaynak; site: string | null } {
  const host = yonlendiren ? siteAdi(yonlendiren) : null
  const kendi = siteAdi(kendiSite)
  if (host && kendi && host === kendi) return { kaynak: 'ic', site: null }
  const i = (isaret ?? '').toLowerCase()
  if (i === 'linkedin') return { kaynak: 'linkedin', site: host ?? 'linkedin.com' }
  if (!host) return { kaynak: 'dogrudan', site: null }
  if (LINKEDIN.test(host)) return { kaynak: 'linkedin', site: host }
  if (ARAMA.test(host)) return { kaynak: 'arama', site: host }
  if (SOSYAL.test(host)) return { kaynak: 'sosyal', site: host }
  if (KURUM.test(host)) return { kaynak: 'kurum', site: host }
  return { kaynak: 'diger', site: host }
}

const BOT = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|python-|curl\/|wget|axios|node-fetch|go-http|java\/|httpclient|monitor|uptime/i

/** Cihaz türü; bot ve otomatik araçlarda null (sayılmaz). Tam tarayıcı kimliği saklanmaz. */
export function cihazSiniflandir(ua: string | null | undefined): Cihaz | null {
  if (!ua || ua.length < 20 || BOT.test(ua)) return null
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return 'mobil'
  return 'masaustu'
}

export interface TrafikOlayi {
  yol: string
  kaynak: Kaynak
  kaynakSite?: string | null
  cihaz: Cihaz
  giris: boolean
  /** İstatistik çerezine izin verenlerde: ilk geliş, günün ve ayın ilk açılışı */
  istatistik?: { yeni: boolean; gununIlki: boolean; ayinIlki: boolean } | null
}

export type Boyut = 'toplam' | 'yol' | 'kaynak' | 'site' | 'cihaz' | 'giris-yolu'
export interface OzetSatiri {
  boyut: Boyut
  deger: string
  goruntuleme: number
  ziyaret: number
  /** İzinli ziyaretçilerde günün ilk açılışı (= günlük tekil ziyaretçi) */
  tekilGun: number
  /** İzinli ziyaretçilerde ayın ilk açılışı (= aylık tekil ziyaretçi) */
  tekilAy: number
  /** İzinli ziyaretçilerde ilk kez gelen */
  yeni: number
  /** İstatistik iznine sahip ziyaret (izin oranı için) */
  izinli: number
}

const bosSatir = (boyut: Boyut, deger: string): OzetSatiri => ({ boyut, deger, goruntuleme: 0, ziyaret: 0, tekilGun: 0, tekilAy: 0, yeni: 0, izinli: 0 })

/**
 * Ham olayları boyut boyut toplar. Ziyaret, dışarıdan gelinen (giriş) görüntülemedir. Kaynak, site ve cihaz
 * boyutlarında ziyaret de görüntüleme de sayılır; “giriş-yolu” yalnızca ziyaretlerin açıldığı sayfaları sayar.
 */
export function olaylariOzetle(olaylar: TrafikOlayi[]): OzetSatiri[] {
  const m = new Map<string, OzetSatiri>()
  for (const o of olaylar) {
    const ekle = (boyut: Boyut, deger: string) => {
      const a = `${boyut}\u0000${deger}`
      const s = m.get(a) ?? bosSatir(boyut, deger)
      s.goruntuleme++
      if (o.giris) s.ziyaret++
      if (o.istatistik) {
        if (o.istatistik.gununIlki) s.tekilGun++
        if (o.istatistik.ayinIlki) s.tekilAy++
        if (o.istatistik.yeni) s.yeni++
        if (o.giris) s.izinli++
      }
      m.set(a, s)
    }
    ekle('toplam', '-')
    ekle('yol', o.yol)
    ekle('cihaz', o.cihaz)
    if (o.giris) {
      ekle('kaynak', o.kaynak)
      if (o.kaynakSite) ekle('site', o.kaynakSite)
      ekle('giris-yolu', o.yol)
    }
  }
  return [...m.values()]
}

/** Aynı boyut ve değerdeki satırları toplar (birden çok günü birleştirmek için). */
export function satirlariTopla(satirlar: Array<Pick<OzetSatiri, 'boyut' | 'deger' | 'goruntuleme' | 'ziyaret'> & Partial<OzetSatiri>>): OzetSatiri[] {
  const m = new Map<string, OzetSatiri>()
  for (const s of satirlar) {
    const a = `${s.boyut}\u0000${s.deger}`
    const t = m.get(a) ?? bosSatir(s.boyut as Boyut, s.deger)
    t.goruntuleme += s.goruntuleme
    t.ziyaret += s.ziyaret
    t.tekilGun += s.tekilGun ?? 0
    t.tekilAy += s.tekilAy ?? 0
    t.yeni += s.yeni ?? 0
    t.izinli += s.izinli ?? 0
    m.set(a, t)
  }
  return [...m.values()]
}

/** Dönemin günleri için (haftalık dönemde 7 günlük dilimler) ziyaret ve görüntüleme dizisi; boş günler 0. */
export function gunlukDizi(
  satirlar: Array<{ gun: string; goruntuleme: number; ziyaret: number }>,
  d: { bas: Date; bit: Date; adimGun: 1 | 7 },
  gunMetni: (an: Date) => string,
): Array<{ gun: string; goruntuleme: number; ziyaret: number }> {
  const adim = d.adimGun * 86_400_000
  const adet = Math.ceil((d.bit.getTime() - d.bas.getTime()) / adim)
  const dizi = Array.from({ length: adet }, (_, i) => ({ gun: gunMetni(new Date(d.bas.getTime() + i * adim)), goruntuleme: 0, ziyaret: 0 }))
  const ilkGun = new Date(`${dizi[0]?.gun}T00:00:00Z`).getTime()
  for (const s of satirlar) {
    const i = Math.floor((new Date(`${s.gun}T00:00:00Z`).getTime() - ilkGun) / adim)
    if (dizi[i]) {
      dizi[i].goruntuleme += s.goruntuleme
      dizi[i].ziyaret += s.ziyaret
    }
  }
  return dizi
}

const SABIT_SAYFALAR: Record<string, string> = {
  '/': 'Ana sayfa',
  '/ilanlar': 'İlan listesi',
  '/firmalar': 'Firmalar',
  '/giris': 'Giriş',
  '/kayit': 'Hesap açma',
  '/sifremi-unuttum': 'Şifremi unuttum',
  '/kvkk-basvurusu': 'KVKK başvurusu',
  '/basvuru-tamam': 'Başvuru tamamlandı',
  '/hesap-silindi': 'Hesap silindi',
  '(diğer)': 'Diğer sayfalar',
}

export type SayfaTuru = { tur: 'sabit'; ad: string } | { tur: 'ilan'; id: number; basvuru: boolean } | { tur: 'firma'; slug: string } | { tur: 'metin'; ad: string }

/** Yolun ne sayfası olduğu: ilan ve firma adları veri katmanında kimlikten bulunur. */
export function sayfaTuru(yol: string): SayfaTuru {
  if (SABIT_SAYFALAR[yol]) return { tur: 'sabit', ad: SABIT_SAYFALAR[yol] }
  const ilan = /^\/ilan\/(\d+)(?:-[^/]*)?(\/basvur)?$/.exec(yol)
  if (ilan) return { tur: 'ilan', id: Number(ilan[1]), basvuru: Boolean(ilan[2]) }
  const firma = /^\/firma\/([^/]+)$/.exec(yol)
  if (firma) return { tur: 'firma', slug: firma[1]! }
  if (yol.startsWith('/metin/')) return { tur: 'metin', ad: 'Bilgilendirme metni' }
  return { tur: 'sabit', ad: yol }
}
