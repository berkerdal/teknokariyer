/**
 * İki aşamalı doğrulama (talimatlar 12; kullanıcı kararı K33, 15.11.2026).
 *
 * - Firma ve Yönetici A.Ş. hesaplarında tanınmayan bir cihazdan girişte ikinci adım zorunludur: e-postaya 6 haneli kod.
 *   “Bu cihazı hatırla” denirse aynı cihazda 90 gün kod istenmez (her girişte uzar).
 * - Doğrulayıcı uygulama (TOTP, RFC 6238: HMAC-SHA1, 30 saniye, 6 hane) önerilen seçenektir; kuran kişiye yeni cihazda
 *   e-posta yerine uygulama kodu sorulur. Adaylar da isterse kurar. Tek kullanımlık kurtarma kodları uygulamayla gelir.
 * WebCrypto kullanır; Workers ve Node'da aynı.
 */

export const ADIM_SANIYE = 30
export const HANE = 6
/** Saat kaymasına karşı önceki ve sonraki adım da kabul edilir. */
export const PENCERE = 1
export const KURTARMA_KODU_SAYISI = 10
/** Bu kadar hatalı kodda ikinci adım kilitlenir. */
export const EN_FAZLA_HATA = 5
export const KILIT_DAKIKA = 15

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Yaz(b: Uint8Array): string {
  let bit = 0
  let deger = 0
  let s = ''
  for (const x of b) {
    deger = (deger << 8) | x
    bit += 8
    while (bit >= 5) {
      s += B32[(deger >>> (bit - 5)) & 31]
      bit -= 5
    }
  }
  if (bit > 0) s += B32[(deger << (5 - bit)) & 31]
  return s
}

export function base32Oku(s: string): Uint8Array {
  const temiz = s.toUpperCase().replace(/[\s=-]/g, '')
  const cikti: number[] = []
  let bit = 0
  let deger = 0
  for (const c of temiz) {
    const i = B32.indexOf(c)
    if (i < 0) throw new Error('Geçersiz base32')
    deger = (deger << 5) | i
    bit += 5
    if (bit >= 8) {
      cikti.push((deger >>> (bit - 8)) & 255)
      bit -= 8
    }
  }
  return new Uint8Array(cikti)
}

/** 160 bit rastgele gizli anahtar (base32). */
export function gizliAnahtarUret(): string {
  return base32Yaz(crypto.getRandomValues(new Uint8Array(20)))
}

/** Kullanıcının elle yazabilmesi için dörtlü gruplar: “ABCD EFGH …”. */
export const gruplu = (s: string) => s.replace(/(.{4})/g, '$1 ').trim()

