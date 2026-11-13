'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { girisEylemi } from '@/eylemler/hesap'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function GirisFormu({ firma, donus }: { firma: boolean; donus?: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(girisEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} />
      {donus && <input type="hidden" name="donus" value={donus} />}
      <Alan id="eposta" etiket="E-posta" type="email" autoComplete="email" inputMode="email" required defaultValue={durum.degerler?.eposta} hata={h.eposta} />
      <Alan id="sifre" etiket="Şifre" type="password" autoComplete="current-password" required hata={h.sifre}>
        <Link className="kucuk" href="/sifremi-unuttum">
          Şifremi unuttum
        </Link>
      </Alan>
      <GonderDugmesi bekleme="Giriş yapılıyor…">{firma ? 'Devam et' : 'Giriş yap'}</GonderDugmesi>
    </form>
  )
}
