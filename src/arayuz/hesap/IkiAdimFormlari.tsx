'use client'
/**
 * İki aşamalı doğrulama formları (K33). Hitap role göre: aday “sen”, firma ve kurum “siz” (K9).
 * Her sonuçta form yeniden kurulur (key={surum}); React eylemden sonra formu sıfırlar.
 */
import { useActionState, useState } from 'react'
import { CIHAZ_GUN } from '@/alan/ikiAdim'
import {
  cihazUnutEylemi,
  epostaKoduYenidenEylemi,
  hesapKurulumEylemi,
  ikiAdimKapatEylemi,
  ikiAdimSifirlaEylemi,
  ikinciAdimEylemi,
  kurtarmaYenileEylemi,
} from '@/eylemler/ikiAdim'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

const KOD_GIRDISI = { autoComplete: 'one-time-code', inputMode: 'numeric' as const, maxLength: 7, pattern: '[0-9 ]*', className: 'girdi girdi--kod' }

export function IkinciAdimFormu({ siz, yontem }: { siz: boolean; yontem: 'eposta' | 'uygulama' }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikinciAdimEylemi, {})
  const [kurtarma, setKurtarma] = useState(false)
  const hatirla = durum.degerler ? durum.degerler.hatirla === 'on' : true
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={siz} alanlar={{ kod: 'kod' }} />
      {kurtarma ? (
        <Alan
          id="kod"
          etiket="Kurtarma kodu"
          ipucu={siz ? 'Doğrulayıcı uygulamayı kurarken kaydettiğiniz kodlardan birini yazın, örneğin “abcd-efgh”. Her kod bir kez kullanılır.' : 'Doğrulayıcı uygulamayı kurarken kaydettiğin kodlardan birini yaz, örneğin “abcd-efgh”. Her kod bir kez kullanılır.'}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          hata={durum.hatalar?.kod}
          autoFocus
        />
      ) : (
        <Alan
          id="kod"
          etiket={yontem === 'eposta' ? 'E-postadaki kod' : 'Doğrulama kodu'}
          ipucu={
            yontem === 'eposta'
              ? siz
                ? '6 haneli kodu yazın. E-posta birkaç dakikada gelmezse gereksiz (spam) klasörüne bakın.'
                : '6 haneli kodu yaz. E-posta birkaç dakikada gelmezse gereksiz (spam) klasörüne bak.'
              : siz
                ? 'Doğrulayıcı uygulamada TeknoKariyer için görünen 6 haneli kodu yazın.'
                : 'Doğrulayıcı uygulamada TeknoKariyer için görünen 6 haneli kodu yaz.'
          }
          {...KOD_GIRDISI}
          hata={durum.hatalar?.kod}
          autoFocus
        />
      )}
      <label className="secenek">
        <input type="checkbox" name="hatirla" defaultChecked={hatirla} />{' '}
        <span>
          Bu cihazı {CIHAZ_GUN} gün hatırla
          <span className="ipucu">{siz ? 'Ortak kullanılan bir bilgisayardaysanız işareti kaldırın.' : 'Ortak kullanılan bir bilgisayardaysan işareti kaldır.'}</span>
        </span>
      </label>
      <GonderDugmesi bekleme="Doğrulanıyor…">Doğrula ve giriş yap</GonderDugmesi>
      {yontem === 'uygulama' && (
        <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setKurtarma(!kurtarma)}>
          {kurtarma ? 'Uygulamadaki kodu kullan' : siz ? 'Telefonunuz yanınızda değil mi? Kurtarma kodu kullanın' : 'Telefonun yanında değil mi? Kurtarma kodu kullan'}
        </button>
      )}
    </form>
  )
}

