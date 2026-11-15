import type { Metadata } from 'next'
import { dilAdresleri } from '@/alan/dil'
import Link from 'next/link'
import { ALT_TUR_ADI, sirala } from '@/alan/ilanFiltre'
import { ilanAdresi, yayinGoreli } from '@/arayuz/bicim'
import { Ikon } from '@/arayuz/Ikon'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'
import { kaydetmeBaglami } from '@/veri/kaydedilenler'

export const dynamic = 'force-dynamic'

/** Başlık ve açıklama kök düzenden gelir; burada kanonik adres ve dil karşılıkları (hreflang). */
export const metadata: Metadata = { alternates: dilAdresleri('/') }

const sonYediGunde = (iso?: string | null) => Boolean(iso) && Date.now() - new Date(iso!).getTime() < 7 * 86_400_000

/** Ana sayfa: ilk ekranda arama, canlı sayılı hızlı filtreler ve gerçek son ilanlar. Dev slogan yok. */
export default async function AnaSayfa() {
  const [ilanlar, kaydet] = await Promise.all([yayindakiIlanlar(), kaydetmeBaglami()])
  const say = (fn: (i: (typeof ilanlar)[number]) => boolean) => ilanlar.filter(fn).length
  const son = sirala(ilanlar, 'yeni').slice(0, 8)
  const firmalar = [...ilanlar.reduce((m, i) => m.set(i.firma.id, { ...i.firma, n: (m.get(i.firma.id)?.n ?? 0) + 1 }), new Map<number, (typeof ilanlar)[number]['firma'] & { n: number }>()).values()]
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
  // “Bu hafta yayına girenler”: son 7 takvim günü; yoksa en son yayına girenler (sahte tazelik yok, başlık değişir).
  const buHafta = sirala(ilanlar.filter((i) => sonYediGunde(i.yayinTarihi)), 'yeni')
  const vitrin = (buHafta.length ? buHafta : son).slice(0, 4)
  const firmaSayisi = new Set(ilanlar.map((i) => i.firma.id)).size
  const hizli = [
    { href: '/ilanlar?tur=staj', ad: 'Staj', n: say((i) => i.tur === 'staj') },
    { href: '/ilanlar?tur=is', ad: 'İş', n: say((i) => i.tur === 'is') },
    { href: '/ilanlar?model=uzaktan', ad: 'Uzaktan', n: say((i) => i.model === 'uzaktan') },
    { href: '/ilanlar?tur=is&deneyim=ogrenci&deneyim=yeni-mezun', ad: 'Yeni mezun', n: say((i) => i.tur === 'is' && ['ogrenci', 'yeni-mezun'].includes(i.deneyim)) },
  ].filter((h) => h.n > 0)

  return (
    <>
      <Ust />
      <main id="icerik" className="as">
        <section className="as-giris">
          <div className="as-giris-ic">
            <h1 className="b1">Pamukkale Teknokent firmalarında iş ve staj ilanları</h1>
            <p className="as-alt">
              {ilanlar.length ? (
                <>
                  Şu anda {firmaSayisi} firmanın <strong>{ilanlar.length} ilanı</strong> yayında.{' '}
                </>
              ) : (
                <>Şu anda yayında ilan bulunmuyor. </>
              )}
              İlanları yalnızca Pamukkale Teknokent’teki firmalar verir ve herkes başvurabilir.
            </p>
            <form className="arama" role="search" action="/ilanlar">
              <label className="gizli" htmlFor="as-ara">
                İlan ara
              </label>
              <span className="arama-kutu">
                <Ikon ad="ara" />
                <input id="as-ara" name="ara" className="girdi" type="search" placeholder="Pozisyon, beceri veya firma" autoComplete="off" enterKeyHint="search" />
              </span>
              <button className="dugme dugme--kiremit" type="submit">
                İlan ara
              </button>
            </form>
            {hizli.length > 0 && (
              <div className="hizli-filtre" role="group" aria-label="Hızlı filtreler">
                {hizli.map((h) => (
                  <Link key={h.ad} className="hap" href={h.href}>
                    {h.ad} <span className="sayi">{h.n}</span>
                  </Link>
                ))}
              </div>
            )}
            {vitrin.length > 0 && (
              <section className="bu-hafta" aria-labelledby="as-hafta">
                <div className="bu-hafta-bas">
                  <h2 id="as-hafta" className="b3">
                    {buHafta.length ? 'Bu hafta yayına girenler' : 'Son yayına girenler'}
                  </h2>
                  {buHafta.length > 0 && <span className="kucuk ikincil">{buHafta.length} ilan</span>}
                </div>
                {vitrin.map((i) => (
                  <Link key={i.id} className="bh-satir" href={ilanAdresi(i)}>
                    <FirmaKaro konum={i.firma.konum} logo={i.firma.logo} ad={i.firma.ad} boy={36} />
                    <span>
                      <strong>{i.pozisyonAdi}</strong>
                      <span>
                        {i.firma.ad} · {yayinGoreli(i.yayinTarihi) ?? ALT_TUR_ADI[i.altTur]}
                      </span>
                    </span>
                  </Link>
                ))}
                <p className="bh-not">Bütün ilanları yalnızca Pamukkale Teknokent firmaları verir.</p>
              </section>
            )}
          </div>
        </section>
        <div className="as-govde">
          <section className="as-ilanlar" aria-labelledby="as-son">
            <div className="bolum-bas">
              <h2 id="as-son" className="b2">
                Son yayınlanan ilanlar
              </h2>
              {ilanlar.length > 0 && (
                <Link href="/ilanlar" className="kucuk">
                  Tüm ilanları gör ({ilanlar.length})
                </Link>
              )}
            </div>
            {son.length ? (
              <>
                <div className="ilan-listesi">
                  {son.map((i) => (
                    <IlanSatiri key={i.id} ilan={i} kaydet={kaydet(i.id, ilanAdresi(i))} />
                  ))}
                </div>
                <Link className="dugme dugme--ikincil dugme--genis tumu" href="/ilanlar">
                  Tüm ilanları göster ({ilanlar.length})
                </Link>
              </>
            ) : (
              <div className="bos panel">
                <p className="b3">Şu anda yayında ilan bulunmuyor.</p>
                <p className="ikincil">Firmalar ilan yayınladığında ilanlar burada listelenir.</p>
              </div>
            )}
          </section>
          <aside className="as-yan">
            {firmalar.length > 0 && (
              <section className="yan-kutu" aria-labelledby="as-firma">
                <h2 id="as-firma" className="b3">
                  İlan veren firmalar
                </h2>
                <ul className="firma-liste">
                  {firmalar.slice(0, 8).map((f) => (
                    <li key={f.id}>
                      <Link href={`/firma/${f.slug}`}>
                        <FirmaKaro konum={f.konum} logo={f.logo} ad={f.ad} boy={40} />
                        <span>
                          <strong>{f.ad}</strong>
                          <span className="kucuk ikincil">
                            {[f.sektor, `${f.n} açık ilan`].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {firmalar.length > 8 && (
                  <Link className="kucuk" href="/firmalar">
                    Bütün firmaları gör ({firmalar.length})
                  </Link>
                )}
              </section>
            )}
            <p className="firma-satir">
              Teknokent firmasıysanız ilan vermek için <Link href="/giris?firma=1">firma girişi</Link> yapın. Hesabınız yoksa Yönetici A.Ş. sizi davet eder.
            </p>
          </aside>
        </div>
      </main>
    </>
  )
}
