/**
 * Teknokent içi konum: “D Blok 208”, “B Blok G19”, “C Blok 302-03”. Karonun rengi bloktan gelir (K36).
 * Saf fonksiyon (birim testli).
 */
export type BlokRengi = 'b' | 'c' | 'd' | 'diger'

const RENKLER: Record<string, BlokRengi> = { B: 'b', C: 'c', D: 'd' }

export function konumAyristir(konum: string | null | undefined): { blok: string | null; oda: string | null; kod: string; renk: BlokRengi } {
  const metin = (konum ?? '').trim()
  const m = /^([A-ZÇĞİÖŞÜ])\s*Blok\s*(.*)$/iu.exec(metin)
  if (m) {
    const blok = m[1]!.toLocaleUpperCase('tr')
    const oda = m[2]!.replace(/\s+/g, '').slice(0, 6) || null
    return { blok, oda, kod: `${blok}${oda ?? ''}`, renk: RENKLER[blok] ?? 'diger' }
  }
  const kod = metin.replace(/\s+/g, '').slice(0, 5) || '—'
  return { blok: null, oda: null, kod, renk: 'diger' }
}
