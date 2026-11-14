import type { Metadata } from 'next'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { TalepKarari } from '@/arayuz/yonetim/Kararlar'
import { moderasyonYapabilirMi } from '@/erisim'
import { bekleyenTalepler, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Liste talepleri · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; eklenen?: string; eposta?: string }> }

const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1)

export default async function Talepler({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/talepler')
  const [liste, sp] = await Promise.all([bekleyenTalepler(), searchParams])
  const karar = moderasyonYapabilirMi(k)
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Liste talepleri</h1>
          <p className="ikincil">{liste.length ? `${liste.length} talep sonuç bekliyor. En eski talep en üstte.` : 'Bekleyen talep yok.'}</p>
        </div>
      </div>
      {sp.sonuc && (
        <div role="status">
          <p className="basari-kutu">
            {sp.sonuc === 'onay'
              ? `Talep onaylandı. Listeye eklenenler: ${sp.eklenen || 'yok'}. Bu öğeler hemen seçilebilir.`
              : 'Talep reddedildi ve talep edene notunuz iletildi.'}
          </p>
          {sp.eposta === '0' && <p className="uyari-kutu">Karar kaydedildi ancak talep edene e-posta gönderilemedi.</p>}
        </div>
      )}
      <ModulBilgisi kimlik="yonetim-talepler" baslik="Liste talepleri nedir?">
        <p>
          Firmalar ilan yazarken, adaylar profilini doldururken seçim listelerinde (beceri, bölüm, üniversite, dil, pozisyon ailesi, sektör) aradığını
          bulamazsa buradan eklenmesini ister. Bütün talepler bu tek sayfada toplanır.
        </p>
        <ul>
          <li>Eklemek istediğiniz öğeleri işaretli bırakın ve “Seçilenleri ekle” düğmesine basın. Öğeler listeye hemen eklenir.</li>
          <li>Talep edene sonuç e-postayla bildirilir. Reddederken nedenini yazmanız gerekir.</li>
          <li>Aynı şeyin farklı yazımlarını (ör. “React.js” ve “React”) eklemeyin; filtre ve eşleştirme ortak adlara dayanır.</li>
        </ul>
      </ModulBilgisi>
      {liste.map((t) => (
        <section key={t.id} id={`t-${t.id}`} className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">
              {buyukHarf(t.turAdi)}: {t.ogeler.join(', ')}
            </h2>
            <span className="kucuk ikincil">{t.bekleme} önce</span>
          </header>
          <div className="panel-ic y-talep">
            <dl className="ozet-dl">
              <div>
                <dt>Talep eden</dt>
                <dd>
                  {t.isteyen} · {t.isteyenTuru}
                </dd>
              </div>
              {t.kaynak && (
                <div>
                  <dt>Nereden</dt>
                  <dd>{t.kaynak}</dd>
                </div>
              )}
              {t.aciklama && (
                <div>
                  <dt>Açıklama</dt>
                  <dd>{t.aciklama}</dd>
                </div>
              )}
            </dl>
            {karar && <TalepKarari talepId={t.id} ogeler={t.ogeler} />}
          </div>
        </section>
      ))}
    </>
  )
}