export function KoduYenidenGonder() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(epostaKoduYenidenEylemi, {})
  return (
    <form action={eylem} className="kod-yeniden">
      <GonderDugmesi className="dugme dugme--sade dugme--kucuk" bekleme="Gönderiliyor…">
        Kod gelmedi mi? Yeni kod gönder
      </GonderDugmesi>
      {durum.tamam && (
        <span className="kucuk" role="status">
          {durum.tamam}
        </span>
      )}
      {durum.genel && (
        <span className="hata-metni kucuk" role="alert">
          {durum.genel}
        </span>
      )}
    </form>
  )
}

/** Doğrulayıcı uygulama kurulumunun son adımı: uygulamadaki ilk kod. */
export function KurulumFormu({ siz }: { siz: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(hesapKurulumEylemi, {})
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={siz} alanlar={{ kod: 'kod' }} />
      <Alan
        id="kod"
        etiket="Uygulamada görünen kod"
        ipucu={siz ? 'Karekodu okuttuktan sonra uygulamada çıkan 6 haneli kodu yazın.' : 'Karekodu okuttuktan sonra uygulamada çıkan 6 haneli kodu yaz.'}
        {...KOD_GIRDISI}
        hata={durum.hatalar?.kod}
      />
      <GonderDugmesi bekleme="Doğrulanıyor…">Kurulumu tamamla</GonderDugmesi>
    </form>
  )
}

export function KurtarmaYenileFormu({ siz }: { siz: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kurtarmaYenileEylemi, {})
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={siz} alanlar={{ kod: 'yenile-kod' }} />
      <Alan id="yenile-kod" name="kod" etiket="Uygulamadaki güncel kod" {...KOD_GIRDISI} hata={durum.hatalar?.kod} />
      <GonderDugmesi className="dugme dugme--ikincil" bekleme="Oluşturuluyor…">
        Yeni kurtarma kodları oluştur
      </GonderDugmesi>
    </form>
  )
}

export function IkiAdimKapatFormu({ siz }: { siz: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikiAdimKapatEylemi, {})
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={siz} alanlar={{ kod: 'kapat-kod' }} />
      <Alan id="kapat-kod" name="kod" etiket="Uygulamadaki güncel kod" {...KOD_GIRDISI} hata={durum.hatalar?.kod} />
      <GonderDugmesi className="dugme dugme--tehlike" bekleme="Kaldırılıyor…">
        Doğrulayıcı uygulamayı kaldır
      </GonderDugmesi>
    </form>
  )
}

/** Tek cihazı veya (cihaz verilmezse) hepsini unutur. */
export function CihazUnutDugmesi({ cihaz, metin }: { cihaz?: string; metin: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(cihazUnutEylemi, {})
  return (
    <form action={eylem} className="satir-ici">
      {cihaz && <input type="hidden" name="cihaz" value={cihaz} />}
      <GonderDugmesi className="dugme dugme--sade dugme--kucuk" bekleme="…">
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

/** Telefonunu kaybeden veya şüpheli giriş gören kişi için sıfırlama (Yönetici A.Ş. veya firmanın tam yetkilisi). */
export function IkiAdimSifirlaDugmesi({ kullaniciId, ad, geri }: { kullaniciId: number; ad: string; geri: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikiAdimSifirlaEylemi, {})
  const [acik, setAcik] = useState(false)
  if (!acik)
    return (
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setAcik(true)}>
        Doğrulamayı sıfırla
      </button>
    )
  return (
    <form action={eylem} className="satir-ici iki-adim-sifirla">
      <input type="hidden" name="kullanici" value={kullaniciId} />
      <input type="hidden" name="geri" value={geri} />
      <span className="kucuk">
        {ad} adlı kişinin doğrulayıcı uygulaması kaldırılır ve tanınan cihazları unutulur; bir sonraki girişte e-postasına kod gider. Kişinin kimliğinden emin
        olun; telefonla arayıp doğrulayın.
      </span>
      <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="…">
        Sıfırla
      </GonderDugmesi>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setAcik(false)}>
        Vazgeç
      </button>
      {durum.genel && (
        <span className="hata-metni kucuk" role="alert">
          {durum.genel}
        </span>
      )}
    </form>
  )
}
