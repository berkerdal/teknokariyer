import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { IceAktarma } from '@/arayuz/yonetim/IceAktarma'
import { firmaSatirlari, sektorSecenekleri } from '@/veri/firmaYonetimi'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Rehberden içe aktar · Yönetim' }

export default async function IceAktar() {
  const k = await yonetimOturumu('/yonetim/firmalar/ice-aktar')
  if (!yoneticiMi(k)) redirect('/yonetim/firmalar')
  const [firmalar, sektorler] = await Promise.all([firmaSatirlari(), sektorSecenekleri()])
  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/firmalar">
            <Ikon ad="geri" kucuk /> Firmalar
          </Link>
          <h1 className="b1">Rehberden içe aktar</h1>
          <p className="ikincil">Teknokent firma rehberindeki firmaları tek seferde iskelet kayıt olarak açın.</p>
        </div>
        <a className="dugme dugme--ikincil dugme--kucuk" href="/yonetim/firmalar/ice-aktar/sablon" download>
          <Ikon ad="indir" kucuk /> Şablonu indir
        </a>
      </div>
      <ModulBilgisi kimlik="yonetim-ice-aktar" baslik="İçe aktarma nasıl yapılır?">
        <ol className="y-adimlar">
          <li>
            <strong>Şablonu indirin</strong> ve rehberdeki firmaları Excel’de şablonun sütunlarına yapıştırın. Zorunlu sütunlar: Unvan ve Blok/oda. Kısa
            ad boşsa unvandan türetilir.
          </li>
          <li>
            Dosyayı Excel’de <strong>“Farklı kaydet → CSV UTF-8 (virgülle ayrılmış)”</strong> seçeneğiyle kaydedin.
          </li>
          <li>
            <strong>Dosyayı yükleyin.</strong> Dosya henüz kaydedilmez; önce her satırın durumu gösterilir: yeni, zaten kayıtlı, dosyada tekrar veya eksik
            bilgi.
          </li>
          <li>
            Uyarıları okuyun. Genel e-postalar (info@), eksik yetkili adı ve şirket türü yazmayan unvanlar (şahıs firması olabilir, kişi adı içerebilir)
            işaretlenir. Bu satırlar aktarılabilir; davetten önce firma sayfasında tamamlanır.
          </li>
          <li>
            <strong>Seçilen satırları aktarın.</strong> Firmalar “İskelet” aşamasında açılır; e-posta gönderilmez. Davetleri sonra “Toplu davet”
            sayfasından gönderirsiniz.
          </li>
        </ol>
        <p>Dosyadaki e-posta adresleri yalnızca veritabanına yazılır; yetkililere bu aşamada hiçbir e-posta gitmez.</p>
      </ModulBilgisi>
      <section className="panel panel-ic">
        <IceAktarma mevcut={firmalar.map((f) => ({ unvan: f.unvan, kisaAd: f.kisaAd }))} sektorler={sektorler.map((s) => s.ad)} />
      </section>
    </>
  )
}
