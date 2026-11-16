'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { hesapTalebiEylemi } from '@/eylemler/hesapTalebi'
import { Alan, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'
import { InsanDogrulama } from './InsanDogrulama'

/** Firma hesap talebi formu (herkese açık; firmalara “siz”). */
export function HesapTalebiFormu({ insan }: { insan: string | null }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(hesapTalebiEylemi, {})
  const d = durum.degerler ?? {}
  const h = durum.hatalar ?? {}
  if (durum.tamam)
    return (
      <div className="form-yigin" role="status">
        <h1 className="b2">Talebiniz alındı</h1>
        <p>
          Yönetici A.Ş. talebinizi firmanızın Pamukkale Teknokent kaydıyla karşılaştırıp <strong>{durum.tamam}</strong> adresine davet gönderecek. Bu genellikle
          1 iş günü sürer.
        </p>
        <Link href="/">Ana sayfaya dön</Link>
      </div>
    )
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <h1 className="b2">Firma hesabı talebi</h1>
      <p>Firmanız Pamukkale Teknokent’te ise ve henüz davet almadıysanız bu formu doldurun. Yönetici A.Ş. firmanızı doğrulayıp size davet gönderir.</p>
      <HataOzeti durum={durum} siz alanlar={{ insan: 'insan-dogrulama', aydinlatma: 'aydinlatma' }} />
      <Alan id="firmaAdi" etiket="Firmanın adı" autoComplete="organization" required defaultValue={d.firmaAdi} hata={h.firmaAdi} />
      <Alan id="konum" etiket="Blok ve oda" istegeBagli placeholder="Örneğin D Blok 208" defaultValue={d.konum} hata={h.konum} />
      <Alan id="yetkiliAd" etiket="Adınız ve soyadınız" autoComplete="name" required defaultValue={d.yetkiliAd} hata={h.yetkiliAd} />
      <Alan id="unvan" etiket="Göreviniz" istegeBagli placeholder="Örneğin İnsan kaynakları uzmanı" defaultValue={d.unvan} hata={h.unvan} />
      <Alan
        id="eposta"
        etiket="İş e-posta adresiniz"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        ipucu="Davet bu adrese gönderilir. Mümkünse firmanızın alan adındaki kişisel iş adresinizi yazın; info@ gibi ortak adresler yerine."
        defaultValue={d.eposta}
        hata={h.eposta}
      />
      <Alan id="telefon" etiket="Telefon" type="tel" inputMode="tel" autoComplete="tel" istegeBagli defaultValue={d.telefon} hata={h.telefon} />
      <div className={h.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="not">
          Not <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        {h.not && <p className="hata-metni">{h.not}</p>}
        <textarea id="not" name="not" className="metin-alani" rows={3} maxLength={1000} defaultValue={d.not} />
      </div>
      <div className={h.aydinlatma ? 'alan alan--hata' : 'alan'}>
        {h.aydinlatma && <p className="hata-metni">{h.aydinlatma}</p>}
        <label className="secenek">
          <input id="aydinlatma" type="checkbox" name="aydinlatma" value="1" />
          <span>
            <Link href="/metin/firma-kullanici-aydinlatma" target="_blank">
              Firma kullanıcıları için aydınlatma metnini
            </Link>{' '}
            okudum.
          </span>
        </label>
      </div>
      <InsanDogrulama site={insan} siz sifirla={durum} hata={h.insan} />
      <GonderDugmesi bekleme="Gönderiliyor…">Talebi gönder</GonderDugmesi>
    </form>
  )
}
