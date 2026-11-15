'use client'
/**
 * İlanı kaydetme düğmesi (talimatlar 5; kullanıcı isteği 15.11.2026). Basınca hemen işaretlenir, sunucu reddederse
 * eski hâline döner ve nedenini gösterir. Giriş yapmamış ziyaretçiye giriş sayfasına giden bağlantı olarak görünür;
 * firma ve Yönetici A.Ş. kullanıcılarına hiç gösterilmez (çağıran karar verir).
 */
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { kaydetEylemi } from '@/eylemler/aday'
import { Ikon } from './Ikon'

export type KaydetBaglami = { kayitli: boolean } | { girisAdresi: string }

export function KaydetDugmesi({ ilanId, baglam, metinli = false, ad }: { ilanId: number; baglam: KaydetBaglami; metinli?: boolean; ad: string }) {
  const [kayitli, setKayitli] = useState('kayitli' in baglam && baglam.kayitli)
  const [hata, setHata] = useState('')
  const [, baslat] = useTransition()
  useEffect(() => {
    if (!hata) return
    const z = setTimeout(() => setHata(''), 5000)
    return () => clearTimeout(z)
  }, [hata])

  const sinif = metinli ? 'dugme dugme--ikincil kaydet kaydet--metinli' : 'ikon-dugme kaydet'
  if ('girisAdresi' in baglam)
    return (
      <Link className={sinif} href={baglam.girisAdresi} aria-label={metinli ? undefined : `${ad} ilanını kaydetmek için giriş yap`} title="Kaydetmek için giriş yap">
        <Ikon ad="yer-imi" kucuk={!metinli} />
        {metinli && 'Kaydet'}
      </Link>
    )
  const degistir = () => {
    const yeni = !kayitli
    setKayitli(yeni)
    setHata('')
    baslat(async () => {
      const r = await kaydetEylemi(ilanId, yeni)
      if (r.hata) {
        setKayitli(!yeni)
        setHata(r.hata)
      }
    })
  }
  return (
    <>
      <button
        type="button"
        className={sinif}
        aria-pressed={kayitli}
        aria-label={metinli ? undefined : kayitli ? `${ad} ilanını kaydedilenlerden çıkar` : `${ad} ilanını kaydet`}
        title={kayitli ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
        onClick={degistir}
      >
        <Ikon ad="yer-imi" kucuk={!metinli} />
        {metinli && (kayitli ? 'Kaydedildi' : 'Kaydet')}
      </button>
      <span className="gizli" role="status">
        {hata || (kayitli ? 'İlan kaydedildi.' : '')}
      </span>
      {hata && (
        <span className="bildirim" role="alert">
          {hata}
        </span>
      )}
    </>
  )
}
