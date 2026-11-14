'use client'
/**
 * Zaman serisi sütun grafiği (tek seri, tek eksen). Kurallar (dataviz): sütun en fazla 24 px, uçta 4 px yuvarlak, tabanda
 * kare; ince ve sürekli ızgara; seçici etiket (yalnızca en yüksek değer); fareyle veya klavyeyle (sol/sağ ok) her dilimin
 * değeri bilgi kutusunda; aynı veri tablo olarak da okunur.
 */
import { useId, useRef, useState } from 'react'
import { eksenAdimlari } from '@/alan/ozet'

export interface SutunVerisi {
  /** Eksende kısa etiket (“14 Kas”) */
  kisa: string
  /** Bilgi kutusu ve tabloda uzun etiket (“14 Kasım 2026, Cumartesi”) */
  uzun: string
  deger: number
}

const G = 640
const Y = 200
const SOL = 36
const ALT = 26
const UST = 16

export function SutunGrafik({ baslik, veri, birim, tabloBasligi }: { baslik: string; veri: SutunVerisi[]; birim: string; tabloBasligi: string }) {
  const [etkin, setEtkin] = useState<number | null>(null)
  const id = useId()
  const kap = useRef<HTMLDivElement>(null)
  const enBuyuk = Math.max(0, ...veri.map((v) => v.deger))
  const adimlar = eksenAdimlari(enBuyuk)
  const ust = adimlar[adimlar.length - 1]!
  const alanG = G - SOL - 8
  const alanY = Y - UST - ALT
  const bant = alanG / Math.max(1, veri.length)
  const kalinlik = Math.max(2, Math.min(24, bant - 2))
  const y = (n: number) => UST + alanY - (n / ust) * alanY
  const enBuyukIndeks = veri.findIndex((v) => v.deger === enBuyuk && enBuyuk > 0)
  const etiketAraligi = Math.ceil(veri.length / 7) // en fazla 7–8 eksen etiketi
  const v = etkin !== null ? veri[etkin] : null
  const toplam = veri.reduce((t, x) => t + x.deger, 0)

  const tus = (e: React.KeyboardEvent) => {
    if (!veri.length) return
    if (e.key === 'ArrowRight') setEtkin((i) => Math.min(veri.length - 1, (i ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setEtkin((i) => Math.max(0, (i ?? veri.length) - 1))
    else if (e.key === 'Escape') setEtkin(null)
    else return
    e.preventDefault()
  }

  return (
    <figure className="grafik">
      <div className="grafik-kap" ref={kap}>
        <svg
          viewBox={`0 0 ${G} ${Y}`}
          role="img"
          aria-label={`${baslik}. Toplam ${toplam} ${birim}. Değerleri okumak için sol ve sağ ok tuşlarını kullanın; tablo aşağıda.`}
          tabIndex={0}
          onKeyDown={tus}
          onBlur={() => setEtkin(null)}
          onPointerLeave={() => setEtkin(null)}
          aria-describedby={`${id}-okuma`}
        >
          {adimlar.map((a) => (
            <g key={a}>
              <line x1={SOL} x2={G - 8} y1={y(a)} y2={y(a)} className="grafik-izgara" />
              <text x={SOL - 6} y={y(a) + 4} className="grafik-eksen" textAnchor="end">
                {a.toLocaleString('tr-TR')}
              </text>
            </g>
          ))}
          {veri.map((d, i) => {
            const x = SOL + i * bant + (bant - kalinlik) / 2
            const h = (d.deger / ust) * alanY
            const r = Math.min(4, kalinlik / 2, h)
            const taban = UST + alanY
            return (
              <g key={i}>
                {d.deger > 0 && (
                  <path
                    className={etkin === i ? 'grafik-sutun etkin' : 'grafik-sutun'}
                    d={`M${x},${taban} V${taban - h + r} Q${x},${taban - h} ${x + r},${taban - h} H${x + kalinlik - r} Q${x + kalinlik},${taban - h} ${x + kalinlik},${taban - h + r} V${taban} Z`}
                  />
                )}
                {i === enBuyukIndeks && (
                  <text x={x + kalinlik / 2} y={taban - h - 5} className="grafik-deger" textAnchor="middle">
                    {d.deger.toLocaleString('tr-TR')}
                  </text>
                )}
                {i % etiketAraligi === 0 && (
                  <text x={SOL + i * bant + bant / 2} y={Y - 8} className="grafik-eksen" textAnchor="middle">
                    {d.kisa}
                  </text>
                )}
                {/* İsabet alanı: bütün bant (işaretten büyük) */}
                <rect x={SOL + i * bant} y={UST} width={bant} height={alanY} fill="transparent" onPointerEnter={() => setEtkin(i)} />
              </g>
            )
          })}
          <line x1={SOL} x2={G - 8} y1={UST + alanY} y2={UST + alanY} className="grafik-taban" />
        </svg>
        {v && etkin !== null && (
          <div
            className={`grafik-ipucu ${(SOL + etkin * bant) / G < 0.2 ? 'sol' : (SOL + etkin * bant) / G > 0.8 ? 'sag' : ''}`}
            style={{ left: `${((SOL + etkin * bant + bant / 2) / G) * 100}%` }}
            aria-hidden="true"
          >
            <strong>{v.deger.toLocaleString('tr-TR')}</strong> {birim}
            <span>{v.uzun}</span>
          </div>
        )}
      </div>
      <p id={`${id}-okuma`} className="gizli" aria-live="polite">
        {v ? `${v.uzun}: ${v.deger} ${birim}` : ''}
      </p>
      <details className="grafik-tablo">
        <summary>Tablo olarak göster</summary>
        <div className="tablo-kap">
          <table className="tablo y-tablo">
            <caption className="gizli">{tabloBasligi}</caption>
            <thead>
              <tr>
                <th scope="col">Tarih</th>
                <th scope="col" className="sag">
                  {birim.charAt(0).toLocaleUpperCase('tr') + birim.slice(1)}
                </th>
              </tr>
            </thead>
            <tbody>
              {veri.map((d) => (
                <tr key={d.uzun}>
                  <td>{d.uzun}</td>
                  <td className="sag sayi">{d.deger.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
