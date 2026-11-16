import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GORUSME_BICIMI, GORUSME_HALI_ADI, gorusmeHali, gorusmeZamani, saatAraligi, type GorusmeBicimi } from '@/alan/gorusme'
import { TarihSecimi, YeniTarihIstegi } from '@/arayuz/aday/GorusmeSecimi'
import { Ikon } from '@/arayuz/Ikon'
import { adayGorusmesi, gorusmeOzu } from '@/servisler/gorusme'
import { IslemHatasi } from '@/servisler/ortak'
import { adayOturumu } from '@/veri/aday'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Görüşme', robots: { index: false } }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ sonuc?: string }> }

/** Adayın görüşme sayfası: firmanın önerdiği tarihlerden birini seçer veya başka tarih ister. */
export default async function GorusmeSayfasi({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const k = await adayOturumu(`/hesabim/gorusme/${id}`)
  const payload = await payloadAl()
  const g = await adayGorusmesi(payload, k, Number(id)).catch((e: unknown): null => {
    if (e instanceof IslemHatasi) return null
    throw e
  })
  if (!g) notFound()
  const [ilan, firma] = await Promise.all([
    payload.findByID({ collection: 'ilanlar', id: Number(typeof g.ilan === 'object' ? g.ilan.id : g.ilan), depth: 0, overrideAccess: true, select: { pozisyonAdi: true } }),
    payload.findByID({ collection: 'firmalar', id: Number(typeof g.firma === 'object' ? g.firma.id : g.firma), depth: 0, overrideAccess: true, select: { kisaAd: true, konum: true } }),
  ])
  const simdi = new Date()
  const hal = gorusmeHali(gorusmeOzu(g), simdi)
  const bicim = GORUSME_BICIMI[g.bicim as GorusmeBicimi]
  const secenekler = (g.secenekler ?? []).map((s) => new Date(s.baslangic)).filter((s) => s > simdi)
  return (
    <div className="gr-kart">
      <Link className="geri kucuk" href="/hesabim">
        <Ikon ad="geri" kucuk /> Başvurularım
      </Link>
      <div>
        <h1 className="b1">Görüşme daveti</h1>
        <p className="ikincil">
          {firma.kisaAd} · {ilan.pozisyonAdi}
        </p>
      </div>
      {sp.sonuc === 'secildi' && hal === 'onaylandi' && (
        <p className="basari-kutu" role="status">
          Tarihi seçtin. Sana ve firmaya takvim dosyası gönderildi.
        </p>
      )}
      {sp.sonuc === 'istendi' && hal === 'yeni-tarih' && (
        <p className="basari-kutu" role="status">
          İsteğin firmaya iletildi. Firma yeni tarihler önerdiğinde sana e-posta gelecek.
        </p>
      )}
      <section className="panel f-blok">
        <p>
          <span className={`rozet ${hal === 'onaylandi' ? 'rozet--yesil' : hal === 'bekliyor' ? 'rozet--lacivert' : 'rozet--notr'}`}>{GORUSME_HALI_ADI[hal].aday}</span>
        </p>
        <dl className="ozet-dl">
          {g.secilen && (hal === 'onaylandi' || hal === 'tamamlandi') && (
            <div>
              <dt>Tarih</dt>
              <dd>
                <strong>{gorusmeZamani(new Date(g.secilen))}</strong> ({saatAraligi(new Date(g.secilen), g.sure)})
              </dd>
            </div>
          )}
          <div>
            <dt>Süre</dt>
            <dd>{g.sure} dakika</dd>
          </div>
          <div>
            <dt>Biçim</dt>
            <dd>{bicim.ad}</dd>
          </div>
          {g.yer && (
            <div>
              <dt>{bicim.yerEtiketi}</dt>
              <dd className="gr-yer">{g.bicim === 'cevrim-ici' && hal === 'onaylandi' ? <a href={g.yer} rel="noopener noreferrer" target="_blank">{g.yer}</a> : g.yer}</dd>
            </div>
          )}
          {g.not && (
            <div>
              <dt>Firmanın notu</dt>
              <dd>{g.not}</dd>
            </div>
          )}
          {hal === 'iptal' && g.iptalNedeni && (
            <div>
              <dt>İptal nedeni</dt>
              <dd>{g.iptalNedeni}</dd>
            </div>
          )}
          {hal === 'yeni-tarih' && g.adayNotu && (
            <div>
              <dt>Firmaya notun</dt>
              <dd>{g.adayNotu}</dd>
            </div>
          )}
        </dl>
        {hal === 'onaylandi' && (
          <p>
            <a className="dugme dugme--ikincil" href={`/hesabim/gorusme/${g.id}/takvim`} download>
              <Ikon ad="takvim" kucuk /> Takvimine ekle (.ics)
            </a>
          </p>
        )}
      </section>
      {hal === 'bekliyor' && secenekler.length > 0 && (
        <section className="panel f-blok">
          <TarihSecimi gorusmeId={g.id} secenekler={secenekler.map((s) => ({ deger: s.toISOString(), metin: gorusmeZamani(s), aralik: `${saatAraligi(s, g.sure)} · Türkiye saati` }))} />
        </section>
      )}
      {hal === 'suresi-doldu' && <p className="uyari-kutu">Önerilen tarihlerin hepsi geçti. Firmadan yeni tarih isteyebilirsin.</p>}
      {(hal === 'bekliyor' || hal === 'onaylandi' || hal === 'suresi-doldu') && <YeniTarihIstegi gorusmeId={g.id} onaylandi={hal === 'onaylandi'} />}
    </div>
  )
}
