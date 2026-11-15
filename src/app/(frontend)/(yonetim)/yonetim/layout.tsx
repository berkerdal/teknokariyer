import Link from 'next/link'
import { redirect } from 'next/navigation'
import { kurumKullanicisiMi, teknikSorumluMu, yoneticiMi } from '@/erisim'
import { Alt } from '@/arayuz/Alt'
import { YonetimMenusu } from '@/arayuz/yonetim/YonetimMenusu'
import { hesapMenusuOgeleri } from '@/alan/hesapMenusu'
import { HesapMenusu } from '@/arayuz/HesapMenusu'
import { rolAnaSayfasi } from '@/veri/cerez'
import { oturum } from '@/veri/payload'
import { kullaniciSayilari } from '@/veri/yonetim'
import { ortam } from '@/altyapi/eposta'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false } }

const ROL_ADI: Record<string, string> = { yonetici: 'Yönetici', moderator: 'Moderatör', raporlayici: 'Raporlayıcı' }

/**
 * Yönetici A.Ş. paneli: veri yoğun, koyu çerçeve (prototip “Yönetim”). Masaüstünde yan menü, mobilde üst çubuk ve
 * kaydırılan sekmeler. Sayfalar oturumu ayrıca denetler (düzen ve sayfa paralel çalışır).
 */
export default async function YonetimDuzeni({ children }: { children: React.ReactNode }) {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fyonetim')
  if (k.pasif) redirect('/cikis?pasif=kurum')
  if (!kurumKullanicisiMi(k)) redirect(rolAnaSayfasi(String(k.rol)))
  const yonetici = yoneticiMi(k)
  const sayilar = await kullaniciSayilari(yonetici)
  const testPosta = yonetici && ortam() !== 'yayin'
  const rolAdi = `Yönetici A.Ş. · ${ROL_ADI[String(k.rol)] ?? k.rol}`
  const menu = hesapMenusuOgeleri('kurum', { yonetici })
  return (
    <>
      <header className="y-ust">
        <Link href="/yonetim" aria-label="Yönetim paneli, bugün">
          <img className="ust-logo" src="/logo/logo-kompakt-negatif.svg" alt="TeknoKariyer" width={140} height={24} />
        </Link>
        <span className="y-rol">Yönetici A.Ş.</span>
        <HesapMenusu ad={k.ad ?? k.email} altBilgi={rolAdi} ogeler={menu} tema="koyu" />
      </header>
      <YonetimMenusu yer="sekme" sayilar={sayilar} teknik={teknikSorumluMu(k)} yonetici={yonetici} testPosta={testPosta} />
      <div className="y-masa">
        <nav className="y-yan" aria-label="Yönetim menüsü">
          <div className="y-logo">
            <Link href="/yonetim" aria-label="Yönetim paneli, bugün">
              <img className="ust-logo" src="/logo/logo-kompakt-negatif.svg" alt="TeknoKariyer" width={150} height={26} />
            </Link>
            <span className="y-rol">Yönetici A.Ş.</span>
          </div>
          <YonetimMenusu yer="yan" sayilar={sayilar} teknik={teknikSorumluMu(k)} yonetici={yonetici} testPosta={testPosta} />
          <div className="y-kisi">
            <HesapMenusu ad={k.ad ?? k.email} altBilgi={rolAdi} ogeler={menu} adiGoster yon="yukari" tema="koyu" />
          </div>
        </nav>
        <main id="icerik" className="y-icerik">
          {children}
        </main>
      </div>
      <Alt />
    </>
  )
}
