'use client'
import { useState } from 'react'
import { Ikon } from './Ikon'

/** Sayfa bağlantısını panoya kopyalar; sonucu ekran okuyucuya da bildirir. */
export function BaglantiyiKopyala() {
  const [durum, setDurum] = useState<'' | 'tamam' | 'hata'>('')
  return (
    <>
      <button
        type="button"
        className="dugme dugme--sade dugme--kucuk"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href)
            setDurum('tamam')
          } catch {
            setDurum('hata')
          }
          setTimeout(() => setDurum(''), 3600)
        }}
      >
        <Ikon ad="kopya" kucuk /> Bağlantıyı kopyala
      </button>
      <div role="status" aria-live="polite">
        {durum && <div className="bildirim">{durum === 'tamam' ? 'Bağlantı kopyalandı' : 'Kopyalanamadı. Adres çubuğundaki bağlantıyı kopyalayabilirsin.'}</div>}
      </div>
    </>
  )
}
