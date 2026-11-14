'use client'
/** Kök düzenin kendisi hata verirse: en sade Türkçe sayfa (stil dosyası yüklenemeyebilir). */
export default function GenelHata({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 640, margin: '0 auto', color: '#1E1E1C' }}>
        <h1>Bu sayfa şu an açılamadı</h1>
        <p>Sorun bizde. Biraz sonra yeniden deneyin.</p>
        {error.digest && <p style={{ color: '#5B5852' }}>Hata kodu: {error.digest}</p>}
        <button type="button" onClick={() => reset()} style={{ padding: '10px 16px' }}>
          Yeniden dene
        </button>
      </body>
    </html>
  )
}
