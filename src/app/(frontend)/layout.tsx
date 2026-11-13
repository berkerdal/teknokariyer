import React from 'react'
import type { Metadata, Viewport } from 'next'
import { IkonSeti } from '@/arayuz/Ikon'
import { OrtamSeridi } from '@/arayuz/OrtamSeridi'
import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ADRESI || 'https://kariyer.pauteknokent.com.tr'),
  title: { default: 'TeknoKariyer · Pamukkale Teknokent', template: '%s · TeknoKariyer' },
  description: 'Pamukkale Teknokent firmalarının iş ve staj ilanları. Başvuru herkese açık.',
  applicationName: 'TeknoKariyer',
}

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
