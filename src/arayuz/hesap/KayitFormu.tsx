'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { kayitEylemi } from '@/eylemler/hesap'
import { SIFRE_KURALLARI } from '@/servisler/hesapKurallari'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function KayitFormu({ surum, tarih }: { surum: string; tarih: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kayitEylemi, {})
  const [sifre, setSifre] = useState('')
  const h = durum.hatalar ?? {}
  if (durum.tamam)
    return (
      <div className="form-yigin" role="status">
        <h1 className="b2">E-postanı kontrol et</h1>
        <p>
          <strong>{durum.tamam}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
        </p>
        <p className="kucuk ikincil">E-posta birkaç dakika içinde gelmezse istenmeyen e-posta klasörüne bak.</p>
        <Link className="dugme dugme--ikincil" href="/giris">
          Giriş sayfasına git
        </Link>
      </div>
    )
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <h1 className="b2">Hesap aç</h1>
      <HataOzeti durum={durum} />
      <Alan id="ad" etiket="Ad soyad" autoComplete="name" required defaultValue={durum.degerler?.ad} hata={h.ad} />
      <Alan id="eposta" etiket="E-posta" type="email" inputMode="email" autoComplete="email" required defaultValue={durum.degerler?.eposta} hata={h.eposta} />
      <Alan
        id="sifre"
        etiket="Şifre"
        type="password"
        autoComplete="new-password"
        required
        hata={h.sifre}
        value={sifre}
        onChange={(e) => setSifre(e.target.value)}
      >
        <ul className="sifre-kurallari kucuk" aria-label="Şifre kuralları">
          {SIFRE_KURALLARI.map((k) => (
            <li key={k.metin} className={k.uyuyor(sifre) ? 'tamam' : undefined}>
              {k.metin}
              <span className="gizli">{k.uyuyor(sifre) ? ': karşılandı' : ': henüz karşılanmadı'}</span>
            </li>
          ))}
        </ul>
      </Alan>
      <div className={h.aydinlatma ? 'alan alan--hata' : 'alan'}>
        {h.aydinlatma && (
          <p className="hata-metni" id="aydinlatma-hata">
            {h.aydinlatma}
          </p>
        )}
        <label className="secenek">
          <input id="aydinlatma" type="checkbox" name="aydinlatma" value="1" aria-describedby={h.aydinlatma ? 'aydinlatma-hata' : undefined} />
          <span>
            <Link href="/metin/aday-aydinlatma" target="_blank">
              Aday aydınlatma metnini
            </Link>{' '}
            okudum. <span className="ipucu">Metin sürümü {surum} · {tarih}</span>
          </span>
        </label>
      </div>
      <label className="secenek kucuk">
        <input type="checkbox" name="ticariIleti" value="1" defaultChecked={durum.degerler?.ticariIleti === '1'} />
        <span>
          Teknokent kariyer etkinlikleri ve duyurularıyla ilgili e-posta almak istiyorum. <span className="istege-bagli">(isteğe bağlı)</span>
        </span>
      </label>
      <GonderDugmesi bekleme="Hesap açılıyor…">Hesabı aç</GonderDugmesi>
      <p className="kucuk ikincil">E-posta adresini doğrulaman için bir bağlantı göndereceğiz.</p>
    </form>
  )
}
