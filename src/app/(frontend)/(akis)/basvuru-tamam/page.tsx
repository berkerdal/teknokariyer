import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { yonelmeEki } from '@/alan/metin'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ikon } from '@/arayuz/Ikon'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { Ust } from '@/arayuz/Ust'
import { adayOturumu } from '@/veri/aday'
import { basvurularim } from '@/veri/basvuru'
import { kaydetmeBaglami } from '@/veri/kaydedilenler'
import { payloadAl } from '@/veri/payload'
import { firmalariAl, yayindakiIlanlar } from '@/veri/ilanlar'
import { kimlik } from '@/servisler/ortak'

export const metadata: Metadata = { title: 'Başvurun iletildi', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | undefined>> }

/**
 * Başvuru sonrası (kullanıcı geri bildirimi, 15.11.2026: “estetiği geliştirilsin”): başarı başlığı, gönderilen ilanın
 * kartı, sürecin gerçek sırası (ilk adım tamam), sonraki eylemler ve aynı alandaki başka açık ilanlar (başvurulanlar
 * hariç, en fazla 3). Yalnızca başvurunun sahibi görür.
 */
export default async function BasvuruTamamSayfasi({ searchParams }: Props) {
  const p = await searchParams
  const k = await adayOturumu()
  const payload = await payloadAl()
  const b = await payload
    .findByID({ collection: 'basvurular', id: Number(p.b), depth: 2, overrideAccess: false, user: k, populate: { ilanlar: { pozisyonAdi: true, firma: true, aile: true }, firmalar: { kisaAd: true } } })
    .catch((): null => null)
  if (!b || typeof b.ilan !== 'object') notFound()
  const ilan = b.ilan
  const [firmalar, acik, benim, kaydet] = await Promise.all([firmalariAl([kimlik(ilan.firma)]), yayindakiIlanlar(), basvurularim(k), kaydetmeBaglami()])
  const firmaO = firmalar.get(kimlik(ilan.firma))
  const firma = firmaO?.ad ?? ''
  const basvurulan = new Set(benim.map((x) => x.ilan.id))
  const aile = typeof ilan.aile === 'object' && ilan.aile ? ilan.aile.ad : null
  const benzer = acik.filter((i) => !basvurulan.has(i.id) && i.id !== ilan.id && (aile ? i.aile === aile : i.firma.id === kimlik(ilan.firma))).slice(0, 3)
  return (
    <>
      <Ust />
      <main id="icerik" className="bvt">
        <section className="bvt-kart" aria-labelledby="bvt-baslik">
          <div className="bvt-bas" role="status">
            <span className="bvt-isaret" aria-hidden="true">
              <Ikon ad="tik" />
            </span>
            <div>
              <h1 id="bvt-baslik" className="b2">
                Başvurun {firma}
                {yonelmeEki(firma)} iletildi
              </h1>
              <p className="ikincil">Onay e-postasını {k.email} adresine gönderdik.</p>
            </div>
          </div>
          <div className="bvt-ilan">
            <FirmaKaro konum={firmaO?.konum ?? ''} logo={firmaO?.logo} ad={firma} boy={44} />
            <div>
              <Link className="bvt-ilan-ad" href={ilanAdresi(ilan)}>
                {ilan.pozisyonAdi}
              </Link>
              <p className="kucuk ikincil">
                {firma} · {tarihYaz(b.createdAt, true)} tarihinde başvurdun
              </p>
            </div>
          </div>
          <h2 className="b3">Bundan sonra ne olacak?</h2>
          <ol className="surec bvt-surec">
            <li data-tamam>
              <b>
                <Ikon ad="tik" kucuk />
              </b>
              <strong>Başvurun iletildi</strong>
              <span>Profilin ve CV’n firmaya ulaştı.</span>
            </li>
            <li>
              <b>2</b>
              <strong>Firma inceler</strong>
              <span>Durum değiştiğinde e-postayla haber veririz.</span>
            </li>
            <li>
              <b>3</b>
              <strong>Görüşme</strong>
              <span>Firma görüşmek isterse seninle iletişime geçer.</span>
            </li>
            <li>
              <b>4</b>
              <strong>Sonuç</strong>
              <span>Karar ne olursa olsun sonuç sana bildirilir.</span>
            </li>
          </ol>
          {p.havuz === '1' && (
            <p className="bilgi kucuk">CV havuzuna da katıldın. Firmalar seni ilan açmadan da bulabilir; ayarlarını “CV havuzu” sayfasından değiştirebilirsin.</p>
          )}
          <div className="dugme-grubu bvt-dugmeler">
            <Link className="dugme" href="/hesabim">
              Başvurularıma git
            </Link>
            <Link className="dugme dugme--ikincil" href="/ilanlar">
              Diğer ilanlara bak
            </Link>
          </div>
        </section>
        {benzer.length > 0 && (
          <section className="bvt-benzer" aria-labelledby="bvt-benzer">
            <h2 id="bvt-benzer" className="b3 kare-bas">
              {aile ? `${aile} alanında başka ilanlar` : `${firma} firmasının başka ilanları`}
            </h2>
            <div className="ilan-listesi">
              {benzer.map((i) => (
                <IlanSatiri key={i.id} ilan={i} kaydet={kaydet(i.id, ilanAdresi(i))} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
