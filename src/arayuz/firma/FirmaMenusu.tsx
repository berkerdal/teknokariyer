'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ikon, type IkonAdi } from '../Ikon'

type Oge = { href: string; ad: string; kisa: string; ikon: IkonAdi; sayi?: number }

const etkinMi = (yol: string, href: string) => (href === '/firma-paneli' ? yol === href : yol === href || yol.startsWith(`${href}/`))

/**
 * Masaüstünde yan menü, mobilde başparmak erişimli alt menü. Yeni başvuru sayısı menüde rozetle görünür.
 * Firma profili ve ekip mobilde hesap menüsündedir (alt menü dört öğeyle sınırlı).
 */
export function FirmaMenusu({ yer, yeniBasvuru }: { yer: 'yan' | 'alt'; yeniBasvuru: number }) {
  const yol = usePathname()
  const ana: Oge[] = [
    { href: '/firma-paneli', ad: 'Özet', kisa: 'Özet', ikon: 'ev' },
    { href: '/firma-paneli/ilanlar', ad: 'İlanlar', kisa: 'İlanlar', ikon: 'liste' },
    { href: '/firma-paneli/basvurular', ad: 'Başvurular', kisa: 'Başvurular', ikon: 'kisi', sayi: yeniBasvuru },
    { href: '/firma-paneli/havuz', ad: 'CV havuzu', kisa: 'Havuz', ikon: 'ara' },
  ]
  const ek: Oge[] = [
    { href: '/firma-paneli/profil', ad: 'Firma profili', kisa: 'Profil', ikon: 'ofis' },
    { href: '/firma-paneli/ekip', ad: 'Ekip', kisa: 'Ekip', ikon: 'kisi' },
  ]
  const baglanti = (o: Oge) => (
    <Link key={o.href} href={o.href} aria-current={etkinMi(yol, o.href) ? 'page' : undefined}>
      <Ikon ad={o.ikon} />
      <span>{yer === 'yan' ? o.ad : o.kisa}</span>
      {o.sayi ? (
        <span className="rozet-sayi" aria-label={`${o.sayi} yeni başvuru`}>
          {o.sayi}
        </span>
      ) : null}
    </Link>
  )
  if (yer === 'alt')
    return (
      <nav className="a-alt-menu f-alt-menu" aria-label="Firma menüsü">
        {ana.map(baglanti)}
      </nav>
    )
  return (
    <nav className="f-menu" aria-label="Firma menüsü">
      {ana.map(baglanti)}
      <hr />
      {ek.map(baglanti)}
    </nav>
  )
}
