import Link from 'next/link'
import { Ust } from '@/arayuz/Ust'

/** Sitede bulunamayan kayıt (ilan, firma). HTTP 404 döner. */
export default function Bulunamadi() {
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
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
    </>
  )
}
