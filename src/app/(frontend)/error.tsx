'use client'
/**
 * Beklenmeyen sunucu hatası: Türkçe, sakin ve çıkış yolu gösteren sayfa. Hata kodu (digest) kayıtlarla eşleştirmek için
 * gösterilir; ayrıntı kullanıcıya gösterilmez.
 */
import Link from 'next/link'
import { useEffect } from 'react'

export default function HataSayfasi({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main id="icerik" className="sayfa-dar">
      <p className="ust-etiket">Bir sorun oluştu</p>
      <h1 className="b1">Bu sayfa şu an açılamadı</h1>
      <p>Sorun bizde. Biraz sonra yeniden dene; sorun sürerse info@pauteknokent.com.tr adresine yazabilirsin.</p>
      {error.digest && <p className="kucuk ikincil">Hata kodu: {error.digest}</p>}
      <p className="dugme-grubu">
        <button type="button" className="dugme" onClick={() => reset()}>
          Yeniden dene
        </button>
        <Link className="dugme dugme--ikincil" href="/">
          Ana sayfa
        </Link>
      </p>
    </main>
  )
}
