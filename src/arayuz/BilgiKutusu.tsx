'use client'
/**
 * Panellerdeki açıklamalar (K30): “Kullanım kabus olursa kendilerini kaybederler.”
 *
 * - `ModulBilgisi`: sayfanın en üstünde, bu modülün ne işe yaradığını ve neler yapılabileceğini anlatan kutu.
 *   Kullanıcı “Anladım, gizle” derse küçük bir “Bu sayfa hakkında” düğmesine dönüşür; tercih bu tarayıcıda hatırlanır.
 * - `AlanBilgisi`: alan etiketinin yanındaki “?” düğmesi. Basınca açıklama etiketin altında açılır (dokunmatik
 *   ekranda da çalışır; üzerine gelince açılan ipucu kullanılmaz).
 */
import { useEffect, useId, useState } from 'react'
import { Ikon } from './Ikon'

const anahtar = (k: string) => `tk-bilgi-gizli:${k}`

export function ModulBilgisi({ kimlik, baslik, children }: { kimlik: string; baslik: string; children: React.ReactNode }) {
  const [acik, setAcik] = useState(true)
  const id = useId()
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı deposu yalnızca istemcide okunur (sunucu çizimiyle uyum)
      if (localStorage.getItem(anahtar(kimlik)) === '1') setAcik(false)
    } catch {}
  }, [kimlik])
  const degistir = (yeni: boolean) => {
    setAcik(yeni)
    try {
      if (yeni) localStorage.removeItem(anahtar(kimlik))
      else localStorage.setItem(anahtar(kimlik), '1')
    } catch {}
  }
  if (!acik)
    return (
      <p className="modul-bilgi-kapali">
        <button type="button" className="dugme dugme--sade dugme--kucuk" aria-expanded="false" aria-controls={id} onClick={() => degistir(true)}>
          <Ikon ad="bilgi" kucuk /> Bu sayfa hakkında
        </button>
      </p>
    )
  return (
    <section className="modul-bilgi" id={id} aria-label={baslik}>
      <div className="modul-bilgi-bas">
        <Ikon ad="bilgi" />
        <h2>{baslik}</h2>
      </div>
      <div className="modul-bilgi-govde">{children}</div>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => degistir(false)}>
        Anladım, gizle
      </button>
    </section>
  )
}

/** Etiketin yanındaki “?” düğmesi ve açılan açıklama. `etiket` ekran okuyucu için düğmenin adını tamamlar. */
export function AlanBilgisi({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  const [acik, setAcik] = useState(false)
  const id = useId()
  return (
    <>
      <button
        type="button"
        className="alan-bilgi-dugme"
        aria-expanded={acik}
        aria-controls={id}
        aria-label={`${etiket}: açıklama`}
        onClick={() => setAcik(!acik)}
      >
        ?
      </button>
      <span id={id} className="alan-bilgi" hidden={!acik}>
        {children}
      </span>
    </>
  )
}
