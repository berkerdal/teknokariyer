import type { IlanOzeti } from '@/alan/ilanFiltre'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { DENEYIM_ADI, MODEL_ADI } from '@/alan/eslesme'
import { ilanAdresi, sonTarih, yayinGoreli } from './bicim'
import { FirmaKaro } from './FirmaKaro'
import { Ikon } from './Ikon'
import { IlanBaglantisi } from './IlanBaglantisi'
import { KaydetDugmesi, type KaydetBaglami } from './KaydetDugmesi'

/**
 * Liste satırı (K36): firma karosu, koyu başlık, ikonlu kısa bilgiler, gerçek durum etiketleri, sağda son başvuru ve
 * yayın zamanı. Yoğun ve taranabilir; büyük kart yok.
 */
export function IlanSatiri({ ilan, secili = false, onizleme, kaydet }: { ilan: IlanOzeti; secili?: boolean; onizleme?: string; kaydet?: KaydetBaglami | null }) {
  const s = sonTarih(ilan.sonBasvuru)
  const yayin = yayinGoreli(ilan.yayinTarihi)
  return (
    <div className="ilan-satiri" aria-current={secili ? 'true' : undefined}>
      <FirmaKaro konum={ilan.firma.konum} logo={ilan.firma.logo} ad={ilan.firma.ad} boy={48} />
      <div className="is-govde">
        <IlanBaglantisi className="poz" href={ilanAdresi(ilan)} onizleme={onizleme}>
          {ilan.pozisyonAdi}
        </IlanBaglantisi>
        <span className="firma">
          <strong>{ilan.firma.ad}</strong> <span className="konum">· {ilan.firma.konum}</span>
        </span>
        <span className="is-meta">
          <span>
            <Ikon ad="canta" kucuk />
            {ALT_TUR_ADI[ilan.altTur] ?? ilan.altTur}
          </span>
          <span>
            <Ikon ad="konum" kucuk />
            {MODEL_ADI[ilan.model]}
          </span>
          {ilan.tur === 'is' && (
            <span>
              <Ikon ad="seviye" kucuk />
              {DENEYIM_ADI[ilan.deneyim]}
            </span>
          )}
          {ilan.tur === 'staj' && ilan.ucretliStaj && <span className="rozet rozet--yesil">Ücretli</span>}
          {ilan.pauOncelik && <span className="rozet rozet--lacivert">PAÜ öncelikli</span>}
        </span>
      </div>
      <span className="is-sag">
        {kaydet && <KaydetDugmesi ilanId={ilan.id} baglam={kaydet} ad={ilan.pozisyonAdi} />}
        <span className={s.vurgu ? 'son-gun' : undefined}>
          {s.vurgu && <Ikon ad="saat" kucuk />}
          {s.metin}
        </span>
        {yayin && <span className="yayin">{yayin}</span>}
      </span>
    </div>
  )
}

/** Beceri listesi: profil varsa “var / eksik” işaretli, yoksa nötr. */
export function BeceriListesi(props: { zorunlu: string[]; tercih: string[]; sahip?: Set<string> }) {
  const b = (x: string) => {
    if (!props.sahip) return <li key={x} className="notr">{x}</li>
    const v = props.sahip.has(x.toLocaleLowerCase('tr'))
    return (
      <li key={x} className={v ? 'var' : 'eksik'}>
        {x}
        <span className="gizli">{v ? ' (profilinde var)' : ' (profilinde yok)'}</span>
      </li>
    )
  }
  return (
    <div className="beceriler">
      {props.zorunlu.length > 0 && (
        <div>
          <p className="ust-etiket">Zorunlu</p>
          <ul className="eslesme">{props.zorunlu.map(b)}</ul>
        </div>
      )}
      {props.tercih.length > 0 && (
        <div>
          <p className="ust-etiket">Tercih sebebi</p>
          <ul className="eslesme">{props.tercih.map(b)}</ul>
        </div>
      )}
    </div>
  )
}
