/**
 * Firma karosu (K36). Logo varsa beyaz zeminde logo; yoksa bloğun renginde dolu karo: büyük harfle blok, altında oda
 * (“D / 208”). Renk süs değil, gerçek bilgi: firmanın Teknokent'teki bloğu (B lacivert, C petrol, D kiremit, diğerleri
 * gece mavisi). Baş harf avatarı kullanılmaz.
 */
import { konumAyristir } from '@/alan/firmaKonumu'

export function FirmaKaro({ konum, boy = 48, logo, ad }: { konum: string; boy?: number; logo?: string | null; ad?: string }) {
  const stil = { ['--boy' as string]: `${boy}px` }
  if (logo) {
    return (
      <span className="firma-karo firma-karo--logo" style={stil}>
        <img src={logo} alt={ad ? `${ad} logosu` : ''} width={boy} height={boy} loading="lazy" decoding="async" />
      </span>
    )
  }
  const k = konumAyristir(konum)
  return (
    <span className={`firma-karo firma-karo--${k.renk}`} style={stil} aria-hidden="true">
      {k.blok ? (
        <>
          <b>{k.blok}</b>
          {k.oda && <i>{k.oda}</i>}
        </>
      ) : (
        <i>{k.kod}</i>
      )}
    </span>
  )
}
