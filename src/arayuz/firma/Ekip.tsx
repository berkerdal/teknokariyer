'use client'
/** Ekip sayfasının etkileşimli parçaları: davet formu, üye ve davet işlemleri, kişinin kendi bilgileri. */
import { useActionState, useEffect, useRef, useState } from 'react'
import { davetEylemi, ekipIslemiEylemi, kendiBilgilerimEylemi } from '@/eylemler/firma'
import { AlanBilgisi } from '../BilgiKutusu'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'
import { YETKILER } from '@/alan/ekip'


function useBildirim(durum: FormDurumu) {
  const [metin, setMetin] = useState('')
  const [anahtar, setAnahtar] = useState(0)
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    /* eslint-disable react-hooks/set-state-in-effect -- işlem bitti */
    setMetin(durum.tamam ?? '')
    setAnahtar((a) => a + 1)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [durum])
  useEffect(() => {
    if (!metin) return
    const z = setTimeout(() => setMetin(''), 5000)
    return () => clearTimeout(z)
  }, [metin])
  return { metin, anahtar }
}

const Bildirim = ({ metin }: { metin: string }) =>
  metin ? (
    <div className="bildirim" role="status">
      {metin}
    </div>
  ) : null

export function DavetFormu() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(davetEylemi, {})
  const { metin, anahtar } = useBildirim(durum)
  const h = durum.hatalar ?? {}
  const d = durum.surum ? {} : (durum.degerler ?? {})
  return (
    <form action={eylem} key={anahtar} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz />
      <div className="iki-alan">
        <div className={h.ad ? 'alan alan--hata' : 'alan'}>
          <label htmlFor="davet-ad">Ad soyad</label>
          {h.ad && <p className="hata-metni">{h.ad}</p>}
          <input id="davet-ad" name="ad" className="girdi" defaultValue={d.ad} autoComplete="off" />
        </div>
        <div className={h.eposta ? 'alan alan--hata' : 'alan'}>
          <label htmlFor="davet-eposta">
            İş e-posta adresi
            <AlanBilgisi etiket="İş e-posta adresi">
              Davet bağlantısı bu adrese gider. Kişisel adres yerine firma adresi kullanmanız, kişi firmadan ayrıldığında erişimin kontrolünü kolaylaştırır.
            </AlanBilgisi>
          </label>
          {h.eposta && <p className="hata-metni">{h.eposta}</p>}
          <input id="davet-eposta" name="eposta" type="email" className="girdi" defaultValue={d.eposta} autoComplete="off" />
        </div>
      </div>
      <fieldset className={h.firmaYetkisi ? 'alan alan--hata' : 'alan'} id="davet-yetki">
        <legend>Yetki</legend>
        {h.firmaYetkisi && <p className="hata-metni">{h.firmaYetkisi}</p>}
        {YETKILER.map(([deger, ad, aciklama]) => (
          <label key={deger} className="secenek">
            <input type="radio" name="firmaYetkisi" value={deger} defaultChecked={(d.firmaYetkisi || 'ilan-sorumlusu') === deger} />{' '}
            <span>
              {ad}
              <span className="ipucu">{aciklama}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div>
        <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
          Davet gönder
        </GonderDugmesi>
      </div>
      <Bildirim metin={metin} />
    </form>
  )
}

/** Tek bir işlem düğmesi (çıkar, geri al, daveti yeniden gönder, iptal). Kalıcı işlemlerde onay sorar. */
export function EkipIslemi({ id, islem, metin, onay, tehlike = false }: { id: number; islem: string; metin: string; onay?: string; tehlike?: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ekipIslemiEylemi, {})
  const { metin: bildirim } = useBildirim(durum)
  return (
    <form
      action={eylem}
      onSubmit={(e) => {
        if (onay && !window.confirm(onay)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="islem" value={islem} />
      <GonderDugmesi className={tehlike ? 'dugme dugme--sade dugme--kucuk tehlike-metin' : 'dugme dugme--sade dugme--kucuk'} bekleme="Bekleyin…">
        {metin}
      </GonderDugmesi>
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <Bildirim metin={bildirim} />
    </form>
  )
}

export function YetkiSecimi({ id, yetki, ad }: { id: number; yetki: string; ad: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ekipIslemiEylemi, {})
  const { metin } = useBildirim(durum)
  const [secili, setSecili] = useState(yetki)
  return (
    <form action={eylem} className="yetki-formu">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="islem" value="yetki" />
      <label className="gizli" htmlFor={`yetki-${id}`}>
        {ad} için yetki
      </label>
      <select id={`yetki-${id}`} name="yetki" className="secim secim--kucuk" value={secili} onChange={(e) => setSecili(e.target.value)}>
        {YETKILER.map(([d, a]) => (
          <option key={d} value={d}>
            {a}
          </option>
        ))}
      </select>
      {secili !== yetki && (
        <GonderDugmesi className="dugme dugme--kucuk" bekleme="Kaydediliyor…">
          Kaydet
        </GonderDugmesi>
      )}
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <Bildirim metin={metin} />
    </form>
  )
}

export function BilgilerimFormu({ ad, unvan }: { ad: string; unvan: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kendiBilgilerimEylemi, {})
  const { metin } = useBildirim(durum)
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <div className="iki-alan">
        <div className={durum.hatalar?.ad ? 'alan alan--hata' : 'alan'}>
          <label htmlFor="ben-ad">Ad soyad</label>
          {durum.hatalar?.ad && <p className="hata-metni">{durum.hatalar.ad}</p>}
          <input id="ben-ad" name="ad" className="girdi" defaultValue={ad} />
        </div>
        <div className="alan">
          <label htmlFor="ben-unvan">
            Göreviniz <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <input id="ben-unvan" name="unvan" className="girdi" defaultValue={unvan} placeholder="Örnek: İnsan Kaynakları Uzmanı" maxLength={80} />
        </div>
      </div>
      <div>
        <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Kaydediliyor…">
          Bilgilerimi kaydet
        </GonderDugmesi>
      </div>
      <Bildirim metin={metin} />
    </form>
  )
}
