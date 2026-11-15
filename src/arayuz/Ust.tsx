import Link from 'next/link'
import { adayMi, firmaKullanicisiMi, kurumKullanicisiMi, yoneticiMi } from '@/erisim'
import { hesapMenusuOgeleri } from '@/alan/hesapMenusu'
import { HesapMenusu } from './HesapMenusu'
import { oturum } from '@/veri/payload'

export type UstMenu = 'ilanlar' | 'staj' | 'firmalar' | ''


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
      ? { rol: 'aday', ad: k.ad ?? k.email, alt: 'Aday hesabı' }
      : firmaKullanicisiMi(k)
        ? { rol: 'firma', ad: k.ad ?? k.email, alt: k.unvan || 'Firma hesabı' }
        : kurumKullanicisiMi(k)
          ? { rol: 'kurum', ad: k.ad ?? k.email, alt: 'Yönetici A.Ş.' }
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
          {hesap ? (
            <HesapMenusu ad={hesap.ad} altBilgi={hesap.alt} ogeler={hesapMenusuOgeleri(hesap.rol, { yonetici: yoneticiMi(k) })} adiGoster />
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
