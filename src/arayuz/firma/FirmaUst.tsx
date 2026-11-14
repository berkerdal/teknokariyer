import Link from 'next/link'
import { cikisEylemi } from '@/eylemler/hesap'
import { FirmaKaro } from '../FirmaKaro'
import { Ikon } from '../Ikon'

const YETKI_ADI: Record<string, string> = {
  yonetici: 'Tam yetkili (ilanlar, başvurular, ekip ve firma profili)',
  'ilan-sorumlusu': 'İlan sorumlusu (ilanlar ve başvurular)',
  degerlendirici: 'Değerlendirici (başvuruları görür, not yazar)',
}

/** Firma paneli üst çubuğu: alt marka logosu, firma, kişi ve hesap menüsü (açılır liste, dokunmatikte de çalışır). */
export function FirmaUst({ firma, kisi, unvan, yetki }: { firma: { kisaAd: string; konum: string; logo?: string | null }; kisi: string; unvan?: string | null; yetki: string }) {
  return (
    <header className="f-ust">
      <div className="f-ust-ic">
        <Link href="/firma-paneli" className="f-ust-logo" aria-label="Firma paneli, özet">
          <img className="ust-logo" src="/logo/logo-kompakt-renkli.svg" alt="TeknoKariyer" width={150} height={26} />
        </Link>
        <span className="f-firma">
          {firma.logo ? <img src={firma.logo} alt="" width={28} height={28} className="f-firma-logo" /> : <FirmaKaro konum={firma.konum} boy={28} />}
          <span>
            <strong>{firma.kisaAd}</strong>
            <span className="kucuk ikincil f-firma-konum">{firma.konum}</span>
          </span>
        </span>
        <details className="f-hesap">
          <summary>
            <span className="f-hesap-ad">
              {kisi}
              {unvan && <span className="f-hesap-unvan">{unvan}</span>}
            </span>
            <span className="gizli">: hesap menüsü</span>
            <Ikon ad="menu" />
          </summary>
          <div className="f-hesap-menu">
            <p className="kucuk">
              <strong>{kisi}</strong>
              {unvan && (
                <>
                  <br />
                  {unvan}
                </>
              )}
              <br />
              <span className="ikincil">Yetki: {YETKI_ADI[yetki] ?? yetki}</span>
            </p>
            <Link href="/firma-paneli/profil">Firma profili</Link>
            <Link href="/firma-paneli/ekip">Ekip</Link>
            <Link href="/">Portalın ana sayfası</Link>
            <form action={cikisEylemi}>
              <button type="submit">Çıkış yap</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  )
}
