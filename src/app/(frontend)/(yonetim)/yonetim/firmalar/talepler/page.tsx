import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { tarihYaz } from '@/arayuz/bicim'
import { HesapTalebiKarari } from '@/arayuz/yonetim/HesapTalebiKarari'
import { moderasyonYapabilirMi } from '@/erisim'
import { hesapTalepKuyrugu, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Firma hesap talepleri · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; firma?: string; eposta?: string }> }

/** Herkese açık formdan gelen firma hesap talepleri (talimatlar 10). */
export default async function HesapTalepleri({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/firmalar/talepler')
  const [{ talepler, firmalar }, sp] = await Promise.all([hesapTalepKuyrugu(), searchParams])
  const karar = moderasyonYapabilirMi(k)
  return (
    <>
      <div className="y-bas">
        <div>
          <p className="kucuk">
            <Link href="/yonetim/firmalar">Firmalar ve kurulum</Link>
          </p>
          <h1 className="b1">Firma hesap talepleri</h1>
          <p className="ikincil">{talepler.length ? `${talepler.length} talep sonuç bekliyor. En eski talep en üstte.` : 'Sonuç bekleyen talep yok.'}</p>
        </div>
      </div>
      {sp.sonuc === 'davet' && (
        <p className="basari-kutu" role="status">
          {sp.firma} için talep edene tam yetkili daveti gönderildi. Davet 14 gün geçerlidir; davetler firma kaydında görünür.
        </p>
      )}
      {sp.sonuc === 'red' && (
        <p className={sp.eposta === '0' ? 'uyari-kutu' : 'basari-kutu'} role="status">
          {sp.eposta === '0' ? 'Talep reddedildi ancak talep edene e-posta gönderilemedi.' : 'Talep reddedildi; gerekçe talep edene e-postayla gönderildi.'}
        </p>
      )}
      <ModulBilgisi kimlik="yonetim-hesap-talepleri" baslik="Firma hesap talepleri nedir?">
        <p>Daveti gelmemiş Teknokent firmaları, portalın “Firma hesabı talebi” formundan hesap ister. Talep burada sonucunu bekler.</p>
        <ul>
          <li>Talebi Teknokent kaydındaki firmayla eşleştirin. Adı benzeyen firmalar seçim listesinin başında gelir.</li>
          <li>“Davet gönder” dediğinizde talep eden kişiye tam yetkili daveti gider; firmanın yetkili bilgisi boşsa talepten doldurulur.</li>
          <li>Firma Teknokent’te değilse veya talep şüpheliyse gerekçesiyle reddedin; gerekçe talep edene e-postayla gider.</li>
        </ul>
      </ModulBilgisi>
      {talepler.map((t) => (
        <section key={t.id} id={`ht-${t.id}`} className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">{t.firmaAdi}</h2>
            <span className="kucuk ikincil">{t.bekleme} önce</span>
          </header>
          <div className="panel-ic">
            <dl className="ozet-dl">
              <div>
                <dt>Talep eden</dt>
                <dd>
                  {t.yetkiliAd}
                  {t.unvan ? `, ${t.unvan}` : ''}
                </dd>
              </div>
              <div>
                <dt>E-posta</dt>
                <dd>{t.eposta}</dd>
              </div>
              {t.telefon && (
                <div>
                  <dt>Telefon</dt>
                  <dd>{t.telefon}</dd>
                </div>
              )}
              {t.konum && (
                <div>
                  <dt>Blok ve oda</dt>
                  <dd>{t.konum}</dd>
                </div>
              )}
              <div>
                <dt>Tarih</dt>
                <dd>{tarihYaz(t.createdAt, true)}</dd>
              </div>
              {t.not && (
                <div>
                  <dt>Not</dt>
                  <dd>{t.not}</dd>
                </div>
              )}
            </dl>
            {karar ? <HesapTalebiKarari talepId={t.id} benzer={t.benzer} firmalar={firmalar} /> : <p className="kucuk ikincil">Karar vermek için moderasyon yetkisi gerekir.</p>}
          </div>
        </section>
      ))}
    </>
  )
}
