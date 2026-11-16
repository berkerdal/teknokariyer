import type { Metadata } from 'next'
import Link from 'next/link'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { tarihYaz } from '@/arayuz/bicim'
import { KaydetDugmesi } from '@/arayuz/KaydetDugmesi'
import { adayOturumu } from '@/veri/aday'
import { kaydedilenIlanlar } from '@/veri/ilanlar'
import { KayitliAramaListesi } from '@/arayuz/KayitliAramaListesi'
import { kisininAramalari } from '@/servisler/kayitliAramalar'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Kaydedilenler', robots: { index: false } }

/**
 * Kaydedilen ilanlar (talimatlar 5). Açık ilanlar üstte; başvuruya kapanmış olanlar altta, ayrı başlıkla.
 * Son başvuruya 2 gün kala bir kez hatırlatma e-postası gider. Kayıtlı aramalar da bu sayfada (alt menü kalabalıklaşmasın).
 */
export default async function KaydedilenlerSayfasi() {
  const k = await adayOturumu('/hesabim/kaydedilenler')
  const [tumu, aramalar] = await Promise.all([kaydedilenIlanlar(Number(k.id)), kisininAramalari(await payloadAl(), k, 'ilan')])
  const acik = tumu.filter((i) => i.acik)
  const kapali = tumu.filter((i) => !i.acik)
  return (
    <>
      <h1 className="b1">Kaydedilen ilanlar</h1>
      <p className="ikincil">
        Kaydettiğin ilanlar burada durur. Son başvuru tarihine 2 gün kala sana bir kez hatırlatma e-postası gönderilir; ilana başvurduysan
        hatırlatma gelmez.
      </p>
      {acik.length ? (
        <div className="ilan-listesi">
          {acik.map((i) => (
            <IlanSatiri key={i.id} ilan={i} kaydet={{ kayitli: true }} />
          ))}
        </div>
      ) : (
        <div className="bos panel">
          <p className="b3">{kapali.length ? 'Kaydettiğin açık ilan bulunmuyor.' : 'Henüz ilan kaydetmedin.'}</p>
          <p className="ikincil">İlan listesinde veya ilan sayfasında yer imi düğmesine basarak ilanları kaydedebilirsin.</p>
          <p>
            <Link className="dugme dugme--ikincil" href="/ilanlar">
              İlanlara göz at
            </Link>
          </p>
        </div>
      )}
      <section aria-labelledby="aramalar" className="kd-aramalar">
        <h2 id="aramalar" className="b3">
          Kayıtlı aramalar
        </h2>
        {aramalar.length ? (
          <KayitliAramaListesi aramalar={aramalar} sonucAdresi="/ilanlar" />
        ) : (
          <p className="ikincil">
            Henüz kayıtlı araman yok. <Link href="/ilanlar">İlanlar</Link> sayfasında filtreleri seçip “Aramayı kaydet”e basarsan uyan yeni ilanları sana
            e-postayla bildiririz.
          </p>
        )}
      </section>
      {kapali.length > 0 && (
        <section aria-labelledby="kd-kapali" className="kd-kapali">
          <h2 id="kd-kapali" className="b3">
            Başvuruya kapanan ilanlar
          </h2>
          <ul className="y-satirlar panel">
            {kapali.map((i) => (
              <li key={i.id}>
                <span>
                  <strong>{i.pozisyonAdi}</strong>
                  <br />
                  <span className="kucuk ikincil">
                    {i.firma.ad} · son başvuru {tarihYaz(i.sonBasvuru, true)}
                  </span>
                </span>
                <KaydetDugmesi ilanId={i.id} baglam={{ kayitli: true }} ad={i.pozisyonAdi} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
