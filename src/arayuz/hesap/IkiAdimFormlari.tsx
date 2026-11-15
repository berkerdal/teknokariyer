'use client'
/**
 * İki aşamalı doğrulama formları. Hitap role göre: aday “sen”, firma ve kurum “siz” (K9).
 * Her sonuçta form yeniden kurulur (key={surum}); React eylemden sonra formu sıfırlar.
 */
import { useActionState, useState } from 'react'
import {
  girisKurulumEylemi,
  hesapKurulumEylemi,
  ikiAdimKapatEylemi,
  ikiAdimSifirlaEylemi,
  ikinciAdimEylemi,
  kurtarmaYenileEylemi,
} from '@/eylemler/ikiAdim'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

const KOD_GIRDISI = { autoComplete: 'one-time-code', inputMode: 'numeric' as const, maxLength: 7, pattern: '[0-9 ]*', className: 'girdi girdi--kod' }

export function IkinciAdimFormu({ siz }: { siz: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikinciAdimEylemi, {})
  const [kurtarma, setKurtarma] = useState(false)
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={siz} alanlar={{ kod: 'kod' }} />
      {kurtarma ? (
        <Alan
          id="kod"
          etiket="Kurtarma kodu"
          ipucu={siz ? 'İki aşamalı doğrulamayı kurarken kaydettiğiniz kodlardan birini yazın, örneğin “abcd-efgh”. Her kod bir kez kullanılır.' : 'İki aşamalı doğrulamayı kurarken kaydettiğin kodlardan birini yaz, örneğin “abcd-efgh”. Her kod bir kez kullanılır.'}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          hata={durum.hatalar?.kod}
          autoFocus
        />
      ) : (
        <Alan
          id="kod"
          etiket="Doğrulama kodu"
          ipucu={siz ? 'Doğrulayıcı uygulamada TeknoKariyer için görünen 6 haneli kodu yazın.' : 'Doğrulayıcı uygulamada TeknoKariyer için görünen 6 haneli kodu yaz.'}
          {...KOD_GIRDISI}
          hata={durum.hatalar?.kod}
          autoFocus
        />
      )}
      <GonderDugmesi bekleme="Doğrulanıyor…">Doğrula ve giriş yap</GonderDugmesi>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setKurtarma(!kurtarma)}>
        {kurtarma ? 'Uygulamadaki kodu kullan' : siz ? 'Telefonunuz yanınızda değil mi? Kurtarma kodu kullanın' : 'Telefonun yanında değil mi? Kurtarma kodu kullan'}
      </button>
    </form>
  )
}

/** Kurulumun son adımı: uygulamadaki ilk kod. `yer`: giriş sırasında mı, oturum açıkken mi. */
export function KurulumFormu({ siz, yer }: { siz: boolean; yer: 'giris' | 'hesap' }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(yer === 'giris' ? girisKurulumEylemi : hesapKurulumEylemi, {})
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

export function IkiAdimKapatFormu() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikiAdimKapatEylemi, {})
  return (
    <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} alanlar={{ kod: 'kapat-kod' }} />
      <Alan id="kapat-kod" name="kod" etiket="Uygulamadaki güncel kod" {...KOD_GIRDISI} hata={durum.hatalar?.kod} />
      <GonderDugmesi className="dugme dugme--tehlike" bekleme="Kapatılıyor…">
        İki aşamalı doğrulamayı kapat
      </GonderDugmesi>
    </form>
  )
}

/** Telefonunu kaybeden kişi için sıfırlama (Yönetici A.Ş. veya firmanın tam yetkilisi). Onay kutusuyla açılır. */
export function IkiAdimSifirlaDugmesi({ kullaniciId, ad, geri }: { kullaniciId: number; ad: string; geri: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ikiAdimSifirlaEylemi, {})
  const [acik, setAcik] = useState(false)
  if (!acik)
    return (
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setAcik(true)}>
        İki aşamalı doğrulamayı sıfırla
      </button>
    )
  return (
    <form action={eylem} className="satir-ici iki-adim-sifirla">
      <input type="hidden" name="kullanici" value={kullaniciId} />
      <input type="hidden" name="geri" value={geri} />
      <span className="kucuk">
        {ad} bir sonraki girişte doğrulayıcı uygulamayı yeniden kuracak. Kişinin kimliğinden emin olun; telefonla arayıp doğrulayın.
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
