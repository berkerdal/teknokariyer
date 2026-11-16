'use client'
/** Bir ilanın açık bildirimlerini sonuçlandırma formu (yersiz / firma uyarıldı / ilan kaldırıldı). */
import { useActionState, useState } from 'react'
import { SIKAYET_SONUCU, type SikayetSonucu } from '@/alan/sikayet'
import { sikayetKarariEylemi } from '@/eylemler/moderasyon'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function SikayetKarari({ ilanId, pozisyon }: { ilanId: number; pozisyon: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(sikayetKarariEylemi, {})
  const [sonuc, setSonuc] = useState<SikayetSonucu | ''>('')
  const h = durum.hatalar ?? {}
  const k = `sk-${ilanId}`
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz alanlar={{ sonuc: `${k}-sonuc-0`, firmaMesaji: `${k}-mesaj` }} />
      <input type="hidden" name="ilan" value={ilanId} />
      <input type="hidden" name="pozisyon" value={pozisyon} />
      <fieldset className={h.sonuc ? 'alan alan--hata' : 'alan'}>
        <legend>Karar</legend>
        {h.sonuc && <p className="hata-metni">{h.sonuc}</p>}
        {(Object.entries(SIKAYET_SONUCU) as Array<[SikayetSonucu, (typeof SIKAYET_SONUCU)[SikayetSonucu]]>).map(([d, s], i) => (
          <label key={d} className="secenek secenek-kutu">
            <input id={i === 0 ? `${k}-sonuc-0` : undefined} type="radio" name="sonuc" value={d} checked={sonuc === d} onChange={() => setSonuc(d)} />
            <span>
              <strong>{s.ad}</strong>
              <span className="ipucu">{s.aciklama}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {sonuc && sonuc !== 'yersiz' && (
        <div className={h.firmaMesaji ? 'alan alan--hata' : 'alan'}>
          <label htmlFor={`${k}-mesaj`}>Firmaya mesaj</label>
          <span className="ipucu">Neyin sorun olduğunu ve firmanın ne yapması gerektiğini yazın. Bildirenlerin kimliği firmaya gösterilmez.</span>
          {h.firmaMesaji && <p className="hata-metni">{h.firmaMesaji}</p>}
          <textarea id={`${k}-mesaj`} name="firmaMesaji" className="metin-alani" rows={3} maxLength={1000} />
        </div>
      )}
      <div className="alan">
        <label htmlFor={`${k}-not`}>
          İç not <span className="istege-bagli">(isteğe bağlı; yalnızca Yönetici A.Ş. görür)</span>
        </label>
        <textarea id={`${k}-not`} name="icNot" className="metin-alani" rows={2} maxLength={1000} />
      </div>
      <div className="dugme-grubu">
        <GonderDugmesi bekleme="Kaydediliyor…">Kararı kaydet</GonderDugmesi>
      </div>
    </form>
  )
}
