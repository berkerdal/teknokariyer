'use client'
/** Adayın KVKK başvuru formu ve hesap silme formu (Hesap ve gizlilik sayfası). Hitap: sen (K9). */
import { useActionState, useState } from 'react'
import { KVKK_TALEP_TURLERI, aciklamaZorunluMu, type KvkkTalepTuru } from '@/alan/kvkk'
import { hesabiSilEylemi, kvkkBasvuruEylemi } from '@/eylemler/kvkk'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function KvkkBasvuruFormu() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkBasvuruEylemi, {})
  const d = durum.degerler ?? {}
  const h = durum.hatalar ?? {}
  const [tur, setTur] = useState<KvkkTalepTuru | ''>((d.tur as KvkkTalepTuru) || '')
  const zorunlu = tur ? aciklamaZorunluMu(tur) : false
  return (
    <form key={durum.surum ?? 0} action={eylem} noValidate>
      <HataOzeti durum={durum} alanlar={{ tur: 'kvkk-tur', aciklama: 'kvkk-aciklama' }} />
      <fieldset className={h.tur ? 'alan alan--hata' : 'alan'} id="kvkk-tur">
        <legend>Ne istiyorsun?</legend>
        {h.tur && <p className="hata-metni">{h.tur}</p>}
        {KVKK_TALEP_TURLERI.map(([t, , aciklama]) => (
          <label key={t} className="secenek">
            <input type="radio" name="tur" value={t} checked={tur === t} onChange={() => setTur(t)} /> <span>{aciklama}</span>
          </label>
        ))}
      </fieldset>
      <div className={h.aciklama ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="kvkk-aciklama">
          Açıklama {!zorunlu && <span className="istege-bagli">(isteğe bağlı)</span>}
        </label>
        <span className="ipucu">
          {zorunlu ? 'Bu başvuru türünde neyi istediğini birkaç cümleyle yaz. Örneğin hangi bilginin yanlış olduğunu ve doğrusunu belirt.' : 'Eklemek istediğin bir ayrıntı varsa yaz.'}
        </span>
        {h.aciklama && <p className="hata-metni">{h.aciklama}</p>}
        <textarea id="kvkk-aciklama" name="aciklama" className="girdi" rows={4} maxLength={3000} defaultValue={d.aciklama} />
      </div>
      <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
        Başvuruyu gönder
      </GonderDugmesi>
    </form>
  )
}

export function HesapSilmeFormu({ basvuruSayisi }: { basvuruSayisi: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(hesabiSilEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <form key={durum.surum ?? 0} action={eylem} noValidate className="hesap-sil">
      <HataOzeti durum={durum} alanlar={{ sifre: 'sil-sifre', onay: 'sil-onay' }} />
      <p>Hesabını sildiğinde şunlar hemen ve geri getirilemeyecek şekilde silinir:</p>
      <ul>
        <li>hesabın, profilin ve bütün CV dosyaların,</li>
        <li>CV havuzu kaydın ve verdiğin onayların kayıtları.</li>
      </ul>
      {basvuruSayisi > 0 ? (
        <p>
          Başvurduğun {basvuruSayisi === 1 ? 'firma' : `${basvuruSayisi} ilanın firmaları`} başvuru kaydını “aday hesabını sildi” olarak görmeye devam eder. Bu kayıttan adın, iletişim
          bilgilerin, ön yazın ve CV’n silinir; eğitim, beceri ve soruların cevapları firmanın değerlendirme kaydında kalır. İlan kapandıktan sonra saklama süresi
          dolunca bunlar da silinir.
        </p>
      ) : null}
      <div className={h.sifre ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="sil-sifre">Şifren</label>
        {h.sifre && <p className="hata-metni">{h.sifre}</p>}
        <input id="sil-sifre" name="sifre" type="password" className="girdi" autoComplete="current-password" />
      </div>
      <div className={h.onay ? 'alan alan--hata' : 'alan'} id="sil-onay">
        {h.onay && <p className="hata-metni">{h.onay}</p>}
        <label className="secenek">
          <input type="checkbox" name="onay" /> <span>Silinen bilgilerin geri getirilemeyeceğini okudum.</span>
        </label>
      </div>
      <GonderDugmesi className="dugme dugme--tehlike" bekleme="Hesap siliniyor…">
        Hesabımı kalıcı olarak sil
      </GonderDugmesi>
    </form>
  )
}
