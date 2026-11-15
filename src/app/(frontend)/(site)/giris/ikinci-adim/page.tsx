import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IkinciAdimFormu } from '@/arayuz/hesap/IkiAdimFormlari'
import { Ust } from '@/arayuz/Ust'
import { KURUM } from '@/altyapi/kurum'
import { bekleyenGirisAc } from '@/servisler/ikiAdim'
import { bekleyenGirisCerezi } from '@/veri/cerez'

export const metadata: Metadata = { title: 'Doğrulama kodu', robots: { index: false } }

/** Şifreden sonra ikinci adım. Bekleyen giriş yoksa veya süresi dolduysa girişe döner. */
export default async function IkinciAdimSayfasi() {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect('/giris?ikinci=sure')
  const siz = g.rol !== 'aday'
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <h1 className="b2">Doğrulama kodu</h1>
          <p>
            {siz
              ? 'Şifreniz doğru. Hesabınızı korumak için telefonunuzdaki doğrulayıcı uygulamanın ürettiği kodu da istiyoruz.'
              : 'Şifren doğru. Hesabını korumak için telefonundaki doğrulayıcı uygulamanın ürettiği kodu da istiyoruz.'}
          </p>
          <IkinciAdimFormu siz={siz} />
          <p className="kucuk ikincil">
            {g.rol === 'firma'
              ? 'Telefonunuzu ve kurtarma kodlarınızı kaybettiyseniz firmanızın tam yetkilisinden veya Yönetici A.Ş.’den iki aşamalı doğrulamanızı sıfırlamasını isteyin.'
              : siz
                ? 'Telefonunuzu ve kurtarma kodlarınızı kaybettiyseniz Yönetici A.Ş.’de tam yetkili bir kullanıcıdan iki aşamalı doğrulamanızı sıfırlamasını isteyin.'
                : `Telefonunu ve kurtarma kodlarını kaybettiysen kayıtlı e-posta adresinden ${KURUM.eposta} adresine yaz; doğrulamanı sıfırlarız.`}{' '}
            <Link href="/giris">Başka bir hesapla giriş yap</Link>
          </p>
        </div>
      </main>
    </>
  )
}
