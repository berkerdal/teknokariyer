'use client'
/**
 * Çerez izni bandı ve tercih penceresi (src/alan/cerez.ts; KVKK Kurumu Çerez Uygulamaları Rehberi):
 * - İzin yoksa veya süresi dolduysa sayfanın altında, içeriği kapatmadan görünür; sayfa kullanılmaya devam edilebilir.
 * - “Reddet” ile “Kabul et” aynı görünür ve aynı kolaylıktadır; ayrıntılı seçimde hiçbir kutu önceden işaretli değildir.
 * - Alt bilgideki “Çerez tercihleri” pencereyi her zaman yeniden açar; izin aynı kolaylıkla geri alınır.
 */
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { CEREZ_PENCERE_OLAYI, izinAl, izinKaydet } from './cerezIstemci'

export function CerezBandi({ baslangicGecerli }: { baslangicGecerli: boolean }) {
  const [bant, setBant] = useState(!baslangicGecerli)
  const [ayrinti, setAyrinti] = useState(false)
  const [tercih, setTercih] = useState(false)
  const [istatistik, setIstatistik] = useState(false)
  const pencere = useRef<HTMLDialogElement>(null)
  const baslik = useId()

  useEffect(() => {
    const ac = () => {
      const i = izinAl()
      setTercih(Boolean(i?.tercih))
      setIstatistik(Boolean(i?.istatistik))
      setAyrinti(true)
      pencere.current?.showModal()
    }
    window.addEventListener(CEREZ_PENCERE_OLAYI, ac)
    return () => window.removeEventListener(CEREZ_PENCERE_OLAYI, ac)
  }, [])

  const kaydet = (i: { tercih: boolean; istatistik: boolean }) => {
    izinKaydet(i)
    setBant(false)
    setAyrinti(false)
    pencere.current?.close()
  }
  const ayrintiAc = () => {
    setAyrinti(true)
    pencere.current?.showModal()
  }

  return (
    <>
      {bant && (
        <section className="cerez-bandi" aria-label="Çerez tercihi">
          <div className="cerez-bandi-ic">
            <p>
              <strong>Çerezler hakkında.</strong> Siteyi çalıştırmak ve hesabını korumak için zorunlu çerezler kullanıyoruz. İzin verirsen tercihlerini
              hatırlamak ve siteyi kaç kişinin kullandığını saymak için iki çerez daha kullanırız. Reklam veya takip çerezi kullanmıyoruz.{' '}
              <Link href="/metin/cerez-politikasi">Çerez politikası</Link>
            </p>
            <div className="cerez-dugmeler">
              <button type="button" className="dugme dugme--ikincil" onClick={() => kaydet({ tercih: false, istatistik: false })}>
                Reddet
              </button>
              <button type="button" className="dugme dugme--ikincil" onClick={() => kaydet({ tercih: true, istatistik: true })}>
                Kabul et
              </button>
              <button type="button" className="dugme dugme--sade" onClick={ayrintiAc}>
                Ayrıntılı seç
              </button>
            </div>
          </div>
        </section>
      )}
      <dialog ref={pencere} className="pencere-dialog cerez-pencere" aria-labelledby={baslik} onClose={() => setAyrinti(false)}>
        {ayrinti && (
          <form
            method="dialog"
            className="form-yigin"
            onSubmit={(e) => {
              e.preventDefault()
              kaydet({ tercih, istatistik })
            }}
          >
            <h2 id={baslik} className="b3">
              Çerez tercihleri
            </h2>
            <p className="kucuk ikincil">
              Seçimini istediğin zaman alt bilgideki “Çerez tercihleri” bağlantısından değiştirebilirsin. Ayrıntılar{' '}
              <Link href="/metin/cerez-politikasi" onClick={() => pencere.current?.close()}>
                çerez politikasında
              </Link>
              .
            </p>
            <div className="cerez-tur">
              <div>
                <strong>Zorunlu çerezler</strong>
                <p className="kucuk ikincil">Oturumunu açık tutar, hesabını ve formları kötüye kullanıma karşı korur, bu seçimini hatırlar. Kapatılamaz.</p>
              </div>
              <span className="rozet rozet--notr">Her zaman açık</span>
            </div>
            <label className="cerez-tur">
              <span>
                <strong>Tercih çerezleri</strong>
                <span className="kucuk ikincil">Kapattığın bilgi kutuları gibi tercihlerini bu tarayıcıda hatırlar. İzin vermezsen yalnızca oturum boyunca hatırlanır.</span>
              </span>
              <input type="checkbox" className="anahtar" checked={tercih} onChange={(e) => setTercih(e.target.checked)} />
            </label>
            <label className="cerez-tur">
              <span>
                <strong>İstatistik çerezi</strong>
                <span className="kucuk ikincil">
                  Siteyi kaç farklı kişinin kullandığını saymamıza yardım eder. Seni tanıtan bir bilgi içermez; yalnızca ilk ziyaret ayını ve son ziyaret gününü
                  tutar.
                </span>
              </span>
              <input type="checkbox" className="anahtar" checked={istatistik} onChange={(e) => setIstatistik(e.target.checked)} />
            </label>
            <div className="cerez-dugmeler">
              <button type="button" className="dugme dugme--ikincil" onClick={() => kaydet({ tercih: false, istatistik: false })}>
                Hepsini reddet
              </button>
              <button type="submit" className="dugme">
                Seçimimi kaydet
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}

/** Alt bilgideki “Çerez tercihleri” bağlantısı: pencereyi açar. */
export function CerezTercihleriDugmesi() {
  return (
    <button type="button" className="a-alt-dugme" onClick={() => window.dispatchEvent(new CustomEvent(CEREZ_PENCERE_OLAYI))}>
      Çerez tercihleri
    </button>
  )
}
