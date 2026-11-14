import type { Metadata } from 'next'
import Link from 'next/link'
import { Ust } from '@/arayuz/Ust'

export const metadata: Metadata = { title: 'Hesabın silindi', robots: { index: false } }

/** Aday hesabını sildikten sonra gelinen sayfa (K27). Oturum kapatılmıştır. */
export default function HesapSilindiSayfasi() {
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <h1 className="b1">Hesabın silindi</h1>
        <p>Hesabın, profilin, CV dosyaların ve onay kayıtların silindi. Başvurduğun firmalar başvuru kaydını adın ve iletişim bilgilerin olmadan görür.</p>
        <p>
          Yeniden ilanlara başvurmak istersen istediğin zaman yeni bir hesap açabilirsin.
        </p>
        <div className="dugme-grubu">
          <Link className="dugme" href="/ilanlar">
            İlanlara göz at
          </Link>
          <Link className="dugme dugme--ikincil" href="/">
            Ana sayfa
          </Link>
        </div>
      </main>
    </>
  )
}
