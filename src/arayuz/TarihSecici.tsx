'use client'
/**
 * Türkçe tarih seçici (CLAUDE.md 5: tarayıcının kendi tarih kutusu tarayıcının dilinde yazar).
 * Değer “YYYY-MM-DD” (Türkiye günü) olarak gizli alanda gönderilir. Sınır dışındaki günler seçilemez ve nedeni yazar.
 * Klavye: oklar gün/hafta, Page Up/Down ay değiştirir; ızgarada yalnızca bir gün sekme sırasındadır.
 */
import { useEffect, useRef, useState } from 'react'
import { Ikon } from './Ikon'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const gun = (s: string) => {
  const [y, a, g] = s.split('-').map(Number)
  return new Date(Date.UTC(y!, a! - 1, g!))
}
const metin = (d: Date) => d.toISOString().slice(0, 10)
const ekle = (s: string, n: number) => metin(new Date(gun(s).getTime() + n * 86_400_000))

export function tarihMetni(s: string) {
  const d = gun(s)
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${GUNLER[d.getUTCDay()]}`
}

export function TarihSecici(props: {
  ad: string
  id: string
  deger?: string
  bugun: string
  enErken: string
  enGec: string
  /** Seçilemeyen günlerin nedeni, ör. “İlan en fazla 60 gün yayında kalabilir.” */
  sinirNedeni: string
  degisince?: (deger: string) => void
}) {
  const [secili, setSecili] = useState(props.deger ?? '')
  const [odak, setOdak] = useState(props.deger || props.enErken)
  const [ay, setAy] = useState(() => (props.deger || props.enErken).slice(0, 7))
  const izgara = useRef<HTMLTableElement>(null)
  const klavyeyle = useRef(false)

  useEffect(() => {
    if (!klavyeyle.current) return
    klavyeyle.current = false
    izgara.current?.querySelector<HTMLButtonElement>(`button[data-gun="${odak}"]`)?.focus()
  }, [odak, ay])

  const uygun = (s: string) => s >= props.enErken && s <= props.enGec
  const sec = (s: string) => {
    if (!uygun(s)) return
    setSecili(s)
    setOdak(s)
    props.degisince?.(s)
  }
  const odakla = (s: string) => {
    klavyeyle.current = true
    setOdak(s)
    setAy(s.slice(0, 7))
  }
  const ayDegistir = (n: number) => {
    const [y, a] = ay.split('-').map(Number)
    const d = new Date(Date.UTC(y!, a! - 1 + n, 1))
    setAy(metin(d).slice(0, 7))
  }

  const ilk = gun(`${ay}-01`)
  const bas = (ilk.getUTCDay() + 6) % 7
  const gunSayisi = new Date(Date.UTC(ilk.getUTCFullYear(), ilk.getUTCMonth() + 1, 0)).getUTCDate()
  const hucreler: Array<string | null> = [...Array(bas).fill(null), ...Array.from({ length: gunSayisi }, (_, n) => `${ay}-${String(n + 1).padStart(2, '0')}`)]
  while (hucreler.length % 7) hucreler.push(null)
  const haftalar = Array.from({ length: hucreler.length / 7 }, (_, n) => hucreler.slice(n * 7, n * 7 + 7))
  const sekmeGunu = hucreler.includes(odak) ? odak : (hucreler.find((h) => h && uygun(h)) ?? hucreler.find(Boolean))
  const oncekiAyVar = `${ay}-01` > props.enErken
  const sonrakiAyVar = `${ay}-${String(gunSayisi).padStart(2, '0')}` < props.enGec

  return (
    <div className="takvim" id={props.id}>
      <input type="hidden" name={props.ad} value={secili} />
      <div className="takvim-bas">
        <button type="button" className="ikon-dugme" aria-label="Önceki ay" disabled={!oncekiAyVar} onClick={() => ayDegistir(-1)}>
          <Ikon ad="geri" kucuk />
        </button>
        <span aria-live="polite">
          {AYLAR[ilk.getUTCMonth()]} {ilk.getUTCFullYear()}
        </span>
        <button type="button" className="ikon-dugme" aria-label="Sonraki ay" disabled={!sonrakiAyVar} onClick={() => ayDegistir(1)}>
          <Ikon ad="ileri" kucuk />
        </button>
      </div>
      <table role="grid" ref={izgara} aria-label={`${AYLAR[ilk.getUTCMonth()]} ${ilk.getUTCFullYear()}`}>
        <thead>
          <tr>
            {KISA.map((g) => (
              <th key={g} scope="col">
                {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {haftalar.map((h, n) => (
            <tr key={n}>
              {h.map((s, m) =>
                s ? (
                  <td key={s}>
                    <button
                      type="button"
                      data-gun={s}
                      tabIndex={s === sekmeGunu ? 0 : -1}
                      disabled={!uygun(s)}
                      aria-pressed={s === secili}
                      className={s === props.bugun ? 'bugun' : undefined}
                      aria-label={`${tarihMetni(s)}${uygun(s) ? '' : ', seçilemez'}`}
                      onClick={() => sec(s)}
                      onKeyDown={(e) => {
                        const adim = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
                        if (adim) {
                          e.preventDefault()
                          odakla(ekle(s, adim))
                        } else if (e.key === 'PageUp' || e.key === 'PageDown') {
                          e.preventDefault()
                          const d = gun(s)
                          d.setUTCMonth(d.getUTCMonth() + (e.key === 'PageUp' ? -1 : 1))
                          odakla(metin(d))
                        }
                      }}
                    >
                      {Number(s.slice(8))}
                    </button>
                  </td>
                ) : (
                  <td key={`b${m}`} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="not kucuk ikincil">{props.sinirNedeni}</p>
      <p className="kucuk" aria-live="polite">
        {secili ? (
          <>
            Seçilen gün: <strong>{tarihMetni(secili)}</strong>
          </>
        ) : (
          'Henüz bir gün seçmediniz.'
        )}
      </p>
    </div>
  )
}
