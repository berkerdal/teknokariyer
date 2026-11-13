import type { IlanOzeti } from '@/alan/ilanFiltre'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { DENEYIM_ADI, MODEL_ADI } from '@/alan/eslesme'
import { ilanAdresi, sonTarih } from './bicim'
import { IlanBaglantisi } from './IlanBaglantisi'

/** Liste satırı: yoğun ve taranabilir; büyük kart yok. */
export function IlanSatiri({ ilan, secili = false, onizleme }: { ilan: IlanOzeti; secili?: boolean; onizleme?: string }) {
  const ek = [
    MODEL_ADI[ilan.model],
    ilan.tur === 'is' ? DENEYIM_ADI[ilan.deneyim] : null,
    ilan.tur === 'staj' && ilan.ucretliStaj ? 'Ücretli' : null,
    ilan.pauOncelik ? 'PAÜ öncelikli' : null,
  ].filter(Boolean)
  const s = sonTarih(ilan.sonBasvuru)
  return (
    <div className="ilan-satiri" aria-current={secili ? 'true' : undefined}>
      <IlanBaglantisi className="poz" href={ilanAdresi(ilan)} onizleme={onizleme}>
        {ilan.pozisyonAdi}
      </IlanBaglantisi>
      <span className="firma">
        {ilan.firma.ad} <span className="konum">· {ilan.firma.konum}</span>
      </span>
      <span className="alt">
        <span>{[ALT_TUR_ADI[ilan.altTur] ?? ilan.altTur, ...ek].join(' · ')}</span>
        <span className={s.vurgu ? 'son-gun' : undefined}>{s.metin}</span>
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
