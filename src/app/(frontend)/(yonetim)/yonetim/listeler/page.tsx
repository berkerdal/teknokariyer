import type { Metadata } from 'next'
import Link from 'next/link'
import { TALEP_TUR_ADI } from '@/alan/talep'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { ListeEkleFormu, ListeOgesi } from '@/arayuz/yonetim/Listeler'
import { LISTE_TURLERI, type ListeTuru } from '@/servisler/listeler'
import { listeOgeleri, listeSayilari } from '@/veri/listeler'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Listeler · Yönetim' }

type Props = { searchParams: Promise<{ tur?: string; ara?: string; sayfa?: string; secilemez?: string }> }

const buyuk = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1)

export default async function Listeler({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/listeler')
  const sp = await searchParams
  const tur: ListeTuru = LISTE_TURLERI.includes(sp.tur as ListeTuru) ? (sp.tur as ListeTuru) : 'beceri'
  const [sayilar, liste] = await Promise.all([listeSayilari(), listeOgeleri(tur, sp.ara ?? '', Number(sp.sayfa) || 1, sp.secilemez === '1')])
  const ad = TALEP_TUR_ADI[tur]!
  const yonetici = yoneticiMi(k)
  const adres = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ tur, ara: sp.ara, secilemez: sp.secilemez, ...q }).filter(([, v]) => v) as Array<[string, string]>)
    return `/yonetim/listeler?${p}`
  }
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Listeler</h1>
          <p className="ikincil">İlanlarda, aday profillerinde ve filtrelerde kullanılan seçim listeleri.</p>
        </div>
        <Link className="dugme dugme--ikincil dugme--kucuk" href="/yonetim/talepler">
          Liste talepleri
        </Link>
      </div>
      <ModulBilgisi kimlik="yonetim-listeler" baslik="Listeler neden önemli?">
        <p>
          Firma ilanında “React” seçer, aday profilinde “React” seçerse portal ikisini eşleştirir. Aynı şey iki farklı yazımla listede olursa eşleşme
          bozulur. Bu yüzden listeleri dikkatle yönetin.
        </p>
        <ul>
          <li>
            <strong>Silme yok:</strong> Kullanılmasını istemediğiniz öğeyi “seçilemez” yapın. Eski ilanlarda ve profillerde görünmeye devam eder, yeni
            seçimlerde çıkmaz.
          </li>
          <li>
            <strong>Eş anlamlılar:</strong> Aynı şeyin farklı yazımlarını (JS, JavaScript) ayrı öğe olarak eklemeyin; birini ana ad yapıp diğerlerini eş
            anlamlı olarak yazın. Aramada ikisi de aynı öğeyi bulur.
          </li>
          <li>Firmaların ve adayların eklenmesini istediği öğeler “Liste talepleri” sayfasına düşer.</li>
        </ul>
      </ModulBilgisi>

      <nav className="sekmeler y-suzgec" aria-label="Liste türü">
        {LISTE_TURLERI.map((t) => (
          <Link key={t} href={`/yonetim/listeler?tur=${t}`} aria-current={t === tur ? 'page' : undefined}>
            {buyuk(TALEP_TUR_ADI[t]!.cogul)} <span className="kucuk">({sayilar[t]?.toplam ?? 0})</span>
          </Link>
        ))}
      </nav>

      <div className="y-iki">
        <section className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">{buyuk(ad.cogul)}</h2>
            <span className="kucuk ikincil">
              {liste.toplam} öğe{sayilar[tur]?.secilemez ? ` · ${sayilar[tur]!.secilemez} seçilemez` : ''}
            </span>
          </header>
          <div className="panel-ic y-firma-suzgec">
            <form action="/yonetim/listeler" className="y-ara">
              <input type="hidden" name="tur" value={tur} />
              <label htmlFor="liste-ara" className="gizli">
                {buyuk(ad.cogul)} içinde ara
              </label>
              <input id="liste-ara" name="ara" className="girdi" placeholder="Ara" defaultValue={sp.ara ?? ''} />
              <button className="dugme dugme--ikincil dugme--kucuk" type="submit">
                Ara
              </button>
            </form>
            <p className="kucuk">
              {sp.secilemez === '1' ? <Link href={adres({ secilemez: undefined, sayfa: undefined })}>Hepsini göster</Link> : <Link href={adres({ secilemez: '1', sayfa: undefined })}>Yalnızca seçilemezleri göster</Link>}
            </p>
          </div>
          {liste.ogeler.length === 0 ? (
            <p className="panel-ic ikincil">Bu aramaya uyan öğe yok.</p>
          ) : (
            <div className="y-oge-listesi">
              {liste.ogeler.map((o) =>
                yonetici ? (
                  <ListeOgesi key={o.id} oge={o} />
                ) : (
                  <p key={o.id} className="y-oge-satir">
                    {o.ad}
                  </p>
                ),
              )}
            </div>
          )}
          {liste.sayfaSayisi > 1 && (
            <nav className="panel-ic y-sayfalar" aria-label="Sayfalar">
              {liste.sayfa > 1 && <Link href={adres({ sayfa: String(liste.sayfa - 1) })}>Önceki</Link>}
              <span className="kucuk">
                Sayfa {liste.sayfa} / {liste.sayfaSayisi}
              </span>
              {liste.sayfa < liste.sayfaSayisi && <Link href={adres({ sayfa: String(liste.sayfa + 1) })}>Sonraki</Link>}
            </nav>
          )}
        </section>
        {yonetici && (
          <section className="panel panel-ic">
            <ListeEkleFormu tur={tur} turAdi={ad.tekil} />
          </section>
        )}
      </div>
    </>
  )
}
