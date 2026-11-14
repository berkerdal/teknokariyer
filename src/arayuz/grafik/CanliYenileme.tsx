'use client'
/**
 * Canlı yenileme (K31): sayfa açık ve görünürken her dakika sunucudan yeni sayıları ister. Yenileme sırasında ekran
 * önceki hâliyle kalır (iskelet yok, sıçrama yok). Kullanıcı durdurabilir; tercih bu sekmede geçerlidir.
 */
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

const SAAT = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Istanbul' })

export function CanliYenileme({ zaman, aralikSn = 60 }: { zaman: string; aralikSn?: number }) {
  const router = useRouter()
  const [acik, setAcik] = useState(true)
  const [bekliyor, basla] = useTransition()
  useEffect(() => {
    if (!acik) return
    const z = setInterval(() => {
      if (document.visibilityState === 'visible') basla(() => router.refresh())
    }, aralikSn * 1000)
    const gorunur = () => document.visibilityState === 'visible' && basla(() => router.refresh())
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      clearInterval(z)
      document.removeEventListener('visibilitychange', gorunur)
    }
  }, [acik, aralikSn, router])
  return (
    <p className="canli kucuk" aria-live="off">
      <span className={acik ? 'canli-isaret acik' : 'canli-isaret'} aria-hidden="true" />
      {acik ? 'Canlı' : 'Yenileme durduruldu'} · Son güncelleme {SAAT.format(new Date(zaman))}
      {bekliyor ? ' · yenileniyor…' : ''}
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setAcik((x) => !x)} aria-pressed={!acik}>
        {acik ? 'Durdur' : 'Sürdür'}
      </button>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => basla(() => router.refresh())}>
        Şimdi yenile
      </button>
    </p>
  )
}
