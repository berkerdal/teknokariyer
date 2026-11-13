import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { yonelmeEki } from '@/alan/metin'
import { Ust } from '@/arayuz/Ust'
import { adayOturumu } from '@/veri/aday'
import { payloadAl } from '@/veri/payload'
import { firmalariAl } from '@/veri/ilanlar'
import { kimlik } from '@/servisler/ortak'

export const metadata: Metadata = { title: 'Başvurun iletildi', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | undefined>> }

/** Başvuru sonrası: ne olacağı açıkça söylenir. Yalnızca başvurunun sahibi görür. */
export default async function BasvuruTamamSayfasi({ searchParams }: Props) {
  const p = await searchParams
  const k = await adayOturumu()
  const payload = await payloadAl()
  const b = await payload
    .findByID({ collection: 'basvurular', id: Number(p.b), depth: 2, overrideAccess: false, user: k, populate: { ilanlar: { pozisyonAdi: true, firma: true }, firmalar: { kisaAd: true } } })
    .catch((): null => null)
  if (!b || typeof b.ilan !== 'object') notFound()
  const firma = (await firmalariAl([kimlik(b.ilan.firma)])).get(kimlik(b.ilan.firma))?.ad ?? ''
  return (
    <>
      <Ust />
      <main id="icerik" className="bv">
        <div className="bv-tamam">
          <div className="basari-kutu" role="status">
            <h1 className="b2">
              Başvurun {firma}
              {yonelmeEki(firma)} iletildi
            </h1>
            <p>
              <strong>{b.ilan.pozisyonAdi}</strong> · Onay e-postası {k.email} adresine gönderildi.
            </p>
          </div>
          <h2 className="b3 kare-bas">Bundan sonra ne olacak?</h2>
          <ol className="sonraki">
            <li>
              <span>
                <strong>Firma başvurunu inceler.</strong> Durum değiştiğinde e-posta alırsın.
              </span>
            </li>
            <li>
              <span>
                <strong>Görüşme isterse</strong> seninle iletişime geçer.
              </span>
            </li>
            <li>
              <span>
                <strong>Karar ne olursa olsun</strong> sonuç sana bildirilir.
              </span>
            </li>
          </ol>
          {p.havuz === '1' && <p className="bilgi">CV havuzuna da katıldın. Ayarlarını “CV havuzu” sayfasından değiştirebilirsin.</p>}
          <div className="dugme-grubu">
            <Link className="dugme" href="/hesabim">
              Başvurularıma git
            </Link>
            <Link className="dugme dugme--ikincil" href="/ilanlar">
              Diğer ilanlara bak
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
