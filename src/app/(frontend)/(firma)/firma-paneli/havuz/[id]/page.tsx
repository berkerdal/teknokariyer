import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CINSIYET_ADI, GORUNURLUK_ADI } from '@/alan/havuz'
import { Ikon } from '@/arayuz/Ikon'
import { tarihYaz } from '@/arayuz/bicim'
import { havuzProfiliAc } from '@/servisler/havuz'
import { IslemHatasi } from '@/servisler/ortak'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Aday profili · CV havuzu', robots: { index: false } }

/** Havuzdaki adayın açık profili (K24). Bu sayfanın her açılışı kayda geçer; aday yalnızca sayıyı görür (K5). */
export default async function HavuzProfili({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const k = await firmaOturumu(`/firma-paneli/havuz/${id}`)
  const p = await havuzProfiliAc(await payloadAl(), k, Number(id)).catch((e: unknown): null => {
    if (e instanceof IslemHatasi) return null
    throw e
  })
  if (!p) notFound()
  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href="/firma-paneli/havuz">
            <Ikon ad="geri" kucuk /> CV havuzu
          </Link>
          <p className="ust-etiket">
            {p.kod} · {GORUNURLUK_ADI[p.gorunurluk]}
          </p>
          <h1 className="b1">{p.ad}</h1>
          <p className="ikincil">{[p.bolum, p.okul, p.mezuniyetYili ? `${p.mezuniyetYili} mezunu` : null].filter(Boolean).join(', ')}</p>
        </div>
      </div>
      <p className="bilgi kucuk">
        Bu görüntüleme kayda geçti. Aday, profiline hangi firmanın baktığını değil yalnızca kaç firmanın baktığını görür.
      </p>
      <div className="bsv-ayrinti">
        <section>
          <h2 className="b3 kare-bas">İletişim ve CV</h2>
          <div className="dugme-grubu">
            {p.eposta && (
              <a className="dugme dugme--sade dugme--kucuk" href={`mailto:${p.eposta}`}>
                <Ikon ad="mesaj" kucuk /> {p.eposta}
              </a>
            )}
            {p.telefon && (
              <a className="dugme dugme--sade dugme--kucuk" href={`tel:${p.telefon.replace(/\s/g, '')}`}>
                {p.telefon}
              </a>
            )}
          </div>
          {p.cvler.length > 0 ? (
            <ul className="dosya-listesi">
              {p.cvler.map((c) => (
                <li key={c.dosya} className="dosya-satiri">
                  <Ikon ad="dosya" />
                  <span className="ad">{c.ad || 'CV'}</span>
                  <a className="dugme dugme--ikincil dugme--kucuk" href={`/firma-paneli/havuz/${id}/cv/${c.dosya}`}>
                    <Ikon ad="indir" kucuk /> İndir<span className="gizli">: {c.ad}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ikincil">Aday henüz CV yüklemedi.</p>
          )}
          <p className="kucuk ikincil">İndirilen CV’nin her sayfasının altına firmanızın adı ve indirme tarihi yazılır; her indirme kayda geçer.</p>
        </section>
        {p.tanitim && (
          <section>
            <h2 className="b3 kare-bas">Tanıtım</h2>
            <p>{p.tanitim}</p>
          </section>
        )}
        <section>
          <h2 className="b3 kare-bas">Profil</h2>
          <dl className="ozet-dl">
            <div>
              <dt>Beceriler</dt>
              <dd>{p.beceriler.join(', ') || '—'}</dd>
            </div>
            {p.diller.length > 0 && (
              <div>
                <dt>Diller</dt>
                <dd>{p.diller.join(', ')}</dd>
              </div>
            )}
            {p.tercih && (
              <div>
                <dt>Tercih</dt>
                <dd>{p.tercih}</dd>
              </div>
            )}
            {p.baslama && (
              <div>
                <dt>Başlama</dt>
                <dd>{p.baslama}</dd>
              </div>
            )}
            {p.cinsiyet && (
              <div>
                <dt>Cinsiyet</dt>
                <dd>{CINSIYET_ADI[p.cinsiyet]}</dd>
              </div>
            )}
          </dl>
        </section>
        {p.deneyimler.length > 0 && (
          <section>
            <h2 className="b3 kare-bas">İş deneyimi</h2>
            <ul className="madde">
              {p.deneyimler.map((d, n) => (
                <li key={d.id ?? n}>
                  <strong>{d.pozisyon}</strong>, {d.kurum}
                  {d.baslangic ? ` · ${tarihYaz(d.baslangic, true)} – ${d.bitis ? tarihYaz(d.bitis, true) : 'devam ediyor'}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
