import type { Metadata } from 'next'
import Link from 'next/link'
import { Alt } from '@/arayuz/Alt'
import './(frontend)/styles.css'

export const metadata: Metadata = { title: 'Sayfa bulunamadı · TeknoKariyer', robots: { index: false } }

/** Hiçbir adresle eşleşmeyen istekler için gerçek HTTP 404 sayfası (iki kök düzen olduğu için genel). */
export default function GenelBulunamadi() {
  return (
    <html lang="tr">
      <body className="tk">
        <header className="a-ust">
          <div className="a-ust-ic">
            <Link href="/" className="a-ust-logo">
              <img className="ust-logo" src="/logo/logo-kompakt-renkli.svg" alt="TeknoKariyer, Pamukkale Teknokent" width={150} height={26} />
            </Link>
          </div>
        </header>
        <main className="sayfa-dar">
          <p className="ust-etiket">404</p>
          <h1 className="b1">Aradığın sayfa bulunamadı</h1>
          <p>Bağlantı yanlış yazılmış olabilir ya da sayfa kaldırılmış olabilir.</p>
          <p className="dugme-grubu">
            <Link className="dugme" href="/ilanlar">
              İlanlara git
            </Link>
            <Link className="dugme dugme--ikincil" href="/">
              Ana sayfa
            </Link>
          </p>
        </main>
        <Alt />
      </body>
    </html>
  )
}
