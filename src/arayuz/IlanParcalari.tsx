import Link from 'next/link'
import { ALT_TUR_ADI, TUR_ADI } from '@/alan/ilanFiltre'
import { DENEYIM_ADI, MODEL_ADI, eslesmeHesapla, type EslesmeProfili } from '@/alan/eslesme'
import { basvuruAraligi } from '@/alan/havuz'
import { kalanGun } from '@/alan/ilan'
import type { IlanAyrintisi } from '@/veri/ilanlar'
import { tarihYaz, ucretYaz } from './bicim'

export function IlanEtiketleri({ ilan, uzun = false }: { ilan: IlanAyrintisi; uzun?: boolean }) {
  const alt = ALT_TUR_ADI[ilan.altTur] ?? ilan.altTur
  return (
    <p className="etiketler">
      <span className="etiket etiket--guclu">{uzun ? `${TUR_ADI[ilan.tur]} · ${alt}` : alt}</span>
      <span className="etiket">{MODEL_ADI[ilan.model]}</span>
      <span className="etiket">{DENEYIM_ADI[ilan.deneyim]}</span>
      {ilan.staj?.ucretli && <span className="etiket">{uzun ? 'Ücretli staj' : 'Ücretli'}</span>}
      {ilan.pauOncelik && <span className="etiket">PAÜ öğrencisine öncelik</span>}
    </p>
  )
}

const MODEL_ACIKLAMA: Record<string, string> = {
  ofiste: 'Ofiste (Teknokent’te)',
  hibrit: 'Hibrit (ofiste ve uzaktan)',
  uzaktan: 'Uzaktan',
}

/** “Tam zamanlı iş”, “Zorunlu staj”: ilan türü ve çalışma şekli tek ifadede. */
export function ilanTuruMetni(ilan: Pick<IlanAyrintisi, 'tur' | 'altTur'>): string {
  const alt = ALT_TUR_ADI[ilan.altTur] ?? ilan.altTur
  return ilan.tur === 'staj' ? alt : `${alt} iş`
}

/** İlanın özet bilgileri. Başvuru sayısı aralıkla gösterilir (K23); görüntülenme herkese açık sayfada yok. */
export function IlanOzetListesi({ ilan, kisa = false }: { ilan: IlanAyrintisi; kisa?: boolean }) {
  const k = kalanGun(new Date(ilan.sonBasvuru), new Date())
  const ucret = ucretYaz(ilan.ucret)
  return (
    <dl className="ozet-dl">
      <div>
        <dt>Son başvuru</dt>
        <dd>
          {tarihYaz(ilan.sonBasvuru, true)}{' '}
          <span className="ikincil">({k === 0 ? 'son gün' : kisa ? `${k} gün` : `${k} gün kaldı`})</span>
        </dd>
      </div>
      {ilan.yayinTarihi && (
        <div>
          <dt>{kisa ? 'Yayın' : 'Yayın tarihi'}</dt>
          <dd>{tarihYaz(ilan.yayinTarihi, !kisa)}</dd>
        </div>
      )}
      {!kisa && (
        <>
          <div>
            <dt>İlan türü</dt>
            <dd>{ilanTuruMetni(ilan)}</dd>
          </div>
          <div>
            <dt>Çalışma modeli</dt>
            <dd>{MODEL_ACIKLAMA[ilan.model] ?? MODEL_ADI[ilan.model]}</dd>
          </div>
          <div>
            <dt>Aranan deneyim</dt>
            <dd>{DENEYIM_ADI[ilan.deneyim]}</dd>
          </div>
          {ilan.pauOncelik && (
            <div>
              <dt>Öncelik</dt>
              <dd>Pamukkale Üniversitesi öğrencilerine öncelik veriliyor</dd>
            </div>
          )}
          <div>
            <dt>Konum</dt>
            <dd>Pamukkale Teknokent, {ilan.firma.konum}</dd>
          </div>
          <div>
            <dt>Pozisyon sayısı</dt>
            <dd>{ilan.pozisyonSayisi}</dd>
          </div>
        </>
      )}
      {ucret && (
        <div>
          <dt>Ücret</dt>
          <dd>{ucret}</dd>
        </div>
      )}
      {!kisa && (
        <div>
          <dt>Başvuru</dt>
          <dd>{basvuruAraligi(ilan.basvuruSayisi)}</dd>
        </div>
      )}
    </dl>
  )
}

/** “Senin profilinle”: puan değil, gerekçeli liste. Profil yoksa giriş/profil daveti. */
export function EslesmeKutusu({ ilan, profil, girisli }: { ilan: IlanAyrintisi; profil: EslesmeProfili | null; girisli: boolean }) {
  if (!profil) {
    return (
      <div className="eslesme-kutu">
        <p className="ust-etiket">Senin profilinle</p>
        <p className="kucuk">
          {girisli ? (
            <>
              Bu ilanın becerilerini profilinle karşılaştırabilmemiz için önce <Link href="/hesabim/profil">profilini doldur</Link>.
            </>
          ) : (
            <>
              <Link href={`/giris?donus=${encodeURIComponent(`/ilan/${ilan.id}`)}`}>Giriş yaparsan</Link> bu ilanın aradığı becerileri profilinle
              karşılaştırır, hangilerinin profilinde bulunduğunu gösteririz.
            </>
          )}
        </p>
      </div>
    )
  }
  const e = eslesmeHesapla(
    { zorunluBeceriler: ilan.zorunluBeceriler, tercihBeceriler: ilan.tercihBeceriler, model: ilan.model, bolumler: ilan.bolumler, deneyim: ilan.deneyim, diller: ilan.diller },
    profil,
    'aday',
  )
  return (
    <div className="eslesme-kutu">
      <p className="ust-etiket">Senin profilinle</p>
      <ul className="eslesme">
        {e.satirlar.map((s) => (
          <li key={s.metin} className={s.durum}>
            {s.metin}
          </li>
        ))}
      </ul>
      {e.eksikZorunlu.length > 0 && (
        <p className="kucuk">
          Bu beceriler sende varsa <Link href="/hesabim/profil#beceriler">profiline ekleyebilirsin</Link>.
        </p>
      )}
    </div>
  )
}

/** Uzun metni paragraflara ve maddelere ayırır (satır başında “-” veya “•” madde sayılır). */
export function Metin({ metin }: { metin: string }) {
  const bloklar = metin.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <>
      {bloklar.map((b, n) => {
        const satirlar = b.split('\n').map((s) => s.trim()).filter(Boolean)
        if (satirlar.every((s) => /^[-•*]\s+/.test(s)))
          return (
            <ul key={n} className="madde">
              {satirlar.map((s, m) => (
                <li key={m}>{s.replace(/^[-•*]\s+/, '')}</li>
              ))}
            </ul>
          )
        return <p key={n}>{satirlar.join(' ')}</p>
      })}
    </>
  )
}
