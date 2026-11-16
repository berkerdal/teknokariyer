'use client'
/**
 * “İlanı bildir” (talimatlar 12): aday sahte, ayrımcı, ücret isteyen veya yanıltıcı ilanı Yönetici A.Ş.'ye bildirir.
 * Ziyaretçi giriş sayfasına gider; firma ve kurum kullanıcısına gösterilmez. Pencere sayfa gövdesine taşınır.
 */
import Link from 'next/link'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ACIKLAMA_EN_UZUN, SIKAYET_NEDENI } from '@/alan/sikayet'
import { sikayetEylemi } from '@/eylemler/aday'
import { GonderDugmesi, HataOzeti, type FormDurumu } from './form'

export function IlanBildir({ ilanId, girisAdresi }: { ilanId: number; girisAdresi?: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(sikayetEylemi, {})
  const [govde, setGovde] = useState<HTMLElement | null>(null)
  const pencere = useRef<HTMLDialogElement>(null)
  const baslik = useId()
  useEffect(() => setGovde(document.body), []) // eslint-disable-line react-hooks/set-state-in-effect -- portal yalnızca istemcide

  if (girisAdresi)
    return (
      <Link className="ilan-bildir kucuk" href={girisAdresi}>
        Bu ilanda bir sorun mu var? Bildir
      </Link>
    )
  const h = durum.hatalar ?? {}
  return (
    <>
      <button type="button" className="ilan-bildir kucuk" onClick={() => pencere.current?.showModal()}>
        Bu ilanda bir sorun mu var? Bildir
      </button>
      {govde &&
        createPortal(
          <dialog ref={pencere} className="pencere-dialog" aria-labelledby={baslik}>
            {durum.tamam ? (
              <div className="form-yigin">
                <h2 id={baslik} className="b3">
                  Teşekkürler
                </h2>
                <p role="status">{durum.tamam}</p>
                <div className="dugme-grubu">
                  <button type="button" className="dugme" onClick={() => pencere.current?.close()}>
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              <form action={eylem} className="form-yigin" noValidate>
                <h2 id={baslik} className="b3">
                  İlanı bildir
                </h2>
                <p className="kucuk ikincil">Bildirimin Yönetici A.Ş.’ye gider ve incelenir. Kimliğin firmayla paylaşılmaz.</p>
                <HataOzeti durum={durum} alanlar={{ neden: `${baslik}-neden-0`, aciklama: `${baslik}-aciklama` }} />
                <input type="hidden" name="ilan" value={ilanId} />
                <fieldset className={h.neden ? 'alan alan--hata' : 'alan'}>
                  <legend>Sorun ne?</legend>
                  {h.neden && <p className="hata-metni">{h.neden}</p>}
                  {Object.entries(SIKAYET_NEDENI).map(([k, n], i) => (
                    <label key={k} className="secenek secenek-kutu">
                      <input id={i === 0 ? `${baslik}-neden-0` : undefined} type="radio" name="neden" value={k} />
                      <span>
                        <strong>{n.ad}</strong>
                        <span className="ipucu">{n.ipucu}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className={h.aciklama ? 'alan alan--hata' : 'alan'}>
                  <label htmlFor={`${baslik}-aciklama`}>
                    Açıklama <span className="istege-bagli">(“Başka bir sorun”da zorunlu)</span>
                  </label>
                  {h.aciklama && <p className="hata-metni">{h.aciklama}</p>}
                  <textarea id={`${baslik}-aciklama`} name="aciklama" className="metin-alani" maxLength={ACIKLAMA_EN_UZUN} rows={3} />
                </div>
                <div className="dugme-grubu">
                  <GonderDugmesi bekleme="Gönderiliyor…">Bildir</GonderDugmesi>
                  <button type="button" className="dugme dugme--ikincil" onClick={() => pencere.current?.close()}>
                    Vazgeç
                  </button>
                </div>
              </form>
            )}
          </dialog>,
          govde,
        )}
    </>
  )
}
