import type { Metadata } from 'next'
import Link from 'next/link'
import { SifreYenileFormu } from '@/arayuz/hesap/SifreFormlari'
import { Ust } from '@/arayuz/Ust'

export const metadata: Metadata = { title: 'Yeni şifre', robots: { index: false }, referrer: 'no-referrer' }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function SifreYenileSayfasi({ searchParams }: Props) {
  const anahtar = (await searchParams).anahtar ?? ''
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          {anahtar ? (
            <SifreYenileFormu anahtar={anahtar} />
          ) : (
            <div className="form-yigin">
              <h1 className="b2">Bağlantı eksik</h1>
              <p>Bu sayfaya e-postadaki bağlantıyla gelinir. Bağlantının tamamını kopyaladığından emin ol ya da yeni bir bağlantı iste.</p>
              <Link className="dugme dugme--ikincil" href="/sifremi-unuttum">
                Yeni bağlantı iste
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
