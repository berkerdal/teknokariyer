'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { havuzEylemi } from '@/eylemler/aday'
import { Ikon } from '../Ikon'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

const GORUNURLUK: Array<[string, string, string]> = [
  ['aktif', 'Aktif iş arıyorum', 'Profilin arama sonuçlarında öne çıkar.'],
  ['acik', 'Fırsatlara açığım', 'Profilin görünür ama öne çıkmaz.'],
  ['gizli', 'Gizle', 'Hiçbir firma profilini havuzda görmez. Başvuruların etkilenmez.'],
]

function useHavuz() {
  return useActionState<FormDurumu, FormData>(havuzEylemi, {})
}

export function HavuzaKatilFormu({ surum }: { surum: string }) {
  const [durum, eylem] = useHavuz()
  return (
    <form action={eylem} className="form-yigin panel panel-ic" noValidate>
      <input type="hidden" name="islem" value="katil" />
      <HataOzeti durum={durum} />
      <fieldset className="alan">
        <legend>Havuzda nasıl görünmek istersin?</legend>
        {GORUNURLUK.slice(0, 2).map(([d, a, i], n) => (
          <label key={d} className="secenek secenek-kutu">
            <input type="radio" name="gorunurluk" value={d} defaultChecked={n === 1} />
            <span>
              <strong>{a}</strong>
              <span className="ipucu">{i}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className={durum.hatalar?.riza ? 'alan alan--hata' : 'alan'}>
        {durum.hatalar?.riza && <p className="hata-metni">{durum.hatalar.riza}</p>}
        <label className="secenek">
          <input id="riza" type="checkbox" name="riza" value="1" />
          <span>
            <Link href="/metin/havuz" target="_blank">
              CV havuzu açık rıza metnini
            </Link>{' '}
            okudum ve onaylıyorum. <span className="ipucu">Metin sürümü {surum}</span>
          </span>
        </label>
      </div>
      <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
        Havuza katıl
      </GonderDugmesi>
    </form>
  )
}

export function GorunurlukFormu({ deger }: { deger: string }) {
  const [durum, eylem] = useHavuz()
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <input type="hidden" name="islem" value="gorunurluk" />
      <HataOzeti durum={durum} />
      <fieldset className="alan">
        <legend className="b3">Görünürlüğün</legend>
        {GORUNURLUK.map(([d, a, i]) => (
          <label key={d} className="secenek secenek-kutu">
            <input type="radio" name="gorunurluk" value={d} defaultChecked={deger === d} />
            <span>
              <strong>{a}</strong>
              <span className="ipucu">{i}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme dugme--ikincil" bekleme="Kaydediliyor…">
          Görünürlüğü kaydet
        </GonderDugmesi>
        {durum.tamam && <span role="status">{durum.tamam}</span>}
      </div>
    </form>
  )
}

export function FirmaGizlemeFormu(props: { firmalar: Array<{ id: number; ad: string }>; secili: number[] }) {
  const [durum, eylem] = useHavuz()
  const [secili, setSecili] = useState(props.secili)
  const [yeni, setYeni] = useState('')
  const [hata, setHata] = useState('')
  const ekle = () => {
    const f = props.firmalar.find((x) => x.ad.toLocaleLowerCase('tr') === yeni.trim().toLocaleLowerCase('tr'))
    if (!f) return setHata('Listeden bir firma seç.')
    if (!secili.includes(f.id)) setSecili([...secili, f.id])
    setYeni('')
    setHata('')
  }
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <input type="hidden" name="islem" value="gizle" />
      {secili.map((id) => (
        <input key={id} type="hidden" name="firma" value={id} />
      ))}
      <HataOzeti durum={durum} />
      {secili.length > 0 && (
        <ul className="secili-filtre" aria-label="Gizlendiğin firmalar">
          {secili.map((id) => (
            <li key={id}>
              <button type="button" className="hap hap--secili" onClick={() => setSecili(secili.filter((x) => x !== id))}>
                {props.firmalar.find((f) => f.id === id)?.ad ?? 'Firma'} <Ikon ad="kapat" kucuk />
                <span className="gizli"> listeden çıkar</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={hata ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="gizle-firma">Firma ekle</label>
        {hata && <p className="hata-metni">{hata}</p>}
        <div className="arama">
          <input id="gizle-firma" className="girdi" list="gizle-firmalar" value={yeni} onChange={(e) => setYeni(e.target.value)} autoComplete="off" />
          <button type="button" className="dugme dugme--ikincil" onClick={ekle}>
            Ekle
          </button>
        </div>
        <datalist id="gizle-firmalar">
          {props.firmalar.map((f) => (
            <option key={f.id} value={f.ad} />
          ))}
        </datalist>
      </div>
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme dugme--ikincil" bekleme="Kaydediliyor…">
          Listeyi kaydet
        </GonderDugmesi>
        {durum.tamam && <span role="status">{durum.tamam}</span>}
      </div>
    </form>
  )
}

export function RizaIslemleri({ surum }: { surum: string }) {
  const [durum, eylem] = useHavuz()
  return (
    <div className="form-yigin">
      <HataOzeti durum={durum} />
      <div className="dugme-grubu">
        <form action={eylem}>
          <input type="hidden" name="islem" value="katil" />
          <input type="hidden" name="riza" value="1" />
          <input type="hidden" name="gorunurluk" value="acik" />
          <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Yenileniyor…">
            Rızamı şimdi yenile (sürüm {surum})
          </GonderDugmesi>
        </form>
        <form
          action={eylem}
          onSubmit={(e) => {
            if (!confirm('Havuzdan çıkmak istiyor musun? Profilin hemen havuzdan kalkar; başvuruların etkilenmez.')) e.preventDefault()
          }}
        >
          <input type="hidden" name="islem" value="geri-al" />
          <GonderDugmesi className="dugme dugme--tehlike dugme--kucuk" bekleme="Çıkılıyor…">
            Havuzdan çık
          </GonderDugmesi>
        </form>
      </div>
      {durum.tamam && <p role="status">{durum.tamam}</p>}
    </div>
  )
}
