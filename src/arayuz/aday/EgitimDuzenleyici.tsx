'use client'
/**
 * Eğitim düzenleyicisi (kullanıcı isteği, 15.11.2026; LinkedIn'deki “Eğitim” bölümü örnek alındı): birden çok eğitim
 * (lisans, yüksek lisans, çift ana dal…). Okul ve bölüm yazdıkça öneriyle seçilir. Değerler gizli JSON alanıyla
 * gönderilir; denetim ve “ana eğitim” seçimi sunucuda (src/alan/egitim.ts).
 */
import { useState } from 'react'
import { EGITIM_DUZEYLERI, EN_FAZLA_EGITIM } from '@/alan/egitim'
import { SINIFLAR } from '@/alan/basvuru'
import { Ikon } from '../Ikon'
import { TekSecimGirdisi } from '../TekSecimGirdisi'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const BU_YIL = new Date().getFullYear()

export interface EgitimTaslagi {
  duzey: string
  okul: number | null
  okulAdi: string
  bolum: number | null
  baslangicYil: number | null
  bitisAy: number | null
  bitisYil: number | null
  devam: boolean
  sinif: string
  gano: string
}

const BOS: EgitimTaslagi = { duzey: 'lisans', okul: null, okulAdi: '', bolum: null, baslangicYil: null, bitisAy: null, bitisYil: null, devam: false, sinif: '', gano: '' }

export function EgitimDuzenleyici(p: {
  baslangic: EgitimTaslagi[]
  okullar: Array<{ id: number; ad: string }>
  bolumler: Array<{ id: number; ad: string }>
  /** Listede yoksa “eklenmesini iste” düğmeleri (sunucuda hazırlanır) */
  talepler?: React.ReactNode
}) {
  const [satirlar, setSatirlar] = useState<EgitimTaslagi[]>(p.baslangic.length ? p.baslangic : [{ ...BOS }])
  const degis = (n: number, d: Partial<EgitimTaslagi>) => setSatirlar((x) => x.map((s, m) => (m === n ? { ...s, ...d } : s)))
  const yillar = (ileri: number) => Array.from({ length: 50 + ileri }, (_, i) => BU_YIL + ileri - i)
  return (
    <div className="satir-listesi">
      <input type="hidden" name="egitimlerJson" value={JSON.stringify(satirlar)} />
      <p className="ikincil kucuk">
        Birden çok eğitimin varsa (yüksek lisans, çift ana dal, önlisans gibi) hepsini ekleyebilirsin. Devam eden veya en son mezun olduğun eğitim, ilanlarla
        eşleşmende ana eğitim olarak kullanılır; bütün bölümlerin eşleşmede dikkate alınır.
      </p>
      {satirlar.map((s, n) => {
        const lise = s.duzey === 'lise'
        return (
          <fieldset key={n} className="satir-kart sf-kart" id={`egitim-${n}`}>
            <legend className="gizli">{n + 1}. eğitim</legend>
            <div className="alan">
              <label htmlFor={`egitim-${n}-duzey`}>Eğitim düzeyi</label>
              <select id={`egitim-${n}-duzey`} className="secim" value={s.duzey} onChange={(e) => degis(n, { duzey: e.target.value })}>
                {EGITIM_DUZEYLERI.map(([k, ad]) => (
                  <option key={k} value={k}>
                    {ad}
                  </option>
                ))}
              </select>
            </div>
            {lise ? (
              <div className="alan">
                <label htmlFor={`egitim-${n}-okulAdi`}>Okulun adı</label>
                <input id={`egitim-${n}-okulAdi`} className="girdi" value={s.okulAdi} maxLength={150} onChange={(e) => degis(n, { okulAdi: e.target.value })} />
              </div>
            ) : (
              <>
                <TekSecimGirdisi
                  id={`egitim-${n}-okul`}
                  etiket="Üniversite"
                  secenekler={p.okullar}
                  deger={s.okul}
                  degis={(okul) => degis(n, { okul })}
                  placeholder="Örneğin Pamukkale"
                />
                <TekSecimGirdisi
                  id={`egitim-${n}-bolum`}
                  etiket="Bölüm veya program"
                  secenekler={p.bolumler}
                  deger={s.bolum}
                  degis={(bolum) => degis(n, { bolum })}
                  placeholder="Örneğin Bilgisayar Mühendisliği"
                />
              </>
            )}
            <label className="secenek">
              <input type="checkbox" checked={s.devam} onChange={(e) => degis(n, { devam: e.target.checked })} /> <span>Hâlâ okuyorum</span>
            </label>
            <div className="iki-alan">
              <div className="alan">
                <label htmlFor={`egitim-${n}-bas`}>
                  Başlangıç yılı <span className="istege-bagli">(isteğe bağlı)</span>
                </label>
                <select id={`egitim-${n}-bas`} className="secim" value={s.baslangicYil ?? ''} onChange={(e) => degis(n, { baslangicYil: Number(e.target.value) || null })}>
                  <option value="">Yıl</option>
                  {yillar(0).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {s.devam && !lise && (
                <div className="alan">
                  <label htmlFor={`egitim-${n}-sinif`}>
                    Sınıf <span className="istege-bagli">(isteğe bağlı)</span>
                  </label>
                  <select id={`egitim-${n}-sinif`} className="secim" value={s.sinif} onChange={(e) => degis(n, { sinif: e.target.value })}>
                    <option value="">Seç</option>
                    {SINIFLAR.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <fieldset className="alan">
              <legend>
                {s.devam ? 'Beklenen mezuniyet' : 'Mezuniyet'} <span className="istege-bagli">(isteğe bağlı)</span>
              </legend>
              <div className="iki-alan">
                <select aria-label="Mezuniyet: ay" className="secim" value={s.bitisAy ?? ''} onChange={(e) => degis(n, { bitisAy: Number(e.target.value) || null })}>
                  <option value="">Ay</option>
                  {AYLAR.map((a, i) => (
                    <option key={a} value={i + 1}>
                      {a}
                    </option>
                  ))}
                </select>
                <select aria-label="Mezuniyet: yıl" className="secim" value={s.bitisYil ?? ''} onChange={(e) => degis(n, { bitisYil: Number(e.target.value) || null })}>
                  <option value="">Yıl</option>
                  {yillar(s.devam ? 8 : 0).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
            {!lise && (
              <div className="alan">
                <label htmlFor={`egitim-${n}-gano`}>
                  Not ortalaması (4 üzerinden) <span className="istege-bagli">(isteğe bağlı)</span>
                </label>
                <input id={`egitim-${n}-gano`} className="girdi girdi--kisa" inputMode="decimal" placeholder="Örneğin 3,12" value={s.gano} onChange={(e) => degis(n, { gano: e.target.value })} />
              </div>
            )}
            {satirlar.length > 1 && (
              <div className="sf-sil">
                <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setSatirlar((x) => x.filter((_, m) => m !== n))}>
                  <Ikon ad="cop" kucuk /> Bu eğitimi sil
                </button>
              </div>
            )}
          </fieldset>
        )
      })}
      {satirlar.length < EN_FAZLA_EGITIM && (
        <button type="button" className="dugme dugme--ikincil" onClick={() => setSatirlar((x) => [...x, { ...BOS, duzey: 'yuksek-lisans' }])}>
          <Ikon ad="arti" kucuk /> Eğitim ekle
        </button>
      )}
      {p.talepler}
    </div>
  )
}
