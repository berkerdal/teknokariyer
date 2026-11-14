import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DURUM_ADI } from '@/alan/ilan'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { HizliIslem } from '@/arayuz/firma/IlanIslemleri'
import { IlanFormu } from '@/arayuz/firma/IlanFormu'
import { bosIlanFormu, firmaIlanlari, firmaOturumu, ilanFormuSecenekleri, ilanYonetebilirMi, oturumdakiFirma, tarihSiniri } from '@/veri/firma'

export const metadata: Metadata = { title: 'Yeni ilan · Firma paneli' }

export default async function YeniIlan({ searchParams }: { searchParams: Promise<{ kopya?: string }> }) {
  const k = await firmaOturumu('/firma-paneli/ilanlar/yeni')
  if (!ilanYonetebilirMi(k)) redirect('/firma-paneli/ilanlar')
  const [p, firma, ilanlar, secenekler, sinir] = await Promise.all([searchParams, oturumdakiFirma(), firmaIlanlari(), ilanFormuSecenekleri(), tarihSiniri()])
  if (!firma) return null

  if (p.kopya === 'sec')
    return (
      <>
        <div className="f-bas">
          <div>
            <Link className="geri kucuk" href="/firma-paneli/ilanlar">
              <Ikon ad="geri" kucuk /> İlanlar
            </Link>
            <h1 className="b1">Hangi ilandan başlayalım?</h1>
          </div>
        </div>
        <p>Seçtiğiniz ilanın kopyası taslak olarak açılır. Bütün alanlar dolu gelir; yalnızca son başvuru tarihini seçmeniz gerekir.</p>
        <ul className="secim-listesi panel kopya-listesi">
          {ilanlar.map((i) => (
            <li key={i.id}>
              <span>
                <strong>{i.pozisyonAdi}</strong> <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum]}</span>
              </span>
              <HizliIslem ilanId={i.id} islem="kopyala" ikincil>
                Bu ilandan başla<span className="gizli">: {i.pozisyonAdi}</span>
              </HizliIslem>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/firma-paneli/ilanlar/yeni">Boş bir formla başlamak istiyorum</Link>
        </p>
      </>
    )

  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href="/firma-paneli/ilanlar">
            <Ikon ad="geri" kucuk /> İlanlar
          </Link>
          <h1 className="b1">Yeni ilan</h1>
        </div>
        {ilanlar.length > 0 && (
          <Link className="dugme dugme--ikincil dugme--kucuk" href="/firma-paneli/ilanlar/yeni?kopya=sec">
            <Ikon ad="kopya" kucuk /> Önceki ilandan kopyala
          </Link>
        )}
      </div>
      <ModulBilgisi kimlik="firma-ilan-formu" baslik="İlan nasıl oluşturulur?">
        <ul>
          <li>Formu yukarıdan aşağıya doldurun. Her alanın yanındaki “?” düğmesi o alanın ne işe yaradığını açıklar.</li>
          <li>Formu yarıda bırakabilirsiniz: “Taslağı kaydet” için yalnızca pozisyon adı gerekir. Taslağı adaylar görmez.</li>
          <li>“Kaydet ve önizle” ilanı adayların göreceği hâliyle gösterir. Eksik alan varsa orada listelenir; ilanı oradan yayına gönderirsiniz.</li>
          <li>İlk ilanlarınız yayına girmeden önce Yönetici A.Ş. tarafından incelenir. Hedef onay süresi 1 iş günüdür.</li>
        </ul>
      </ModulBilgisi>
      <IlanFormu ilanId={null} durum="yeni" baslangic={bosIlanFormu(firma)} secenekler={secenekler} sinir={sinir} />
    </>
  )
}
