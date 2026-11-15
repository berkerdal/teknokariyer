'use client'

/**
 * Sayfa geçiş göstergesi (kullanıcı isteği, 15.11.2026): bir bağlantıya tıklandığında veya arama formu gönderildiğinde
 * hemen üstte ince bir ilerleme çubuğu belirir; geçiş 450 ms'den uzun sürerse ekran hafifçe soluklaşır ve Pamukkale
 * Teknokent logosunun çevresinde bir halka döner (kullanıcı isteği; logo en az 120 px genişlikte, kimlik kuralı). Yeni sayfa açılınca kendiliğinden kaybolur.
 *
 * - Next'in `Link` bileşeni tıklamada `preventDefault` çağırdığı için olay yakalama (capture) aşamasında dinlenir.
 * - Yeni sekme, değiştirici tuşlar, `download`, başka site, yalnızca `#` değişikliği ve aynı adres göstergeyi açmaz.
 * - Takılı kalmasın diye 12 saniye sonra kapanır. Hareket azaltma tercihinde halka dönmez (CSS).
 */
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const GECIKME = 450
const EN_UZUN = 12_000

/** Tıklanan bağlantının veya gönderilen formun hedefi bir sayfa geçişi mi? */
export function gecisHedefi(href: string, simdiki: Location): string | null {
  let u: URL
  try {
    u = new URL(href, simdiki.href)
  } catch {
    return null
  }
  if (u.origin !== simdiki.origin || !/^https?:$/.test(u.protocol)) return null
  if (u.pathname === simdiki.pathname && u.search === simdiki.search) return null // aynı sayfa veya yalnızca #
  return u.pathname + u.search
}

export function GezinmeGostergesi() {
  const yol = usePathname()
  const ara = useSearchParams().toString()
  const anahtar = `${yol}?${ara}`
  // Geçiş, başladığı sayfanın anahtarıyla tutulur: adres değişince gösterge kendiliğinden kaybolur.
  const [bekleyen, setBekleyen] = useState<{ kaynak: string; ortu: boolean } | null>(null)
  const zamanlar = useRef<number[]>([])
  // Adres değişince bekleyen geçiş biter (React'in “önceki değere göre durum ayarlama” kalıbı; efekt gerekmez).
  const [onceki, setOnceki] = useState(anahtar)
  if (onceki !== anahtar) {
    setOnceki(anahtar)
    setBekleyen(null)
  }

  useEffect(() => {
    const temizle = () => {
      zamanlar.current.forEach((z) => window.clearTimeout(z))
      zamanlar.current = []
    }
    const basla = () => {
      temizle()
      const kaynak = `${window.location.pathname}?${window.location.search.replace(/^\?/, '')}`
      setBekleyen({ kaynak, ortu: false })
      zamanlar.current.push(
        window.setTimeout(() => setBekleyen((b) => (b && b.kaynak === kaynak ? { ...b, ortu: true } : b)), GECIKME),
        window.setTimeout(() => setBekleyen(null), EN_UZUN),
      )
    }
    const tikla = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self') || a.dataset.gostergesiz !== undefined) return
      if (gecisHedefi(a.getAttribute('href') ?? '', window.location)) basla()
    }
    const gonder = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement
      // Yalnızca adres değiştiren GET formları (ör. arama). Sunucu eylemli formların kendi bekleme düğmeleri var.
      if (f.method.toLowerCase() !== 'get' || f.target === '_blank') return
      const hedef = new URL(f.action || window.location.href)
      hedef.search = new URLSearchParams(new FormData(f) as unknown as Record<string, string>).toString()
      if (gecisHedefi(hedef.toString(), window.location)) basla()
    }
    const geri = () => temizle()
    document.addEventListener('click', tikla, true)
    document.addEventListener('submit', gonder, true)
    window.addEventListener('pageshow', geri)
    return () => {
      document.removeEventListener('click', tikla, true)
      document.removeEventListener('submit', gonder, true)
      window.removeEventListener('pageshow', geri)
      temizle()
    }
  }, [])

  if (!bekleyen || bekleyen.kaynak !== anahtar) return null
  return (
    <div className="gezinme" role="status" aria-live="polite">
      <span className="gizli">Sayfa yükleniyor</span>
      <span className="gezinme-cubuk" aria-hidden="true" />
      {bekleyen.ortu && (
        <span className="gezinme-ortu" aria-hidden="true">
          <span className="gezinme-isaret">
            <svg className="gezinme-halka" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" />
              <circle cx="40" cy="40" r="36" className="yay" pathLength="100" />
            </svg>
            <img src="/logo/kurum/teknokent-dikey-renkli.svg" alt="Pamukkale Teknokent" width={120} height={63} />
          </span>
        </span>
      )}
    </div>
  )
}
