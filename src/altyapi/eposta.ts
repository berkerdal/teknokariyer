/**
 * E-posta adaptörü.
 *
 * Kural (kurum talimatı, 13.11.2026): Sistem tam olarak kullanıma alınana kadar hiçbir dış adrese e-posta gitmez.
 * Bu yüzden ORTAM açıkça "yayin" olmadıkça her e-posta "test-postalar" koleksiyonuna yazılır ve yönetim panelindeki
 * test posta kutusundan okunur (talimatlar 0.5).
 *
 * Yayın ortamında gönderim servisi henüz seçilmedi (docs/teknoloji-onerisi.md, 5. bölüm). Servis bağlanana kadar
 * yayın ortamında gönderim denemesi sessizce yutulmaz, görünür bir hatayla durur.
 */
import type { EmailAdapter } from 'payload'

export const GONDEREN_ADRES = process.env.EPOSTA_GONDEREN || 'kariyer@pauteknokent.com.tr'
export const GONDEREN_AD = 'TeknoKariyer'

export type Ortam = 'gelistirme' | 'test' | 'yayin'

export function ortam(): Ortam {
  const o = (process.env.ORTAM || '').toLowerCase()
  if (o === 'yayin') return 'yayin'
  if (o === 'test') return 'test'
  return 'gelistirme'
}

/** Yayın dışındaki her ortamda e-posta dışarı çıkmaz. */
export function epostaDisariCikabilirMi(o: Ortam = ortam()): boolean {
  return o === 'yayin'
}

const adresler = (deger: unknown): string => {
  if (!deger) return ''
  const liste = Array.isArray(deger) ? deger : [deger]
  return liste
    .map((a) => (typeof a === 'string' ? a : (a as { address?: string })?.address ?? ''))
    .filter(Boolean)
    .join(', ')
}

export const epostaAdaptoru = (): EmailAdapter => ({ payload }) => ({
  name: 'teknokariyer',
  defaultFromAddress: GONDEREN_ADRES,
  defaultFromName: GONDEREN_AD,
  sendEmail: async (mesaj) => {
    if (!epostaDisariCikabilirMi()) {
      await payload.create({
        collection: 'test-postalar',
        overrideAccess: true,
        data: {
          kime: adresler(mesaj.to),
          konu: String(mesaj.subject ?? ''),
          html: typeof mesaj.html === 'string' ? mesaj.html : '',
          metin: typeof mesaj.text === 'string' ? mesaj.text : '',
          ortam: ortam(),
        },
      })
      return { testKutusunaYazildi: true }
    }
    throw new Error(
      'Yayın ortamı için e-posta servisi henüz bağlanmadı. Gönderim yapılmadı. (docs/teknoloji-onerisi.md, 5. bölüm)',
    )
  },
})
