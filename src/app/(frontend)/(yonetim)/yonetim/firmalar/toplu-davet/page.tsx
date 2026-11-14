import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { TopluDavetFormu } from '@/arayuz/yonetim/Firmalar'
import { moderasyonYapabilirMi } from '@/erisim'
import { kurulumOzeti } from '@/veri/firmaYonetimi'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Toplu davet · Yönetim' }

export default async function TopluDavet() {
  const k = await yonetimOturumu('/yonetim/firmalar/toplu-davet')
  const ozet = await kurulumOzeti()
  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/firmalar">
            <Ikon ad="geri" kucuk /> Firmalar
          </Link>
          <h1 className="b1">Toplu davet</h1>
          <p className="ikincil">{ozet.davetHazir.length} iskelet firma davete hazır.</p>
        </div>
      </div>
      <ModulBilgisi kimlik="yonetim-toplu-davet" baslik="Toplu davet nasıl çalışır?">
        <p>Listede yalnızca iskelet aşamasındaki ve yetkilisinin adı ile kişisel iş e-postası girilmiş firmalar görünür.</p>
        <ul>
          <li>Seçtiğiniz her firmanın yetkilisine kişiye özel, 14 gün geçerli bir davet e-postası gider. Kabul eden kişi firmanın tam yetkili kullanıcısı olur.</li>
          <li>Davet gönderilen firma “Davet gönderildi” aşamasına geçer ve bu listeden çıkar.</li>
          <li>Gönderilemeyen firma olursa nedeni sonuçta yazar; diğer davetler etkilenmez.</li>
          <li>
            Yetkilisi eksik {ozet.yetkiliEksik.length} firma bu listede yok. Önce{' '}
            <Link href="/yonetim/firmalar?asama=iskelet#liste">firma kayıtlarını</Link> tamamlayın.
          </li>
        </ul>
      </ModulBilgisi>
      <section className="panel panel-ic">
        {moderasyonYapabilirMi(k) ? (
          <TopluDavetFormu firmalar={ozet.davetHazir.map((f) => ({ id: f.id, kisaAd: f.kisaAd, konum: f.konum }))} />
        ) : (
          <p className="ikincil">Rolünüz davet göndermeye izin vermiyor.</p>
        )}
      </section>
    </>
  )
}
