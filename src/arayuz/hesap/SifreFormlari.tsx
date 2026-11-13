'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { sifreSifirlamaEylemi, sifreYenileEylemi } from '@/eylemler/hesap'
import { SIFRE_KURALLARI } from '@/servisler/hesapKurallari'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function SifreSifirlamaFormu() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(sifreSifirlamaEylemi, {})
  if (durum.tamam)
    return (
      <div className="form-yigin" role="status">
        <h1 className="b2">E-postanı kontrol et</h1>
        <p>
          <strong>{durum.tamam}</strong> adresiyle bir hesap varsa şifre yenileme bağlantısı gönderdik. Bağlantı 1 saat geçerlidir.
        </p>
        <Link href="/giris">Giriş sayfasına dön</Link>
      </div>
    )
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <h1 className="b2">Şifremi unuttum</h1>
      <p>Hesabının e-posta adresini yaz; şifreni yenilemen için bir bağlantı gönderelim.</p>
      <HataOzeti durum={durum} />
      <Alan id="eposta" etiket="E-posta" type="email" inputMode="email" autoComplete="email" required defaultValue={durum.degerler?.eposta} hata={durum.hatalar?.eposta} />
      <GonderDugmesi>Bağlantı gönder</GonderDugmesi>
    </form>
  )
}

export function SifreYenileFormu({ anahtar }: { anahtar: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(sifreYenileEylemi, {})
  const [sifre, setSifre] = useState('')
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <h1 className="b2">Yeni şifre belirle</h1>
      <HataOzeti durum={durum} />
      {durum.genel && (
        <p>
          <Link href="/sifremi-unuttum">Yeni bağlantı iste</Link>
        </p>
      )}
      <input type="hidden" name="anahtar" value={anahtar} />
      <Alan id="sifre" etiket="Yeni şifre" type="password" autoComplete="new-password" required hata={durum.hatalar?.sifre} value={sifre} onChange={(e) => setSifre(e.target.value)}>
        <ul className="sifre-kurallari kucuk" aria-label="Şifre kuralları">
          {SIFRE_KURALLARI.map((k) => (
            <li key={k.metin} className={k.uyuyor(sifre) ? 'tamam' : undefined}>
              {k.metin}
            </li>
          ))}
        </ul>
      </Alan>
      <GonderDugmesi>Şifreyi kaydet ve giriş yap</GonderDugmesi>
    </form>
  )
}
