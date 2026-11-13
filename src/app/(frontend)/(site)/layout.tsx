import { Alt } from '@/arayuz/Alt'

/** Herkese açık sayfalar: üst çubuk sayfanın kendisinde (etkin menü öğesi sayfaya göre), alt bilgi burada. */
export default function SiteDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Alt />
    </>
  )
}
