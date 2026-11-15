'use client'
/**
 * Bot koruması aracı (Cloudflare Turnstile). Çoğu kişi bir doğrulama kutusu görmez; şüpheli durumda araç tek tıklık bir
 * doğrulama gösterir. Anahtar formla birlikte `insan` adıyla gönderilir ve sunucuda doğrulanır (src/veri/koruma.ts).
 * - Korumanın varlığı ve durumu küçük bir satırla görünür (kullanıcı geri bildirimi, 15.11.2026: “doğrulama mı var
 *   yok mu belli değil”).
 * - Tarayıcının kayıtlı şifresiyle hemen gönderilen form, anahtar gelmeden sunucuya gitmez: gönderim bekletilir ve
 *   anahtar gelince kendiliğinden yapılır. Önceden bu durumda “Güvenlik doğrulaması tamamlanmadı” hatası çıkıyordu.
 * - Her gönderimden sonra yenilenir (anahtar tek kullanımlıktır). Betik yüklenemezse form çökmez, açıklama gösterilir.
 */
import { useEffect, useRef, useState } from 'react'
import { Ikon } from '../Ikon'

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

/** Gönderimi bekletmenin üst sınırı; aşılırsa form yine gönderilir ve sunucu anlaşılır hatayı verir. */
const EN_UZUN_BEKLEME = 20_000

type Durum = 'hazirlaniyor' | 'hazir' | 'etkilesim' | 'yuklenemedi'

export function InsanDogrulama({ site, siz = false, sifirla, hata }: { site: string | null; siz?: boolean; sifirla?: unknown; hata?: string }) {
  const kap = useRef<HTMLDivElement>(null)
  const kimlik = useRef<string | null>(null)
  const [durum, setDurum] = useState<Durum>('hazirlaniyor')
  const [bekliyor, setBekliyor] = useState(false)
  // Anahtar gelmeden basılan gönder düğmesi; anahtar gelince form bu düğmeyle gönderilir.
  const bekleyen = useRef<{ form: HTMLFormElement; dugme: HTMLElement | null; zaman: number } | null>(null)

  useEffect(() => {
    if (!site) return
    let iptal = false
    const form = kap.current?.closest('form') ?? null
    const anahtarVar = () => Boolean((form?.querySelector('input[name="insan"]') as HTMLInputElement | null)?.value)
    const gonder = () => {
      const b = bekleyen.current
      if (!b) return
      bekleyen.current = null
      setBekliyor(false)
      clearTimeout(b.zaman)
      b.form.requestSubmit(b.dugme instanceof HTMLButtonElement && b.dugme.form === b.form ? b.dugme : undefined)
    }
    // Yakalama aşamasında: React'in form eylemi işleyicisi kök düğümde kabarcıklanma aşamasında çalışır, ona hiç ulaşmaz.
    const gonderimde = (e: SubmitEvent) => {
      if (anahtarVar() || !window.turnstile || !kimlik.current) return
      e.preventDefault()
      e.stopPropagation()
      if (bekleyen.current) return
      setBekliyor(true)
      bekleyen.current = { form: form!, dugme: e.submitter, zaman: window.setTimeout(gonder, EN_UZUN_BEKLEME) }
    }
    form?.addEventListener('submit', gonderimde, true)
    betikYukle()
      .then(() => {
        if (iptal || !kap.current || !window.turnstile) return
        kimlik.current = window.turnstile.render(kap.current, {
          sitekey: site,
          language: 'tr',
          appearance: 'interaction-only',
          'response-field-name': 'insan',
          callback: () => {
            setDurum('hazir')
            // Anahtar alanı aracın içinde güncellenir; gönderim bir sonraki karede yapılır.
            requestAnimationFrame(gonder)
          },
          'before-interactive-callback': () => setDurum('etkilesim'),
          'error-callback': () => setDurum('yuklenemedi'),
          'expired-callback': () => {
            setDurum('hazirlaniyor')
            if (kimlik.current) window.turnstile?.reset(kimlik.current)
          },
        })
      })
      .catch(() => !iptal && setDurum('yuklenemedi'))
    return () => {
      iptal = true
      form?.removeEventListener('submit', gonderimde, true)
      if (bekleyen.current) clearTimeout(bekleyen.current.zaman)
      bekleyen.current = null
      if (kimlik.current) window.turnstile?.remove(kimlik.current)
      kimlik.current = null
    }
  }, [site])

  // Gönderimden sonra (sonuç ne olursa olsun) anahtar kullanılmış olur; yeni bir anahtar alınır.
  const [oncekiSifirla, setOncekiSifirla] = useState(sifirla)
  if (sifirla !== oncekiSifirla) {
    setOncekiSifirla(sifirla)
    if (durum === 'hazir') setDurum('hazirlaniyor')
  }
  useEffect(() => {
    if (sifirla && kimlik.current) window.turnstile?.reset(kimlik.current)
  }, [sifirla])

  if (!site) return null
  const metin =
    durum === 'yuklenemedi'
      ? siz
        ? 'Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyin; sorun sürerse bu site için reklam engelleyiciyi kapatın.'
        : 'Güvenlik doğrulaması yüklenemedi. Sayfayı yenile; sorun sürerse bu site için reklam engelleyiciyi kapat.'
      : durum === 'etkilesim'
        ? siz
          ? 'Devam etmek için aşağıdaki doğrulama kutusunu işaretleyin.'
          : 'Devam etmek için aşağıdaki doğrulama kutusunu işaretle.'
        : bekliyor
          ? 'Güvenlik doğrulaması bitince form kendiliğinden gönderilecek…'
          : durum === 'hazir'
            ? 'Güvenlik doğrulaması tamamlandı.'
            : 'Güvenlik doğrulaması yapılıyor…'
  return (
    <div className={hata ? 'alan alan--hata insan-dogrulama' : 'insan-dogrulama'} id="insan-dogrulama">
      {hata && <p className="hata-metni">{hata}</p>}
      <p className={`insan-durum insan-durum--${durum === 'hazir' && !bekliyor ? 'hazir' : durum === 'yuklenemedi' ? 'hata' : 'bekliyor'}`} role="status">
        <Ikon ad={durum === 'hazir' && !bekliyor ? 'tik' : 'kalkan'} kucuk />
        <span>{metin}</span>
      </p>
      <div ref={kap} />
    </div>
  )
}
