/**
 * Dil ve adres bilgisi (talimatlar 14). Arayüz şimdilik yalnızca Türkçe; İngilizce sürüm kurumun kararını bekliyor.
 * hreflang ve site haritası bu listeden üretilir: İngilizce eklendiğinde buraya `{ kod: 'en', onEk: '/en' }` girer,
 * sayfaların ve site haritasının hreflang bağlantıları kendiliğinden çoğalır.
 */
export interface Dil {
  /** hreflang kodu */
  kod: string
  /** Adres ön eki ('' = kökte) */
  onEk: string
}

export const DILLER: Dil[] = [{ kod: 'tr', onEk: '' }]
export const VARSAYILAN_DIL = DILLER[0]!

/** Bir sayfanın kanonik adresi ve dil karşılıkları (Next `alternates`). Yol `/` ile başlar, sorgu içerebilir. */
export function dilAdresleri(yol: string): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {}
  for (const d of DILLER) languages[d.kod] = d.onEk + yol
  languages['x-default'] = VARSAYILAN_DIL.onEk + yol
  return { canonical: VARSAYILAN_DIL.onEk + yol, languages }
}