export async function hotp(gizli: string, sayac: number): Promise<string> {
  const anahtar = await crypto.subtle.importKey('raw', base32Oku(gizli) as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const mesaj = new ArrayBuffer(8)
  const g = new DataView(mesaj)
  g.setUint32(0, Math.floor(sayac / 2 ** 32))
  g.setUint32(4, sayac >>> 0)
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', anahtar, mesaj))
  const o = h[h.length - 1]! & 15
  const sayi = ((h[o]! & 127) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!
  return String(sayi % 10 ** HANE).padStart(HANE, '0')
}

export const zamanAdimi = (an: Date) => Math.floor(an.getTime() / 1000 / ADIM_SANIYE)

/**
 * Kodu doğrular. Kabul edilen adım, en son kullanılan adımdan büyük olmalıdır (aynı kod ikinci kez kullanılamaz).
 * Geçerliyse kullanılan adımı, değilse null döner.
 */
export async function totpDogrula(gizli: string, kod: string, simdi: Date, sonAdim = 0): Promise<number | null> {
  const k = kod.replace(/\s/g, '')
  if (!/^\d{6}$/.test(k)) return null
  const adim = zamanAdimi(simdi)
  for (let d = -PENCERE; d <= PENCERE; d++) {
    const a = adim + d
    if (a <= sonAdim) continue
    if ((await hotp(gizli, a)) === k) return a
  }
  return null
}

/** Doğrulayıcı uygulamanın okuyacağı adres (karekodun içeriği). */
export function otpauthAdresi(gizli: string, hesap: string, yayinci = 'TeknoKariyer'): string {
  const etiket = encodeURIComponent(`${yayinci}:${hesap}`)
  return `otpauth://totp/${etiket}?secret=${gizli}&issuer=${encodeURIComponent(yayinci)}&algorithm=SHA1&digits=${HANE}&period=${ADIM_SANIYE}`
}

// Karışan karakterler (0/O, 1/I/L) yok
const KOD_ABECE = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Tek kullanımlık kurtarma kodları: “abcd-efgh”. */
export function kurtarmaKodlariUret(adet = KURTARMA_KODU_SAYISI): string[] {
  return Array.from({ length: adet }, () => {
    const r = crypto.getRandomValues(new Uint8Array(8))
    const s = Array.from(r, (x) => KOD_ABECE[x % KOD_ABECE.length]).join('')
    return `${s.slice(0, 4)}-${s.slice(4)}`
  })
}

export const kurtarmaKoduNormal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export async function ozet(s: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(h), (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Bu rolde yeni cihazdan girişte ikinci adım zorunlu mu? Firma ve Yönetici A.Ş. kullanıcıları için evet. */
export const ikiAdimZorunluMu = (rol: string | null | undefined) => rol === 'firma' || rol === 'yonetici' || rol === 'moderator' || rol === 'raporlayici'

/* ---------- E-posta kodu ve tanınan cihazlar ---------- */

export const EPOSTA_KODU_DAKIKA = 10
export const YENIDEN_GONDER_SANIYE = 60
/** Bir hesabın bir saatte isteyebileceği en fazla e-posta kodu */
export const SAATTE_EN_FAZLA_KOD = 5
export const CIHAZ_GUN = 90
export const EN_FAZLA_CIHAZ = 10

/** 6 haneli e-posta kodu (eşit dağılımlı). */
export function epostaKoduUret(): string {
  const r = crypto.getRandomValues(new Uint32Array(1))[0]!
  return String(r % 1_000_000).padStart(6, '0')
}

/** “ay***@firma.com”: kodun nereye gittiğini, adresi açık etmeden söyler. */
export function epostaMaskele(e: string): string {
  const [ad, alan] = e.split('@')
  if (!ad || !alan) return e
  return `${ad.slice(0, Math.min(2, ad.length))}${'*'.repeat(Math.max(3, ad.length - 2))}@${alan}`
}

/** Tarayıcı kimliğinden kısa ve anlaşılır cihaz adı: “Chrome · Windows”. Kesin değildir; yalnızca listede tanımak için. */
export function cihazAdi(ua: string | null | undefined): string {
  const u = ua ?? ''
  const tarayici = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'Tarayıcı'
  const sistem = /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS X|Macintosh/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'bilinmeyen sistem'
  return `${tarayici} · ${sistem}`
}

export interface TaninanCihaz {
  ozet: string
  ad: string
  ilk: string
  son: string
}

/** Süresi dolmamış cihazlar; en yeni kullanılan önce. */
export function gecerliCihazlar(liste: unknown, simdi: Date): TaninanCihaz[] {
  if (!Array.isArray(liste)) return []
  const sinir = simdi.getTime() - CIHAZ_GUN * 86_400_000
  return (liste as TaninanCihaz[]).filter((c) => c && typeof c.ozet === 'string' && new Date(c.son).getTime() > sinir).sort((a, b) => b.son.localeCompare(a.son))
}

/** Cihazı listeye ekler veya son kullanımını günceller; en fazla 10 cihaz tutulur (en eskisi düşer). */
export function cihazEkle(liste: unknown, c: { ozet: string; ad: string }, simdi: Date): TaninanCihaz[] {
  const an = simdi.toISOString()
  const mevcut = gecerliCihazlar(liste, simdi)
  const eski = mevcut.find((x) => x.ozet === c.ozet)
  const digerleri = mevcut.filter((x) => x.ozet !== c.ozet)
  return [{ ozet: c.ozet, ad: c.ad, ilk: eski?.ilk ?? an, son: an }, ...digerleri].slice(0, EN_FAZLA_CIHAZ)
}
