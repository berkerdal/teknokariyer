'use client'
/** Adayın görüşme tarihi seçimi ve başka tarih isteği (servis src/servisler/gorusme.ts). */
import { useActionState, useState } from 'react'
import { gorusmeSecEylemi, gorusmeYeniTarihEylemi } from '@/eylemler/gorusme'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function TarihSecimi({ gorusmeId, secenekler }: { gorusmeId: number; secenekler: Array<{ deger: string; metin: string; aralik: string }> }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(gorusmeSecEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} alanlar={{ secim: 'gs-0' }} />
      <input type="hidden" name="gorusme" value={gorusmeId} />
      <fieldset className={h.secim ? 'alan alan--hata' : 'alan'}>
        <legend>Sana uyan tarihi seç</legend>
        {h.secim && <p className="hata-metni">{h.secim}</p>}
        <ul className="gr-secim-listesi">
          {secenekler.map((s, i) => (
            <li key={s.deger}>
              <label className="secenek secenek-kutu">
                <input type="radio" id={`gs-${i}`} name="secim" value={s.deger} defaultChecked={durum.degerler?.secim === s.deger || (secenekler.length === 1 && i === 0)} />{' '}
                <span>
                  <strong>{s.metin}</strong>
                  <br />
                  <span className="kucuk ikincil">{s.aralik}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
          Bu tarihi seç
        </GonderDugmesi>
      </div>
    </form>
  )
}

export function YeniTarihIstegi({ gorusmeId, onaylandi }: { gorusmeId: number; onaylandi: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(gorusmeYeniTarihEylemi, {})
  const [acik, setAcik] = useState(Boolean(durum.hatalar))
  const h = durum.hatalar ?? {}
  if (!acik && !durum.hatalar)
    return (
      <button type="button" className="dugme dugme--ikincil" onClick={() => setAcik(true)}>
        {onaylandi ? 'Bu saatte katılamıyorum' : 'Hiçbiri bana uymuyor'}
      </button>
    )
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin panel gr-kart-ic" noValidate>
      <HataOzeti durum={durum} alanlar={{ not: 'gy-not' }} />
      <input type="hidden" name="gorusme" value={gorusmeId} />
      <div className={h.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="gy-not">Firmaya not</label>
        <span className="ipucu">Hangi gün ve saatlerin sana uygun olduğunu yaz. Örneğin: “Hafta içi 14.00’ten sonra uygunum.”</span>
        {h.not && <p className="hata-metni">{h.not}</p>}
        <textarea id="gy-not" name="not" className="metin-alani" rows={3} maxLength={500} defaultValue={durum.degerler?.not} />
      </div>
      {onaylandi && <p className="kucuk ikincil">Kesinleşen görüşme takviminden kaldırılır; firma yeni tarihler önerdiğinde sana e-posta gelir.</p>}
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
          Başka tarih iste
        </GonderDugmesi>
        <button type="button" className="dugme dugme--sade" onClick={() => setAcik(false)}>
          Vazgeç
        </button>
      </div>
    </form>
  )
}
