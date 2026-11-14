'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Oge = { href: string; ad: string; sayi?: number }

const etkinMi = (yol: string, href: string) => (href === '/yonetim' ? yol === href : yol === href || yol.startsWith(`${href}/`))

/**
 * Yönetici A.Ş. menüsü: masaüstünde koyu yan menü, mobilde yatay kaydırılan sekmeler (prototip “Yönetim”).
 * Sayılar bekleyen işlerdir; sayfa sunucuda her istekte hesaplar.
 */
export function YonetimMenusu({ yer, sayilar }: { yer: 'yan' | 'sekme'; sayilar: { toplam: number; onay: number; degisiklik: number; talep: number; takip: number } }) {
  const yol = usePathname()
  const ana: Oge[] = [
    { href: '/yonetim', ad: 'Bugün', sayi: sayilar.toplam },
    { href: '/yonetim/onay', ad: 'İlan onayı', sayi: sayilar.onay },
    { href: '/yonetim/degisiklikler', ad: 'İlan değişiklikleri', sayi: sayilar.degisiklik },
    { href: '/yonetim/talepler', ad: 'Liste talepleri', sayi: sayilar.talep },
    { href: '/yonetim/firmalar', ad: 'Firmalar ve kurulum', sayi: sayilar.takip },
  ]
  const baglanti = (o: Oge) => (
    <Link key={o.href} href={o.href} aria-current={etkinMi(yol, o.href) ? 'page' : undefined}>
      <span>{o.ad}</span>
      {o.sayi ? (
        <span className="y-sayi" aria-label={`${o.sayi} bekleyen`}>
          {o.sayi}
        </span>
      ) : null}
    </Link>
  )
  if (yer === 'sekme')
    return (
      <nav className="y-sekmeler" aria-label="Yönetim menüsü">
        {ana.map(baglanti)}
      </nav>
    )
  return (
    <>
      <div className="y-menu">{ana.map(baglanti)}</div>
      <p className="y-menu-bas">Diğer</p>
      <div className="y-menu y-menu--ikincil">
        {/* Payload paneli ayrı kök düzende; tam sayfa geçiş bilinçli */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin">
          <span>Gelişmiş yönetim ekranı</span>
        </a>
        <Link href="/">
          <span>Portalın ana sayfası</span>
        </Link>
      </div>
    </>
  )
}
