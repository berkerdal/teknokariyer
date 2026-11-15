import type { Metadata } from 'next'
import { dilAdresleri } from '@/alan/dil'
import Link from 'next/link'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { ilanAdresi } from '@/arayuz/bicim'
import { sirala } from '@/alan/ilanFiltre'
import { konumAyristir } from '@/alan/firmaKonumu'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'İlan veren firmalar',
  description: 'Pamukkale Teknokent’te şu anda iş veya staj ilanı bulunan firmalar.',
  alternates: dilAdresleri('/firmalar'),
}

type Props = { searchParams: Promise<{ blok?: string }> }

const BLOKLAR = [
  { kod: 'B', renk: 'b' },
  { kod: 'C', renk: 'c' },
  { kod: 'D', renk: 'd' },
] as const

/**
 * İlanı olan firmalar. Firma rehberinin tamamı değil: aday için anlamlı olan, açık ilanı olan firmalar.
 * Kompakt kart ızgarası (kullanıcı isteği, 15.11.2026): karo veya logo, ad, sektör, açık ilanların ilk ikisi. Blok süzgeci.
 */
export default async function FirmalarSayfasi({ searchParams }: Props) {
  const { blok } = await searchParams
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
  const blokSay = (k: string) => tumu.filter((f) => konumAyristir(f.konum).blok === k).length
  const secili = BLOKLAR.some((b) => b.kod === blok) ? blok : undefined
  const firmalar = secili ? tumu.filter((f) => konumAyristir(f.konum).blok === secili) : tumu
  return (
    <>
      <Ust aktif="firmalar" />
      <main id="icerik" className="fl">
        <header className="fl-bas">
          <div>
            <h1 className="b1">İlan veren firmalar</h1>
            <p className="ikincil">Pamukkale Teknokent’te şu anda açık ilanı bulunan {tumu.length} firma.</p>
          </div>
          {tumu.length > 0 && (
            <nav className="hizli-filtre" aria-label="Bloğa göre süz">
              <Link className="hap" href="/firmalar" aria-pressed={!secili}>
                Tümü <span className="sayi">{tumu.length}</span>
              </Link>
              {BLOKLAR.filter((b) => blokSay(b.kod) > 0).map((b) => (
                <Link key={b.kod} className="hap" href={`/firmalar?blok=${b.kod}`} aria-pressed={secili === b.kod}>
                  <i className={`blok-isaret blok-isaret--${b.renk}`} aria-hidden="true" />
                  {b.kod} Blok <span className="sayi">{blokSay(b.kod)}</span>
                </Link>
              ))}
            </nav>
          )}
        </header>
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
        ) : (
          <p>Şu anda açık ilanı bulunan firma yok.</p>
        )}
      </main>
    </>
  )
}
