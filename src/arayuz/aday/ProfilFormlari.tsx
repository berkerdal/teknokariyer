'use client'
/**
 * Profil düzenleme parçaları. Her bölüm kendi formuyla kaydedilir; kaydedilmemiş değişiklik varken sayfadan çıkılırsa
 * tarayıcı uyarır (CLAUDE.md 5).
 */
import { useActionState, useEffect, useState } from 'react'
import { cvSilEylemi, cvYukleEylemi, profilKaydetEylemi } from '@/eylemler/aday'
import { CEFR } from '@/alan/eslesme'
import { Ikon } from '../Ikon'
import { OneriliGirdi } from '../OneriliGirdi'
import { TalepPenceresi, useTalepAcma } from '../TalepPenceresi'
import { DosyaSecici, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

type Satir = { ad: string; seviye: string }

/** Beceri veya dil listesi: taksonomiden seçilir (ilan ile aynı liste, eşleşme doğru çalışsın diye). */
export function ListeDuzenleyici(props: {
  ad: 'beceri' | 'dil'
  etiket: string
  ipucu?: string
  secenekler: Array<{ id: number; ad: string }>
  seviyeler: Array<[string, string]>
  baslangic: Satir[]
  enFazla: number
}) {
  const [satirlar, setSatirlar] = useState<Satir[]>(props.baslangic)
  const [hata, setHata] = useState('')
  const talepAcma = useTalepAcma(false)
  const idBul = (ad: string) => props.secenekler.find((s) => s.ad.toLocaleLowerCase('tr') === ad.trim().toLocaleLowerCase('tr'))
  const ekle = (s: { id: number; ad: string }) => {
    if (satirlar.some((x) => x.ad === s.ad)) return setHata(`${s.ad} zaten listende bulunuyor.`)
    setSatirlar([...satirlar, { ad: s.ad, seviye: props.seviyeler[1]?.[0] ?? props.seviyeler[0]![0] }])
    setHata('')
  }
  return (
    <fieldset className="alan">
      <legend>{props.etiket}</legend>
      {props.ipucu && <span className="ipucu">{props.ipucu}</span>}
      {satirlar.length === 0 && <p className="ikincil">{props.ad === 'beceri' ? 'Henüz beceri eklemedin.' : 'Henüz dil eklemedin.'}</p>}
      <ul className="beceri-duzen">
        {satirlar.map((s, n) => {
          const id = idBul(s.ad)?.id
          return (
            <li key={s.ad}>
              <span>{s.ad}</span>
              <label className="gizli" htmlFor={`${props.ad}-sev-${n}`}>
                {s.ad} seviyesi
              </label>
              <select
                id={`${props.ad}-sev-${n}`}
                className="secim secim--kucuk"
                value={s.seviye}
                onChange={(e) => setSatirlar(satirlar.map((x, m) => (m === n ? { ...x, seviye: e.target.value } : x)))}
              >
                {props.seviyeler.map(([d, a]) => (
                  <option key={d} value={d}>
                    {a}
                  </option>
                ))}
              </select>
              {id && <input type="hidden" name={props.ad} value={`${id}:${s.seviye}`} />}
              <button type="button" className="ikon-dugme" aria-label={`${s.ad} çıkar`} onClick={() => setSatirlar(satirlar.filter((_, m) => m !== n))}>
                <Ikon ad="kapat" kucuk />
              </button>
            </li>
          )
        })}
      </ul>
      {satirlar.length < props.enFazla && (
        <div className={hata ? 'alan alan--hata' : 'alan'}>
          <span className="alan-ad">{props.ad === 'beceri' ? 'Beceri ekle' : 'Dil ekle'}</span>
          {hata && <p className="hata-metni">{hata}</p>}
          <OneriliGirdi
            id={`${props.ad}-yeni`}
            etiket={props.ad === 'beceri' ? 'Beceri ekle' : 'Dil ekle'}
            secenekler={props.secenekler}
            haric={satirlar.map((x) => idBul(x.ad)?.id ?? -1)}
            sec={ekle}
            placeholder={props.ad === 'beceri' ? 'Yazmaya başla: Python, SolidWorks…' : 'Yazmaya başla: İngilizce'}
            bulunamadi={talepAcma.baglanti}
          />
        </div>
      )}
      <TalepPenceresi tur={props.ad} kaynak={`aday-profil:${props.ad}`} hitap="sen" baslangic={talepAcma.talep.metin} disAcma={talepAcma.talep.n} tetikYok />
    </fieldset>
  )
}

export const CEFR_SEVIYELERI: Array<[string, string]> = CEFR.map((c) => [c, c])

export function CvYukleFormu({ kalan }: { kalan: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(cvYukleEylemi, {})
  if (kalan <= 0) return <p className="kucuk ikincil">En fazla 3 CV saklayabilirsin. Yeni bir CV yüklemek için önce birini sil.</p>
  return (
    <form action={eylem} className="dosya" noValidate>
      <HataOzeti durum={durum} alanlar={{ cvDosya: 'cv-dosya' }} />
      <p>
        <strong>Yalnızca PDF dosyası yükleyebilirsin; dosya en fazla 5 MB olabilir.</strong> {kalan} CV daha ekleyebilirsin.
      </p>
      <div className={durum.hatalar?.cvDosya ? 'alan alan--hata' : 'alan'}>
        {durum.hatalar?.cvDosya && <p className="hata-metni">{durum.hatalar.cvDosya}</p>}
        <DosyaSecici id="cv-dosya" ad="cvDosya" />
      </div>
      <div className="alan">
        <label htmlFor="cv-ad">
          CV’ye bir ad ver <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        <input id="cv-ad" name="cvAd" className="girdi" placeholder="Ör. CV – İngilizce" maxLength={60} />
      </div>
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme dugme--ikincil" bekleme="Yükleniyor…">
          <Ikon ad="yukle" /> CV yükle
        </GonderDugmesi>
        {durum.tamam && <span role="status">{durum.tamam}</span>}
      </div>
    </form>
  )
}

export function CvSilDugmesi({ dosyaId, ad }: { dosyaId: number; ad: string }) {
  return (
    <form
      action={cvSilEylemi}
      onSubmit={(e) => {
        if (!confirm(`“${ad}” silinsin mi? Daha önce bu CV ile yaptığın başvurular etkilenmez.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="dosya" value={dosyaId} />
      <GonderDugmesi className="dugme dugme--sade dugme--kucuk" bekleme="Siliniyor…">
        Sil<span className="gizli">: {ad}</span>
      </GonderDugmesi>
    </form>
  )
}
