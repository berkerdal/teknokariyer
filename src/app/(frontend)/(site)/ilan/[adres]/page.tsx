import type { Metadata } from 'next'
import { dilAdresleri } from '@/alan/dil'
import Link from 'next/link'
import { basvuruKaynagi } from '@/alan/basvuru'
import { DENEYIM_ADI } from '@/alan/eslesme'
import { notFound, permanentRedirect } from 'next/navigation'
import { sirala } from '@/alan/ilanFiltre'
import { kalanGun, suresiDolduMu } from '@/alan/ilan'
import { ilgiEki } from '@/alan/metin'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ikon } from '@/arayuz/Ikon'
import { BeceriListesi, IlanSatiri } from '@/arayuz/IlanSatiri'
import { BasvuruSureci, EslesmeKutusu, IlanOlgulari, IlanOzetListesi, Metin } from '@/arayuz/IlanParcalari'
import { BaglantiyiKopyala } from '@/arayuz/BaglantiyiKopyala'
import { Ust } from '@/arayuz/Ust'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { eslesmeProfili, oturumdakiAday } from '@/veri/aday'
import { ilanAyrintisi, yayindakiIlanlar, type IlanAyrintisi } from '@/veri/ilanlar'
import { oturum } from '@/veri/payload'
import { IlanBildir } from '@/arayuz/IlanBildir'
import { adayMi } from '@/erisim'
import { kaydetmeBaglami } from '@/veri/kaydedilenler'
import { KaydetDugmesi } from '@/arayuz/KaydetDugmesi'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ adres: string }>; searchParams?: Promise<{ kaynak?: string }> }

const EGITIM_ADI: Record<string, string> = { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans', 'yuksek-lisans': 'Yüksek lisans', doktora: 'Doktora' }
const SGK_ADI: Record<string, string> = { okul: 'Okul karşılıyor', firma: 'Firma karşılıyor' }

async function ilanAl(adres: string) {
  const id = Number(adres.match(/^(\d+)/)?.[1])
  const ilan = await ilanAyrintisi(id)
  if (!ilan) notFound()
  if (ilan.durum !== 'yayinda' && ilan.durum !== 'duraklatildi' && ilan.durum !== 'suresi-doldu' && ilan.durum !== 'kapandi') notFound()
  return ilan
}

const acikMi = (i: IlanAyrintisi) => i.durum === 'yayinda' && !suresiDolduMu(new Date(i.sonBasvuru), new Date())

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ilan = await ilanAl((await params).adres)
  const ad = `${ilan.pozisyonAdi} · ${ilan.firma.ad}`
  return {
    title: ad,
    description: `${ilan.firma.ad} (Pamukkale Teknokent, ${ilan.firma.konum}) ${ilan.tur === 'staj' ? 'staj' : 'iş'} ilanı. Son başvuru: ${tarihYaz(ilan.sonBasvuru, true)}.`,
    alternates: dilAdresleri(ilanAdresi(ilan)),
    robots: acikMi(ilan) ? undefined : { index: false, follow: true },
    openGraph: { title: ad, type: 'website', locale: 'tr_TR', siteName: 'TeknoKariyer' },
  }
}

/** Arama motorları için iş ilanı verisi (yalnızca açık ilanlarda). */
function jobPosting(ilan: IlanAyrintisi) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: ilan.pozisyonAdi,
    description: `${ilan.isTanimi}\n\n${ilan.nitelikler}`.replace(/\n/g, '<br>'),
    datePosted: ilan.yayinTarihi,
    validThrough: ilan.sonBasvuru,
    employmentType: ilan.tur === 'staj' ? 'INTERN' : ilan.altTur === 'yari-zamanli' ? 'PART_TIME' : ilan.altTur === 'proje' ? 'CONTRACTOR' : 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: ilan.firmaBilgi.unvan },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', streetAddress: 'Hüseyin Yılmaz Cad. No:67, Pamukkale Teknokent', addressLocality: 'Pamukkale', addressRegion: 'Denizli', addressCountry: 'TR' },
    },
    ...(ilan.model === 'uzaktan' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Türkiye' } } : {}),
    ...(ilan.ucret
      ? { baseSalary: { '@type': 'MonetaryAmount', currency: 'TRY', value: { '@type': 'QuantitativeValue', minValue: ilan.ucret.enAz, maxValue: ilan.ucret.enCok, unitText: 'MONTH' } } }
      : {}),
  }
}

