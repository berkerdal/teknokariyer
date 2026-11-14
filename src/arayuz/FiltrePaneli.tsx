'use client'
/**
 * İlan filtreleri.
 * - Masaüstünde solda sabit sütun; mobilde alttan açılan panel (“12 ilanı göster”).
 * - Bir seçim değişince form kendiliğinden gönderilir (adres güncellenir, sayfa yeniden yüklenmez).
 * - JavaScript yoksa “Uygula” düğmesiyle çalışır.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Ikon } from './Ikon'

export function FiltrePaneli(props: { formId: string; aktifSayi: number; sonucSayisi: number; temizleHref: string; children: React.ReactNode }) {
  const [acik, setAcik] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const acan = useRef<HTMLButtonElement>(null)

  const kapat = useCallback(() => {
    setAcik(false)
    acan.current?.focus()
  }, [])
  useEffect(() => {
    const form = document.getElementById(props.formId) as HTMLFormElement | null
    if (!form) return
    let zaman: ReturnType<typeof setTimeout> | undefined
    const gonder = (e: Event) => {
      const t = e.target as HTMLInputElement
      if (t.type === 'search') {
        clearTimeout(zaman)
        zaman = setTimeout(() => form.requestSubmit(), 450)
      } else form.requestSubmit()
    }
    form.addEventListener('change', gonder)
    form.addEventListener('input', gonder)
    return () => {
      form.removeEventListener('change', gonder)
      form.removeEventListener('input', gonder)
      clearTimeout(zaman)
    }
  }, [props.formId])
  useEffect(() => {
    if (!acik) return
    panel.current?.querySelector<HTMLElement>('input, button')?.focus()
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && kapat()
    document.addEventListener('keydown', tus)
    return () => document.removeEventListener('keydown', tus)
  }, [acik, kapat])

  return (
    <>
      <div className="ortu il-ortu" data-acik={acik} onClick={kapat} aria-hidden="true" />
      <aside
        ref={panel}
        className="il-filtre"
        aria-label="Filtreler"
        data-acik={acik}
        role={acik ? 'dialog' : undefined}
        aria-modal={acik ? true : undefined}
      >
        <div className="il-filtre-bas bolum-bas">
          <h2 className="b3">Filtrele</h2>
          {props.aktifSayi > 0 && (
            <a className="dugme dugme--sade dugme--kucuk" href={props.temizleHref}>
              Temizle
            </a>
          )}
          <button type="button" className="ikon-dugme il-filtre-kapat" onClick={kapat} aria-label="Filtreleri kapat">
            <Ikon ad="kapat" />
          </button>
        </div>
        <div className="il-filtre-govde">{props.children}</div>
        <div className="il-filtre-ayak">
          <noscript>
            <button className="dugme dugme--genis" type="submit" form={props.formId}>
              Uygula
            </button>
          </noscript>
          <button type="button" className="dugme dugme--genis" data-mobil onClick={kapat} disabled={props.sonucSayisi === 0}>
            {props.sonucSayisi ? `${props.sonucSayisi} ilanı göster` : 'Uyan ilan bulunmuyor'}
          </button>
        </div>
      </aside>
      <div className="yapiskan-alt">
        <button ref={acan} type="button" className="dugme dugme--genis" onClick={() => setAcik(true)} aria-expanded={acik}>
          <Ikon ad="filtre" /> Filtrele{props.aktifSayi ? ` (${props.aktifSayi})` : ''}
        </button>
      </div>
    </>
  )
}
