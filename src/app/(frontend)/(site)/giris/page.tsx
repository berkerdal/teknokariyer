import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GirisFormu } from '@/arayuz/hesap/GirisFormu'
import { Ust } from '@/arayuz/Ust'
import { guvenliDonus, rolAnaSayfasi } from '@/veri/cerez'
import { oturum } from '@/veri/payload'

export const metadata: Metadata = { title: 'Giriş', robots: { index: false } }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

/** Aday ve firma girişi aynı yerde, ayrı sekmede. Firma hesabı kendi kendine açılmaz (Yönetici A.Ş. davet eder). */
export default async function GirisSayfasi({ searchParams }: Props) {
  const p = await searchParams
  const firma = p.firma === '1'
  const donus = p.donus ? guvenliDonus(p.donus, '') : undefined
  const k = await oturum()
  if (k) redirect(donus || rolAnaSayfasi(String(k.rol)))
  return (
    <>
      <Ust />
      <main id="icerik" className="giris-ekran">
        <div className="giris-kutu">
          <div className="sekmeler" role="tablist" aria-label="Hesap türü">
            <Link className="sekme" role="tab" href={`/giris${donus ? `?donus=${encodeURIComponent(donus)}` : ''}`} aria-selected={!firma}>
              Aday
            </Link>
            <Link className="sekme" role="tab" href="/giris?firma=1" aria-selected={firma}>
              Firma
            </Link>
          </div>
          <h1 className="b2">{firma ? 'Firma girişi' : 'Giriş yap'}</h1>
          {p.dogrulandi === '1' && (
            <div className="basari-kutu" role="status">
              E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.
            </div>
          )}
          {firma && (
            <p className="kucuk ikincil">
              Firma hesapları Yönetici A.Ş. davetiyle açılır. Davet e-postanızdaki bağlantıyla hesabınızı devralabilirsiniz.
            </p>
          )}
          <GirisFormu firma={firma} donus={donus} />
          {firma ? (
            <p className="kucuk">
              Firmanız için hesap yoksa Yönetici A.Ş. ile iletişime geçin: <a href="mailto:info@pauteknokent.com.tr">info@pauteknokent.com.tr</a>
            </p>
          ) : (
            <p>
              Hesabın yok mu? <Link href="/kayit">Hesap aç</Link>
            </p>
          )}
        </div>
        <aside className="giris-yan giris-yan--masa">
          <p className="ust-etiket">{firma ? 'Firma hesabıyla' : 'Neden hesap?'}</p>
          {firma ? (
            <ul className="madde">
              <li>İlanlarınızı verir, düzenler, duraklatır ve kapatırsınız.</li>
              <li>Başvuruları ekibinizle birlikte değerlendirirsiniz.</li>
              <li>CV havuzunda aday ararsınız.</li>
            </ul>
          ) : (
            <ul className="madde">
              <li>Profilini bir kez doldurursun, her başvuruda kullanılır.</li>
              <li>Başvurularının durumunu tek yerden izlersin.</li>
              <li>İstersen CV havuzuna katılırsın; Teknokent firmaları seni bulabilir.</li>
            </ul>
          )}
        </aside>
      </main>
    </>
  )
}
