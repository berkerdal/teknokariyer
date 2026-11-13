import type { Metadata } from 'next'
import Link from 'next/link'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'İlan veren firmalar',
  description: 'Pamukkale Teknokent’te şu an iş veya staj ilanı olan firmalar.',
  alternates: { canonical: '/firmalar' },
}

/** İlanı olan firmalar. Firma rehberinin tamamı değil: aday için anlamlı olan, açık ilanı olan firmalar. */
export default async function FirmalarSayfasi() {
  const ilanlar = await yayindakiIlanlar()
  type F = (typeof ilanlar)[number]['firma'] & { n: number }
  const firmalar = [...ilanlar.reduce((m, i) => m.set(i.firma.id, { ...i.firma, n: (m.get(i.firma.id)?.n ?? 0) + 1 }), new Map<number, F>()).values()].sort(
    (a, b) => a.ad.localeCompare(b.ad, 'tr'),
  )
  return (
    <>
      <Ust aktif="firmalar" />
      <main id="icerik" className="sayfa-dar">
        <h1 className="b1">İlan veren firmalar</h1>
        <p className="ikincil">Pamukkale Teknokent’te şu an açık ilanı olan {firmalar.length} firma.</p>
        {firmalar.length ? (
          <ul className="firma-liste">
            {firmalar.map((f) => (
              <li key={f.id}>
                <Link href={`/firma/${f.slug}`}>
                  <FirmaKaro konum={f.konum} boy={40} />
                  <span>
                    <strong>{f.ad}</strong>
                    <span className="kucuk ikincil">{[f.sektor, f.konum, `${f.n} açık ilan`].filter(Boolean).join(' · ')}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Şu an ilanı olan firma yok.</p>
        )}
      </main>
    </>
  )
}
