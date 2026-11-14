import type { Metadata } from 'next'
import Link from 'next/link'
import { basvuruKaynagi } from '@/alan/basvuru'
import { DENEYIM_ADI } from '@/alan/eslesme'
import { notFound, permanentRedirect } from 'next/navigation'
import { sirala } from '@/alan/ilanFiltre'
import { suresiDolduMu } from '@/alan/ilan'
import { ilgiEki } from '@/alan/metin'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ikon } from '@/arayuz/Ikon'
import { BeceriListesi, IlanSatiri } from '@/arayuz/IlanSatiri'
import { EslesmeKutusu, IlanOzetListesi, Metin } from '@/arayuz/IlanParcalari'
import { BaglantiyiKopyala } from '@/arayuz/BaglantiyiKopyala'
import { Ust } from '@/arayuz/Ust'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { eslesmeProfili, oturumdakiAday } from '@/veri/aday'
import { ilanAyrintisi, yayindakiIlanlar, type IlanAyrintisi } from '@/veri/ilanlar'
import { oturum } from '@/veri/payload'

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
    alternates: { canonical: ilanAdresi(ilan) },
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

  const [aday, k] = await Promise.all([oturumdakiAday(), oturum()])
  const profil = aday ? eslesmeProfili(aday) : null
  const sahip = profil ? new Set(profil.beceriler.map((b) => b.toLocaleLowerCase('tr'))) : undefined
  const f = ilan.firma
  // Paylaşım bağlantısıyla gelen adayın kaynağı (ör. ?kaynak=linkedin) başvuruya taşınır; istatistikte ayrı görünür.
  const basvur = `${ilanAdresi(ilan)}/basvur${kaynak ? `?kaynak=${kaynak}` : ''}`

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
            <FirmaKaro konum={f.konum} boy={48} />
            <div>
              <p>
                <Link href={`/firma/${f.slug}`}>
                  <strong>{f.ad}</strong>
                </Link>
              </p>
              <p className="kucuk ikincil">{[f.sektor, f.konum].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <h1 className="b1">{ilan.pozisyonAdi}</h1>
        </div>

        <aside className="id-yan" aria-label="İlan özeti">
          <div className="id-yan-yapiskan">
            <div className="dugme-grubu id-yan-eylem">
              <Link className="dugme dugme--genis" href={basvur}>
                Başvur
              </Link>
            </div>
            <IlanOzetListesi ilan={ilan} />
            <EslesmeKutusu ilan={ilan} profil={profil} girisli={Boolean(k)} />
            <div className="id-yan-kopya">
              <BaglantiyiKopyala />
            </div>
          </div>
        </aside>

        <div className="id-ana">
          <div className="id-bolumler">
            <details className="acilir" open>
              <summary>Ne yapacaksın?</summary>
              <div className="icerik">
                <Metin metin={ilan.isTanimi} />
              </div>
            </details>
            <details className="acilir" open>
              <summary>Aranan nitelikler</summary>
              <div className="icerik">
                <Metin metin={ilan.nitelikler} />
                <p>
                  <strong>Deneyim:</strong> {DENEYIM_ADI[ilan.deneyim]}
                </p>
                <p>
                  <strong>Eğitim:</strong> {EGITIM_ADI[ilan.egitim] ?? ilan.egitim}
                  {ilan.bolumler.length ? ` · ${ilan.bolumler.join(', ')}` : ''}
                </p>
                {ilan.diller.length > 0 && (
                  <p>
                    <strong>Dil:</strong> {ilan.diller.map((d) => `${d.dil} ${d.seviye}`).join(', ')}
                  </p>
                )}
              </div>
            </details>
            {(ilan.zorunluBeceriler.length > 0 || ilan.tercihBeceriler.length > 0) && (
              <details className="acilir" open>
                <summary>Beceriler</summary>
                <div className="icerik">
                  <BeceriListesi zorunlu={ilan.zorunluBeceriler} tercih={ilan.tercihBeceriler} sahip={sahip} />
                </div>
              </details>
            )}
            {ilan.staj && (
              <details className="acilir" open>
                <summary>Staj bilgileri</summary>
                <div className="icerik">
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
                    {ilan.staj.pauOncelik && (
                      <div>
                        <dt>Öncelik</dt>
                        <dd>PAÜ öğrencilerine öncelik veriliyor</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </details>
            )}
            {ilan.yanHaklar.length > 0 && (
              <details className="acilir">
                <summary>Yan haklar</summary>
                <div className="icerik">
                  <ul className="madde">
                    {ilan.yanHaklar.map((y) => (
                      <li key={y}>{y}</li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
            <details className="acilir">
              <summary>Başvuru nasıl ilerler?</summary>
              <div className="icerik">
                <p>
                  Profilin ve seçtiğin CV gönderilir{ilan.soruSayisi ? `, ${ilan.soruSayisi} kısa soruyu cevaplarsın` : ''}. Başvurunun durumunu
                  “Başvurularım” sayfasından izlersin; firma karar verdiğinde sonuç sana mutlaka bildirilir.
                </p>
              </div>
            </details>
            <details className="acilir">
              <summary>{f.ad} hakkında</summary>
              <div className="icerik">
                <p>{[ilan.firmaBilgi.unvan, f.sektor, f.konum].filter(Boolean).join(' · ')}</p>
                <Link href={`/firma/${f.slug}`}>Firma sayfasına git</Link>
              </div>
            </details>
          </div>
        </div>
      </main>
      <div className="yapiskan-alt id-mobil-eylem">
        <Link className="dugme dugme--genis" href={basvur}>
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
          <FirmaKaro konum={ilan.firma.konum} boy={48} />
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
