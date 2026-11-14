'use client'
/**
 * Profil bölümü düzenleme penceresi (K28).
 * - Masaüstünde ortada açılır; mobilde tam ekrandır, başlık ve düğmeler sabit kalır.
 * - Kaydedilmemiş değişiklik varken kapatılırsa onay ister (CLAUDE.md 5).
 * - Başarılı kayıtta kapanır, bildirim gösterir; form yeni değerlerle yeniden kurulur. (React form eylemi sonrası formu
 *   eski varsayılanlara sıfırladığı için alanlar yanlış değere dönüyordu; yeniden kurmak bunu önler.)
 */
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { profilKaydetEylemi } from '@/eylemler/aday'
import { Ikon } from '../Ikon'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export interface DuzenlemePenceresiProps {
  baslik: string
  /** Pencerenin üstünde, ne düzenlendiğini anlatan kısa cümle. */
  aciklama?: string
  /** Bu formun kaydedeceği profil bölümleri (src/alan/profilFormu.ts). */
  bolumler: string[]
  /** Açma düğmesinin metni: bölüm boşsa “Ekle”, doluysa “Düzenle”. */
  dugme: string
  tamamMetni: string
  /** Hata özetindeki bağlantıların gideceği alan kimlikleri. */
  alanlar?: Record<string, string>
  children: React.ReactNode
}

export function DuzenlemePenceresi(p: DuzenlemePenceresiProps) {
  const pencere = useRef<HTMLDialogElement>(null)
  const acanDugme = useRef<HTMLButtonElement>(null)
  const [durum, eylem] = useActionState<FormDurumu, FormData>(profilKaydetEylemi, {})
  const [kirli, setKirli] = useState(false)
  const [anahtar, setAnahtar] = useState(0)
  const [bildirim, setBildirim] = useState('')
  const [hataGoster, setHataGoster] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const sonSurum = useRef(durum.surum)
  const baslikId = useId()

  useEffect(() => {
    if (!durum.surum || durum.surum === sonSurum.current) return
    sonSurum.current = durum.surum
    /* eslint-disable react-hooks/set-state-in-effect -- kayıt bitti: pencere kapanır, form yeni değerlerle kurulur */
    setKirli(false)
    setHataGoster(false)
    setAnahtar((a) => a + 1)
    setBildirim(durum.tamam ?? '')
    /* eslint-enable react-hooks/set-state-in-effect */
    pencere.current?.close()
    acanDugme.current?.focus()
  }, [durum])

  // Alan hataları: özetin yanında, ilgili alanın altında da gösterilir (alanlar sunucuda çizildiği için burada işaretlenir).
  useEffect(() => {
    const kok = formRef.current
    if (!kok) return
    kok.querySelectorAll('[data-pencere-hatasi]').forEach((x) => x.remove())
    kok.querySelectorAll('.alan--hata[data-pencere-isaret]').forEach((x) => x.classList.remove('alan--hata'))
    if (!hataGoster) return
    for (const [alan, mesaj] of Object.entries(durum.hatalar ?? {})) {
      const girdi = kok.querySelector<HTMLElement>(`#${CSS.escape(p.alanlar?.[alan] ?? alan)}`)
      const kap = girdi?.closest('.alan, fieldset')
      if (!girdi || !kap) continue
      girdi.setAttribute('aria-invalid', 'true')
      kap.classList.add('alan--hata')
      kap.setAttribute('data-pencere-isaret', '')
      const m = document.createElement('p')
      m.className = 'hata-metni'
      m.setAttribute('data-pencere-hatasi', '')
      m.textContent = mesaj
      girdi.insertAdjacentElement('beforebegin', m)
    }
  }, [durum, hataGoster, p.alanlar])

  useEffect(() => {
    if (!bildirim) return
    const z = setTimeout(() => setBildirim(''), 4000)
    return () => clearTimeout(z)
  }, [bildirim])

  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])

  const kapat = () => {
    if (kirli && !window.confirm('Kaydedilmemiş değişikliklerin kaybolacak. Pencereyi kapatmak istiyor musun?')) return
    setKirli(false)
    setHataGoster(false)
    setAnahtar((a) => a + 1) // vazgeçilen değişiklikler atılır
    pencere.current?.close()
    acanDugme.current?.focus()
  }

  return (
    <>
      <button ref={acanDugme} type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => pencere.current?.showModal()}>
        <Ikon ad={p.dugme === 'Ekle' ? 'arti' : 'kalem'} kucuk /> {p.dugme}
        <span className="gizli">: {p.baslik}</span>
      </button>
      <dialog
        ref={pencere}
        className="duzen-pencere"
        aria-labelledby={baslikId}
        onCancel={(e) => {
          e.preventDefault()
          kapat()
        }}
      >
        <form key={anahtar} ref={formRef} action={eylem} onChange={() => setKirli(true)} onSubmit={() => setHataGoster(true)} noValidate>
          <header className="duzen-pencere-bas">
            <h2 className="b3" id={baslikId}>
              {p.baslik}
            </h2>
            <button type="button" className="ikon-dugme" onClick={kapat} aria-label="Pencereyi kapat">
              <Ikon ad="kapat" />
            </button>
          </header>
          <div className="duzen-pencere-govde">
            {p.aciklama && <p className="ikincil">{p.aciklama}</p>}
            <HataOzeti durum={hataGoster ? durum : {}} alanlar={p.alanlar} />
            {p.bolumler.map((b) => (
              <input key={b} type="hidden" name="profilBolumu" value={b} />
            ))}
            <input type="hidden" name="tamamMetni" value={p.tamamMetni} />
            {p.children}
          </div>
          <footer className="duzen-pencere-ayak">
            <button type="button" className="dugme dugme--ikincil" onClick={kapat}>
              Vazgeç
            </button>
            <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
              Kaydet
            </GonderDugmesi>
          </footer>
        </form>
      </dialog>
      {bildirim && (
        <div className="bildirim" role="status">
          {bildirim}
        </div>
      )}
    </>
  )
}
