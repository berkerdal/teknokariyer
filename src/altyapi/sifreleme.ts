/**
 * Sunucu tarafı simetrik şifreleme (AES-GCM). Anahtar PAYLOAD_SECRET'tan HKDF ile amaca özel türetilir.
 *
 * Kullanım: iki aşamalı doğrulamanın gizli anahtarı veritabanında şifreli durur; giriş sırasında ikinci adım beklenirken
 * oturum anahtarı şifreli ve kısa ömürlü bir çerezde taşınır. PAYLOAD_SECRET değişirse bu veriler çözülemez: kullanıcılar
 * ikinci adımı yeniden kurar (göç rehberinde yazılı).
 */

const anahtarlar = new Map<string, Promise<CryptoKey>>()

function anahtar(amac: string): Promise<CryptoKey> {
  let k = anahtarlar.get(amac)
  if (!k) {
    k = (async () => {
      const gizli = process.env.PAYLOAD_SECRET
      if (!gizli) throw new Error('PAYLOAD_SECRET tanımlı değil')
      const ham = await crypto.subtle.importKey('raw', new TextEncoder().encode(gizli), 'HKDF', false, ['deriveKey'])
      return crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('teknokariyer'), info: new TextEncoder().encode(amac) },
        ham,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      )
    })()
    anahtarlar.set(amac, k)
  }
  return k
}

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64Oku = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

export async function sifrele(metin: string, amac: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await anahtar(amac), new TextEncoder().encode(metin)))
  const cikti = new Uint8Array(iv.length + ct.length)
  cikti.set(iv)
  cikti.set(ct, iv.length)
  return b64(cikti)
}

/** Çözülemezse (bozuk, başka amaçla veya başka anahtarla şifrelenmiş) null. */
export async function coz(veri: string, amac: string): Promise<string | null> {
  try {
    const b = b64Oku(veri)
    const acik = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, await anahtar(amac), b.slice(12))
    return new TextDecoder().decode(acik)
  } catch {
    return null
  }
}
