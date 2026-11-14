import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DURUM_ADI, type IlanDurumu } from '@/alan/ilan'
import { DUZELTME_GEREKCELERI, KONTROL_LISTESI } from '@/alan/moderasyon'
import { moderasyonYapabilirMi, yoneticiMi } from '@/erisim'
import { Ikon } from '@/arayuz/Ikon'
import { IlanGovdesi } from '@/arayuz/IlanGovdesi'
import { OnayKarari } from '@/arayuz/yonetim/Kararlar'
import { firmaOzeti, ilanAyrintisinaCevir } from '@/veri/ilanlar'
import { beklemeMetni, onayAyrintisi, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'İlan onayı · Yönetim' }

type Props = { params: Promise<{ id: string }> }

/** Bulgunun metninden önerilecek hazır gerekçe. */
function onerilenGerekce(bulgular: string[]): string | undefined {
  const m = bulgular.join(' ')
  if (/e-posta|telefon|web adresi/i.test(m)) return 'iletisim'
  if (/ücret|deneme/i.test(m)) return 'ucretsiz'
  if (/yaş|cinsiyet|medeni|boy|kilo|görünüş|askerlik/i.test(m)) return 'ayrimci'
  return undefined
}

export default async function OnayEkrani({ params }: Props) {
  const { id } = await params
  const k = await yonetimOturumu(`/yonetim/onay/${id}`)
  const v = await onayAyrintisi(Number(id))
  if (!v || v.ilan.durum === 'taslak') notFound() // taslak tamamlanmamış olabilir; Yönetici A.Ş. taslakla ilgilenmez
  const { ilan, firma, tarama, kural } = v
  const durum = ilan.durum as IlanDurumu
  const f = firmaOzeti(firma)
  const a = ilanAyrintisinaCevir(ilan, f)
  const onayli = firma.onaylanmisIlanSayisi ?? 0
  const uyarilar = tarama.filter((b) => b.tur === 'uyari').map((b) => b.metin)
  const karar = moderasyonYapabilirMi(k) && durum === 'onayda'

  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/onay">
            <Ikon ad="geri" kucuk /> İlan onayı
          </Link>
          <h1 className="b1">{ilan.pozisyonAdi}</h1>
          <p className="ikincil">
            {firma.kisaAd} · {firma.konum} · firmanın {onayli + 1}. ilanı · {beklemeMetni(ilan.updatedAt)} önce gönderildi
          </p>
        </div>
      </div>

      {durum !== 'onayda' && (
        <p className="bilgi">
          Bu ilan artık onay beklemiyor. Şu anki durumu: <strong>{DURUM_ADI[durum]}</strong>.
        </p>
      )}
      {ilan.duzeltmeGerekcesi && durum === 'onayda' && (
        <div className="bilgi">
          <p>
            <strong>Bu ilan daha önce düzeltme için geri gönderilmişti.</strong> Firmaya yazılan not: {ilan.duzeltmeGerekcesi}
          </p>
          <p className="kucuk">
            Firmanın ne değiştirdiğini{' '}
            <a href={`/admin/collections/ilanlar/${ilan.id}/versions`}>sürüm geçmişinde</a> görebilirsiniz.
          </p>
        </div>
      )}

      <div className="y-onay">
        <div className="y-onay-ilan panel">
          <p className="ust-etiket">Adayın göreceği şekliyle</p>
          <IlanGovdesi a={a} f={f} sorular={(ilan.onElemeSorulari ?? []).map((s) => `${s.soru}${s.eleyici ? ` (eleyici; beklenen cevap: ${s.beklenenCevap || 'belirtilmedi'})` : ''}`)} />
        </div>
        <aside className="y-onay-karar">
          <section className="panel panel-ic">
            <h2 className="b3">Otomatik tarama</h2>
            <ul className="eslesme">
              {tarama.map((b, n) => (
                <li key={n} className={b.tur === 'temiz' ? 'var' : 'eksik'}>
                  {b.metin}
                </li>
              ))}
            </ul>
            <p className="kucuk ikincil">Tarama şüpheli ifadeleri işaretler; kararı siz verirsiniz.</p>
          </section>
          <section className="panel panel-ic">
            <h2 className="b3">Firma</h2>
            <p>
              <strong>{firma.unvan}</strong>
            </p>
            <p className="kucuk ikincil">
              {firma.guvenilir ? 'Güvenilir firma.' : `Şimdiye kadar ${onayli} ilanı onaylandı. İlk ${kural} ilanı onaydan geçer.`}
            </p>
            {firma.web && (
              <p className="kucuk">
                <a href={firma.web} rel="noopener noreferrer" target="_blank">
                  {firma.web.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
          </section>
          {karar ? (
            <OnayKarari
              ilanId={ilan.id}
              kontroller={KONTROL_LISTESI}
              gerekceler={DUZELTME_GEREKCELERI}
              onerilenGerekce={onerilenGerekce(uyarilar)}
              guvenilirOner={firma.guvenilir ? null : { firma: firma.kisaAd, onayli, kural }}
              yetkili={yoneticiMi(k)}
            />
          ) : (
            durum === 'onayda' && <p className="kucuk ikincil">Rolünüz ilanları görüntülemeye izin veriyor; onay kararını yönetici veya moderatör verir.</p>
          )}
        </aside>
      </div>
    </>
  )
}
