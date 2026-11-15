import type { Metadata } from 'next'
import Link from 'next/link'
import { DONEMLER, donem, type Donem } from '@/alan/ozet'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { CanliYenileme } from '@/arayuz/grafik/CanliYenileme'
import { SiraliCubuklar } from '@/arayuz/grafik/Cubuklar'
import { SutunGrafik } from '@/arayuz/grafik/SutunGrafik'
import { OzetSekmeleri } from '@/arayuz/yonetim/OzetSekmeleri'
import { trafikVerisi } from '@/veri/trafik'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Site trafiği · Yönetim' }

type Props = { searchParams: Promise<{ donem?: string }> }

const KISA = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
const UZUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'Europe/Istanbul' })
const GUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' })
const sayi = (n: number) => n.toLocaleString('tr-TR')

function etiket(gun: string, d: Donem) {
  const bas = new Date(`${gun}T12:00:00+03:00`)
  if (d.adimGun === 1) return { kisa: KISA.format(bas), uzun: UZUN.format(bas) }
  return { kisa: KISA.format(bas), uzun: `${KISA.format(bas)} – ${GUN.format(new Date(bas.getTime() + 6 * 86_400_000))} haftası` }
}

function Degisim({ d }: { d: { fark: number; yuzde: number | null } }) {
  if (d.fark === 0) return <span className="ozet-degisim">Önceki dönemle aynı</span>
  const artis = d.fark > 0
  return (
    <span className={artis ? 'ozet-degisim iyi' : 'ozet-degisim kotu'}>
      <span aria-hidden="true">{artis ? '▲' : '▼'}</span> {artis ? '+' : '−'}
      {sayi(Math.abs(d.fark))}
      {d.yuzde !== null ? ` (%${sayi(Math.abs(d.yuzde))})` : ''} <span className="ikincil">önceki döneme göre</span>
    </span>
  )
}

/**
 * Site trafiği (kullanıcı isteği, 15.11.2026). Kendi ölçümümüz: dış hizmet yok, veri kurumda kalır ve Türkiye'deki
 * sunucuya taşınır (talimatlar 9, K2). Tekil ziyaretçi yalnızca istatistik çerezine izin verenlerde (src/alan/cerez.ts).
 */
