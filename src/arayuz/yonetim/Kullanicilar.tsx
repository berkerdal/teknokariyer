'use client'
import { useActionState, useState } from 'react'
import { KURUM_ROLLERI } from '@/alan/kurumRolleri'
import { kurumKullanicisiEkleEylemi, kurumKullanicisiIslemiEylemi } from '@/eylemler/kurumKullanicilari'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function KurumKullanicisiFormu() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kurumKullanicisiEkleEylemi, {})
  const [rol, setRol] = useState(durum.degerler?.rol || 'yonetici')
  const h = durum.hatalar ?? {}
  const d = durum.degerler ?? {}
  return (
    <form action={eylem} noValidate className="y-karar">
      <HataOzeti durum={durum} siz alanlar={{ ad: 'k-ad', eposta: 'k-eposta', rol: 'k-rol' }} />
      <div className={h.ad ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="k-ad">Ad soyad</label>
        {h.ad && <p className="hata-metni">{h.ad}</p>}
        <input id="k-ad" name="ad" className="girdi" defaultValue={d.ad} autoComplete="off" />
      </div>
      <div className={h.eposta ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="k-eposta">Kurumsal e-posta</label>
        <span className="ipucu">Şifre belirleme bağlantısı bu adrese gider.</span>
        {h.eposta && <p className="hata-metni">{h.eposta}</p>}
        <input id="k-eposta" name="eposta" type="email" className="girdi" defaultValue={d.eposta} autoComplete="off" />
      </div>
      <div className="alan">
        <label htmlFor="k-unvan">
          Görevi <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        <input id="k-unvan" name="unvan" className="girdi" defaultValue={d.unvan} placeholder="Örnek: Kurumsal İletişim Uzmanı" />
      </div>
      <fieldset className={h.rol ? 'alan alan--hata' : 'alan'} id="k-rol">
        <legend>Yetki</legend>
        {h.rol && <p className="hata-metni">{h.rol}</p>}
        {KURUM_ROLLERI.map(([r, a, aciklama]) => (
          <label key={r} className="secenek">
            <input type="radio" name="rol" value={r} checked={rol === r} onChange={() => setRol(r)} />{' '}
            <span>
              {a}
              <span className="ipucu">{aciklama}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="Hesap açılıyor…">
        Hesabı aç ve e-posta gönder
      </GonderDugmesi>
    </form>
  )
}

export function KullaniciIslemi({ kullaniciId, islem, metin, rol, tehlike }: { kullaniciId: number; islem: string; metin: string; rol?: string; tehlike?: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kurumKullanicisiIslemiEylemi, {})
  return (
    <form action={eylem} className="satir-ici">
      <input type="hidden" name="kullanici" value={kullaniciId} />
      <input type="hidden" name="islem" value={islem} />
      {rol && <input type="hidden" name="rol" value={rol} />}
      <GonderDugmesi className={tehlike ? 'dugme dugme--sade dugme--kucuk y-tehlike' : 'dugme dugme--sade dugme--kucuk'} bekleme="…">
        {metin}
      </GonderDugmesi>
      {durum.genel && (
        <span className="hata-metni kucuk" role="alert">
          {durum.genel}
        </span>
      )}
    </form>
  )
}

export function RolSecimi({ kullaniciId, rol }: { kullaniciId: number; rol: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kurumKullanicisiIslemiEylemi, {})
  const [secili, setSecili] = useState(rol)
  return (
    <form action={eylem} className="satir-ici">
      <input type="hidden" name="kullanici" value={kullaniciId} />
      <input type="hidden" name="islem" value="rol" />
      <label className="gizli" htmlFor={`rol-${kullaniciId}`}>
        Yetki
      </label>
      <select id={`rol-${kullaniciId}`} name="rol" className="secim secim--kucuk" value={secili} onChange={(e) => setSecili(e.target.value)}>
        {KURUM_ROLLERI.map(([r, a]) => (
          <option key={r} value={r}>
            {a}
          </option>
        ))}
      </select>
      {secili !== rol && (
        <GonderDugmesi className="dugme dugme--kucuk" bekleme="…">
          Kaydet
        </GonderDugmesi>
      )}
      {durum.genel && (
        <span className="hata-metni kucuk" role="alert">
          {durum.genel}
        </span>
      )}
    </form>
  )
}
