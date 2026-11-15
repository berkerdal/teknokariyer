import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { KurulumAdimlari } from '@/arayuz/hesap/KurulumAdimlari'
import { Ust } from '@/arayuz/Ust'
import { kurulumBilgisi } from '@/servisler/ikiAdim'
import { oturum, payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Doğrulayıcı uygulama', robots: { index: false } }

/** Oturum açıkken kurulum (adayın isteğe bağlı olarak açması). Zaten kuruluysa güvenlik sayfasına döner. */
export default async function HesapKurulumSayfasi() {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi%2Fkur')
  const { gizli, adres } = await kurulumBilgisi(await payloadAl(), Number(k.id)).catch(() => redirect('/hesap-guvenligi'))
  const siz = k.rol !== 'aday'
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <Link className="geri kucuk" href="/hesap-guvenligi">
          Hesap güvenliği
        </Link>
        <p className="ust-etiket">Önerilen</p>
        <h1 className="b1">{siz ? 'Doğrulayıcı uygulamayı kurun' : 'Doğrulayıcı uygulamayı kur'}</h1>
        <p>
          {siz
            ? 'Kurduktan sonra yeni bir cihazdan girişte e-posta yerine telefonunuzdaki uygulamanın ürettiği kod istenir. Bu yöntem e-postadan daha güvenlidir: e-posta hesabınız ele geçse bile portala girilemez.'
            : 'Kurduktan sonra yeni bir cihazdan girişte telefonundaki uygulamanın ürettiği kod istenir. Böylece şifren başkasının eline geçse bile hesabına girilemez.'}
        </p>
        <KurulumAdimlari gizli={gizli} adres={adres} siz={siz} />
      </main>
    </>
  )
}
