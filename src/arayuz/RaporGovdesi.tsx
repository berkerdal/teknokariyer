/** Raporun ekran ve baskı gövdesi (Yönetici A.Ş. ve firma raporları ortak kullanır). */
import type { Rapor } from '@/veri/raporlar'

const yaz = (x: string | number | null) => (x === null ? '—' : typeof x === 'number' ? x.toLocaleString('tr-TR') : x)

export function RaporGovdesi({ rapor: r }: { rapor: Pick<Rapor, 'ozet' | 'tablolar' | 'notlar'> }) {
  return (
    <>
      <section className="ozet-serit" aria-label="Özet">
        {r.ozet.map((o) => (
          <div key={o.ad} className="ozet-kutu">
            <p className="ozet-ad">{o.ad}</p>
            <p className="ozet-deger">{yaz(o.deger)}</p>
            <p className="ozet-tanim">{o.tanim}</p>
          </div>
        ))}
      </section>
      {r.tablolar.map((t) => (
        <section key={t.baslik} className="panel rapor-tablo">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3 kare-bas">{t.baslik}</h2>
            {t.aciklama && <span className="kucuk ikincil">{t.aciklama}</span>}
          </header>
          {t.satirlar.length === 0 ? (
            <p className="panel-ic ikincil">{t.bos ?? 'Bu dönem için kayıt yok.'}</p>
          ) : (
            <div className="tablo-kap">
              <table className="tablo y-tablo">
                <thead>
                  <tr>
                    {t.sutunlar.map((s) => (
                      <th key={s.ad} scope="col" className={s.sayi ? 'sag' : undefined}>
                        {s.ad}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.satirlar.map((satir, i) => (
                    <tr key={i}>
                      {satir.map((h, j) => (
                        <td key={j} className={t.sutunlar[j]?.sayi ? 'sag sayi' : undefined}>
                          {yaz(h)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      {r.notlar.length > 0 && (
        <section className="rapor-notlar">
          <h2 className="b4">Notlar</h2>
          <ul>
            {r.notlar.map((n) => (
              <li key={n} className="kucuk">
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