export default async function SiteTrafigi({ searchParams }: Props) {
  await yonetimOturumu('/yonetim/ozet/trafik')
  const sp = await searchParams
  const d = donem(sp.donem)
  const v = await trafikVerisi(d)
  const birimAdi = d.adimGun === 7 ? 'haftalık' : 'günlük'
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Yönetici özeti</h1>
          <p className="ikincil">
            {d.ad}: {GUN.format(d.bas)} – {GUN.format(new Date(d.bit.getTime() - 1))}. Karşılaştırma: önceki eşit uzunluktaki dönem.
          </p>
        </div>
        <CanliYenileme zaman={new Date().toISOString()} />
      </div>
      <OzetSekmeleri etkin="trafik" donem={sp.donem} />
      <nav className="sekmeler y-suzgec" aria-label="Dönem">
        {DONEMLER.map(([k, ad]) => (
          <Link key={k} href={`/yonetim/ozet/trafik?donem=${k}`} aria-current={d.kod === k ? 'page' : undefined}>
            {ad}
          </Link>
        ))}
      </nav>

      <ModulBilgisi kimlik="yonetim-trafik" baslik="Site trafiği nasıl ölçülüyor?">
        <p>
          Bu sayfa portalın herkese açık sayfalarının (ana sayfa, ilanlar, ilan ve firma sayfaları, başvuru formu) kaç kez açıldığını ve ziyaretçilerin
          nereden geldiğini gösterir. Ölçümü portal kendisi yapar; dış bir analiz hizmeti (Google Analytics gibi) ve reklam çerezi kullanılmaz.
        </p>
        <ul>
          <li>
            <strong>Ziyaret:</strong> Siteye başka bir siteden, arama motorundan veya adres yazarak gelinmesidir. Site içinde sayfadan sayfaya geçmek yeni
            ziyaret sayılmaz.
          </li>
          <li>
            <strong>Sayfa görüntüleme:</strong> Bir sayfanın her açılışıdır. Filtre değiştirmek yeni görüntüleme sayılmaz.
          </li>
          <li>
            Ziyaret ve sayfa görüntüleme herkes için, kişiyi tanıyacak hiçbir bilgi (IP adresi, tarayıcı kimliği) tutulmadan sayılır.
          </li>
          <li>
            <strong>Tekil ziyaretçi</strong> yalnızca istatistik çerezine izin verenler için sayılır. Bu çerez kişiyi tanıtmaz; yalnızca ilk ziyaret ayını ve
            son ziyaret gününü tutar. Gerçek sayı, izin oranına göre bundan biraz yüksektir.
          </li>
          <li>Arama motoru botları, firma ve Yönetici A.Ş. kullanıcılarının gezinmesi ve tarayıcısında “takip etme” tercihi açık olanlar sayılmaz.</li>
          <li>Bugünün sayıları canlıdır; geçmiş günler her gece özetlenir.</li>
        </ul>
      </ModulBilgisi>

      <section className="ozet-serit" aria-label="Temel göstergeler">
        <div className="ozet-kutu">
          <p className="ozet-ad">Ziyaret</p>
          <p className="ozet-deger">{sayi(v.ziyaret)}</p>
          <Degisim d={v.ziyaretDegisim} />
          <p className="ozet-tanim">Siteye dışarıdan gelişler</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Sayfa görüntüleme</p>
          <p className="ozet-deger">{sayi(v.goruntuleme)}</p>
          <Degisim d={v.goruntulemeDegisim} />
          <p className="ozet-tanim">Herkese açık sayfaların açılma sayısı</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Ziyaret başına sayfa</p>
          <p className="ozet-deger">{v.sayfaBasina === null ? '—' : v.sayfaBasina.toLocaleString('tr-TR')}</p>
          <p className="ozet-tanim">Bir ziyarette ortalama kaç sayfa açıldığı</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Telefondan gelen</p>
          <p className="ozet-deger">{v.mobilOran === null ? '—' : `%${v.mobilOran}`}</p>
          <p className="ozet-tanim">Ziyaretlerin telefondan yapılan bölümü</p>
        </div>
      </section>

      <section className="ozet-bolum" aria-labelledby="tr-izinli">
        <h2 id="tr-izinli" className="b4">
          Tekil ziyaretçiler <span className="kucuk ikincil">(istatistik çerezine izin verenler)</span>
        </h2>
        <div className="ozet-serit">
          <div className="ozet-kutu">
            <p className="ozet-ad">Günlük tekil ziyaretçi</p>
            <p className="ozet-deger">{sayi(v.izinli.gunlukTekil)}</p>
            <p className="ozet-tanim">Dönemde bir günde siteye giren farklı kişi sayısının ortalaması</p>
          </div>
          <div className="ozet-kutu">
            <p className="ozet-ad">Bu ay tekil ziyaretçi</p>
            <p className="ozet-deger">{sayi(v.izinli.buAyTekil)}</p>
            <p className="ozet-tanim">Bu takvim ayında siteye giren farklı kişi sayısı</p>
          </div>
          <div className="ozet-kutu">
            <p className="ozet-ad">Geri dönen ziyaretçi</p>
            <p className="ozet-deger">{v.izinli.geriDonenOran === null ? '—' : `%${v.izinli.geriDonenOran}`}</p>
            <p className="ozet-tanim">Daha önce de gelmiş olan ziyaretçilerin payı</p>
          </div>
          <div className="ozet-kutu">
            <p className="ozet-ad">İzin oranı</p>
            <p className="ozet-deger">{v.izinli.izinOrani === null ? '—' : `%${v.izinli.izinOrani}`}</p>
            <p className="ozet-tanim">Ziyaretlerin istatistik çerezine izin verilen bölümü; tekil sayılar yalnızca bunları kapsar</p>
          </div>
        </div>
      </section>

      <section className="panel panel-ic ozet-bolum">
        <h2 className="b3">Ziyaretler ({birimAdi})</h2>
        <SutunGrafik
          baslik={`${birimAdi} ziyaret sayısı, ${d.ad.toLocaleLowerCase('tr')}`}
          veri={v.trend.map((x) => ({ ...etiket(x.gun, d), deger: x.ziyaret }))}
          birim="ziyaret"
          tabloBasligi="Ziyaretler"
        />
      </section>

      <div className="y-iki">
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3">Ziyaretçiler nereden geliyor?</h2>
          <SiraliCubuklar gruplar={v.kaynaklar} birim="ziyaret" bos="Bu dönemde ziyaret yok." />
        </section>
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3">Hangi cihazla?</h2>
          <SiraliCubuklar gruplar={v.cihazlar} birim="ziyaret" bos="Bu dönemde ziyaret yok." />
          {v.siteler.length > 0 && (
            <>
              <h3 className="b4">Yönlendiren siteler</h3>
              <SiraliCubuklar gruplar={v.siteler} birim="ziyaret" bos="" />
            </>
          )}
        </section>
      </div>

      <div className="y-iki">
        <section className="panel ozet-bolum">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">En çok görüntülenen sayfalar</h2>
          </header>
          {v.sayfalar.length ? (
            <div className="tablo-kap">
              <table className="tablo">
                <thead>
                  <tr>
                    <th scope="col">Sayfa</th>
                    <th scope="col" className="sag">
                      Görüntüleme
                    </th>
                    <th scope="col" className="sag">
                      Ziyaret başlangıcı
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {v.sayfalar.map((s) => (
                    <tr key={s.ad}>
                      <td>{s.yol ? <Link href={s.yol}>{s.ad}</Link> : s.ad}</td>
                      <td className="sag">{sayi(s.goruntuleme)}</td>
                      <td className="sag">{sayi(s.ziyaret)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="panel-ic kucuk ikincil">Bu dönemde sayfa görüntüleme yok.</p>
          )}
        </section>
        <section className="panel ozet-bolum">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">Ziyaretlerin başladığı sayfalar</h2>
          </header>
          {v.girisSayfalari.length ? (
            <div className="tablo-kap">
              <table className="tablo">
                <thead>
                  <tr>
                    <th scope="col">Sayfa</th>
                    <th scope="col" className="sag">
                      Ziyaret
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {v.girisSayfalari.map((s) => (
                    <tr key={s.ad}>
                      <td>{s.yol ? <Link href={s.yol}>{s.ad}</Link> : s.ad}</td>
                      <td className="sag">{sayi(s.ziyaret)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="panel-ic kucuk ikincil">Bu dönemde ziyaret yok.</p>
          )}
        </section>
      </div>
    </>
  )
}
