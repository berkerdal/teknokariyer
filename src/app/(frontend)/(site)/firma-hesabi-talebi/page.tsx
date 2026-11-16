import type { Metadata } from 'next'
import { dilAdresleri } from '@/alan/dil'
import { insanDogrulamaSiteAnahtari } from '@/altyapi/insanDogrulama'
import { HesapTalebiFormu } from '@/arayuz/hesap/HesapTalebiFormu'
import { Ust } from '@/arayuz/Ust'

export const metadata: Metadata = {
  title: 'Firma hesabı talebi',
  description: 'Pamukkale Teknokent firmaları için TeknoKariyer firma hesabı talep formu.',
  alternates: dilAdresleri('/firma-hesabi-talebi'),
}

/** Daveti gelmemiş Teknokent firmasının hesap talebi (talimatlar 3 ve 10). */
export default function FirmaHesabiTalebiSayfasi() {
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <HesapTalebiFormu insan={insanDogrulamaSiteAnahtari()} />
        </div>
        <aside className="giris-yan" aria-label="Nasıl işler?">
          <p className="ust-etiket">Nasıl işler?</p>
          <ul className="madde">
            <li>TeknoKariyer’de yalnızca Pamukkale Teknokent firmaları ilan verir; firma hesapları davetle açılır.</li>
            <li>Yönetici A.Ş. talebinizi firmanızın Teknokent kaydıyla karşılaştırır ve size e-postayla davet gönderir.</li>
            <li>Davetteki bağlantıyla şifrenizi belirler, firma profilinizi tamamlar ve ilan vermeye başlarsınız.</li>
          </ul>
        </aside>
      </main>
    </>
  )
}
