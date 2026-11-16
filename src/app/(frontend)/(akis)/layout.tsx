import { Alt } from '@/arayuz/Alt'

/** Başvuru akışı: öteki sayfalarla aynı kurumsal alt bilgi (16.11.2026 kullanıcı isteği). */
export default function AkisDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Alt />
    </>
  )
}
