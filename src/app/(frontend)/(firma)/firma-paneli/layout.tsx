import { redirect } from 'next/navigation'
import { firmaKullanicisiMi } from '@/erisim'
import { Alt } from '@/arayuz/Alt'
import { FirmaMenusu } from '@/arayuz/firma/FirmaMenusu'
import { FirmaUst } from '@/arayuz/firma/FirmaUst'
import { rolAnaSayfasi } from '@/veri/cerez'
import { firmaIlanlari, firmaYetkisi, oturumdakiFirma } from '@/veri/firma'
import { oturum } from '@/veri/payload'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false } }

const dosyaAdresi = (x: unknown) => (x && typeof x === 'object' ? ((x as { url?: string }).url ?? null) : null)

/** Firma paneli: yalnızca firma kullanıcısı. Sayfalar oturumu ayrıca denetler (düzen ve sayfa paralel çalışır). */
export default async function FirmaPaneliDuzeni({ children }: { children: React.ReactNode }) {
  const k = await oturum()
  if (!k) redirect('/giris?firma=1&donus=%2Ffirma-paneli')
  if (!firmaKullanicisiMi(k)) redirect(rolAnaSayfasi(String(k.rol)))
  const [firma, ilanlar] = await Promise.all([oturumdakiFirma(), firmaIlanlari()])
  if (!firma) redirect('/')
  const yeni = ilanlar.reduce((n, i) => n + i.yeni, 0)
  return (
    <>
      <FirmaUst firma={{ kisaAd: firma.kisaAd, konum: firma.konum, logo: dosyaAdresi(firma.logo) }} kisi={k.ad ?? k.email} unvan={k.unvan} yetki={firmaYetkisi(k)} />
      <div className="f-masa">
        <FirmaMenusu yer="yan" yeniBasvuru={yeni} />
        <main id="icerik" className="f-icerik">
          {children}
        </main>
      </div>
      <FirmaMenusu yer="alt" yeniBasvuru={yeni} />
      <Alt />
    </>
  )
}
