'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { listeEkleEylemi, listeOgesiEylemi } from '@/eylemler/listeler'
import { GonderDugmesi, type FormDurumu } from '../form'

export function ListeEkleFormu({ tur, turAdi }: { tur: string; turAdi: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(listeEkleEylemi, {})
  const [anahtar, setAnahtar] = useState(0)
  const son = useRef(durum.surum)
  useEffect(() => {
    // Başarılı eklemeden sonra alan boşalır; benzer uyarısı varsa yazılanlar korunur
    if (durum.surum && durum.surum !== son.current && !durum.hatalar) setAnahtar((n) => n + 1)
    son.current = durum.surum
  }, [durum])
  return (
    <form action={eylem} key={anahtar} className="y-karar">
      <input type="hidden" name="tur" value={tur} />
      {durum.tamam && (
        <p className="basari-kutu" role="status">
          {durum.tamam}
        </p>
      )}
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <div className={durum.hatalar?.ogeler ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={`ekle-${tur}`}>Yeni {turAdi}</label>
        <span className="ipucu">Her satıra bir öğe yazın; en fazla 10. Listede olanlar ve aynı şeyin başka yazımları ayrıca eklenmez.</span>
        {durum.hatalar?.ogeler && <p className="hata-metni">{durum.hatalar.ogeler}</p>}
        <textarea id={`ekle-${tur}`} name="ogeler" className="metin-alani" rows={3} defaultValue={durum.degerler?.ogeler ?? ''} />
      </div>
      {durum.degerler?.benzer && (
        <label className="secenek kucuk">
          <input type="checkbox" name="yineDe" /> <span>Bunlar farklı öğeler; yine de ayrı olarak ekle.</span>
        </label>
      )}
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="Ekleniyor…">
        Listeye ekle
      </GonderDugmesi>
    </form>
  )
}

export function ListeOgesi({ oge }: { oge: { id: number; ad: string; esAnlamlilar: string[]; aktif: boolean } }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(listeOgesiEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <details className="y-oge-satir">
      <summary>
        <span className={oge.aktif ? undefined : 'ikincil'}>
          <strong>{oge.ad}</strong>
          {oge.esAnlamlilar.length > 0 && <span className="kucuk ikincil"> · {oge.esAnlamlilar.join(', ')}</span>}
        </span>
        {!oge.aktif && <span className="durum durum--kapandi">Seçilemez</span>}
        <span className="kucuk y-duzenle">Düzenle</span>
      </summary>
      <form action={eylem} className="y-karar">
        <input type="hidden" name="id" value={oge.id} />
        {durum.tamam && (
          <p className="kucuk" role="status">
            {durum.tamam}
          </p>
        )}
        {durum.genel && <p className="hata-metni">{durum.genel}</p>}
        <div className={h.ad ? 'alan alan--hata' : 'alan'}>
          <label htmlFor={`ad-${oge.id}`}>Ad</label>
          {h.ad && <p className="hata-metni">{h.ad}</p>}
          <input id={`ad-${oge.id}`} name="ad" className="girdi" defaultValue={durum.degerler?.ad ?? oge.ad} />
        </div>
        <div className={h.esAnlamlilar ? 'alan alan--hata' : 'alan'}>
          <label htmlFor={`es-${oge.id}`}>Eş anlamlılar</label>
          <span className="ipucu">Aynı şeyin diğer yazımları, virgülle ayırın. Örnek: JavaScript için “JS, ECMAScript”. Aramada bu öğeyi bulur.</span>
          {h.esAnlamlilar && <p className="hata-metni">{h.esAnlamlilar}</p>}
          <input id={`es-${oge.id}`} name="esAnlamlilar" className="girdi" defaultValue={durum.degerler?.esAnlamlilar ?? oge.esAnlamlilar.join(', ')} />
        </div>
        <label className="secenek">
          <input type="checkbox" name="aktif" defaultChecked={oge.aktif} />{' '}
          <span>
            Seçilebilir
            <span className="ipucu">İşareti kaldırırsanız öğe yeni ilanlarda ve profillerde seçilemez; mevcut ilanlarda ve profillerde görünmeye devam eder.</span>
          </span>
        </label>
        <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Kaydediliyor…">
          Kaydet
        </GonderDugmesi>
      </form>
    </details>
  )
}
