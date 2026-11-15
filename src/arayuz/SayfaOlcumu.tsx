'use client'
/**
 * Çerezsiz sayfa görüntüleme ölçümü (src/alan/trafik.ts). Her adres değişiminde bir kez `/olcum`'a bildirir.
 * İlk sayfada yönlendiren adres `document.referrer`; site içi geçişlerde kendi adresimiz (ziyaret sayılmaz).
 * Sayfa sayımı çerez kullanmaz. İstatistik çerezine izin verildiyse tekil ziyaretçi için kimliksiz işaretler eklenir
 * (src/alan/cerez.ts). “Takip etme” (DNT/GPC) tercihi olan tarayıcıda hiç ölçüm yapılmaz.
 */
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { istatistikIsaretleri } from './cerezIstemci'

/** Son bildirilen yol: aynı sayfa ikinci kez bildirilmez (geliştirme kipinde efekt iki kez çalışır). */
let sonYol: string | null = null

export function SayfaOlcumu(): null {
  const yol = usePathname()
  const ilk = useRef(true)
  useEffect(() => {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean }
    if (n.doNotTrack === '1' || n.globalPrivacyControl || sonYol === yol) return
    sonYol = yol
    const p = new URLSearchParams(window.location.search)
    const veri = JSON.stringify({
      yol,
      onceki: ilk.current ? document.referrer : window.location.origin + '/',
      isaret: ilk.current ? (p.get('kaynak') ?? p.get('utm_source')) : null,
      // İstatistik çerezine izin verildiyse yalnızca üç kimliksiz işaret (ilk geliş, günün ve ayın ilk açılışı)
      istatistik: istatistikIsaretleri(),
    })
    ilk.current = false
    try {
      if (!navigator.sendBeacon?.('/olcum', new Blob([veri], { type: 'text/plain' })))
        void fetch('/olcum', { method: 'POST', body: veri, keepalive: true, credentials: 'same-origin' })
    } catch {
      // ölçüm hiçbir zaman sayfayı bozmaz
    }
  }, [yol])
  return null
}
