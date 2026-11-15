import type { Metadata } from 'next'
import Link from 'next/link'
import { Alt } from '@/arayuz/Alt'
import { BulunamadiGovdesi } from '@/arayuz/BulunamadiGovdesi'
import { IkonSeti } from '@/arayuz/Ikon'
import './(frontend)/styles.css'

export const metadata: Metadata = { title: 'Sayfa bulunamadı · TeknoKariyer', robots: { index: false } }

/** Hiçbir adresle eşleşmeyen istekler için gerçek HTTP 404 sayfası (iki kök düzen olduğu için genel). */
export default function GenelBulunamadi() {
  return (
    <html lang="tr">
      <body className="tk">
        <IkonSeti />
        <header className="a-ust">
          <div className="a-ust-ic">
            <Link href="/" className="a-ust-logo">
              <img className="ust-logo" src="/logo/logo-kompakt-renkli.svg" alt="TeknoKariyer, Pamukkale Teknokent" width={150} height={26} />
            </Link>
          </div>
        </header>
        <BulunamadiGovdesi />
        <Alt />
      </body>
    </html>
  )
}
