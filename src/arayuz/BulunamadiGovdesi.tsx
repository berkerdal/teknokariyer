import Link from 'next/link'
import { Ikon } from './Ikon'

/**
 * 404 gövdesi (kullanıcı isteği, 15.11.2026): lacivert blokta büyük “404” ve Pamukkale Teknokent negatif logosu; yanında
 * ne olduğunu anlatan cümle, ilan araması ve sık gidilen sayfalar. Hem sitede bulunamayan kayıt (ilan, firma) hem de
 * hiçbir adresle eşleşmeyen istek aynı gövdeyi kullanır. Sayfa gerçek HTTP 404 döner.
 */
export function BulunamadiGovdesi() {
  return (
    <main id="icerik" className="bulunamadi">
      <div className="bn-kart">
        <div className="bn-pano" aria-hidden="true">
          <span className="bn-sayi">404</span>
          <img src="/logo/kurum/teknokent-dikey-negatif.svg" alt="" width={132} height={69} />
        </div>
        <div className="bn-govde">
          <p className="ust-etiket">Hata 404 · Sayfa bulunamadı</p>
          <h1 className="b1">Aradığın sayfa burada değil</h1>
          <p className="ikincil">
            Bağlantı yanlış yazılmış ya da sayfa kaldırılmış olabilir. Süresi dolan ilanlar bir süre sonra yayından kalkar. Aradığın ilanı aşağıdan
            bulabilirsin.
          </p>
          <form className="arama bn-arama" role="search" action="/ilanlar">
            <label className="gizli" htmlFor="bn-ara">
              İlan ara
            </label>
            <span className="arama-kutu">
              <Ikon ad="ara" />
              <input id="bn-ara" name="ara" className="girdi" type="search" placeholder="Pozisyon, beceri veya firma" enterKeyHint="search" />
            </span>
            <button className="dugme" type="submit">
              İlan ara
            </button>
          </form>
          <nav aria-label="Sık kullanılan sayfalar" className="bn-baglantilar">
            <p className="kucuk ikincil">Şunlar da işine yarayabilir:</p>
            <ul>
              <li>
                <Link href="/ilanlar">
                  <Ikon ad="liste" kucuk /> Tüm ilanlar
                </Link>
              </li>
              <li>
                <Link href="/ilanlar?tur=staj">
                  <Ikon ad="canta" kucuk /> Staj ilanları
                </Link>
              </li>
              <li>
                <Link href="/firmalar">
                  <Ikon ad="ofis" kucuk /> Firmalar
                </Link>
              </li>
              <li>
                <Link href="/">
                  <Ikon ad="ev" kucuk /> Ana sayfa
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </main>
  )
}
