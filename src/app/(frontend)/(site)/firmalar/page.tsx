import type { Metadata } from 'next'
import { dilAdresleri } from '@/alan/dil'
import Form from 'next/form'
import Link from 'next/link'
import { FiltreGrubu } from '@/arayuz/FiltreGrubu'
import { FiltrePaneli } from '@/arayuz/FiltrePaneli'
import { Ikon } from '@/arayuz/Ikon'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { ilanAdresi } from '@/arayuz/bicim'
import { sirala } from '@/alan/ilanFiltre'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'İlan veren firmalar',
  description: 'Pamukkale Teknokent’te şu anda iş veya staj ilanı bulunan firmalar.',
  alternates: dilAdresleri('/firmalar'),
}

type Props = { searchParams: Promise<{ sektor?: string | string[]; ara?: string }> }

const kucult = (x: string) => x.toLocaleLowerCase('tr')

/**
 * İlanı olan firmalar. Firma rehberinin tamamı değil: aday için anlamlı olan, açık ilanı olan firmalar.
 * Kompakt kart ızgarası (kullanıcı isteği, 15.11.2026): karo veya logo, ad, sektör, açık ilanların ilk ikisi (fazlası
 * “ve N ilan daha” bağlantısıyla firma sayfasında; kart uzamaz). Alfabetik.
 * Süzgeç ilan listesindeki gibi solda (mobilde alttan açılan panel): “Sektör” grubu (birden çok seçilebilir) ve firma
 * veya pozisyon adıyla arama (kullanıcı isteği, 15.11.2026: düğmeler yerine filtre). Bloklar tek binanın koridorları
 * olduğu için blok süzgeci yok.
 */
export default async function FirmalarSayfasi({ searchParams }: Props) {
  const p = await searchParams
  const ara = String(p.ara ?? '').trim().slice(0, 80)
  const istenen = [p.sektor ?? []].flat()
  const ilanlar = sirala(await yayindakiIlanlar(), 'yeni')
  type F = (typeof ilanlar)[number]['firma'] & { ilanlar: { ad: string; adres: string }[] }
  const tumu = [
    ...ilanlar
      .reduce((m, i) => {
        const f = m.get(i.firma.id) ?? { ...i.firma, ilanlar: [] }
        f.ilanlar.push({ ad: i.pozisyonAdi, adres: ilanAdresi(i) })
        return m.set(i.firma.id, f)
      }, new Map<number, F>())
      .values(),
  ].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
  // Arama firma adında, sektörde ve açık pozisyon adlarında; sektör sayıları aramaya göre.
  const aranan = ara ? tumu.filter((f) => [f.ad, f.sektor ?? '', ...f.ilanlar.map((i) => i.ad)].some((x) => kucult(x).includes(kucult(ara)))) : tumu
  const sektorler = [...tumu.reduce((m, f) => (f.sektor ? m.set(f.sektor, 0) : m), new Map<string, number>()).keys()].sort((a, b) => a.localeCompare(b, 'tr'))
  const secili = istenen.filter((x) => sektorler.includes(x))
  const firmalar = secili.length ? aranan.filter((f) => f.sektor && secili.includes(f.sektor)) : aranan
  const formId = 'firma-filtre'
  const temizle = ara ? `/firmalar?ara=${encodeURIComponent(ara)}` : '/firmalar'
  return (
    <>
      <Ust aktif="firmalar" />
      <main id="icerik" className="fl fl-duzen">
        <Form action="/firmalar" id={formId} scroll={false} replace className="contents" role="search">
          <FiltrePaneli formId={formId} aktifSayi={secili.length} sonucSayisi={firmalar.length} temizleHref={temizle} birim="firma">
            <FiltreGrubu
              g={{
                k: 'sektor',
                ad: 'Sektör',
                secenekler: sektorler.map((ad) => ({ deger: ad, ad, sayi: aranan.filter((f) => f.sektor === ad).length, secili: secili.includes(ad) })),
              }}
            />
          </FiltrePaneli>
          <div className="fl-icerik">
            <header className="fl-bas">
              <h1 className="b1">İlan veren firmalar</h1>
              <p className="ikincil">Pamukkale Teknokent’te şu anda açık ilanı bulunan {tumu.length} firma.</p>
            </header>
            <div className="arama arama--liste">
              <label className="gizli" htmlFor="fl-ara">
                Firma ara
              </label>
              <span className="arama-kutu">
                <Ikon ad="ara" />
                <input id="fl-ara" name="ara" className="girdi" type="search" defaultValue={ara} placeholder="Firma, sektör veya pozisyon" autoComplete="off" enterKeyHint="search" />
              </span>
            </div>
            {(secili.length > 0 || ara) && (
              <div className="secili-filtre" aria-label="Seçili filtreler">
                {secili.map((x) => (
                  <Link key={x} className="hap hap--secili" href={firmaAdresi(ara, secili.filter((y) => y !== x))} scroll={false}>
                    {x} <Ikon ad="kapat" kucuk />
                    <span className="gizli"> süzgecini kaldır</span>
                  </Link>
                ))}
                {ara && (
                  <Link className="hap hap--secili" href={firmaAdresi('', secili)} scroll={false}>
                    “{ara}” <Ikon ad="kapat" kucuk />
                    <span className="gizli"> aramasını kaldır</span>
                  </Link>
                )}
              </div>
            )}
            <p className="kucuk ikincil fl-sonuc" aria-live="polite">
              {firmalar.length === tumu.length ? `${tumu.length} firma, alfabetik` : `${firmalar.length} firma gösteriliyor`}
            </p>
            {firmalar.length ? (
              <ul className="fl-izgara">
                {firmalar.map((f) => (
                  <li key={f.id} className="fl-kart">
                    <FirmaKaro konum={f.konum} logo={f.logo} ad={f.ad} boy={48} />
                    <div className="fl-govde">
                      <Link className="fl-ad" href={`/firma/${f.slug}`}>
                        {f.ad}
                      </Link>
                      {/* Karo blok ve odayı zaten gösterir; konum yazısı yalnızca logolu firmada */}
                      <span className="kucuk ikincil">{[f.sektor, f.logo ? f.konum : null].filter(Boolean).join(' · ')}</span>
                      <ul className="fl-ilanlar">
                        {f.ilanlar.slice(0, 2).map((i) => (
                          <li key={i.adres}>
                            <Link href={i.adres}>{i.ad}</Link>
                          </li>
                        ))}
                      </ul>
                      {f.ilanlar.length > 2 && (
                        <Link className="kucuk fl-daha" href={`/firma/${f.slug}`}>
                          ve {f.ilanlar.length - 2} ilan daha
                        </Link>
                      )}
                    </div>
                    <span className="rozet rozet--lacivert fl-sayi">{f.ilanlar.length} ilan</span>
                  </li>
                ))}
              </ul>
            ) : tumu.length ? (
              <div className="bos-durum">
                <p>Seçtiğin süzgeçlere uyan firma bulunmuyor.</p>
                <Link className="dugme dugme--ikincil dugme--kucuk" href="/firmalar">
                  Süzgeçleri temizle
                </Link>
              </div>
            ) : (
              <p>Şu anda açık ilanı bulunan firma yok.</p>
            )}
          </div>
        </Form>
      </main>
    </>
  )
}

function firmaAdresi(ara: string, sektorler: string[]) {
  const q = new URLSearchParams()
  if (ara) q.set('ara', ara)
  for (const x of sektorler) q.append('sektor', x)
  const s = q.toString()
  return s ? `/firmalar?${s}` : '/firmalar'
}
