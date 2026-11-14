import type { Metadata } from 'next'
import Link from 'next/link'
import { raporDonemi } from '@/alan/raporDonemi'
import { trGunMetni } from '@/alan/tarih'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { DonemSecimi } from '@/arayuz/yonetim/Raporlar'
import { RAPORLAR } from '@/veri/raporlar'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Raporlar · Yönetim' }

type Props = { searchParams: Promise<{ donem?: string; bas?: string; bit?: string }> }

export default async function Raporlar({ searchParams }: Props) {
  await yonetimOturumu('/yonetim/raporlar')
  const sp = await searchParams
  const d = raporDonemi(sp.donem, sp.bas, sp.bit)
  const sorgu = 'hata' in d ? '' : `?${new URLSearchParams(d.sorgu)}`
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Raporlar</h1>
          <p className="ikincil">Dönem seçin, raporu ekranda inceleyin, Excel veya PDF olarak alın.</p>
        </div>
      </div>
      <ModulBilgisi kimlik="yonetim-raporlar" baslik="Raporlar nasıl alınır?">
        <ol className="y-adimlar">
          <li>Aşağıdan dönemi seçin: ay, çeyrek, yıl veya özel bir aralık.</li>
          <li>İstediğiniz raporu açın. Rapor ekranda tablolarıyla görünür; her sayının altında tanımı yazar.</li>
          <li>
            <strong>Excel olarak indir</strong> her tabloyu ayrı bir sayfa olarak verir. <strong>PDF olarak kaydet</strong> yazdırma penceresini açar;
            “Hedef” olarak “PDF olarak kaydet”i seçin.
          </li>
        </ol>
        <p>Raporlarda aday adı veya iletişim bilgisi yer almaz. Kişiyi tanınır kılmamak için 5’ten küçük gruplar birleştirilir.</p>
      </ModulBilgisi>
      <section className="panel panel-ic">
        <DonemSecimi eylem="/yonetim/raporlar" deger={sp.donem ?? 'bu-ay'} bas={sp.bas} bit={sp.bit} bugun={trGunMetni(new Date())} />
        {'hata' in d ? (
          <p className="hata-metni" role="alert">
            {d.hata}
          </p>
        ) : (
          <p className="kucuk ikincil">Seçili dönem: {d.ad}</p>
        )}
      </section>
      <ul className="rapor-kartlari">
        {RAPORLAR.map((r) => (
          <li key={r.kod} className="panel panel-ic">
            <h2 className="b3">{r.ad}</h2>
            <p>{r.amac}</p>
            <p className="kucuk ikincil">Kimin için: {r.kimIcin}</p>
            {'hata' in d ? null : (
              <p className="dugme-grubu">
                <Link className="dugme dugme--kucuk" href={`/yonetim/raporlar/${r.kod}${sorgu}`}>
                  Raporu aç
                </Link>
                <a className="dugme dugme--ikincil dugme--kucuk" href={`/yonetim/raporlar/${r.kod}/excel${sorgu}`} download>
                  Excel olarak indir
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
