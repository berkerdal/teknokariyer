import type { Metadata } from 'next'
import Link from 'next/link'
import { CINSIYET_ADI, GORUNURLUK_ADI } from '@/alan/havuz'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { HavuzSuzgeci } from '@/arayuz/firma/HavuzSuzgeci'
import { firmaYetkisiVarMi } from '@/erisim'
import { havuzAra } from '@/servisler/havuz'
import { firmaOturumu, ilanFormuSecenekleri } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'CV havuzu · Firma paneli' }

type Props = { searchParams: Promise<{ beceri?: string | string[]; kosul?: string }> }

/** CV havuzu araması (K24, K25): liste anonimdir; profil açılınca ad, iletişim ve CV görünür ve açılış kayda geçer. */
export default async function Havuz({ searchParams }: Props) {
  const k = await firmaOturumu('/firma-paneli/havuz')
  const p = await searchParams
  const yetki = firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])
  const { beceriler } = await ilanFormuSecenekleri()
  const seciliIdler = [...new Set([p.beceri ?? []].flat().map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 15)
  const secili = beceriler.filter((b) => seciliIdler.includes(b.id))
  const kosul = p.kosul === 'herhangi' ? 'herhangi' : 'hepsi'
  const payload = await payloadAl()
  const [tumu, sonuc] = yetki
    ? await Promise.all([havuzAra(payload, k, {}), seciliIdler.length ? havuzAra(payload, k, { beceriler: seciliIdler, beceriKosulu: kosul }) : null])
    : [[], null]
  const liste = sonuc ?? tumu

  return (
    <>
      <div className="f-bas">
        <div>
          <h1 className="b1">CV havuzu</h1>
          {yetki && (
            <p className="ikincil">
              Havuzda şu anda <strong>{tumu.length} aday</strong> var. Bu adaylar firmaların kendilerini bulmasına açık rızayla izin verdi.
            </p>
          )}
        </div>
      </div>
      <ModulBilgisi kimlik="firma-havuz" baslik="CV havuzu nasıl çalışır?">
        <ul>
          <li>İlan açmadan aday arayabilirsiniz. Listede adayın adı ve iletişim bilgisi gizlidir; her aday bir kodla görünür.</li>
          <li>“Profili aç” dediğinizde ad, iletişim bilgisi ve CV görünür. Aday buna havuza katılırken izin verdi; ayrıca sorulmaz.</li>
          <li>Her profil açılışı kayda geçer. Aday, profiline bakan firmaların adını değil yalnızca sayısını görür.</li>
          <li>Cinsiyet bilgisi, aday paylaştıysa görünür; ancak aramada ve sıralamada kullanılmaz.</li>
        </ul>
      </ModulBilgisi>

      {!yetki ? (
        <p className="uyari-kutu">CV havuzunda arama yetkiniz yok. Firma yöneticinizden “İlan sorumlusu” veya “Tam yetkili” yetkisi isteyin.</p>
      ) : (
        <>
          <HavuzSuzgeci beceriler={beceriler} secili={secili} kosul={kosul} />
          <p className="kucuk">
            <strong>{liste.length} aday</strong>
            {secili.length ? ` · ${secili.map((s) => s.ad).join(kosul === 'hepsi' ? ' ve ' : ' veya ')} becerisi olanlar` : ''}
          </p>
          {liste.length === 0 ? (
            <p className="ikincil">
              {tumu.length === 0 ? 'Havuzda henüz aday yok.' : 'Bu becerilerle eşleşen aday yok. Koşulu “Herhangi biri” yapmayı veya beceri sayısını azaltmayı deneyin.'}
            </p>
          ) : (
            <ul className="havuz-liste">
              {liste.map((a) => (
                <li key={a.id} className="havuz-kart panel">
                  <div className="havuz-kart-bas">
                    <p className="ust-etiket">
                      {a.kod || 'Aday'} · {GORUNURLUK_ADI[a.gorunurluk]}
                    </p>
                    <p>
                      <strong>{[a.bolum, a.okul].filter(Boolean).join(', ') || 'Eğitim bilgisi yok'}</strong>
                    </p>
                  </div>
                  <dl className="ozet-dl kucuk">
                    {a.mezuniyetYili && (
                      <div>
                        <dt>Mezuniyet</dt>
                        <dd>{a.mezuniyetYili}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Beceriler</dt>
                      <dd>{a.beceriler.join(', ') || '—'}</dd>
                    </div>
                    {a.diller.length > 0 && (
                      <div>
                        <dt>Dil</dt>
                        <dd>{a.diller.join(', ')}</dd>
                      </div>
                    )}
                    {a.tercih && (
                      <div>
                        <dt>Tercih</dt>
                        <dd>{a.tercih}</dd>
                      </div>
                    )}
                    {a.baslama && (
                      <div>
                        <dt>Başlama</dt>
                        <dd>{a.baslama}</dd>
                      </div>
                    )}
                    {a.cinsiyet && (
                      <div>
                        <dt>Cinsiyet</dt>
                        <dd>{CINSIYET_ADI[a.cinsiyet]}</dd>
                      </div>
                    )}
                  </dl>
                  <Link className="dugme dugme--kucuk" href={`/firma-paneli/havuz/${a.id}`}>
                    Profili aç<span className="gizli">: {a.kod}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
