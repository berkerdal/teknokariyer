import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { KayitFormu } from '@/arayuz/hesap/KayitFormu'
import { Ust } from '@/arayuz/Ust'
import { tarihYaz } from '@/arayuz/bicim'
import { METINLER } from '@/metinler'
import { rolAnaSayfasi } from '@/veri/cerez'
import { oturum } from '@/veri/payload'

export const metadata: Metadata = { title: 'Hesap aç', description: 'TeknoKariyer aday hesabı aç: ad, e-posta ve şifre yeter.' }

/** Yalnızca gerekli üç bilgi. Profil bilgileri kayıtta sorulmaz. */
export default async function KayitSayfasi() {
  const k = await oturum()
  if (k) redirect(rolAnaSayfasi(String(k.rol)))
  const m = METINLER['aday-aydinlatma']
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <KayitFormu surum={m.surum} tarih={tarihYaz(m.tarih, true)} />
          <p className="kucuk">
            Hesabın var mı? <Link href="/giris">Giriş yap</Link>
          </p>
        </div>
        <aside className="giris-yan giris-yan--masa">
          <p className="ust-etiket">Sonra ne olacak?</p>
          <ul className="madde">
            <li>E-postandaki bağlantıyla adresini doğrularsın.</li>
            <li>İlk başvurunda yalnızca o ilanın gerektirdiği bilgileri sorarız.</li>
            <li>CV havuzuna katılmak isteğe bağlıdır; ayrıca sorulur.</li>
          </ul>
        </aside>
      </main>
    </>
  )
}
