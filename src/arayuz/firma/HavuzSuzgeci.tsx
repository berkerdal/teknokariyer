'use client'
/** CV havuzu süzgeci: beceriler yazdıkça önerilerden seçilir; koşul “hepsi” veya “herhangi biri”. Arama adreste tutulur. */
import { useState } from 'react'
import { OneriliGirdi } from '../OneriliGirdi'
import { Ikon } from '../Ikon'
import type { Secenek } from './IlanFormu'

export function HavuzSuzgeci({ beceriler, secili, kosul }: { beceriler: Secenek[]; secili: Secenek[]; kosul: 'hepsi' | 'herhangi' }) {
  const [liste, setListe] = useState(secili)
  return (
    <form className="havuz-filtre panel f-blok" action="/firma-paneli/havuz">
      <div className="alan">
        <span className="alan-ad">Aradığınız beceriler</span>
        <span className="ipucu">Becerileri yazmaya başlayın ve önerilerden seçin. Boş bırakırsanız havuzdaki bütün adaylar listelenir.</span>
        {liste.length > 0 && (
          <ul className="cip-listesi">
            {liste.map((s) => (
              <li key={s.id} className="beceri-cip">
                {s.ad}
                <input type="hidden" name="beceri" value={s.id} />
                <button type="button" aria-label={`${s.ad} becerisini kaldır`} onClick={() => setListe(liste.filter((x) => x.id !== s.id))}>
                  <Ikon ad="kapat" kucuk />
                </button>
              </li>
            ))}
          </ul>
        )}
        <OneriliGirdi id="havuz-beceri" etiket="Beceri ekle" secenekler={beceriler} haric={liste.map((x) => x.id)} sec={(s) => setListe([...liste, s])} placeholder="Örnek: Python" />
      </div>
      <fieldset className="alan">
        <legend>Adayda bulunsun</legend>
        <div className="yan-yana">
          <label className="secenek">
            <input type="radio" name="kosul" value="hepsi" defaultChecked={kosul === 'hepsi'} /> <span>Seçtiğim becerilerin hepsi</span>
          </label>
          <label className="secenek">
            <input type="radio" name="kosul" value="herhangi" defaultChecked={kosul === 'herhangi'} /> <span>Herhangi biri</span>
          </label>
        </div>
      </fieldset>
      <div>
        <button type="submit" className="dugme">
          <Ikon ad="ara" kucuk /> Ara
        </button>
      </div>
    </form>
  )
}
