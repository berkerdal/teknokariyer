'use client'
/**
 * Yazdıkça öneren tek seçim (okul, bölüm). Seçim yapılınca seçilen ad bir kutuda görünür; “Değiştir” ile yeniden yazılır.
 * Uzun listelerde (229 üniversite, 596 bölüm) açılır liste yerine kullanılır (kullanıcı isteği, 15.11.2026).
 */
import { useState } from 'react'
import { Ikon } from './Ikon'
import { OneriliGirdi } from './OneriliGirdi'

export function TekSecimGirdisi(p: {
  id: string
  etiket: string
  secenekler: Array<{ id: number; ad: string }>
  deger: number | null
  degis: (id: number | null) => void
  placeholder?: string
  istegeBagli?: boolean
  bulunamadi?: (yazilan: string) => React.ReactNode
}) {
  const [degistiriyor, setDegistiriyor] = useState(false)
  const secili = p.deger ? p.secenekler.find((s) => s.id === p.deger) : undefined
  return (
    <div className="alan">
      <label htmlFor={p.id}>
        {p.etiket} {p.istegeBagli && <span className="istege-bagli">(isteğe bağlı)</span>}
      </label>
      {secili && !degistiriyor ? (
        <div className="tek-secim">
          <span className="tek-secim-ad">
            <Ikon ad="tik" kucuk /> {secili.ad}
          </span>
          <button id={p.id} type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setDegistiriyor(true)}>
            Değiştir<span className="gizli">: {p.etiket}</span>
          </button>
        </div>
      ) : (
        <OneriliGirdi
          id={p.id}
          etiket={p.etiket}
          secenekler={p.secenekler}
          placeholder={p.placeholder ?? 'Yazmaya başla ve listeden seç'}
          bulunamadi={p.bulunamadi}
          disEtiket
          sec={(s) => {
            p.degis(s.id)
            setDegistiriyor(false)
          }}
        />
      )}
    </div>
  )
}