export default async function IlanSayfasi({ params, searchParams }: Props) {
  const { adres } = await params
  const kaynak = basvuruKaynagi((await searchParams)?.kaynak)
  const ilan = await ilanAl(adres)
  const dogru = ilanAdresi(ilan).replace('/ilan/', '')
  if (adres !== dogru) permanentRedirect(ilanAdresi(ilan))

  if (!acikMi(ilan)) return <KapanmisIlan ilan={ilan} />

  const [aday, k, kaydetFn] = await Promise.all([oturumdakiAday(), oturum(), kaydetmeBaglami()])
  const kaydet = kaydetFn(ilan.id, ilanAdresi(ilan))
  const profil = aday ? eslesmeProfili(aday) : null
  const sahip = profil ? new Set(profil.beceriler.map((b) => b.toLocaleLowerCase('tr'))) : undefined
  const f = ilan.firma
  // Paylaşım bağlantısıyla gelen adayın kaynağı (ör. ?kaynak=linkedin) başvuruya taşınır; istatistikte ayrı görünür.
  const basvur = `${ilanAdresi(ilan)}/basvur${kaynak ? `?kaynak=${kaynak}` : ''}`

  const kalan = kalanGun(new Date(ilan.sonBasvuru), new Date())

  return (
    <>
      <Ust aktif="ilanlar" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting(ilan)).replace(/</g, '\\u003c') }} />
      <main id="icerik" className="id">
        <div className="id-ana">
          <Link className="geri" href="/ilanlar">
            <Ikon ad="geri" kucuk /> İlanlara dön
          </Link>
          <div className="il-bas">
            <FirmaKaro konum={f.konum} logo={f.logo} ad={f.ad} boy={56} />
            <div>
              <p>
                <Link href={`/firma/${f.slug}`}>
                  <strong>{f.ad}</strong>
                </Link>
              </p>
              <p className="kucuk ikincil">{[f.sektor, `${f.konum} · Pamukkale Teknokent`].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <h1 className="b1">{ilan.pozisyonAdi}</h1>
          <IlanOlgulari ilan={ilan} />
          {(ilan.pauOncelik || ilan.staj?.ucretli) && (
            <p className="etiketler">
              {ilan.staj?.ucretli && <span className="rozet rozet--yesil">Ücretli staj</span>}
              {ilan.pauOncelik && <span className="rozet rozet--lacivert">PAÜ öğrencilerine öncelik</span>}
            </p>
          )}
        </div>

        <aside className="id-yan" aria-label="İlan özeti">
          <div className="id-yan-yapiskan">
            <div className="dugme-grubu id-yan-eylem">
              <Link className="dugme dugme--genis" href={basvur}>
                Başvur
              </Link>
              {kaydet && <KaydetDugmesi ilanId={ilan.id} baglam={kaydet} ad={ilan.pozisyonAdi} metinli />}
            </div>
            <IlanOzetListesi ilan={ilan} yan />
            <EslesmeKutusu ilan={ilan} profil={profil} girisli={Boolean(k)} />
            <div className="id-yan-kopya">
              <BaglantiyiKopyala />
            </div>
          </div>
        </aside>

        <div className="id-ana">
          <section className="id-bolum" aria-labelledby="id-tanim">
            <h2 id="id-tanim">Ne yapacaksın?</h2>
            <Metin metin={ilan.isTanimi} />
          </section>
          <section className="id-bolum" aria-labelledby="id-nitelik">
            <h2 id="id-nitelik">Aranan nitelikler</h2>
            <Metin metin={ilan.nitelikler} />
            <dl className="ozet-dl">
              <div>
                <dt>Deneyim</dt>
                <dd>{DENEYIM_ADI[ilan.deneyim]}</dd>
              </div>
              <div>
                <dt>Eğitim</dt>
                <dd>
                  {EGITIM_ADI[ilan.egitim] ?? ilan.egitim}
                  {ilan.bolumler.length ? ` · ${ilan.bolumler.join(', ')}` : ''}
                </dd>
              </div>
              {ilan.diller.length > 0 && (
                <div>
                  <dt>Dil</dt>
                  <dd>{ilan.diller.map((d) => `${d.dil} ${d.seviye}`).join(', ')}</dd>
                </div>
              )}
            </dl>
          </section>
          {(ilan.zorunluBeceriler.length > 0 || ilan.tercihBeceriler.length > 0) && (
            <section className="id-bolum" aria-labelledby="id-beceri">
              <h2 id="id-beceri">Beceriler</h2>
              <BeceriListesi zorunlu={ilan.zorunluBeceriler} tercih={ilan.tercihBeceriler} sahip={sahip} />
            </section>
          )}
          {ilan.staj && (
            <section className="id-bolum" aria-labelledby="id-staj">
              <h2 id="id-staj">Staj bilgileri</h2>
              <dl className="ozet-dl">
                {ilan.staj.donem && (
                  <div>
                    <dt>Dönem</dt>
                    <dd>{ilan.staj.donem}</dd>
                  </div>
                )}
                <div>
                  <dt>Ücret</dt>
                  <dd>{ilan.staj.ucretli ? 'Ücretli' : 'Ücretsiz (gönüllü staj)'}</dd>
                </div>
                {ilan.staj.sgk && (
                  <div>
                    <dt>SGK</dt>
                    <dd>{SGK_ADI[ilan.staj.sgk] ?? ilan.staj.sgk}</dd>
                  </div>
                )}
                <div>
                  <dt>Zorunlu staj belgesi</dt>
                  <dd>{ilan.staj.belge ? 'İmzalanıyor' : 'İmzalanmıyor'}</dd>
                </div>
              </dl>
            </section>
          )}
          {ilan.yanHaklar.length > 0 && (
            <section className="id-bolum" aria-labelledby="id-yan-hak">
              <h2 id="id-yan-hak">Yan haklar</h2>
              <ul className="madde">
                {ilan.yanHaklar.map((y) => (
                  <li key={y}>{y}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="id-bolum" aria-labelledby="id-surec">
            <h2 id="id-surec">Başvuru nasıl ilerler?</h2>
            <BasvuruSureci soruSayisi={ilan.soruSayisi} />
          </section>
          <section className="id-firma-kutu" aria-labelledby="id-firma">
            <FirmaKaro konum={f.konum} logo={f.logo} ad={f.ad} boy={48} />
            <div>
              <h2 id="id-firma" className="b3">
                {f.ad} hakkında
              </h2>
              <p className="kucuk ikincil">{[ilan.firmaBilgi.unvan, f.sektor, f.konum].filter(Boolean).join(' · ')}</p>
            </div>
            <Link className="dugme dugme--ikincil" href={`/firma/${f.slug}`}>
              Firma sayfası
            </Link>
          </section>
          {(!k || adayMi(k)) && <IlanBildir ilanId={ilan.id} girisAdresi={k ? undefined : `/giris?donus=${encodeURIComponent(ilanAdresi(ilan))}`} />}
        </div>
      </main>
      <div className="mobil-basvur id-mobil-eylem" role="region" aria-label="Başvuru">
        <p>
          <small>Son başvuru</small>
          <strong>
            {tarihYaz(ilan.sonBasvuru)} · {kalan === 0 ? 'son gün' : `${kalan} gün`}
          </strong>
        </p>
        {kaydet && <KaydetDugmesi ilanId={ilan.id} baglam={kaydet} ad={ilan.pozisyonAdi} />}
        <Link className="dugme" href={basvur}>
          Başvur
        </Link>
      </div>
    </>
  )
}

async function KapanmisIlan({ ilan }: { ilan: IlanAyrintisi }) {
  const tumu = await yayindakiIlanlar()
  const firmanin = sirala(tumu.filter((i) => i.firma.id === ilan.firma.id), 'yeni')
  const benzer = sirala(tumu.filter((i) => i.firma.id !== ilan.firma.id && ilan.aile && i.aile === ilan.aile), 'yeni').slice(0, 3)
  const t = tarihYaz(ilan.sonBasvuru, true)
  const ust =
    ilan.durum === 'suresi-doldu' || ilan.durum === 'yayinda'
      ? `Bu ilanın son başvuru tarihi geçti (${t}).`
      : ilan.durum === 'duraklatildi'
        ? 'Bu ilan şu an başvuru almıyor'
        : 'Bu ilan kapandı'
  return (
    <>
      <Ust aktif="ilanlar" />
      <main id="icerik" className="sayfa-dar">
        <div className="il-bas">
          <FirmaKaro konum={ilan.firma.konum} logo={ilan.firma.logo} ad={ilan.firma.ad} boy={56} />
          <div>
            <p>
              <Link href={`/firma/${ilan.firma.slug}`}>
                <strong>{ilan.firma.ad}</strong>
              </Link>
            </p>
            <p className="kucuk ikincil">{ilan.firma.konum}</p>
          </div>
        </div>
        <p className="ust-etiket">{ust}</p>
        <h1 className="b1">{ilan.pozisyonAdi}</h1>
        <p>
          {ilan.durum === 'duraklatildi'
            ? 'Firma bu ilanı geçici olarak durdurdu. Yeniden başvuruya açılırsa bu adresten başvurabilirsin.'
            : 'Bu ilana artık başvurulamıyor.'}{' '}
          {firmanin.length || benzer.length ? 'Aşağıda başvurabileceğin açık ilanlar bulunuyor.' : ''}
        </p>
        {firmanin.length > 0 && (
          <section>
            <h2 className="b3 kare-bas">
              {ilan.firma.ad}
              {ilgiEki(ilan.firma.ad)} açık ilanları
            </h2>
            <div className="ilan-listesi">
              {firmanin.map((i) => (
                <IlanSatiri key={i.id} ilan={i} />
              ))}
            </div>
          </section>
        )}
        {benzer.length > 0 && (
          <section>
            <h2 className="b3 kare-bas">Benzer ilanlar</h2>
            <div className="ilan-listesi">
              {benzer.map((i) => (
                <IlanSatiri key={i.id} ilan={i} />
              ))}
            </div>
          </section>
        )}
        <p>
          <Link className="dugme dugme--ikincil" href={ilan.tur === 'staj' ? '/ilanlar?tur=staj' : '/ilanlar?tur=is'}>
            Tüm {ilan.tur === 'staj' ? 'staj' : 'iş'} ilanları
          </Link>
        </p>
      </main>
    </>
  )
}
