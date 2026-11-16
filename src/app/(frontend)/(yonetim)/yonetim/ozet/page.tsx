import type { Metadata } from 'next'
import Link from 'next/link'
import { DURUM_ADI } from '@/alan/ilan'
import { DONEMLER, donem, type Donem } from '@/alan/ozet'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { ilanAdresi } from '@/arayuz/bicim'
import { CanliYenileme } from '@/arayuz/grafik/CanliYenileme'
import { Huni, SiraliCubuklar } from '@/arayuz/grafik/Cubuklar'
import { SutunGrafik, type SutunVerisi } from '@/arayuz/grafik/SutunGrafik'
import { ozetVerisi } from '@/veri/ozet'
import { OzetSekmeleri } from '@/arayuz/yonetim/OzetSekmeleri'
import { SIRALAMALAR, tabloyuSuz } from '@/veri/ozetTablo'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Yönetici özeti · Yönetim' }

type Props = { searchParams: Promise<{ donem?: string; durum?: string; ara?: string; sirala?: string; yon?: string; tum?: string }> }

const KISA = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
const UZUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'Europe/Istanbul' })
const GUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' })
const sayi = (n: number) => n.toLocaleString('tr-TR')

function dilimEtiketi(gun: string, d: Donem): Omit<SutunVerisi, 'deger'> {
  const bas = new Date(`${gun}T12:00:00+03:00`)
  if (d.adimGun === 1) return { kisa: KISA.format(bas), uzun: UZUN.format(bas) }
  const bit = new Date(bas.getTime() + 6 * 86_400_000)
  return { kisa: KISA.format(bas), uzun: `${KISA.format(bas)} – ${GUN.format(bit)} haftası` }
}

function Degisim({ d, iyiYon = 'artis' }: { d: { fark: number; yuzde: number | null }; iyiYon?: 'artis' }) {
  if (d.fark === 0) return <span className="ozet-degisim">Önceki dönemle aynı</span>
  const artis = d.fark > 0
  const iyi = artis === (iyiYon === 'artis')
  return (
    <span className={iyi ? 'ozet-degisim iyi' : 'ozet-degisim kotu'}>
      <span aria-hidden="true">{artis ? '▲' : '▼'}</span> {artis ? '+' : '−'}
      {sayi(Math.abs(d.fark))}
      {d.yuzde !== null ? ` (%${sayi(Math.abs(d.yuzde))})` : ''} <span className="ikincil">önceki döneme göre</span>
    </span>
  )
}

