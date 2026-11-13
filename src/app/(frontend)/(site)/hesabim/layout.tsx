import { redirect } from 'next/navigation'
import { adayMi } from '@/erisim'
import { PanelMenusu } from '@/arayuz/aday/PanelMenusu'
import { Ust } from '@/arayuz/Ust'
import { rolAnaSayfasi } from '@/veri/cerez'
import { oturum } from '@/veri/payload'

export const dynamic = 'force-dynamic'

/** Aday paneli: yalnızca oturumdaki aday. Diğer roller kendi panellerine gider. */
export default async function AdayPaneliDuzeni({ children }: { children: React.ReactNode }) {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesabim')
  if (!adayMi(k)) redirect(rolAnaSayfasi(String(k.rol)))
  return (
    <>
      <Ust />
      <main id="icerik" className="ap">
        <PanelMenusu yer="yan" />
        <div className="ap-icerik">{children}</div>
      </main>
      <PanelMenusu yer="alt" />
    </>
  )
}
