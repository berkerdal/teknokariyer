import React from 'react'
import './styles.css'

export const metadata = {
  title: 'TeknoKariyer · Pamukkale Teknokent',
  description: 'Pamukkale Teknokent firmalarının iş ve staj ilanları.',
}

export default async function KokDuzen(props: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{props.children}</body>
    </html>
  )
}