export default async function YoneticiOzeti({ searchParams }: Props) {
  await yonetimOturumu('/yonetim/ozet')
  const sp = await searchParams
  const d = donem(sp.donem)
  const v = await ozetVerisi(d)
  const zaman = new Date().toISOString()
  const tablo = tabloyuSuz(v.tablo, sp)
  const gosterilen = sp.tum ? tablo : tablo.slice(0, 50)
  const adres = (q: Record<string, string | undefined>, capa = '') => {
    const p = new URLSearchParams(Object.entries({ donem: sp.donem, durum: sp.durum, ara: sp.ara, sirala: sp.sirala, yon: sp.yon, ...q }).filter(([, x]) => x) as Array<[string, string]>)
    return `/yonetim/ozet${p.size ? `?${p}` : ''}${capa}`
  }
  const siralaBaglanti = (k: string, ad: string, sag = false) => {
    const etkin = (sp.sirala ?? 'yayin') === k
    const yon = etkin && sp.yon !== 'artan' ? 'artan' : undefined
    return (
      <th scope="col" className={sag ? 'sag' : undefined} aria-sort={etkin ? (sp.yon === 'artan' ? 'ascending' : 'descending') : undefined}>
        <Link href={adres({ sirala: k, yon }, '#ilanlar')} className="y-sirala">
          {ad}
          {etkin && <span aria-hidden="true">{sp.yon === 'artan' ? ' ↑' : ' ↓'}</span>}
        </Link>
      </th>
    )
  }
  const basvuruVeri = v.basvuruTrendi.map((x) => ({ ...dilimEtiketi(x.gun, d), deger: x.n }))
  const ilanVeri = v.ilanTrendi.map((x) => ({ ...dilimEtiketi(x.gun, d), deger: x.n }))
  const birimAdi = d.adimGun === 7 ? 'haftalık' : 'günlük'

  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Yönetici özeti</h1>
          <p className="ikincil">
            {d.ad}: {GUN.format(d.bas)} – {GUN.format(new Date(d.bit.getTime() - 1))}. Karşılaştırma: önceki {d.ad.toLocaleLowerCase('tr').replace('son ', '')}.
          </p>
        </div>
        <CanliYenileme zaman={zaman} />
      </div>
      <OzetSekmeleri etkin="portal" donem={sp.donem} />

      <nav className="sekmeler y-suzgec" aria-label="Dönem">
        {DONEMLER.map(([k, ad]) => (
          <Link key={k} href={adres({ donem: k })} aria-current={d.kod === k ? 'page' : undefined}>
            {ad}
          </Link>
        ))}
      </nav>

      <ModulBilgisi kimlik="yonetim-ozet" baslik="Bu sayfa nasıl okunur?">
        <p>
          Özet, portalın durumunu yönetimin beş sorusuna göre gösterir. Sayfa açık kaldığı sürece her dakika kendiliğinden yenilenir. Yukarıdaki dönem
          seçimi bütün sayıları ve grafikleri birlikte değiştirir.
        </p>
        <ul>
          <li>Her sayının altında ne anlama geldiği ve hangi dönemi kapsadığı yazar. Değişimler bir önceki eşit uzunluktaki dönemle karşılaştırılır.</li>
          <li>Grafiklerin üzerine gelerek veya grafiği seçip ok tuşlarıyla günlük değerleri okuyabilirsiniz; “Tablo olarak göster” bütün değerleri verir.</li>
          <li>Sayfada aday adı veya iletişim bilgisi yer almaz. Kişiyi tanınır kılmamak için 5’ten küçük gruplar “5’ten az” olarak gösterilir.</li>
        </ul>
      </ModulBilgisi>

      <section className="ozet-serit" aria-label="Temel göstergeler">
        <div className="ozet-kutu">
          <p className="ozet-ad">Yayındaki ilan</p>
          <p className="ozet-deger">{sayi(v.serit.yayindakiIlan)}</p>
          <p className="ozet-tanim">Şu anda başvuru alan ilanlar</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Başvuru</p>
          <p className="ozet-deger">{sayi(v.serit.donemBasvuru)}</p>
          <Degisim d={v.serit.basvuruDegisim} />
          <p className="ozet-tanim">Dönemde gönderilen, geri çekilmemiş başvurular</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Yeni aday hesabı</p>
          <p className="ozet-deger">{sayi(v.serit.yeniAday)}</p>
          <Degisim d={v.serit.adayDegisim} />
          <p className="ozet-tanim">Dönemde açılan aday hesapları</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">İlan veren firma</p>
          <p className="ozet-deger">{sayi(v.serit.ilanVerenFirma)}</p>
          <p className="ozet-tanim">Dönemde ilanı yayına giren veya şu anda yayında ilanı olan firmalar</p>
        </div>
        <div className="ozet-kutu">
          <p className="ozet-ad">Onay bekleyen ilan</p>
          <p className="ozet-deger">{sayi(v.serit.onaydaIlan)}</p>
          <p className="ozet-tanim">
            <Link href="/yonetim/onay">Onay kuyruğuna git</Link>
          </p>
        </div>
      </section>

      <section className="panel panel-ic ozet-bolum">
        <h2 className="b3 kare-bas">Portal kullanılıyor mu?</h2>
        <div className="y-iki ozet-ikili">
          <div>
            <h3 className="b4">Başvurular ({birimAdi})</h3>
            <SutunGrafik baslik={`${birimAdi} başvuru sayısı, ${d.ad.toLocaleLowerCase('tr')}`} veri={basvuruVeri} birim="başvuru" tabloBasligi="Başvurular" />
          </div>
          <div>
            <h3 className="b4">Yayına giren ilanlar ({birimAdi})</h3>
            <SutunGrafik baslik={`${birimAdi} yayına giren ilan sayısı, ${d.ad.toLocaleLowerCase('tr')}`} veri={ilanVeri} birim="ilan" tabloBasligi="Yayına giren ilanlar" />
          </div>
        </div>
      </section>

      <section className="panel ozet-bolum" id="ilanlar">
        <header className="panel-ic y-panel-bas">
          <h2 className="b3 kare-bas">Bütün ilanlar</h2>
          <span className="kucuk ikincil">
            {sayi(tablo.length)} ilan · taslaklar hariç · görüntülenme ve başvuru sayıları canlı
          </span>
        </header>
        <div className="panel-ic y-firma-suzgec">
          <form action="/yonetim/ozet" className="y-ara ozet-tablo-suzgec">
            {sp.donem && <input type="hidden" name="donem" value={sp.donem} />}
            {sp.sirala && <input type="hidden" name="sirala" value={sp.sirala} />}
            <label htmlFor="ozet-durum" className="gizli">
              Durum
            </label>
            <select id="ozet-durum" name="durum" className="secim secim--kucuk" defaultValue={sp.durum ?? ''}>
              <option value="">Bütün durumlar</option>
              <option value="acik">Başvuru alanlar (yayında ve duraklatılmış)</option>
              {(['yayinda', 'duraklatildi', 'onayda', 'duzeltme', 'suresi-doldu', 'kapandi'] as const).map((x) => (
                <option key={x} value={x}>
                  {DURUM_ADI[x]}
                </option>
              ))}
            </select>
            <label htmlFor="ozet-ara" className="gizli">
              İlan veya firma ara
            </label>
            <input id="ozet-ara" name="ara" className="girdi" placeholder="İlan veya firma ara" defaultValue={sp.ara ?? ''} />
            <button className="dugme dugme--ikincil dugme--kucuk" type="submit">
              Uygula
            </button>
            <a className="dugme dugme--ikincil dugme--kucuk" href={adres({}).replace('/yonetim/ozet', '/yonetim/ozet/ilanlar-csv')} download>
              <Ikon ad="indir" kucuk /> Excel için indir
            </a>
          </form>
        </div>
        <div className="tablo-kap" tabIndex={0}>
          <table className="tablo y-tablo ozet-tablo">
            <thead>
              <tr>
                <th scope="col">İlan</th>
                {siralaBaglanti('firma', 'Firma')}
                <th scope="col">Durum</th>
                {siralaBaglanti('yayin', 'Yayın')}
                {siralaBaglanti('kalan', 'Kalan gün', true)}
                {siralaBaglanti('goruntulenme', 'Görüntülenme', true)}
                {siralaBaglanti('basvuru', 'Başvuru', true)}
                {siralaBaglanti('yeni', 'İncelenmemiş', true)}
                {siralaBaglanti('donem', 'Dönemde', true)}
              </tr>
            </thead>
            <tbody>
              {gosterilen.map((i) => (
                <tr key={i.id}>
                  <td>
                    {['yayinda', 'duraklatildi', 'kapandi', 'suresi-doldu'].includes(i.durum) ? (
                      <Link href={ilanAdresi(i)}>{i.pozisyonAdi}</Link>
                    ) : i.durum === 'onayda' ? (
                      <Link href={`/yonetim/onay/${i.id}`}>{i.pozisyonAdi}</Link>
                    ) : (
                      i.pozisyonAdi
                    )}
                  </td>
                  <td>
                    <Link href={`/yonetim/firmalar/${i.firmaId}`}>{i.firma}</Link>
                  </td>
                  <td>
                    <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum]}</span>
                  </td>
                  <td className="sayi">{i.yayinTarihi ? GUN.format(new Date(i.yayinTarihi)) : '—'}</td>
                  <td className="sag sayi">{i.kalan === null ? '—' : i.kalan === 0 ? 'Bugün' : sayi(i.kalan)}</td>
                  <td className="sag sayi">{sayi(i.goruntulenme)}</td>
                  <td className="sag sayi">{sayi(i.basvuru)}</td>
                  <td className="sag sayi">{i.yeni ? <strong>{sayi(i.yeni)}</strong> : 0}</td>
                  <td className="sag sayi">{sayi(i.donemBasvuru)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tablo.length > gosterilen.length && (
          <p className="panel-ic kucuk">
            İlk 50 ilan gösteriliyor. <Link href={adres({ tum: '1' }, '#ilanlar')}>Hepsini göster ({sayi(tablo.length)})</Link> veya Excel olarak indirin.
          </p>
        )}
        <p className="panel-ic kucuk ikincil">
          “İncelenmemiş”, firmanın henüz açmadığı başvurulardır. “Dönemde”, seçilen dönemde gelen başvurulardır. Sıralamak için sütun başlığını seçin.
          Şu anki sıralama: {SIRALAMALAR[sp.sirala ?? 'yayin']?.ad ?? 'Yayın tarihi'}.
        </p>
      </section>

      <div className="y-iki">
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3 kare-bas">İlanlar sonuç veriyor mu?</h2>
          <p className="kucuk ikincil">Dönemde gelen başvuruların bugün ulaştığı aşama. Yüzdeler ilk basamağa göredir.</p>
          <Huni adimlar={v.sonuc} />
          <p className="kucuk ikincil">
            Görüşmeden sonra olumsuz sonuçlanan başvurular “İncelendi” basamağında sayılır; portal başvurunun yalnızca bugünkü durumunu bilir.
          </p>
        </section>
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3 kare-bas">Hangi firmalar aktif?</h2>
          <p>
            <strong>{sayi(v.firmalar.etkin)}</strong> etkin firmanın <strong>{sayi(v.firmalar.ilanVeren)}</strong> tanesi en az bir ilan yayınladı.{' '}
            <strong>{sayi(v.firmalar.ilanVermeyen)}</strong> firma henüz hiç ilan vermedi.
          </p>
          <p className="kucuk">
            <Link href="/yonetim/firmalar#liste">Firma listesinde kurulum aşamalarını görün</Link>
          </p>
          {v.firmalar.tablo.length > 0 && (
            <div className="tablo-kap" tabIndex={0}>
              <table className="tablo y-tablo">
                <caption className="kucuk ikincil ozet-baslik-alti">Dönemde en çok başvuru alan firmalar</caption>
                <thead>
                  <tr>
                    <th scope="col">Firma</th>
                    <th scope="col" className="sag">
                      Yayında ilan
                    </th>
                    <th scope="col" className="sag">
                      Dönemde başvuru
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {v.firmalar.tablo.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <Link href={`/yonetim/firmalar/${f.id}`}>{f.ad}</Link>
                      </td>
                      <td className="sag sayi">{sayi(f.yayinda)}</td>
                      <td className="sag sayi">{sayi(f.basvuru)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="y-iki">
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3 kare-bas">Bölgenin yetenek ihtiyacı</h2>
          <p className="kucuk ikincil">
            Yayındaki ilanlarda zorunlu olarak istenen beceriler ve CV havuzunda bu beceriye sahip aday sayısı. İlan başına aday azaldıkça açık büyür.
          </p>
          {v.yetenek.length === 0 ? (
            <p className="kucuk ikincil">Yayında zorunlu beceri isteyen ilan yok.</p>
          ) : (
            <div className="tablo-kap" tabIndex={0}>
              <table className="tablo y-tablo">
                <thead>
                  <tr>
                    <th scope="col">Beceri</th>
                    <th scope="col" className="sag">
                      İlan
                    </th>
                    <th scope="col" className="sag">
                      Havuzda aday
                    </th>
                    <th scope="col" className="sag">
                      İlan başına aday
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {v.yetenek.map((y, i) => (
                    <tr key={y.ad}>
                      <td>{i === 0 ? <strong>{y.ad}</strong> : y.ad}</td>
                      <td className="sag sayi">{sayi(y.ilan)}</td>
                      <td className="sag sayi">{y.aday > 0 && y.aday < 5 ? '5’ten az' : sayi(y.aday)}</td>
                      <td className="sag sayi">{y.aday > 0 && y.aday < 5 ? '—' : y.oran.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel panel-ic ozet-bolum">
          <h2 className="b3 kare-bas">Adaylar nereden geliyor?</h2>
          <p>
            {v.kaynak.pauOrani === null ? (
              'Dönemde okul bilgisi olan başvuru sayısı oran vermek için az.'
            ) : (
              <>
                Okulu bilinen başvurularda Pamukkale Üniversitesi’nin payı: <strong>%{v.kaynak.pauOrani}</strong>.
              </>
            )}
          </p>
          <h3 className="b4">Üniversite</h3>
          <SiraliCubuklar gruplar={v.kaynak.okul} birim="başvuru" bos="Dönemde başvuru yok." />
          <h3 className="b4">Bölüm</h3>
          <SiraliCubuklar gruplar={v.kaynak.bolum} birim="başvuru" bos="Dönemde başvuru yok." />
          <h3 className="b4">Başvurunun geldiği yer</h3>
          <SiraliCubuklar gruplar={v.kaynak.kanal} birim="başvuru" bos="Dönemde başvuru yok." />
        </section>
      </div>
    </>
  )
}
