import type { Metadata } from 'next'
import { VARSAYILAN_EN_UZUN_SURE_GUN, VARSAYILAN_ONAYLI_ILAN_SAYISI } from '@/alan/ilan'
import { hatirlatmaGunleri } from '@/alan/hatirlatma'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { AyarlarFormu } from '@/arayuz/yonetim/Ayarlar'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Ayarlar · Yönetim' }

export default async function Ayarlar() {
  const k = await yonetimOturumu('/yonetim/ayarlar')
  const a = await (await payloadAl()).findGlobal({ slug: 'ayarlar', overrideAccess: true })
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Ayarlar</h1>
          <p className="ikincil">Portalın kurallarını belirleyen sayılar. Değişiklik kaydedildiği anda geçerli olur ve işlem kaydına yazılır.</p>
        </div>
      </div>
      <ModulBilgisi kimlik="yonetim-ayarlar" baslik="Ayarları değiştirmeden önce">
        <p>Bu sayılar kurumun aldığı kararlara dayanır (ör. K4: ilk 3 ilan onaydan geçer). Değiştirmeden önce kararı ilgili birimle netleştirin.</p>
      </ModulBilgisi>
      <AyarlarFormu
        yonetici={yoneticiMi(k)}
        deger={{
          onayliIlanSayisi: a.onayliIlanSayisi ?? VARSAYILAN_ONAYLI_ILAN_SAYISI,
          enUzunSureGun: a.enUzunSureGun ?? VARSAYILAN_EN_UZUN_SURE_GUN,
          hatirlatmaGunleri: hatirlatmaGunleri(a.hatirlatmaGunleri),
          havuzRizaAy: a.saklama?.havuzRizaAy ?? 12,
        }}
      />
    </>
  )
}
