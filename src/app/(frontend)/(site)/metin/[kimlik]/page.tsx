import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Metin } from '@/arayuz/IlanParcalari'
import { Ust } from '@/arayuz/Ust'
import { tarihYaz } from '@/arayuz/bicim'
import { METINLER, type MetinKimligi } from '@/metinler'

type Props = { params: Promise<{ kimlik: string }> }

const bul = (k: string) => (k in METINLER ? METINLER[k as MetinKimligi] : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = bul((await params).kimlik)
  if (!m) notFound()
  return { title: m.baslik }
}

/** Aydınlatma ve rıza metinleri: sürümü ve tarihiyle. Onaylanmamış metin “taslak” olarak işaretlenir. */
export default async function MetinSayfasi({ params }: Props) {
  const m = bul((await params).kimlik)
  if (!m) notFound()
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <p className="ust-etiket">
          Sürüm {m.surum} · {tarihYaz(m.tarih, true)}
        </p>
        <h1 className="b1">{m.baslik}</h1>
        {!m.onayli && (
          <div className="uyari-kutu" role="note">
            Bu metin taslaktır. Kurumun KVKK sorumlusu ve hukuk birimi onayladığında son hâlini alacak.
          </div>
        )}
        <Metin metin={m.govde} />
      </main>
    </>
  )
}
