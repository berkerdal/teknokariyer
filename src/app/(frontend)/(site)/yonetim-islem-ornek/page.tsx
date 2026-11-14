import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { yoneticiMi } from '@/erisim'
import { ortam } from '@/altyapi/eposta'
import { OrnekVeriDugmesi } from '@/arayuz/OrnekVeriDugmesi'
import { Ust } from '@/arayuz/Ust'
import { oturum } from '@/veri/payload'

export const metadata: Metadata = { title: 'Örnek veri', robots: { index: false } }

/** Test ortamı aracı (K13): yalnızca Yönetici A.Ş. yöneticisi, yalnızca yayın dışı ortamda. Yönetici paneli gelince oraya taşınır. */
export default async function OrnekVeri() {
  if (ortam() === 'yayin') notFound()
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fyonetim-islem-ornek')
  if (!yoneticiMi(k)) notFound()
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar form-yigin">
        <p className="ust-etiket">Test ortamı</p>
        <h1 className="b1">Örnek veri</h1>
        <p>
          Bu düğme test ortamına örnek firmaları, ilanları ve kurgusal adayları (başvurular ve CV havuzu dahil) yükler. Var olan kayıtlar yeniden
          oluşturulmaz; yarıda kalan bir yükleme kaldığı yerden tamamlanır. Yayın ortamında bu sayfa yoktur.
        </p>
        <OrnekVeriDugmesi />
      </main>
    </>
  )
}
