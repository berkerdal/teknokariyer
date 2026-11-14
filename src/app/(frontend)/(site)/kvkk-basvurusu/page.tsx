import type { Metadata } from 'next'
import Link from 'next/link'
import { Ust } from '@/arayuz/Ust'
import { KURUM } from '@/altyapi/kurum'

export const metadata: Metadata = {
  title: 'KVKK başvurusu',
  description: 'TeknoKariyer’de işlenen kişisel verilerinizle ilgili haklarınızı nasıl kullanabileceğiniz.',
}

/**
 * İlgili kişi başvurusunun yolları (KVKK m. 11, 13; Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ).
 * Metin hukuk birimi onayına kadar taslaktır.
 */
export default function KvkkBasvurusuSayfasi() {
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <h1 className="b1">KVKK başvurusu</h1>
        <div className="uyari-kutu" role="note">
          Bu metin taslaktır. Kurumun KVKK sorumlusu ve hukuk birimi onayladığında son hâlini alacak.
        </div>
        <p>
          TeknoKariyer’de kişisel verileriniz {KURUM.unvan} tarafından işlenir. Kişisel Verilerin Korunması Kanunu’nun 11. maddesine göre verilerinizin işlenip
          işlenmediğini öğrenebilir, bilgi isteyebilir, düzeltilmesini veya silinmesini talep edebilirsiniz.
        </p>
        <h2 className="b3">Nasıl başvurabilirsiniz?</h2>
        <ul>
          <li>
            <strong>TeknoKariyer hesabınız varsa:</strong> Hesabınıza giriş yapıp <Link href="/hesabim/hesap#kvkk">Hesap ve gizlilik</Link> sayfasındaki formu
            kullanın. Giriş yaptığınız için ayrıca kimlik belgesi istenmez. Verilerinizin bir kopyasını aynı sayfadan hemen indirebilir, hesabınızı da aynı
            sayfadan silebilirsiniz.
          </li>
          <li>
            <strong>E-postayla:</strong> Portalda kayıtlı e-posta adresinizden <a href={`mailto:${KURUM.kvkkEposta}`}>{KURUM.kvkkEposta}</a> adresine yazın.
            Portalda kayıtlı adresiniz yoksa kimliğinizi doğrulamamız için sizden ek bilgi isteyebiliriz.
          </li>
          <li>
            <strong>Yazılı olarak:</strong> Islak imzalı dilekçenizi kimlik belgenizin bir örneğiyle {KURUM.adres} adresine elden teslim edin veya postayla
            gönderin.
          </li>
        </ul>
        <h2 className="b3">Başvurunuzda neler yer almalı?</h2>
        <p>Adınız ve soyadınız, cevabın gönderileceği adres ve ne istediğiniz. Talebiniz bir bilginin düzeltilmesiyse doğru bilgiyi de yazın.</p>
        <h2 className="b3">Ne zaman cevap alırsınız?</h2>
        <p>
          Başvurunuz, bize ulaştığı günden başlayarak en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Talebinizi kabul etmezsek gerekçesini yazarız. Cevabı
          yeterli bulmazsanız Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsiniz.
        </p>
      </main>
    </>
  )
}
