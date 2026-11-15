import Link from 'next/link'
import { hesapMenusuOgeleri } from '@/alan/hesapMenusu'
import { HesapMenusu } from '../HesapMenusu'
import { FirmaKaro } from '../FirmaKaro'

const YETKI_KISA: Record<string, string> = { yonetici: 'Tam yetkili', 'ilan-sorumlusu': 'İlan sorumlusu', degerlendirici: 'Değerlendirici' }

/** Firma paneli üst çubuğu: alt marka logosu, firma, kişi ve hesap menüsü (açılır liste, dokunmatikte de çalışır). */
export function FirmaUst({ firma, kisi, unvan, yetki }: { firma: { kisaAd: string; konum: string; logo?: string | null }; kisi: string; unvan?: string | null; yetki: string }) {
  return (
    <header className="f-ust">
      <div className="f-ust-ic">
        <Link href="/firma-paneli" className="f-ust-logo" aria-label="Firma paneli, özet">
          <img className="ust-logo" src="/logo/logo-kompakt-renkli.svg" alt="TeknoKariyer" width={150} height={26} />
        </Link>
        <span className="f-firma">
          <FirmaKaro konum={firma.konum} logo={firma.logo} boy={30} />
          <span>
            <strong>{firma.kisaAd}</strong>
            <span className="kucuk ikincil f-firma-konum">{firma.konum}</span>
          </span>
        </span>
        <div className="f-hesap">
          <HesapMenusu ad={kisi} altBilgi={unvan || (YETKI_KISA[yetki] ?? null)} ogeler={hesapMenusuOgeleri('firma')} adiGoster />
        </div>
      </div>
    </header>
  )
}
