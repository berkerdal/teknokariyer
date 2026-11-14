import type { Metadata } from 'next'
import { raporDonemi } from '@/alan/raporDonemi'
import { trGunMetni } from '@/alan/tarih'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { RaporGovdesi } from '@/arayuz/RaporGovdesi'
import { DonemSecimi, YazdirDugmesi } from '@/arayuz/yonetim/Raporlar'
import { firmaOturumu } from '@/veri/firma'
import { firmaRaporuHazirla } from '@/veri/firmaRaporu'

export const metadata: Metadata = { title: 'Rapor · Firma paneli' }

type Props = { searchParams: Promise<{ donem?: string; bas?: string; bit?: string }> }

export default async function FirmaRaporu({ searchParams }: Props) {
  const k = await firmaOturumu('/firma-paneli/rapor')
  const sp = await searchParams
  const d = raporDonemi(sp.donem, sp.bas, sp.bit)
  const bugun = trGunMetni(new Date())
  const r = 'hata' in d ? null : await firmaRaporuHazirla(k, d)
  const sorgu = 'hata' in d ? '' : `?${new URLSearchParams(d.sorgu)}`
  return (
    <article className="rapor">
      <div className="f-bas">
        <div>
          <h1 className="b1">{r?.ad ?? 'İlan raporu'}</h1>
          {r && (
            <p>
              <strong>Dönem:</strong> {r.donem}
            </p>
          )}
        </div>
        {r && (
          <p className="dugme-grubu rapor-eylemler">
            <a className="dugme dugme--kucuk" href={`/firma-paneli/rapor/excel${sorgu}`} download>
              <Ikon ad="indir" kucuk /> Excel olarak indir
            </a>
            <YazdirDugmesi />
          </p>
        )}
      </div>
      <ModulBilgisi kimlik="firma-rapor" baslik="Bu rapor ne gösterir?">
        <p>Rapor, seçtiğiniz dönemde ilanlarınızın kaç kez görüntülendiğini, kaç başvuru aldığını ve başvuruların hangi aşamada olduğunu gösterir.</p>
        <ul>
          <li>Sayılar yalnızca firmanızın ilanlarından hesaplanır; başka firmaların verisi görünmez.</li>
          <li>“Excel olarak indir” her tabloyu ayrı sayfa olarak verir. “PDF olarak kaydet” yazdırma penceresini açar; hedef olarak “PDF olarak kaydet”i seçin.</li>
          <li>Başvurunun LinkedIn’den geldiğini görmek için ilanı, ilan işlemlerindeki paylaşım bağlantısıyla paylaşın.</li>
        </ul>
      </ModulBilgisi>
      <section className="panel panel-ic rapor-eylemler">
        <DonemSecimi eylem="/firma-paneli/rapor" deger={sp.donem ?? 'bu-ay'} bas={sp.bas} bit={sp.bit} bugun={bugun} />
        {'hata' in d && (
          <p className="hata-metni" role="alert">
            {d.hata}
          </p>
        )}
      </section>
      {r && <RaporGovdesi rapor={r} />}
    </article>
  )
}
