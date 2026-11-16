'use client'
/** Firma hesap talebi kararı: firma kaydıyla eşleştirip davet gönder veya gerekçeyle reddet. */
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { hesapTalebiKarariEylemi } from '@/eylemler/hesapTalebi'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

type Firma = { id: number; kisaAd: string; konum: string }

type Ozellikler = { talepId: number; benzer: Firma[]; firmalar: Firma[] }

export function HesapTalebiKarari(o: Ozellikler) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(hesapTalebiKarariEylemi, {})
  return <KararFormu key={durum.surum ?? 0} {...o} durum={durum} eylem={eylem} />
}

function KararFormu({ talepId, benzer, firmalar, durum, eylem }: Ozellikler & { durum: FormDurumu; eylem: (f: FormData) => void }) {
  const d = durum.degerler ?? {}
  const [karar, setKarar] = useState<'davet' | 'red'>(d.karar === 'red' ? 'red' : 'davet')
  const h = durum.hatalar ?? {}
  const k = `ht-${talepId}`
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz alanlar={{ firma: `${k}-firma`, gerekce: `${k}-gerekce` }} />
      <input type="hidden" name="talep" value={talepId} />
      <fieldset className="alan">
        <legend>Karar</legend>
        <div className="yan-yana">
          <label className="secenek secenek-kutu">
            <input type="radio" name="karar" value="davet" checked={karar === 'davet'} onChange={() => setKarar('davet')} /> <span>Firmayla eşleştir ve davet gönder</span>
          </label>
          <label className="secenek secenek-kutu">
            <input type="radio" name="karar" value="red" checked={karar === 'red'} onChange={() => setKarar('red')} /> <span>Reddet</span>
          </label>
        </div>
      </fieldset>
      {karar === 'davet' ? (
        <div className={h.firma ? 'alan alan--hata' : 'alan'}>
          <label htmlFor={`${k}-firma`}>Talebin ait olduğu firma</label>
          <span className="ipucu">
            {benzer.length ? 'Adı benzeyen firmalar listenin başında. ' : 'Adı benzeyen kayıtlı firma bulunamadı. '}
            Firma listede yoksa önce <Link href="/yonetim/firmalar/yeni">iskelet kaydını oluşturun</Link>. Davet “Tam yetkili” olarak gider.
          </span>
          {h.firma && <p className="hata-metni">{h.firma}</p>}
          <select id={`${k}-firma`} name="firma" className="secim" defaultValue={d.firma ?? benzer[0]?.id ?? ''}>
            <option value="">Firma seçin</option>
            {benzer.length > 0 && (
              <optgroup label="Adı benzeyenler">
                {benzer.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.kisaAd} · {f.konum}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Bütün firmalar">
              {firmalar.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.kisaAd} · {f.konum}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      ) : (
        <div className={h.gerekce ? 'alan alan--hata' : 'alan'}>
          <label htmlFor={`${k}-gerekce`}>Gerekçe</label>
          <span className="ipucu">Talep edene e-postayla gider. Örneğin: “Firmanız Pamukkale Teknokent kayıtlarında bulunamadı.”</span>
          {h.gerekce && <p className="hata-metni">{h.gerekce}</p>}
          <textarea id={`${k}-gerekce`} name="gerekce" className="metin-alani" rows={3} maxLength={1000} defaultValue={d.gerekce} />
        </div>
      )}
      <div className="dugme-grubu">
        <GonderDugmesi bekleme="Kaydediliyor…">{karar === 'davet' ? 'Davet gönder' : 'Reddet'}</GonderDugmesi>
      </div>
    </form>
  )
}
