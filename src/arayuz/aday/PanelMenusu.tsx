'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ikon, type IkonAdi } from '../Ikon'

const OGELER: Array<{ href: string; ad: string; kisa: string; ikon: IkonAdi }> = [
  { href: '/hesabim', ad: 'Başvurularım', kisa: 'Başvurular', ikon: 'liste' },
  { href: '/hesabim/profil', ad: 'Profil ve CV’ler', kisa: 'Profil', ikon: 'kisi' },
  { href: '/hesabim/havuz', ad: 'CV havuzu', kisa: 'Havuz', ikon: 'ara' },
  { href: '/hesabim/hesap', ad: 'Hesap ve gizlilik', kisa: 'Hesap', ikon: 'ayar' },
]

/** Masaüstünde yan menü, mobilde başparmak erişimli alt menü. */
export function PanelMenusu({ yer }: { yer: 'yan' | 'alt' }) {
  const yol = usePathname()
  if (yer === 'yan')
    return (
      <nav className="ap-menu" aria-label="Hesabım">
        {OGELER.map((o) => (
          <Link key={o.href} href={o.href} aria-current={yol === o.href ? 'page' : undefined}>
            {o.ad}
          </Link>
        ))}
      </nav>
    )
  return (
    <nav className="a-alt-menu" aria-label="Hesabım">
      {OGELER.map((o) => (
        <Link key={o.href} href={o.href} aria-current={yol === o.href ? 'page' : undefined}>
          <Ikon ad={o.ikon} />
          <span>{o.kisa}</span>
        </Link>
      ))}
    </nav>
  )
}
