'use client'
import { useState } from 'react'
import { RAPOR_DONEMLERI } from '@/alan/raporDonemi'
import { TarihSecici } from '../TarihSecici'

/** Dönem seçimi: hazır dönemler veya özel aralık (Türkçe takvim). GET formu: seçim adreste durur. */
export function DonemSecimi({ eylem, deger, bas, bit, bugun, gizli }: { eylem: string; deger: string; bas?: string; bit?: string; bugun: string; gizli?: Record<string, string> }) {
  const [secili, setSecili] = useState(deger)
  return (
    <form action={eylem} className="rapor-donem">
      {Object.entries(gizli ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <fieldset className="alan">
        <legend>Dönem</legend>
        <div className="rapor-donem-secenek">
          {RAPOR_DONEMLERI.map(([k, ad]) => (
            <label key={k} className="secenek">
              <input type="radio" name="donem" value={k} checked={secili === k} onChange={() => setSecili(k)} /> <span>{ad}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {secili === 'ozel' && (
        <div className="rapor-ozel">
          <div className="alan">
            <label htmlFor="rapor-bas">Başlangıç günü</label>
            <TarihSecici ad="bas" id="rapor-bas" deger={bas} bugun={bugun} enErken="2024-01-01" enGec={bugun} sinirNedeni="Rapor bugünden sonrasını kapsayamaz." />
          </div>
          <div className="alan">
            <label htmlFor="rapor-bit">Bitiş günü</label>
            <TarihSecici ad="bit" id="rapor-bit" deger={bit} bugun={bugun} enErken="2024-01-01" enGec={bugun} sinirNedeni="Rapor bugünden sonrasını kapsayamaz." />
          </div>
        </div>
      )}
      <button type="submit" className="dugme dugme--kucuk">
        Dönemi uygula
      </button>
    </form>
  )
}

export function YazdirDugmesi() {
  return (
    <button type="button" className="dugme dugme--ikincil dugme--kucuk" onClick={() => window.print()}>
      PDF olarak kaydet veya yazdır
    </button>
  )
}
