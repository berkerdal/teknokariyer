/**
 * Sertifikaların okunur görünümü (LinkedIn usulü): ad, veren kurum, veriliş ve geçerlilik, kimlik numarası, doğrulama
 * bağlantısı, belge ve ilgili beceriler. Aday profili, firmanın başvuru ekranı ve havuz profili aynı bileşeni kullanır.
 */
import { Ikon } from './Ikon'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export interface SertifikaGorunumu {
  ad: string
  kurum?: string | null
  ay?: number | null
  yil?: number | null
  bitisAy?: number | null
  bitisYil?: number | null
  suresiz?: boolean | null
  kimlikNo?: string | null
  url?: string | null
  beceriler?: string[]
  dosya?: number | null
}

const kimlik = (x: unknown) => (x && typeof x === 'object' ? Number((x as { id?: unknown }).id) : Number(x)) || null
const adi = (x: unknown) => (x && typeof x === 'object' ? String((x as { ad?: unknown }).ad ?? '') : typeof x === 'string' ? x : '')

/** Profil kaydını (ilişkiler dolu veya kimlik) ya da başvuru kopyasını görünüme çevirir. */
export function sertifikaGorunumu(s: Record<string, unknown>): SertifikaGorunumu {
  return {
    ad: String(s.ad ?? ''),
    kurum: (s.kurum as string) ?? null,
    ay: (s.ay as number) ?? null,
    yil: (s.yil as number) ?? null,
    bitisAy: (s.bitisAy as number) ?? null,
    bitisYil: (s.bitisYil as number) ?? null,
    suresiz: Boolean(s.suresiz),
    kimlikNo: (s.kimlikNo as string) ?? null,
    url: (s.url as string) ?? null,
    beceriler: (Array.isArray(s.beceriler) ? s.beceriler : []).map(adi).filter(Boolean),
    dosya: kimlik(s.dosya),
  }
}

const tarih = (ay?: number | null, yil?: number | null) => (yil ? `${ay ? `${AYLAR[ay - 1]} ` : ''}${yil}` : '')

/** Geçerlilik bitişi geçtiyse true (ayın sonuna kadar geçerli sayılır). */
function suresiDolduMu(s: SertifikaGorunumu, simdi: Date): boolean {
  if (s.suresiz || !s.bitisYil) return false
  const bitis = Date.UTC(s.bitisYil, s.bitisAy ?? 12, 1) // bitiş ayının ertesi ayının başı
  return simdi.getTime() >= bitis
}

export function SertifikaListesi({ sertifikalar, belgeAdresi, simdi = new Date() }: { sertifikalar: SertifikaGorunumu[]; belgeAdresi?: (dosya: number) => string; simdi?: Date }) {
  return (
    <ul className="sf-liste">
      {sertifikalar.map((s, n) => {
        const verilis = tarih(s.ay, s.yil)
        const bitis = tarih(s.bitisAy, s.bitisYil)
        const doldu = suresiDolduMu(s, simdi)
        return (
          <li key={n} className="sf-oge">
            <span className="sf-simge" aria-hidden="true">
              <Ikon ad="tik" kucuk />
            </span>
            <div className="sf-govde">
              <p className="sf-ad">{s.ad}</p>
              {s.kurum && <p className="sf-kurum">{s.kurum}</p>}
              {(verilis || bitis || s.suresiz) && (
                <p className="kucuk ikincil">
                  {[verilis && `Veriliş: ${verilis}`, s.suresiz ? 'Süresi dolmaz' : bitis && `Geçerlilik: ${bitis}`].filter(Boolean).join(' · ')}
                  {doldu && (
                    <>
                      {' '}
                      <span className="rozet rozet--kiremit">Süresi doldu</span>
                    </>
                  )}
                </p>
              )}
              {s.kimlikNo && <p className="kucuk ikincil">Kimlik numarası: {s.kimlikNo}</p>}
              {(s.url || (s.dosya && belgeAdresi)) && (
                <p className="sf-eylemler">
                  {s.url && (
                    <a className="dugme dugme--ikincil dugme--kucuk" href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                      Doğrula <Ikon ad="paylas" kucuk />
                      <span className="gizli"> (yeni sekmede açılır)</span>
                    </a>
                  )}
                  {s.dosya && belgeAdresi && (
                    <a className="dugme dugme--ikincil dugme--kucuk" href={belgeAdresi(s.dosya)} target="_blank" rel="noopener">
                      <Ikon ad="dosya" kucuk /> Belgeyi gör
                    </a>
                  )}
                </p>
              )}
              {s.beceriler && s.beceriler.length > 0 && (
                <p className="kucuk">
                  <span className="ikincil">Beceriler: </span>
                  {s.beceriler.join(' · ')}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
