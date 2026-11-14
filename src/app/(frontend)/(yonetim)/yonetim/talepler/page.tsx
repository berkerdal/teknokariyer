import type { Metadata } from 'next'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { TalepKarari } from '@/arayuz/yonetim/Kararlar'
import { moderasyonYapabilirMi } from '@/erisim'
import { bekleyenTalepler, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Liste talepleri · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; eklenen?: string; eklenmeyen?: string; eposta?: string }> }

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
            {sp.eklenen ? `Listeye eklendi: ${sp.eklenen}. Bu öğeler hemen seçilebilir.` : 'Listeye öğe eklenmedi.'}
            {sp.eklenmeyen ? ` Eklenmedi: ${sp.eklenmeyen}.` : ''} Sonuç talep edene bildirildi.
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
          <li>Bir talepte birden fazla öğe olabilir. Her öğe için ayrı karar verirsiniz: “Listeye ekle” veya “Ekleme”.</li>
          <li>
            Her öğenin altında listede benzer adlar varsa gösterilir. Örneğin “React.js” istenmişse ve listede “React” varsa, ikisi aynı şeydir; eklemeyin,
            talep edene listedeki adı seçmesini yazın. Bu durumda karar kendiliğinden “Ekleme” gelir ve neden metni hazır yazılır.
          </li>
          <li>Eklerken yazımı düzeltebilirsiniz. Eklemediğiniz her öğe için kısa bir neden yazmanız gerekir; talep eden bu nedeni e-postada görür.</li>
          <li>Aynı şeyin farklı yazımlarını eklemeyin; filtre ve eşleştirme ortak adlara dayanır.</li>
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
            {karar && <TalepKarari talepId={t.id} ogeler={t.ogeler} benzerler={t.benzerler} sen={t.sen} />}
          </div>
        </section>
      ))}
    </>
  )
}
