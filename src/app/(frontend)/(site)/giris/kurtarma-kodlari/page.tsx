import type { Metadata } from 'next'
import Link from 'next/link'
import { Ust } from '@/arayuz/Ust'
import { YazdirDugmesi } from '@/arayuz/yonetim/Raporlar'
import { kurtarmaKaydedildiEylemi } from '@/eylemler/ikiAdim'
import { kurtarmaAc } from '@/servisler/ikiAdim'
import { kurtarmaCerezi } from '@/veri/cerez'
import { oturum } from '@/veri/payload'

export const metadata: Metadata = { title: 'Kurtarma kodları', robots: { index: false } }

/** Yeni kurtarma kodları bir kez gösterilir; “kaydettim” deyince gösterim çerezi silinir. */
export default async function KurtarmaKodlariSayfasi() {
  const v = await kurtarmaAc(await kurtarmaCerezi())
  const k = await oturum()
  const siz = k?.rol !== 'aday'
  if (!v)
    return (
      <>
        <Ust />
        <main id="icerik" className="sayfa-dar">
          <h1 className="b1">Kurtarma kodları</h1>
          <p>{siz ? 'Gösterilecek kod yok. Kodlar yalnızca oluşturulduklarında bir kez gösterilir.' : 'Gösterilecek kod yok. Kodlar yalnızca oluşturuldukları anda bir kez gösterilir.'}</p>
          <Link className="dugme" href="/hesap-guvenligi">
            Hesap güvenliği
          </Link>
        </main>
      </>
    )
  const metin = `TeknoKariyer kurtarma kodları\nOluşturma: ${new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })}\nHer kod bir kez kullanılır.\n\n${v.kodlar.join('\n')}\n`
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <p className="ust-etiket">İki aşamalı doğrulama</p>
        <h1 className="b1">{siz ? 'Kurtarma kodlarınızı saklayın' : 'Kurtarma kodlarını sakla'}</h1>
        <p>
          {siz
            ? 'Telefonunuz yanınızda değilken veya telefonunuzu kaybettiğinizde bu kodlardan biriyle giriş yapabilirsiniz. Her kod bir kez kullanılır. Kodları yazdırın veya parola yöneticinize kaydedin; bu sayfadan ayrıldıktan sonra yeniden gösterilmez.'
            : 'Telefonun yanında değilken bu kodlardan biriyle giriş yapabilirsin. Her kod bir kez kullanılır. Kodları yazdır veya güvenli bir yere kaydet; bu sayfadan ayrıldıktan sonra yeniden gösterilmez.'}
        </p>
        <ul className="kurtarma-kodlari" aria-label="Kurtarma kodları">
          {v.kodlar.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div className="dugme-grubu rapor-eylemler">
          <a className="dugme dugme--ikincil" href={`data:text/plain;charset=utf-8,${encodeURIComponent(metin)}`} download="teknokariyer-kurtarma-kodlari.txt">
            Metin dosyası olarak indir
          </a>
          <YazdirDugmesi />
        </div>
        <form action={kurtarmaKaydedildiEylemi} className="rapor-eylemler">
          <button type="submit" className="dugme">
            Kodları kaydettim, devam et
          </button>
        </form>
      </main>
    </>
  )
}
