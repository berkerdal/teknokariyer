'use client'
/**
 * Yazdıkça öneri gösteren seçim kutusu (taksonomi: beceri, bölüm, dil…). Telefon klavyesinin kendi önerileri yerine
 * eşleşen seçenekler ekranda, alanın hemen altında listelenir.
 *
 * - Erişilebilir combobox: ↑/↓ ile gezinilir, Enter seçer, Esc kapatır; ekran okuyucu etkin seçeneği duyar.
 * - Listede olmayan bir şey yazılırsa `bulunamadi` içeriği gösterilir (ör. “Yönetici A.Ş.’den eklenmesini isteyin”).
 */
import { useId, useMemo, useRef, useState } from 'react'
import { oneriler, type OneriSecenegi } from '@/alan/oneri'

export function OneriliGirdi<T extends OneriSecenegi>(p: {
  id: string
  etiket: string
  secenekler: T[]
  haric?: number[]
  sec: (s: T) => void
  placeholder?: string
  /** Eşleşme yokken listenin altında gösterilecek içerik; yazılan metni alır. */
  bulunamadi?: (yazilan: string) => React.ReactNode
}) {
  const [yazilan, setYazilan] = useState('')
  const [acik, setAcik] = useState(false)
  const [etkin, setEtkin] = useState(0)
  const listeId = useId()
  const girdi = useRef<HTMLInputElement>(null)
  const liste = useMemo(() => oneriler(p.secenekler, yazilan, p.haric), [p.secenekler, yazilan, p.haric])
  const goster = acik && yazilan.trim().length > 0

  const sec = (s: T) => {
    p.sec(s)
    setYazilan('')
    setAcik(false)
    setEtkin(0)
    girdi.current?.focus()
  }

  return (
    <div className="oneri-kap">
      <label className="gizli" htmlFor={p.id}>
        {p.etiket}
      </label>
      <input
        ref={girdi}
        id={p.id}
        className="girdi"
        role="combobox"
        aria-expanded={goster && liste.length > 0}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={goster && liste[etkin] ? `${listeId}-${liste[etkin]!.id}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        value={yazilan}
        placeholder={p.placeholder}
        onChange={(e) => {
          setYazilan(e.target.value)
          setAcik(true)
          setEtkin(0)
        }}
        onFocus={() => setAcik(true)}
        onBlur={() => setTimeout(() => setAcik(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAcik(true)
            setEtkin((n) => Math.min(n + 1, Math.max(liste.length - 1, 0)))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setEtkin((n) => Math.max(n - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault() // formu göndermesin
            if (goster && liste[etkin]) sec(liste[etkin]!)
          } else if (e.key === 'Escape') {
            setAcik(false)
          }
        }}
      />
      {goster && (
        <div className="oneri-panel">
          {liste.length > 0 ? (
            <ul id={listeId} role="listbox" aria-label={`${p.etiket}: öneriler`}>
              {liste.map((s, n) => (
                <li
                  key={s.id}
                  id={`${listeId}-${s.id}`}
                  role="option"
                  aria-selected={n === etkin}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setEtkin(n)}
                  onClick={() => sec(s)}
                >
                  {s.ad}
                </li>
              ))}
            </ul>
          ) : (
            <div className="oneri-yok" role="status">
              <p>“{yazilan.trim()}” listede bulunamadı.</p>
              {p.bulunamadi?.(yazilan.trim())}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
