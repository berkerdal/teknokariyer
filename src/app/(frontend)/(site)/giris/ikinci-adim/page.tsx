import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IkinciAdimFormu, KoduYenidenGonder } from '@/arayuz/hesap/IkiAdimFormlari'
import { Ust } from '@/arayuz/Ust'
import { KURUM } from '@/altyapi/kurum'
import { bekleyenGirisAc, guvenlikAyarlariniAl } from '@/servisler/ikiAdim'
import { payloadAl } from '@/veri/payload'
import { bekleyenGirisCerezi } from '@/veri/cerez'

export const metadata: Metadata = { title: 'Giriş doğrulaması', robots: { index: false } }

/** Yeni cihazdan girişte ikinci adım (K33): e-posta kodu veya doğrulayıcı uygulama kodu. */
export default async function IkinciAdimSayfasi() {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect('/giris?ikinci=sure')
  const siz = g.rol !== 'aday'
  const eposta = g.yontem === 'eposta'
  const { epostaKoduDakika: EPOSTA_KODU_DAKIKA, cihazGun } = await guvenlikAyarlariniAl(await payloadAl())
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <h1 className="b2">{eposta ? (siz ? 'E-postanızı kontrol edin' : 'E-postanı kontrol et') : 'Doğrulama kodu'}</h1>
          {eposta ? (
            <p>
              {siz
                ? g.oncekiKod
                  ? `Bu cihazdan ilk kez giriş yapıyorsunuz. ${g.adres} adresine az önce gönderdiğimiz kod hâlâ geçerli; o kodu yazın.`
                  : `Bu cihazdan ilk kez giriş yapıyorsunuz. ${g.adres} adresine 6 haneli bir kod gönderdik. Kod ${EPOSTA_KODU_DAKIKA} dakika geçerlidir.`
                : g.oncekiKod
                  ? `Bu cihazdan ilk kez giriş yapıyorsun. ${g.adres} adresine az önce gönderdiğimiz kod hâlâ geçerli; o kodu yaz.`
                  : `Bu cihazdan ilk kez giriş yapıyorsun. ${g.adres} adresine 6 haneli bir kod gönderdik. Kod ${EPOSTA_KODU_DAKIKA} dakika geçerlidir.`}
            </p>
          ) : (
            <p>
              {siz
                ? 'Bu cihazdan ilk kez giriş yapıyorsunuz. Telefonunuzdaki doğrulayıcı uygulamanın ürettiği kodu yazın.'
                : 'Bu cihazdan ilk kez giriş yapıyorsun. Telefonundaki doğrulayıcı uygulamanın ürettiği kodu yaz.'}
            </p>
          )}
          {eposta && g.testKodu && (
            <p className="uyari-kutu" role="note">
              <strong>Test ortamı:</strong> E-postalar dışarı gönderilmediği için kod burada gösteriliyor: <strong className="test-kodu">{g.testKodu}</strong>
            </p>
          )}
          <IkinciAdimFormu siz={siz} yontem={g.yontem} cihazGun={cihazGun} />
          {eposta && <KoduYenidenGonder />}
          <p className="kucuk ikincil">
            {g.yontem === 'uygulama'
              ? g.rol === 'firma'
                ? 'Telefonunuzu ve kurtarma kodlarınızı kaybettiyseniz firmanızın tam yetkilisinden veya Yönetici A.Ş.’den doğrulamanızı sıfırlamasını isteyin.'
                : siz
                  ? 'Telefonunuzu ve kurtarma kodlarınızı kaybettiyseniz Yönetici A.Ş.’de tam yetkili bir kullanıcıdan doğrulamanızı sıfırlamasını isteyin.'
                  : `Telefonunu ve kurtarma kodlarını kaybettiysen kayıtlı e-posta adresinden ${KURUM.eposta} adresine yaz; doğrulamanı sıfırlarız.`
              : siz
                ? 'Bu adım, şifreniz başkasının eline geçse bile hesabınıza girilmesini önler.'
                : 'Bu adım, şifren başkasının eline geçse bile hesabına girilmesini önler.'}{' '}
            <Link href="/giris">Başka bir hesapla giriş yap</Link>
          </p>
        </div>
      </main>
    </>
  )
}
