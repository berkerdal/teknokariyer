'use client'
/**
 * Satır listesi düzenleyici: iş deneyimi, sertifika, bağlantı gibi tekrar eden kayıtlar.
 * Değer gizli bir JSON alanıyla gönderilir; denetim sunucuda yapılır (src/alan/profilFormu.ts).
 */
import { useState } from 'react'
import { Ikon } from '../Ikon'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const BU_YIL = new Date().getFullYear()

export type SatirAlani =
  | { ad: string; etiket: string; tip: 'metin' | 'adres' | 'uzunMetin'; zorunlu?: boolean; ipucu?: string; ornek?: string }
  | { ad: string; etiket: string; tip: 'yil'; zorunlu?: boolean }
  | { ad: string; etiket: string; tip: 'ayYil'; zorunlu?: boolean; gizleEger?: string }
  | { ad: string; etiket: string; tip: 'onay' }

type Satir = Record<string, string | number | boolean | null | undefined>

export function SatirListesi(props: {
  /** Gizli JSON alanının adı (örneğin deneyimlerJson). */
  ad: string
  /** Hata anahtarı öneki (deneyim-0, sertifika-1…). */
  hataOneki: string
  /** Bir satırın adı: “deneyim”, “sertifika”, “bağlantı”. */
  satirAdi: string
  ekleMetni: string
  bosMetin: string
  alanlar: SatirAlani[]
  baslangic: Satir[]
  enFazla: number
}) {
  const [satirlar, setSatirlar] = useState<Satir[]>(props.baslangic)
  const degistir = (n: number, alan: string, deger: Satir[string]) => setSatirlar(satirlar.map((s, m) => (m === n ? { ...s, [alan]: deger } : s)))
  return (
    <div className="satir-listesi">
      <input type="hidden" name={props.ad} value={JSON.stringify(satirlar)} />
      {satirlar.length === 0 && <p className="ikincil">{props.bosMetin}</p>}
      {satirlar.map((s, n) => (
        <fieldset key={n} className="satir-kart" id={`${props.hataOneki}-${n}`}>
          <legend className="gizli">
            {n + 1}. {props.satirAdi}
          </legend>
          {props.alanlar.map((a) => {
            const id = `${props.ad}-${n}-${a.ad}`
            if (a.tip === 'onay')
              return (
                <label key={a.ad} className="secenek">
                  <input type="checkbox" checked={Boolean(s[a.ad])} onChange={(e) => degistir(n, a.ad, e.target.checked)} /> <span>{a.etiket}</span>
                </label>
              )
            if (a.tip === 'ayYil') {
              if (a.gizleEger && s[a.gizleEger]) return null
              return (
                <fieldset key={a.ad} className="alan">
                  <legend>
                    {a.etiket} {!a.zorunlu && <span className="istege-bagli">(isteğe bağlı)</span>}
                  </legend>
                  <div className="iki-alan">
                    <select aria-label={`${a.etiket}: ay`} className="secim" value={String(s[`${a.ad}Ay`] ?? '')} onChange={(e) => degistir(n, `${a.ad}Ay`, Number(e.target.value) || null)}>
                      <option value="">Ay</option>
                      {AYLAR.map((ay, i) => (
                        <option key={ay} value={i + 1}>
                          {ay}
                        </option>
                      ))}
                    </select>
                    <select aria-label={`${a.etiket}: yıl`} className="secim" value={String(s[`${a.ad}Yil`] ?? '')} onChange={(e) => degistir(n, `${a.ad}Yil`, Number(e.target.value) || null)}>
                      <option value="">Yıl</option>
                      {Array.from({ length: 45 }, (_, i) => BU_YIL + 1 - i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>
              )
            }
            return (
              <div key={a.ad} className="alan">
                <label htmlFor={id}>
                  {a.etiket} {!a.zorunlu && <span className="istege-bagli">(isteğe bağlı)</span>}
                </label>
                {'ipucu' in a && a.ipucu && <span className="ipucu">{a.ipucu}</span>}
                {a.tip === 'uzunMetin' ? (
                  <textarea id={id} className="metin-alani" maxLength={1000} value={String(s[a.ad] ?? '')} onChange={(e) => degistir(n, a.ad, e.target.value)} />
                ) : (
                  <input
                    id={id}
                    className="girdi"
                    inputMode={a.tip === 'yil' ? 'numeric' : a.tip === 'adres' ? 'url' : undefined}
                    maxLength={a.tip === 'yil' ? 4 : 300}
                    placeholder={'ornek' in a ? a.ornek : undefined}
                    value={String(s[a.ad] ?? '')}
                    onChange={(e) => degistir(n, a.ad, e.target.value)}
                  />
                )}
              </div>
            )
          })}
          <button type="button" className="dugme dugme--sade dugme--kucuk satir-sil" onClick={() => setSatirlar(satirlar.filter((_, m) => m !== n))}>
            <Ikon ad="kapat" kucuk /> Bu {props.satirAdi} kaydını kaldır
          </button>
        </fieldset>
      ))}
      {satirlar.length < props.enFazla && (
        <button type="button" className="dugme dugme--ikincil dugme--kucuk" onClick={() => setSatirlar([...satirlar, {}])}>
          <Ikon ad="arti" kucuk /> {props.ekleMetni}
        </button>
      )}
    </div>
  )
}
