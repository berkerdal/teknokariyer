/**
 * Eğitim bilgilerinin okunur görünümü (LinkedIn usulü): okul, düzey ve bölüm, yıllar, sınıf ve not ortalaması.
 * Aday profili, firmanın başvuru ekranı ve havuz profili aynı bileşeni kullanır.
 */
import { EGITIM_DUZEYI_ADI, egitimleriSirala } from '@/alan/egitim'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export interface EgitimGorunumu {
  duzey: string
  okul: string | null
  bolum: string | null
  baslangicYil: number | null
  bitisAy: number | null
  bitisYil: number | null
  devam: boolean
  sinif: string | null
  gano: number | null
}

const adi = (x: unknown) => (x && typeof x === 'object' ? String((x as { ad?: unknown }).ad ?? '') || null : typeof x === 'string' ? x : null)

/** Profil kaydını (ilişkiler dolu) veya başvuru kopyasını (adlar) görünüme çevirir. */
export function egitimGorunumu(e: Record<string, unknown>): EgitimGorunumu {
  return {
    duzey: String(e.duzey ?? ''),
    okul: adi(e.okul) ?? ((e.okulAdi as string) || null),
    bolum: adi(e.bolum),
    baslangicYil: (e.baslangicYil as number) ?? null,
    bitisAy: (e.bitisAy as number) ?? null,
    bitisYil: (e.bitisYil as number) ?? null,
    devam: Boolean(e.devam),
    sinif: (e.sinif as string) ?? null,
    gano: e.gano == null ? null : Number(e.gano),
  }
}

export function EgitimListesi({ egitimler }: { egitimler: EgitimGorunumu[] }) {
  return (
    <ul className="sf-liste">
      {egitimleriSirala(egitimler).map((e, n) => {
        const bitis = e.bitisYil ? `${e.bitisAy ? `${AYLAR[e.bitisAy - 1]} ` : ''}${e.bitisYil}` : ''
        const yillar = e.devam
          ? [e.baslangicYil ? `${e.baslangicYil}’den beri` : 'Devam ediyor', bitis && `beklenen mezuniyet ${bitis}`].filter(Boolean).join(' · ')
          : [e.baslangicYil, bitis].filter(Boolean).join(' – ')
        return (
          <li key={n} className="sf-oge">
            <span className="sf-simge eg-simge" aria-hidden="true">
              {(EGITIM_DUZEYI_ADI[e.duzey] ?? '?').charAt(0)}
            </span>
            <div className="sf-govde">
              <p className="sf-ad">{e.okul ?? 'Okul belirtilmedi'}</p>
              <p className="sf-kurum">{[EGITIM_DUZEYI_ADI[e.duzey], e.bolum].filter(Boolean).join(' · ')}</p>
              {(yillar || e.sinif || e.gano != null) && (
                <p className="kucuk ikincil">
                  {[yillar, e.devam && e.sinif, e.gano != null && `Not ortalaması: ${String(e.gano).replace('.', ',')}`].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
