'use client'
/**
 * Profil düzenleme parçaları. Her bölüm kendi formuyla kaydedilir; kaydedilmemiş değişiklik varken sayfadan çıkılırsa
 * tarayıcı uyarır (CLAUDE.md 5).
 */
import { useActionState, useEffect, useState } from 'react'
import { cvSilEylemi, cvYukleEylemi, profilKaydetEylemi } from '@/eylemler/aday'
import { CEFR } from '@/alan/eslesme'
import { Ikon } from '../Ikon'
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
  const [yeni, setYeni] = useState('')
  const [hata, setHata] = useState('')
  const idBul = (ad: string) => props.secenekler.find((s) => s.ad.toLocaleLowerCase('tr') === ad.trim().toLocaleLowerCase('tr'))
  const listeId = `${props.ad}-liste`
  const ekle = () => {
    const s = idBul(yeni)
    if (!s) return setHata(`“${yeni}” listede yok. Lütfen listeden bir seçenek seç; listede olmayan seçenekleri Yönetici A.Ş. ekler.`)
    if (satirlar.some((x) => x.ad === s.ad)) return setHata(`${s.ad} zaten listende bulunuyor.`)
    setSatirlar([...satirlar, { ad: s.ad, seviye: props.seviyeler[1]?.[0] ?? props.seviyeler[0]![0] }])
    setYeni('')
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
          <label htmlFor={`${props.ad}-yeni`}>{props.ad === 'beceri' ? 'Beceri ekle' : 'Dil ekle'}</label>
          {hata && <p className="hata-metni">{hata}</p>}
          <div className="arama">
            <input
              id={`${props.ad}-yeni`}
              className="girdi"
              list={listeId}
              value={yeni}
              onChange={(e) => setYeni(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ekle()
                }
              }}
              placeholder={props.ad === 'beceri' ? 'Ör. Python, SolidWorks' : 'Ör. İngilizce'}
              autoComplete="off"
            />
            <button type="button" className="dugme dugme--ikincil" onClick={ekle}>
              Ekle
            </button>
          </div>
          <datalist id={listeId}>
            {props.secenekler.map((s) => (
              <option key={s.id} value={s.ad} />
            ))}
          </datalist>
        </div>
      )}
    </fieldset>
  )
}

export const CEFR_SEVIYELERI: Array<[string, string]> = CEFR.map((c) => [c, c])

export function CvYukleFormu({ kalan }: { kalan: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(cvYukleEylemi, {})
  if (kalan <= 0) return <p className="kucuk ikincil">En fazla 3 CV saklayabilirsin. Yenisini yüklemek için birini sil.</p>
  return (
    <form action={eylem} className="dosya" noValidate>
      <HataOzeti durum={durum} alanlar={{ cvDosya: 'cv-dosya' }} />
      <p>
        <strong>Yalnızca PDF, en fazla 5 MB.</strong> {kalan} CV daha ekleyebilirsin.
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
