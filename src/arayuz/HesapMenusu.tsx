'use client'
/**
 * Hesap menüsü (kullanıcı isteği, 15.11.2026): kullanıcı simgesine tıklayınca role göre kısayollar, hesap güvenliği ve
 * çıkış. Aday, firma ve Yönetici A.Ş. aynı bileşeni kullanır; içerik sunucuda role göre hazırlanır (src/alan/hesapMenusu.ts).
 * Dışarı tıklayınca, Esc ile veya bir bağlantı seçilince kapanır; açılınca ilk bağlantıya odaklanır.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { cikisEylemi } from '@/eylemler/hesap'
import type { HesapMenusuOgesi } from '@/alan/hesapMenusu'
import { Ikon } from './Ikon'

const basHarfler = (ad = '') =>
  ad.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toLocaleUpperCase('tr')).join('')

export function HesapMenusu(p: {
  ad: string
  altBilgi?: string | null
  ogeler: HesapMenusuOgesi[]
  /** Adı simgenin yanında da yaz (masaüstü üst çubuk) */
  adiGoster?: boolean
  /** Panelin açılacağı yön: üst çubukta aşağı, yan menünün altında yukarı */
  yon?: 'asagi' | 'yukari'
  tema?: 'acik' | 'koyu'
}) {
  const [acik, setAcik] = useState(false)
  const kap = useRef<HTMLDivElement>(null)
  const dugme = useRef<HTMLButtonElement>(null)
  const id = useId()
  const yol = usePathname()
  const [oncekiYol, setOncekiYol] = useState(yol)
  if (oncekiYol !== yol) {
    setOncekiYol(yol)
    setAcik(false)
  }

  useEffect(() => {
    if (!acik) return
    kap.current?.querySelector<HTMLElement>('.hm-panel a, .hm-panel button')?.focus()
    const disari = (e: PointerEvent) => !kap.current?.contains(e.target as Node) && setAcik(false)
    const tus = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAcik(false)
      dugme.current?.focus()
    }
    document.addEventListener('pointerdown', disari)
    document.addEventListener('keydown', tus)
    return () => {
      document.removeEventListener('pointerdown', disari)
      document.removeEventListener('keydown', tus)
    }
  }, [acik])

  return (
    <div ref={kap} className={`hm hm--${p.yon ?? 'asagi'} hm--${p.tema ?? 'acik'}`}>
      <button ref={dugme} type="button" className="hm-dugme" aria-expanded={acik} aria-controls={id} onClick={() => setAcik((a) => !a)}>
        <span className="hm-simge" aria-hidden="true">
          {basHarfler(p.ad)}
        </span>
        {p.adiGoster && (
          <span className="hm-ad">
            <span>{p.ad}</span>
            {p.altBilgi && <span className="hm-alt">{p.altBilgi}</span>}
          </span>
        )}
        <span className="gizli">{p.adiGoster ? ': hesap menüsü' : `${p.ad}: hesap menüsü`}</span>
        <span className="hm-ok" aria-hidden="true">
          <Ikon ad="ileri" kucuk />
        </span>
      </button>
      {acik && (
        <div id={id} className="hm-panel">
          <div className="hm-kim">
            <span className="hm-simge hm-simge--buyuk" aria-hidden="true">
              {basHarfler(p.ad)}
            </span>
            <span>
              <strong>{p.ad}</strong>
              {p.altBilgi && <span className="kucuk ikincil">{p.altBilgi}</span>}
            </span>
          </div>
          <ul>
            {p.ogeler.map((o) =>
              o.ayrac ? (
                <li key={o.href} className="hm-ayrac" role="separator" />
              ) : (
                <li key={o.href}>
                  <Link href={o.href} aria-current={yol === o.href ? 'page' : undefined} onClick={() => setAcik(false)}>
                    {o.ikon && <Ikon ad={o.ikon} kucuk />}
                    {o.ad}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <form action={cikisEylemi} className="hm-cikis">
            <button type="submit">
              <Ikon ad="cikis" kucuk />
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
