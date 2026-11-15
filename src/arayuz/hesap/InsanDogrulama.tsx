'use client'
/**
 * Bot koruması aracı (Cloudflare Turnstile). Çoğu kişi hiçbir şey görmez; şüpheli durumda araç tek tıklık bir doğrulama
 * gösterir. Anahtar formla birlikte `insan` adıyla gönderilir ve sunucuda doğrulanır (src/veri/koruma.ts).
 * Her gönderimden sonra yenilenir (anahtar tek kullanımlıktır). Betik yüklenemezse form çökmez, açıklama gösterilir.
 */
import { useEffect, useRef, useState } from 'react'

type Turnstile = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let betik: Promise<void> | null = null
function betikYukle(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  betik ??= new Promise<void>((tamam, hata) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => tamam()
    s.onerror = () => {
      betik = null
      hata(new Error('Turnstile yüklenemedi'))
    }
    document.head.appendChild(s)
  })
  return betik
}

export function InsanDogrulama({ site, siz = false, sifirla, hata }: { site: string | null; siz?: boolean; sifirla?: unknown; hata?: string }) {
  const kap = useRef<HTMLDivElement>(null)
  const kimlik = useRef<string | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)

  useEffect(() => {
    if (!site) return
    let iptal = false
    betikYukle()
      .then(() => {
        if (iptal || !kap.current || !window.turnstile) return
        kimlik.current = window.turnstile.render(kap.current, {
          sitekey: site,
          language: 'tr',
          appearance: 'interaction-only',
          'response-field-name': 'insan',
          'error-callback': () => setYuklenemedi(true),
          'expired-callback': () => kimlik.current && window.turnstile?.reset(kimlik.current),
        })
      })
      .catch(() => !iptal && setYuklenemedi(true))
    return () => {
      iptal = true
      if (kimlik.current) window.turnstile?.remove(kimlik.current)
      kimlik.current = null
    }
  }, [site])

  // Gönderimden sonra (sonuç ne olursa olsun) anahtar kullanılmış olur; yeni bir anahtar alınır.
  useEffect(() => {
    if (sifirla && kimlik.current) window.turnstile?.reset(kimlik.current)
  }, [sifirla])

  if (!site) return null
  return (
    <div className={hata ? 'alan alan--hata insan-dogrulama' : 'insan-dogrulama'} id="insan-dogrulama">
      {hata && <p className="hata-metni">{hata}</p>}
      <div ref={kap} />
      {yuklenemedi && (
        <p className="kucuk uyari-kutu" role="status">
          {siz
            ? 'Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyin; sorun sürerse bu site için reklam engelleyiciyi kapatın.'
            : 'Güvenlik doğrulaması yüklenemedi. Sayfayı yenile; sorun sürerse bu site için reklam engelleyiciyi kapat.'}
        </p>
      )}
    </div>
  )
}
