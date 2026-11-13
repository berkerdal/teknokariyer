import type { Metadata } from 'next'
import { SifreSifirlamaFormu } from '@/arayuz/hesap/SifreFormlari'
import { Ust } from '@/arayuz/Ust'

export const metadata: Metadata = { title: 'Şifremi unuttum', robots: { index: false } }

export default function SifremiUnuttumSayfasi() {
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <SifreSifirlamaFormu />
        </div>
      </main>
    </>
  )
}
