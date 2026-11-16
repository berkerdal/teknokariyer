'use client'
/**
 * “Aramayı kaydet” düğmesi ve penceresi (ilan listesi: aday; CV havuzu: firma). Pencere sayfa gövdesine taşınır
 * (createPortal): ilan listesindeki filtre formunun içinde iç içe form olmasın ve seçim değişikliği filtreyi göndermesin.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SIKLIK_ADI, type AramaTuru, type Siklik } from '@/alan/kayitliArama'
import { aramaKaydetEylemi } from '@/eylemler/aramalar'
import { Ikon } from './Ikon'

export function AramaKaydet(p: { tur: AramaTuru; sorgu: string; ozet: string; durum: 'kaydedebilir' | 'kayitli' | { giris: string }; listeAdresi: string }) {
  const [acik, setAcik] = useState(false)
  const [siklik, setSiklik] = useState<Siklik>('haftalik')
  const [ad, setAd] = useState(p.ozet)
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [govde, setGovde] = useState<HTMLElement | null>(null)
  const pencere = useRef<HTMLDialogElement>(null)
  const baslik = useId()
  const router = useRouter()
  const siz = p.tur === 'havuz'

  useEffect(() => setGovde(document.body), []) // eslint-disable-line react-hooks/set-state-in-effect -- portal yalnızca istemcide
  useEffect(() => {
    if (acik) pencere.current?.showModal()
    else pencere.current?.close()
  }, [acik])

  if (typeof p.durum === 'object')
    return (
      <Link className="dugme dugme--sade dugme--kucuk arama-kaydet" href={p.durum.giris}>
        <Ikon ad="zil" kucuk /> Aramayı kaydet
      </Link>
    )
  if (p.durum === 'kayitli')
    return (
      <Link className="dugme dugme--sade dugme--kucuk arama-kaydet" href={p.listeAdresi}>
        <Ikon ad="tik" kucuk /> Bu arama kayıtlı
      </Link>
    )

  const kaydet = async () => {
    setBekliyor(true)
    setHata(null)
    const r = await aramaKaydetEylemi(p.tur, p.sorgu, siklik, ad)
    setBekliyor(false)
    if (r.hata) return setHata(r.hata)
    setAcik(false)
    router.refresh()
  }

  return (
    <>
      <button type="button" className="dugme dugme--sade dugme--kucuk arama-kaydet" onClick={() => setAcik(true)}>
        <Ikon ad="zil" kucuk /> Aramayı kaydet
      </button>
      {govde &&
        createPortal(
          <dialog ref={pencere} className="pencere-dialog" aria-labelledby={baslik} onClose={() => setAcik(false)}>
            <div className="form-yigin">
              <h2 id={baslik} className="b3">
                Aramayı kaydet
              </h2>
              <p className="kucuk ikincil">
                {siz
                  ? 'Bu aramaya uyan yeni adaylar CV havuzuna katıldığında haftada bir, kaç aday olduğunu e-postayla bildiririz. Adayların bilgileri e-postaya yazılmaz.'
                  : 'Bu aramaya uyan yeni ilanlar yayına girdiğinde sana e-postayla haber veririz. Aramayı “Kaydedilenler” sayfasından değiştirebilir veya silebilirsin.'}
              </p>
              <div className="alan">
                <label htmlFor={`${baslik}-ad`}>Aramanın adı</label>
                <input id={`${baslik}-ad`} className="girdi" value={ad} maxLength={120} onChange={(e) => setAd(e.target.value)} />
              </div>
              {!siz && (
                <fieldset className="alan">
                  <legend>Ne zaman haber verelim?</legend>
                  {(Object.keys(SIKLIK_ADI) as Siklik[]).map((s) => (
                    <label key={s} className="secenek secenek-kutu">
                      <input type="radio" name={`${baslik}-siklik`} value={s} checked={siklik === s} onChange={() => setSiklik(s)} />
                      <span>
                        <strong>{SIKLIK_ADI[s]}</strong>
                        <span className="ipucu">{s === 'anlik' ? 'Her yeni ilan için ayrı bir e-posta.' : 'Geçen haftanın yeni ilanları tek e-postada.'}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              {hata && (
                <p className="hata-kutu" role="alert">
                  {hata}
                </p>
              )}
              <div className="dugme-grubu">
                <button type="button" className="dugme" onClick={kaydet} disabled={bekliyor}>
                  {bekliyor ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
                <button type="button" className="dugme dugme--ikincil" onClick={() => setAcik(false)}>
                  Vazgeç
                </button>
              </div>
            </div>
          </dialog>,
          govde,
        )}
    </>
  )
}
