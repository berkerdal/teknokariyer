import Link from 'next/link'

/** Yönetici özetinin iki görünümü: portalın işlevsel göstergeleri ve site trafiği. Dönem seçimi korunur. */
export function OzetSekmeleri({ etkin, donem }: { etkin: 'portal' | 'trafik'; donem?: string }) {
  const q = donem ? `?donem=${donem}` : ''
  return (
    <nav className="ozet-sekmeler" aria-label="Özet görünümü">
      <Link href={`/yonetim/ozet${q}`} aria-current={etkin === 'portal' ? 'page' : undefined}>
        Portal
      </Link>
      <Link href={`/yonetim/ozet/trafik${q}`} aria-current={etkin === 'trafik' ? 'page' : undefined}>
        Site trafiği
      </Link>
    </nav>
  )
}
