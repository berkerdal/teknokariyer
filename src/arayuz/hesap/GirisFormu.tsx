'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { girisEylemi } from '@/eylemler/hesap'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'
import { InsanDogrulama } from './InsanDogrulama'

export function GirisFormu({ firma, donus, insan }: { firma: boolean; donus?: string; insan: string | null }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(girisEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} siz={firma} alanlar={{ insan: 'insan-dogrulama' }} />
      {firma && <input type="hidden" name="firma" value="1" />}
      {donus && <input type="hidden" name="donus" value={donus} />}
      <Alan id="eposta" etiket="E-posta" type="email" autoComplete="email" inputMode="email" required defaultValue={durum.degerler?.eposta} hata={h.eposta} />
      <Alan id="sifre" etiket="Şifre" type="password" autoComplete="current-password" required hata={h.sifre}>
        <Link className="kucuk" href="/sifremi-unuttum">
          Şifremi unuttum
        </Link>
      </Alan>
      <InsanDogrulama site={insan} siz={firma} sifirla={durum} hata={h.insan} />
      <GonderDugmesi bekleme="Giriş yapılıyor…">{firma ? 'Devam et' : 'Giriş yap'}</GonderDugmesi>
    </form>
  )
}
