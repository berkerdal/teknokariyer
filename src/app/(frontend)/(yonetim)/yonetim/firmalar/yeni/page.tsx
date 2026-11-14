import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { FirmaKaydiFormu } from '@/arayuz/yonetim/Firmalar'
import { sektorSecenekleri } from '@/veri/firmaYonetimi'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Yeni firma kaydı · Yönetim' }

export default async function YeniFirma() {
  const k = await yonetimOturumu('/yonetim/firmalar/yeni')
  if (!yoneticiMi(k)) redirect('/yonetim/firmalar')
  const sektorler = await sektorSecenekleri()
  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/firmalar">
            <Ikon ad="geri" kucuk /> Firmalar
          </Link>
          <h1 className="b1">Yeni firma kaydı</h1>
        </div>
      </div>
      <ModulBilgisi kimlik="yonetim-firma-yeni" baslik="İskelet kayıt nedir?">
        <p>
          İskelet kayıt, firmanın portaldaki ilk hâlidir. Siz firmanın unvanını, Teknokent’teki yerini ve yetkilisini girersiniz; firma daveti kabul edince
          profilini kendisi tamamlar. Kayıt açılınca firma herkese açık sayfalarda görünmez; profil tamamlanınca görünür.
        </p>
        <p>Kaydı oluşturduktan sonra firma sayfasından yetkiliye davet gönderebilirsiniz.</p>
      </ModulBilgisi>
      <section className="panel panel-ic">
        <FirmaKaydiFormu sektorler={sektorler} yonetici />
      </section>
    </>
  )
}
