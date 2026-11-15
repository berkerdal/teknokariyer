/**
 * Filtre grubu (kullanıcı isteği, 15.11.2026; kariyer.net ve sahibinden usulü): başlığa tıklayınca açılıp kapanır,
 * seçenekler onay kutulu sade satırlar ve sağda ilan sayısı. Uzun listelerde seçili olanlar ve ilk beşi görünür,
 * gerisi “Tümünü göster” ile açılır. Seçili sayısı başlıkta yazar. Seçim değişince form kendiliğinden gönderilir
 * (FiltrePaneli).
 */
import type { Faset } from '@/alan/ilanFiltre'
import { Ikon } from './Ikon'

const ILK = 5

function Secenek({ k, s }: { k: string; s: Faset['secenekler'][number] }) {
  const pasif = !s.sayi && !s.secili
  return (
    <label className="fg-satir" data-pasif={pasif || undefined}>
      <input type="checkbox" name={k} value={s.deger} defaultChecked={s.secili} disabled={pasif} />
      <span className="fg-kutu" aria-hidden="true">
        <Ikon ad="tik" kucuk />
      </span>
      <span className="fg-ad">{s.ad}</span>
      <span className="fg-sayi">{s.sayi}</span>
    </label>
  )
}

export function FiltreGrubu({ g, acik = true }: { g: Pick<Faset, 'ad' | 'secenekler'> & { k: string }; acik?: boolean }) {
  const seciliSayi = g.secenekler.filter((s) => s.secili).length
  // Seçili olanlar her zaman görünür; kalan yer ilk seçeneklerle dolar.
  const gorunen = g.secenekler.filter((s, n) => s.secili || n < ILK)
  const gizli = g.secenekler.filter((s) => !gorunen.includes(s))
  return (
    <details className="fg" open={acik || seciliSayi > 0}>
      <summary>
        <span className="fg-baslik">{g.ad}</span>
        {seciliSayi > 0 && <span className="fg-secili">{seciliSayi}</span>}
        <span className="fg-ok" aria-hidden="true">
          <Ikon ad="ileri" kucuk />
        </span>
      </summary>
      <fieldset className="fg-govde">
        <legend className="gizli">{g.ad}</legend>
        {gorunen.map((s) => (
          <Secenek key={s.deger} k={g.k} s={s} />
        ))}
        {gizli.length > 0 && (
          <details className="fg-daha">
            <summary>
              <span className="fg-daha-ac">Tümünü göster ({g.secenekler.length})</span>
              <span className="fg-daha-kapat">Daha az göster</span>
            </summary>
            {gizli.map((s) => (
              <Secenek key={s.deger} k={g.k} s={s} />
            ))}
          </details>
        )}
      </fieldset>
    </details>
  )
}
