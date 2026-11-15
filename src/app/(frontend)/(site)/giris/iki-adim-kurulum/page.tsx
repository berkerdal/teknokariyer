import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { KurulumAdimlari } from '@/arayuz/hesap/KurulumAdimlari'
import { Ust } from '@/arayuz/Ust'
import { BEKLEYEN_DAKIKA, bekleyenGirisAc, kurulumBilgisi } from '@/servisler/ikiAdim'
import { bekleyenGirisCerezi } from '@/veri/cerez'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'İki aşamalı doğrulamayı kurun', robots: { index: false } }

/** Firma ve Yönetici A.Ş. hesaplarında ilk girişte zorunlu kurulum. Kurulmadan oturum açılmaz. */
export default async function GirisKurulumSayfasi() {
  const g = await bekleyenGirisAc(await bekleyenGirisCerezi())
  if (!g) redirect('/giris?ikinci=sure')
  const { gizli, adres } = await kurulumBilgisi(await payloadAl(), g.kullaniciId).catch(() => redirect('/giris/ikinci-adim'))
  const siz = g.rol !== 'aday'
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <p className="ust-etiket">Son adım</p>
        <h1 className="b1">{siz ? 'İki aşamalı doğrulamayı kurun' : 'İki aşamalı doğrulamayı kur'}</h1>
        <p>
          {siz
            ? 'Firma ve Yönetici A.Ş. hesaplarında, şifrenize ek olarak telefonunuzdaki bir uygulamanın ürettiği kod istenir. Böylece şifreniz başkasının eline geçse bile hesabınıza girilemez. Kurulum bir kez yapılır ve birkaç dakika sürer.'
            : 'Şifrene ek olarak telefonundaki bir uygulamanın ürettiği kod istenir. Kurulum bir kez yapılır.'}
        </p>
        <p className="kucuk ikincil">
          {siz ? `Bu sayfa güvenliğiniz için ${BEKLEYEN_DAKIKA} dakika açık kalır; süre dolarsa yeniden giriş yapmanız gerekir.` : `Bu sayfa ${BEKLEYEN_DAKIKA} dakika açık kalır.`}
        </p>
        <KurulumAdimlari gizli={gizli} adres={adres} siz={siz} yer="giris" />
      </main>
    </>
  )
}
