import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sirala } from '@/alan/ilanFiltre'
import { MODEL_ADI } from '@/alan/eslesme'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { Metin } from '@/arayuz/IlanParcalari'
import { Ust } from '@/arayuz/Ust'
import { firmaBul, yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await firmaBul((await params).slug)
  if (!f) notFound()
  return {
    title: `${f.ad} · Pamukkale Teknokent`,
    description: f.kisaTanitim || `${f.unvan}, Pamukkale Teknokent ${f.konum}. Açık iş ve staj ilanları.`,
    alternates: { canonical: `/firma/${f.slug}` },
  }
}

/** Firma vitrini: fotoğraf yokken de eksik görünmez; tipografi, ofis konumu ve gerçek bilgiler taşır (K12). */
export default async function FirmaSayfasi({ params }: Props) {
  const f = await firmaBul((await params).slug)
  if (!f) notFound()
  const acik = sirala((await yayindakiIlanlar()).filter((i) => i.firma.id === f.id), 'yeni')
  const web = f.web ? (/^https?:\/\//.test(f.web) ? f.web : `https://${f.web}`) : undefined
  return (
    <>
      <Ust aktif="firmalar" />
      <main id="icerik" className="fv">
        <header className="fv-bas">
          <div className="fv-bas-ic">
            <FirmaKaro konum={f.konum} boy={72} />
            <div>
              {f.sektor && <p className="ust-etiket">{f.sektor}</p>}
              <h1 className="b1 fv-ad">{f.ad}</h1>
              <p className="ikincil">{f.unvan}</p>
            </div>
          </div>
          <dl className="fv-gercekler">
            <div>
              <dt>Teknokent’teki yeri</dt>
              <dd>{f.konum}</dd>
            </div>
            {f.calismaModelleri.length > 0 && (
              <div>
                <dt>Çalışma modeli</dt>
                <dd>{f.calismaModelleri.map((m) => MODEL_ADI[m]).join(', ')}</dd>
              </div>
            )}
            <div>
              <dt>Açık ilan</dt>
              <dd>{acik.length}</dd>
            </div>
            {web && (
              <div>
                <dt>Web</dt>
                <dd>
                  <a href={web} rel="noopener">
                    {f.web!.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </header>
        <div className="fv-govde">
          <section className="fv-tanitim">
            {f.kisaTanitim ? <p className="fv-giris">{f.kisaTanitim}</p> : <p className="fv-giris">{f.ad}, Pamukkale Teknokent’te çalışan bir teknoloji firması.</p>}
            {f.uzunTanitim && <Metin metin={f.uzunTanitim} />}
          </section>
          {(f.yanHaklar.length > 0 || f.teknolojiler.length > 0 || f.calisanAraligi || f.kurulusYili) && (
            <section className="fv-blok">
              <h2 className="b3 kare-bas">Burada çalışmak</h2>
              <dl className="ozet-dl">
                {f.yanHaklar.length > 0 && (
                  <div>
                    <dt>Yan haklar</dt>
                    <dd>{f.yanHaklar.join(', ')}</dd>
                  </div>
                )}
                {f.teknolojiler.length > 0 && (
                  <div>
                    <dt>Teknolojiler</dt>
                    <dd>{f.teknolojiler.join(', ')}</dd>
                  </div>
                )}
                {f.calisanAraligi && (
                  <div>
                    <dt>Çalışan sayısı</dt>
                    <dd>{f.calisanAraligi}</dd>
                  </div>
                )}
                {f.kurulusYili && (
                  <div>
                    <dt>Kuruluş yılı</dt>
                    <dd>{f.kurulusYili}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
          <section className="fv-blok">
            <h2 className="b3 kare-bas">Açık ilanlar</h2>
            {acik.length ? (
              <div className="ilan-listesi">
                {acik.map((i) => (
                  <IlanSatiri key={i.id} ilan={i} />
                ))}
              </div>
            ) : (
              <p className="ikincil">Şu an açık ilan yok.</p>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
