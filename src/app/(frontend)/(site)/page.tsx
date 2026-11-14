import Link from 'next/link'
import { sirala } from '@/alan/ilanFiltre'
import { Ikon } from '@/arayuz/Ikon'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

/** Ana sayfa: ilk ekranda arama, canlı sayılı hızlı filtreler ve gerçek son ilanlar. Dev slogan yok. */
export default async function AnaSayfa() {
  const ilanlar = await yayindakiIlanlar()
  const say = (fn: (i: (typeof ilanlar)[number]) => boolean) => ilanlar.filter(fn).length
  const son = sirala(ilanlar, 'yeni').slice(0, 8)
  const firmalar = [...ilanlar.reduce((m, i) => m.set(i.firma.id, { ...i.firma, n: (m.get(i.firma.id)?.n ?? 0) + 1 }), new Map<number, (typeof ilanlar)[number]['firma'] & { n: number }>()).values()]
    .sort((a, b) => b.n - a.n || a.ad.localeCompare(b.ad, 'tr'))
    .slice(0, 8)
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
              <button className="dugme" type="submit">
                Ara
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
          </div>
        </section>
        <div className="as-govde">
          <section className="as-ilanlar" aria-labelledby="as-son">
            <div className="bolum-bas">
              <h2 id="as-son" className="b2 kare-bas">
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
                    <IlanSatiri key={i.id} ilan={i} />
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
              <section aria-labelledby="as-firma">
                <h2 id="as-firma" className="b3 kare-bas">
                  İlan veren firmalar
                </h2>
                <ul className="firma-liste">
                  {firmalar.map((f) => (
                    <li key={f.id}>
                      <Link href={`/firma/${f.slug}`}>
                        <FirmaKaro konum={f.konum} boy={40} />
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
