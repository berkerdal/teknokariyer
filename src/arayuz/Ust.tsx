import Link from 'next/link'
import { adayMi, firmaKullanicisiMi, kurumKullanicisiMi } from '@/erisim'
import { oturum } from '@/veri/payload'

export type UstMenu = 'ilanlar' | 'staj' | 'firmalar' | ''

const basHarfler = (ad = '') =>
  ad.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toLocaleUpperCase('tr')).join('')

/** Aday ve ziyaretçi üst çubuğu. Mobilde logo ve hesap; masaüstünde menü de görünür. */
export async function Ust({ aktif = '' }: { aktif?: UstMenu }) {
  const k = await oturum()
  const m = (id: UstMenu, href: string, ad: string) => (
    <Link href={href} aria-current={aktif === id ? 'page' : undefined}>
      {ad}
    </Link>
  )
  const hesap = !k
    ? null
    : adayMi(k)
      ? { href: '/hesabim', ad: k.ad ?? 'Hesabım' }
      : firmaKullanicisiMi(k)
        ? { href: '/firma', ad: k.ad ?? 'Firma paneli' }
        : kurumKullanicisiMi(k)
          ? { href: '/admin', ad: k.ad ?? 'Yönetim' }
          : null
  return (
    <header className="a-ust">
      <div className="a-ust-ic">
        <Link href="/" className="a-ust-logo">
          <img className="ust-logo" src="/logo/logo-kompakt-renkli.svg" alt="TeknoKariyer, Pamukkale Teknokent" width={150} height={26} />
        </Link>
        <nav className="a-menu" aria-label="Ana menü">
          {m('ilanlar', '/ilanlar', 'İlanlar')}
          {m('staj', '/ilanlar?tur=staj', 'Staj')}
          {m('firmalar', '/firmalar', 'Firmalar')}
        </nav>
        <div className="a-ust-sag">
          {!hesap && (
            <Link href="/giris?firma=1" className="a-firma-giris">
              Firma girişi
            </Link>
          )}
          {hesap ? (
            <>
              <Link className="a-ust-kisi" href={hesap.href} aria-label={`Hesabım: ${hesap.ad}`}>
                {basHarfler(hesap.ad)}
              </Link>
              <span className="kucuk a-ust-ad">{hesap.ad}</span>
            </>
          ) : (
            <Link className="dugme dugme--ikincil dugme--kucuk" href="/giris">
              Giriş yap
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
