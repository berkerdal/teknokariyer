import { DENEYIM_ADI } from '@/alan/eslesme'
import type { FirmaOzeti, IlanAyrintisi } from '@/veri/ilanlar'
import { FirmaKaro } from './FirmaKaro'
import { IlanOzetListesi, Metin } from './IlanParcalari'
import { BeceriListesi } from './IlanSatiri'

const EGITIM_ADI: Record<string, string> = { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans', 'yuksek-lisans': 'Yüksek lisans', doktora: 'Doktora' }

/** İlanın adayların göreceği gövdesi (firma önizlemesi ve Yönetici A.Ş. onay ekranı aynı çizimi kullanır). */
export function IlanGovdesi({ a, f, sorular }: { a: IlanAyrintisi; f: FirmaOzeti; sorular?: string[] }) {
  return (
    <>
      <div className="il-bas">
        <FirmaKaro konum={f.konum} boy={40} />
        <div>
          <p>
            <strong>{f.ad}</strong>
          </p>
          <p className="kucuk ikincil">{[f.sektor, f.konum].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <h2 className="b2">{a.pozisyonAdi}</h2>
      <IlanOzetListesi ilan={a} />
      <h3 className="b3 kare-bas">Ne yapacaksın?</h3>
      <Metin metin={a.isTanimi} />
      <h3 className="b3 kare-bas">Aranan nitelikler</h3>
      <Metin metin={a.nitelikler} />
      <p>
        <strong>Deneyim:</strong> {DENEYIM_ADI[a.deneyim]}
      </p>
      <p>
        <strong>Eğitim:</strong> {EGITIM_ADI[a.egitim] ?? a.egitim}
        {a.bolumler.length ? ` · ${a.bolumler.join(', ')}` : ''}
      </p>
      {a.diller.length > 0 && (
        <p>
          <strong>Dil:</strong> {a.diller.map((d) => `${d.dil} ${d.seviye}`).join(', ')}
        </p>
      )}
      <h3 className="b3 kare-bas">Beceriler</h3>
      <BeceriListesi zorunlu={a.zorunluBeceriler} tercih={a.tercihBeceriler} />
      {a.yanHaklar.length > 0 && (
        <>
          <h3 className="b3 kare-bas">Yan haklar</h3>
          <ul className="madde">
            {a.yanHaklar.map((y) => (
              <li key={y}>{y}</li>
            ))}
          </ul>
        </>
      )}
      {sorular?.length ? (
        <>
          <h3 className="b3 kare-bas">Ön eleme soruları</h3>
          <ol className="madde">
            {sorular.map((s, n) => (
              <li key={n}>{s}</li>
            ))}
          </ol>
        </>
      ) : (
        a.soruSayisi > 0 && <p className="kucuk ikincil">Başvururken adaya {a.soruSayisi} ön eleme sorusu sorulur.</p>
      )}
    </>
  )
}
