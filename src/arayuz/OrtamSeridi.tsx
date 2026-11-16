import { ortam } from '@/altyapi/eposta'

/** Yayın dışı ortamlarda içeriğin örnek olduğunu ve e-posta gönderilmediğini söyler (K13, K17; kurum talimatı). */
export function OrtamSeridi() {
  const o = ortam()
  if (o === 'yayin') return null
  return (
    <aside className="ortam-serit" aria-label="Ortam bilgisi">
      <strong>{o === 'test' ? 'TEST ORTAMI' : 'GELİŞTİRME ORTAMI'}</strong> · İlanlar ve kişiler örnektir; firma adları Teknokent rehberinden alınmıştır. E-posta
      gönderilmez.
    </aside>
  )
}
