/**
 * İki aşamalı doğrulama (talimatlar 12: firma ve Yönetici A.Ş. hesaplarında zorunlu, adaylarda isteğe bağlı).
 *
 * Doğrulayıcı uygulama kodu (TOTP, RFC 6238: HMAC-SHA1, 30 saniye, 6 hane) ve tek kullanımlık kurtarma kodları.
 * Google Authenticator, Microsoft Authenticator ve benzerleriyle çalışır. WebCrypto kullanır; Workers ve Node'da aynı.
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

/** Rol için ikinci adım zorunlu mu? Firma ve Yönetici A.Ş. kullanıcıları için evet; aday isterse açar. */
export const ikiAdimZorunluMu = (rol: string | null | undefined) => rol === 'firma' || rol === 'yonetici' || rol === 'moderator' || rol === 'raporlayici'
