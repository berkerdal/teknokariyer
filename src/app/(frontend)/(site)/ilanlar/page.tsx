import type { Metadata } from 'next'
import Link from 'next/link'
import Form from 'next/form'
import {
  aktifFiltreSayisi,
  bosDurumOnerisi,
  fasetler,
  filtreAdresi,
  filtreDegistir,
  filtreOku,
  filtrele,
  secenekAdi,
  sirala,
  ucretliStajSayisi,
  BOS_FILTRE,
} from '@/alan/ilanFiltre'
import { FiltrePaneli } from '@/arayuz/FiltrePaneli'
import { Ikon } from '@/arayuz/Ikon'
import { IlanSatiri } from '@/arayuz/IlanSatiri'
import { IlanOnizleme } from '@/arayuz/IlanOnizleme'
import { Ust } from '@/arayuz/Ust'
import { yayindakiIlanlar } from '@/veri/ilanlar'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = filtreOku(await searchParams)
  const staj = f.tur.length === 1 && f.tur[0] === 'staj'
  return {
    title: staj ? 'Staj ilanları' : 'İş ve staj ilanları',
    description: 'Pamukkale Teknokent firmalarının yayındaki iş ve staj ilanları. Türe, çalışma modeline, deneyime ve pozisyon ailesine göre filtrele.',
    alternates: { canonical: staj ? '/ilanlar?tur=staj' : '/ilanlar' },
    // Filtre birleşimleri arama motorunda ayrı sayfa olarak dizinlenmez.
    robots: aktifFiltreSayisi(f) > (staj ? 1 : 0) || f.ara ? { index: false, follow: true } : undefined,
  }
}

export default async function IlanlarSayfasi({ searchParams }: Props) {
  const p = await searchParams
  const f = filtreOku(p)
  const tumu = await yayindakiIlanlar()
  const sonuc = sirala(filtrele(tumu, f), f.sira)
  const secili = Number(Array.isArray(p.secili) ? p.secili[0] : p.secili) || sonuc[0]?.id
  const aktif = aktifFiltreSayisi(f)
  const formId = 'ilan-filtresi'
  const oneri = sonuc.length ? null : bosDurumOnerisi(tumu, f)
  const ucretli = ucretliStajSayisi(tumu, f)

  const etiketler = [
    ...(['tur', 'model', 'deneyim', 'aile'] as const).flatMap((k) =>
      f[k].map((d) => ({ ad: secenekAdi(k, d), href: `/ilanlar${filtreAdresi(filtreDegistir(f, k, d))}` })),
    ),
    ...(f.ucretli ? [{ ad: 'Ücretli staj', href: `/ilanlar${filtreAdresi(filtreDegistir(f, 'ucretli'))}` }] : []),
    ...(f.ara ? [{ ad: `“${f.ara}”`, href: `/ilanlar${filtreAdresi(filtreDegistir(f, 'ara'))}` }] : []),
  ]

  return (
    <>
      <Ust aktif={f.tur.length === 1 && f.tur[0] === 'staj' && aktif === 1 ? 'staj' : 'ilanlar'} />
      <main id="icerik" className="il">
        <h1 className="gizli">İş ve staj ilanları</h1>
        <Form action="/ilanlar" id={formId} scroll={false} replace className="contents" role="search">
          <FiltrePaneli formId={formId} aktifSayi={aktif} sonucSayisi={sonuc.length} temizleHref={`/ilanlar${f.ara ? filtreAdresi({ ...BOS_FILTRE, ara: f.ara }) : ''}`}>
            {fasetler(tumu, f).map((g) =>
              g.secenekler.length ? (
                <fieldset key={g.k} className="f-grup">
                  <legend>{g.ad}</legend>
                  <div className="f-haplar">
                    {g.secenekler.map((s) => (
                      <label key={s.deger} className="hap">
                        <input className="gizli" type="checkbox" name={g.k} value={s.deger} defaultChecked={s.secili} disabled={!s.sayi && !s.secili} />
                        {s.ad} <span className="sayi">{s.sayi}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null,
            )}
            {(ucretli > 0 || f.ucretli) && (
              <fieldset className="f-grup">
                <legend>Staj</legend>
                <label className="secenek">
                  <input type="checkbox" name="ucretli" value="1" defaultChecked={f.ucretli} />
                  <span>
                    Yalnızca ücretli staj <span className="ikincil">({ucretli})</span>
                  </span>
                </label>
              </fieldset>
            )}
          </FiltrePaneli>

          <section className="il-liste" aria-label="İlanlar">
            <div className="arama arama--liste">
              <label className="gizli" htmlFor="il-ara">
                İlan ara
              </label>
              <span className="arama-kutu">
                <Ikon ad="ara" />
                <input id="il-ara" name="ara" className="girdi" type="search" defaultValue={f.ara} placeholder="Pozisyon, beceri veya firma" enterKeyHint="search" />
              </span>
            </div>
            {etiketler.length > 0 && (
              <div className="secili-filtre">
                {etiketler.map((e) => (
                  <Link key={e.href + e.ad} className="hap hap--secili" href={e.href} scroll={false}>
                    {e.ad} <Ikon ad="kapat" kucuk />
                    <span className="gizli"> filtresini kaldır</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="liste-bas">
              <p aria-live="polite">
                <strong>{sonuc.length}</strong> ilan bulundu
              </p>
              <label className="siralama kucuk">
                Sırala
                <select name="sira" className="secim secim--kucuk" defaultValue={f.sira}>
                  <option value="yeni">En yeni</option>
                  <option value="son-tarih">Son başvuru tarihi yakın</option>
                </select>
              </label>
            </div>
            <div className="ilan-listesi">
              {sonuc.map((i) => (
                <IlanSatiri key={i.id} ilan={i} secili={i.id === secili} onizleme={`/ilanlar${filtreAdresi(f, { secili: String(i.id) })}`} />
              ))}
              {!sonuc.length && (
                <div className="bos">
                  <p className="b3">{tumu.length ? 'Seçtiğin filtrelere uyan ilan bulunmuyor.' : 'Şu anda yayında ilan bulunmuyor.'}</p>
                  {oneri && (
                    <>
                      <p>
                        “{oneri.ad}” filtresini kaldırırsan {oneri.sayi} ilan listelenir.
                      </p>
                      <Link className="dugme dugme--ikincil" href={`/ilanlar${filtreAdresi(filtreDegistir(f, oneri.k, oneri.deger))}`} scroll={false}>
                        “{oneri.ad}” filtresini kaldır
                      </Link>
                    </>
                  )}
                  {aktif + (f.ara ? 1 : 0) > 0 && (
                    <Link className="dugme dugme--sade" href="/ilanlar">
                      Tüm filtreleri temizle
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>
        </Form>
        <section className="il-onizleme" aria-label="Seçili ilan">
          {secili ? <IlanOnizleme id={secili} /> : null}
        </section>
      </main>
    </>
  )
}
