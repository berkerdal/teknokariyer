import Link from 'next/link'
import { KURUM } from '@/altyapi/kurum'

/**
 * Kurumsal alt bilgi (14.11.2026 geri bildirimi): solda Teknokent ve TTO logoları ile iletişim bilgisi, sağda site
 * haritası. Gece zemini yönetim paneliyle aynı tondur; logolar negatif (beyaz) sürümdür. Sloganlı logo kurumca
 * onaylanmadığı için kullanılmaz (CLAUDE.md 2).
 *
 * `sade`: başvuru akışı gibi odaklı sayfalar için yalnızca alt şerit.
 */

type Baglanti = { ad: string; href: string; dis?: boolean }

const SUTUNLAR: Array<{ baslik: string; baglantilar: Baglanti[] }> = [
  {
    baslik: 'Adaylar',
    baglantilar: [
      { ad: 'Tüm ilanlar', href: '/ilanlar' },
      { ad: 'Staj ilanları', href: '/ilanlar?tur=staj' },
      { ad: 'İş ilanları', href: '/ilanlar?tur=is' },
      { ad: 'Teknokent firmaları', href: '/firmalar' },
      { ad: 'Hesap oluştur', href: '/kayit' },
    ],
  },
  {
    baslik: 'Firmalar',
    baglantilar: [
      { ad: 'Firma girişi', href: '/giris?firma=1' },
      { ad: 'Firma hesabı talebi', href: `mailto:${KURUM.eposta}?subject=${encodeURIComponent('TeknoKariyer firma hesabı talebi')}` },
    ],
  },
  {
    baslik: 'Pamukkale Teknokent',
    baglantilar: [
      { ad: 'Kurumsal web sitesi', href: KURUM.web, dis: true },
      { ad: 'Teknoloji firmaları rehberi', href: `${KURUM.web}/teknoloji-firmalari`, dis: true },
      { ad: 'Pamukkale Üniversitesi', href: 'https://www.pau.edu.tr', dis: true },
    ],
  },
  {
    baslik: 'Kişisel veriler',
    baglantilar: [
      { ad: 'Aday aydınlatma metni', href: '/metin/aday-aydinlatma' },
      { ad: 'Başvuru aydınlatma metni', href: '/metin/basvuru-aydinlatma' },
      { ad: 'CV havuzu açık rıza metni', href: '/metin/havuz' },
      { ad: 'KVKK başvurusu', href: `mailto:${KURUM.kvkkEposta}` },
    ],
  },
]

function Bag({ b }: { b: Baglanti }) {
  if (b.dis || b.href.startsWith('mailto:'))
    return (
      <a href={b.href} rel={b.dis ? 'noopener' : undefined}>
        {b.ad}
        {b.dis && <span className="gizli"> (kurumsal site)</span>}
      </a>
    )
  return <Link href={b.href}>{b.ad}</Link>
}

function Taban() {
  return (
    <div className="a-alt-taban">
      <p>
        © {new Date().getFullYear()} {KURUM.unvan}
      </p>
      <p>TeknoKariyer, Pamukkale Teknokent’in kariyer portalıdır.</p>
    </div>
  )
}

export function Alt({ sade = false }: { sade?: boolean }) {
  if (sade)
    return (
      <footer className="a-alt a-alt--sade">
        <Taban />
      </footer>
    )
  return (
    <footer className="a-alt">
      <div className="a-alt-ic">
        <div className="a-alt-kurum">
          <div className="a-alt-logolar">
            <a href={KURUM.web} rel="noopener">
              <img src="/logo/kurum/teknokent-dikey-negatif.svg" alt="Pamukkale Teknokent" width={150} height={79} loading="lazy" />
            </a>
            <span className="a-alt-ayrac" aria-hidden="true" />
            <img src="/logo/kurum/pamukkale-tto-beyaz.svg" alt="Pamukkale Teknoloji Transfer Ofisi" width={78} height={78} loading="lazy" />
          </div>
          <address>
            <span>{KURUM.adres}</span>
            <a href={`tel:${KURUM.telefonHam}`}>{KURUM.telefon}</a>
            <a href={`mailto:${KURUM.eposta}`}>{KURUM.eposta}</a>
          </address>
        </div>
        <nav className="a-alt-harita" aria-label="Site haritası">
          {SUTUNLAR.map((s) => (
            <div key={s.baslik}>
              <h2>{s.baslik}</h2>
              <ul>
                {s.baglantilar.map((b) => (
                  <li key={b.href}>
                    <Bag b={b} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <Taban />
    </footer>
  )
}
