import type { Metadata } from 'next'
import Link from 'next/link'
import { SIKAYET_NEDENI, SIKAYET_SONUCU, type SikayetNedeni, type SikayetSonucu } from '@/alan/sikayet'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { SikayetKarari } from '@/arayuz/yonetim/SikayetKarari'
import { moderasyonYapabilirMi } from '@/erisim'
import { sikayetKuyrugu, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'İlan bildirimleri · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; ilan?: string; bildirim?: string; firmaya?: string }> }

/** Adayların ilan bildirimleri (şikâyet), ilan başına toplanmış. Bildirenin kimliği gösterilmez. */
export default async function Sikayetler({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/sikayetler')
  const [liste, sp] = await Promise.all([sikayetKuyrugu(), searchParams])
  const karar = moderasyonYapabilirMi(k)
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">İlan bildirimleri</h1>
          <p className="ikincil">{liste.length ? `${liste.length} ilan için bildirim sonuç bekliyor. En eski bildirim en üstte.` : 'Sonuç bekleyen bildirim yok.'}</p>
        </div>
      </div>
      {sp.sonuc && (
        <div role="status">
          <p className="basari-kutu">
            “{sp.ilan}” için {sp.bildirim} bildirim sonuçlandı: {SIKAYET_SONUCU[sp.sonuc as SikayetSonucu]?.ad ?? ''}. Bildirenlere sonuç e-postayla gönderildi.
          </p>
          {sp.sonuc !== 'yersiz' && sp.firmaya === '0' && <p className="uyari-kutu">Firmanın ilanlarla ilgilenen etkin kullanıcısı olmadığı için firmaya e-posta gitmedi. Firmaya telefonla ulaşın.</p>}
        </div>
      )}
      <ModulBilgisi kimlik="yonetim-sikayetler" baslik="İlan bildirimleri nedir?">
        <p>Adaylar, ilan sayfasındaki “Bildir” bağlantısıyla sahte, ayrımcı, ücret isteyen veya yanıltıcı ilanları size bildirir.</p>
        <ul>
          <li>Aynı ilanın bildirimleri tek kartta toplanır; kararınız hepsine birlikte uygulanır.</li>
          <li>“Firma uyarıldı” ilanı yayında bırakır ve firmaya mesajınızı gönderir. “İlan yayından kaldırıldı” ilanı kapatır; adaylar başvuramaz.</li>
          <li>Bildirenlere sonuç kısaca bildirilir. Bildirenlerin kimliği firmaya hiçbir zaman gösterilmez.</li>
          <li>Bir aday günde en fazla 5 ilan bildirebilir; aynı ilanı ikinci kez bildiremez.</li>
        </ul>
      </ModulBilgisi>
      {liste.map((g) => (
        <section key={g.ilan.id} className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">
              <Link href={ilanAdresi(g.ilan)} target="_blank">
                {g.ilan.pozisyonAdi}
              </Link>{' '}
              <span className="kucuk ikincil">· {g.ilan.firma}</span>
            </h2>
            <span className="kucuk ikincil">
              {g.bildirimler.length} bildirim · ilki {g.bekleme} önce
            </span>
          </header>
          <div className="panel-ic">
            <ul className="y-sikayetler">
              {g.bildirimler.map((b) => (
                <li key={b.id}>
                  <strong>{SIKAYET_NEDENI[b.neden as SikayetNedeni]?.ad ?? b.neden}</strong>
                  <span className="kucuk ikincil"> · {tarihYaz(b.tarih, true)}</span>
                  {b.aciklama && <p className="kucuk">{b.aciklama}</p>}
                </li>
              ))}
            </ul>
            {g.ilan.durum !== 'yayinda' && <p className="uyari-kutu kucuk">İlan şu an yayında değil (durumu değişmiş). Karar yine de kaydedilir ve bildirenlere iletilir.</p>}
            {karar ? <SikayetKarari ilanId={g.ilan.id} pozisyon={g.ilan.pozisyonAdi} /> : <p className="kucuk ikincil">Karar vermek için moderasyon yetkisi gerekir.</p>}
          </div>
        </section>
      ))}
    </>
  )
}
