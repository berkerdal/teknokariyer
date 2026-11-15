import { Alt } from '@/arayuz/Alt'
import { SayfaOlcumu } from '@/arayuz/SayfaOlcumu'

/** Herkese açık sayfalar: üst çubuk sayfanın kendisinde (etkin menü öğesi sayfaya göre), alt bilgi burada. */
export default function SiteDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SayfaOlcumu />
      <Alt />
    </>
  )
}
