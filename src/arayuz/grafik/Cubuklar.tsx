/**
 * Sıralı yatay çubuklar ve huni (sunucu bileşeni; HTML). Tek seri, tek renk; değer çubuğun ucunda, metin rengiyle.
 * Gizlenen (5'ten küçük) grupta çubuk çizilmez, “5'ten az” yazılır. Her çubuğun değeri metin olarak da okunur.
 */
import type { Grup } from '@/alan/ozet'

export function SiraliCubuklar({ gruplar, birim, bos }: { gruplar: Grup[]; birim: string; bos: string }) {
  if (!gruplar.length) return <p className="kucuk ikincil">{bos}</p>
  const enBuyuk = Math.max(1, ...gruplar.map((g) => g.n ?? 0))
  return (
    <ul className="cubuklar-liste">
      {gruplar.map((g) => (
        <li key={g.ad}>
          <span className="cubuk-ad">{g.ad}</span>
          <span className="cubuk-iz" aria-hidden="true">
            {g.n !== null && <span className="cubuk-dolgu" style={{ width: `${(g.n / enBuyuk) * 100}%` }} />}
          </span>
          <span className="cubuk-deger">
            {g.n === null ? '5’ten az' : g.n.toLocaleString('tr-TR')}
            <span className="gizli"> {birim}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Huni({ adimlar }: { adimlar: Array<{ kod: string; ad: string; n: number; oran: number | null }> }) {
  const ilk = Math.max(1, adimlar[0]?.n ?? 0)
  return (
    <ol className="cubuklar-liste huni-liste">
      {adimlar.map((a, i) => (
        <li key={a.kod}>
          <span className="cubuk-ad">{a.ad}</span>
          <span className="cubuk-iz" aria-hidden="true">
            <span className={`cubuk-dolgu huni-${i}`} style={{ width: `${(a.n / ilk) * 100}%` }} />
          </span>
          <span className="cubuk-deger">
            {a.n.toLocaleString('tr-TR')}
            {i > 0 && a.oran !== null && <span className="ikincil"> · %{a.oran.toLocaleString('tr-TR')}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
