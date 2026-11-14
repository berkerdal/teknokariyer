import type { Metadata } from 'next'
import Link from 'next/link'
import { HUNI, HUNI_ADI } from '@/alan/kurulum'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ikon } from '@/arayuz/Ikon'
import { tarihYaz } from '@/arayuz/bicim'
import { yoneticiMi } from '@/erisim'
import { firmaSatirlari, firmaSuz, kurulumOzeti } from '@/veri/firmaYonetimi'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Firmalar · Yönetim' }

type Props = { searchParams: Promise<{ ara?: string; asama?: string }> }

const SUZGECLER: Array<[string, string]> = [
  ['', 'Hepsi'],
  ['takip', 'Kişisel takip'],
  ['iskelet', 'İskelet'],
  ['davet', 'Davet gönderildi'],
  ['devralindi', 'Devralındı'],
  ['profil-tamam', 'Profil tamam'],
  ['ilk-ilan', 'İlk ilanı verdi'],
  ['pasif', 'Pasif'],
]

const YETKILI_ADI = { tamam: '', eksik: 'Yetkili eksik', genel: 'Genel e-posta' } as const

export default async function Firmalar({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/firmalar')
  const [sp, tum, ozet] = await Promise.all([searchParams, firmaSatirlari(), kurulumOzeti()])
  const liste = firmaSuz(tum, sp)
  const etkin = tum.filter((f) => f.asama !== 'pasif')
  const sirali = [...etkin].sort((a, b) => b.huni - a.huni)
  const adres = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ara: sp.ara, asama: sp.asama, ...q }).filter(([, v]) => v) as Array<[string, string]>)
    return `/yonetim/firmalar${p.size ? `?${p}` : ''}`
  }

  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Firmalar ve kurulum</h1>
          <p className="ikincil">
            {etkin.length} etkin firma{ozet.pasif ? `, ${ozet.pasif} pasif` : ''}. Huni, firmaların portala geçişini gösterir.
          </p>
        </div>
        {yoneticiMi(k) && (
          <div className="dugme-grubu">
            <Link className="dugme dugme--ikincil dugme--kucuk" href="/yonetim/firmalar/toplu-davet">
              Toplu davet ({ozet.davetHazir.length})
            </Link>
            <Link className="dugme dugme--kucuk" href="/yonetim/firmalar/yeni">
              <Ikon ad="arti" kucuk /> Yeni firma kaydı
            </Link>
          </div>
        )}
      </div>

      <ModulBilgisi kimlik="yonetim-firmalar" baslik="Firma kurulumu nasıl ilerler?">
        <p>Her firma portala beş adımda geçer. Hunide her kare bir firmadır; koyulaştıkça firma daha ileri bir adımdadır.</p>
        <ul>
          <li>
            <strong>1. İskelet:</strong> Kaydı Yönetici A.Ş. açar; unvan, yer ve yetkili kişi girilir.
          </li>
          <li>
            <strong>2. Davet gönderildi:</strong> Yetkiliye kişiye özel, 14 gün geçerli bir davet bağlantısı gider.
          </li>
          <li>
            <strong>3. Devralındı:</strong> Yetkili daveti kabul edip şifresini oluşturur.
          </li>
          <li>
            <strong>4. Profil tamam:</strong> Firma logo, kısa tanıtım ve sektörü girer; firma sayfası herkese açık olur.
          </li>
          <li>
            <strong>5. İlk ilan verildi:</strong> Firma ilk ilanını yayınlar.
          </li>
        </ul>
        <p>
          Bir firma davetten veya devralmadan sonra {14} gün ilerlemezse “Kişisel takip” listesine düşer. Firmayı arayıp sonucu firma sayfasına not olarak
          yazın.
        </p>
      </ModulBilgisi>

      <section className="panel panel-ic y-huni">
        <div className="y-kareler" role="img" aria-label={`Her kare bir firma. ${HUNI.map((h, i) => `${HUNI_ADI[h]}: ${ozet.huni[i]}`).join(', ')}`}>
          {sirali.map((f) => (
            <i key={f.id} className={`a${f.huni}`} title={`${f.kisaAd}: ${f.ilkIlan ? HUNI_ADI['ilk-ilan'] : f.asamaAdi}`} />
          ))}
        </div>
        <ol className="y-asamalar">
          {HUNI.map((h, i) => (
            <li key={h}>
              <i className={`a${i}`} />
              <span>{HUNI_ADI[h]}</span>
              <strong>{ozet.huni[i]}</strong>
              {i > 0 && ozet.huni[i - 1] ? <span className="kucuk ikincil">%{Math.round((ozet.huni[i]! / ozet.huni[i - 1]!) * 100)} geçti</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <div className="y-iki">
        <section className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">Kişisel takip gerekiyor</h2>
            <span className="kucuk ikincil">14 gündür ilerleme yok</span>
          </header>
          {ozet.takip.length === 0 ? (
            <p className="panel-ic ikincil">Takip gerektiren firma yok.</p>
          ) : (
            <div className="tablo-kap">
              <table className="tablo y-tablo">
                <thead>
                  <tr>
                    <th>Firma</th>
                    <th>Aşama</th>
                    <th className="sag">Gün</th>
                    <th>Son not</th>
                  </tr>
                </thead>
                <tbody>
                  {ozet.takip.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <Link href={`/yonetim/firmalar/${f.id}`}>{f.kisaAd}</Link>
                      </td>
                      <td>{f.asamaAdi}</td>
                      <td className="sag sayi">{f.takipGun}</td>
                      <td className="kucuk">{f.sonNot ? `${tarihYaz(f.sonNot.tarih)}: ${f.sonNot.not}` : <span className="ikincil">Not yok</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel panel-ic">
          <h2 className="b3">Yetkili e-postası eksik</h2>
          <p>
            <strong className="buyuk-sayi">{ozet.yetkiliEksik.length}</strong> iskelet firmanın kişiye özel yetkili e-postası yok. Bu firmalara davet
            gönderilemez.
          </p>
          <p className="kucuk ikincil">Firmaları telefonla arayıp yetkilinin adını ve iş e-postasını firma kaydına yazın.</p>
          {ozet.yetkiliEksik.length > 0 && (
            <p className="dugme-grubu">
              <Link className="dugme dugme--ikincil dugme--kucuk" href={adres({ asama: 'iskelet' })}>
                Listede göster
              </Link>
              <a className="dugme dugme--ikincil dugme--kucuk" href="/yonetim/firmalar/disa-aktar" download>
                <Ikon ad="indir" kucuk /> Excel için indir (CSV)
              </a>
            </p>
          )}
        </section>
      </div>

      <section className="panel" id="liste">
        <header className="panel-ic y-panel-bas">
          <h2 className="b3">Firma listesi</h2>
          <span className="kucuk ikincil">{liste.length} firma</span>
        </header>
        <div className="panel-ic y-firma-suzgec">
          <form action="/yonetim/firmalar" className="y-ara">
            {sp.asama && <input type="hidden" name="asama" value={sp.asama} />}
            <label htmlFor="y-firma-ara" className="gizli">
              Firma ara
            </label>
            <input id="y-firma-ara" name="ara" className="girdi" placeholder="Unvan, kısa ad veya blok" defaultValue={sp.ara ?? ''} />
            <button className="dugme dugme--ikincil dugme--kucuk" type="submit">
              Ara
            </button>
          </form>
          <nav className="sekmeler y-suzgec" aria-label="Aşamaya göre süz">
            {SUZGECLER.map(([d, ad]) => (
              <Link key={d} href={adres({ asama: d || undefined })} aria-current={(sp.asama ?? '') === d ? 'page' : undefined}>
                {ad}
              </Link>
            ))}
          </nav>
        </div>
        {liste.length === 0 ? (
          <p className="panel-ic ikincil">Bu süzgece uyan firma yok.</p>
        ) : (
          <ul className="y-firmalar">
            {liste.map((f) => (
              <li key={f.id}>
                <Link href={`/yonetim/firmalar/${f.id}`}>
                  <FirmaKaro konum={f.konum} boy={32} />
                  <span className="y-firma-ad">
                    <strong>{f.kisaAd}</strong>
                    <span className="kucuk ikincil">
                      {f.konum}
                      {f.testFirmasi ? ' · test firması' : ''}
                    </span>
                  </span>
                  <span className="y-firma-durum">
                    <span className={`y-asama y-asama--${f.asama}`}>{f.ilkIlan && f.asama !== 'pasif' ? HUNI_ADI['ilk-ilan'] : f.asamaAdi}</span>
                    <span className="kucuk ikincil">
                      {f.uye} kullanıcı · {f.yayindakiIlan} yayında ilan
                      {f.bekleyenDavet ? ` · ${f.bekleyenDavet} bekleyen davet` : ''}
                    </span>
                    {f.asama === 'iskelet' && f.yetkili !== 'tamam' && <span className="durum durum--duzeltme">{YETKILI_ADI[f.yetkili]}</span>}
                    {f.takipGun !== null && <span className="durum durum--reddedildi">{f.takipGun} gündür ilerleme yok</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
