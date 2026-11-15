import React from 'react'
import type { Metadata, Viewport } from 'next'
import { IkonSeti } from '@/arayuz/Ikon'
import { OrtamSeridi } from '@/arayuz/OrtamSeridi'
import { siteAdresi } from '@/altyapi/epostaSablonlari'
import './styles.css'

export const metadata: Metadata = {
  // Kanonik, hreflang ve Open Graph adresleri; site haritası ve e-postalarla aynı kök (SITE_ADRESI)
  metadataBase: new URL(siteAdresi()),
  title: { default: 'TeknoKariyer · Pamukkale Teknokent', template: '%s · TeknoKariyer' },
  description: 'Pamukkale Teknokent firmalarının iş ve staj ilanları. Başvuru herkese açık.',
  applicationName: 'TeknoKariyer',
}

/** Tüm sayfalar veritabanına ve oturuma bağlı: derlemede önceden üretilmez. */
export const dynamic = 'force-dynamic'

export const viewport: Viewport = { themeColor: '#FFFFFF', width: 'device-width', initialScale: 1 }

export default function KokDuzen({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="tk">
        <a className="atla" href="#icerik">
          İçeriğe geç
        </a>
        <IkonSeti />
        <OrtamSeridi />
        {children}
      </body>
    </html>
  )
}
