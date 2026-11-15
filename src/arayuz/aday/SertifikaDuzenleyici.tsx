'use client'
/**
 * Sertifika düzenleyicisi (kullanıcı isteği, 15.11.2026; LinkedIn'deki “Lisans ve sertifikalar” formu örnek alındı):
 * ad, veren kurum, veriliş tarihi, geçerlilik bitişi veya “süresi dolmaz”, sertifika kimlik numarası, doğrulama
 * bağlantısı, ilgili beceriler ve belge (PDF veya görsel). Değerler gizli JSON alanıyla gönderilir; denetim sunucuda
 * (src/alan/profilFormu.ts → sertifikaSatiri, src/servisler/sertifika.ts). Belge seçilince hemen yüklenir.
 */
import { useRef, useState, useTransition } from 'react'
import { sertifikaBelgesiEylemi } from '@/eylemler/aday'
import { Ikon } from '../Ikon'
import { OneriliGirdi } from '../OneriliGirdi'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const BU_YIL = new Date().getFullYear()

export interface SertifikaTaslagi {
  ad: string
  kurum: string
  ay: number | null
  yil: number | null
  bitisAy: number | null
  bitisYil: number | null
  suresiz: boolean
  kimlikNo: string
  url: string
  beceriler: number[]
  dosya: number | null
  dosyaTur: string | null
}

const BOS: SertifikaTaslagi = { ad: '', kurum: '', ay: null, yil: null, bitisAy: null, bitisYil: null, suresiz: false, kimlikNo: '', url: '', beceriler: [], dosya: null, dosyaTur: null }

function AyYil(p: { id: string; etiket: string; ay: number | null; yil: number | null; yillar: number[]; degis: (ay: number | null, yil: number | null) => void }) {
  return (
    <fieldset className="alan">
      <legend>
        {p.etiket} <span className="istege-bagli">(isteğe bağlı)</span>
      </legend>
      <div className="iki-alan">
        <select id={`${p.id}-ay`} aria-label={`${p.etiket}: ay`} className="secim" value={p.ay ?? ''} onChange={(e) => p.degis(Number(e.target.value) || null, p.yil)}>
          <option value="">Ay</option>
          {AYLAR.map((a, i) => (
            <option key={a} value={i + 1}>
              {a}
            </option>
          ))}
        </select>
        <select aria-label={`${p.etiket}: yıl`} className="secim" value={p.yil ?? ''} onChange={(e) => p.degis(p.ay, Number(e.target.value) || null)}>
          <option value="">Yıl</option>
          {p.yillar.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}

function BelgeAlani({ s, n, degis }: { s: SertifikaTaslagi; n: number; degis: (d: Partial<SertifikaTaslagi>) => void }) {
  const [yukleniyor, baslat] = useTransition()
  const [hata, setHata] = useState('')
  const girdi = useRef<HTMLInputElement>(null)
  const sec = (dosya: File | undefined) => {
    if (!dosya) return
    setHata('')
    const f = new FormData()
    f.append('belge', dosya)
    baslat(async () => {
      const r = await sertifikaBelgesiEylemi(f)
      if (r.hata || !r.id) setHata(r.hata ?? 'Belge yüklenemedi.')
      else degis({ dosya: r.id, dosyaTur: r.tur ?? null })
      if (girdi.current) girdi.current.value = ''
    })
  }
  return (
    <div className={hata ? 'alan alan--hata' : 'alan'}>
      <span className="alan-ad">
        Belge <span className="istege-bagli">(isteğe bağlı)</span>
      </span>
      <span className="ipucu">Sertifikanın PDF’i veya fotoğrafı (PNG, JPEG, WebP; en fazla 5 MB). Başvurduğun firmalar görebilir.</span>
      {hata && <p className="hata-metni">{hata}</p>}
      {s.dosya ? (
        <div className="sf-belge">
          <Ikon ad={s.dosyaTur === 'application/pdf' ? 'dosya' : 'goz'} kucuk />
          <a href={`/hesabim/belge/${s.dosya}`} target="_blank" rel="noopener">
            {s.dosyaTur === 'application/pdf' ? 'PDF belgesi' : 'Görsel belge'}
          </a>
          <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => degis({ dosya: null, dosyaTur: null })}>
            Kaldır
          </button>
        </div>
      ) : (
        <div className="dosya-secici">
          <input
            ref={girdi}
            id={`sertifika-${n}-belge`}
            type="file"
            accept="application/pdf,.pdf,image/png,image/jpeg,image/webp"
            className="gizli"
            disabled={yukleniyor}
            onChange={(e) => sec(e.target.files?.[0])}
          />
          <label htmlFor={`sertifika-${n}-belge`} className="dugme dugme--ikincil dugme--kucuk" aria-disabled={yukleniyor}>
            <Ikon ad="yukle" kucuk /> {yukleniyor ? 'Yükleniyor…' : 'Belge yükle'}
          </label>
        </div>
      )}
    </div>
  )
}

export function SertifikaDuzenleyici({ baslangic, beceriler, enFazla = 20 }: { baslangic: SertifikaTaslagi[]; beceriler: Array<{ id: number; ad: string }>; enFazla?: number }) {
  const [satirlar, setSatirlar] = useState<SertifikaTaslagi[]>(baslangic)
  const degis = (n: number, d: Partial<SertifikaTaslagi>) => setSatirlar((x) => x.map((s, m) => (m === n ? { ...s, ...d } : s)))
  const veriYillari = Array.from({ length: 45 }, (_, i) => BU_YIL - i)
  const bitisYillari = Array.from({ length: 60 }, (_, i) => BU_YIL + 15 - i)
  const beceriAdi = (id: number) => beceriler.find((b) => b.id === id)?.ad ?? ''
  return (
    <div className="satir-listesi">
      <input type="hidden" name="sertifikalarJson" value={JSON.stringify(satirlar.map(({ dosyaTur: _t, ...s }) => s))} />
      {satirlar.length === 0 && <p className="ikincil">Henüz sertifika eklemedin. Kurslar, eğitim programları, lisanslar ve yarışma derecelerini de ekleyebilirsin.</p>}
      {satirlar.map((s, n) => (
        <fieldset key={n} className="satir-kart sf-kart" id={`sertifika-${n}`}>
          <legend className="gizli">{n + 1}. sertifika</legend>
          <div className="alan">
            <label htmlFor={`sertifika-${n}-ad`}>Sertifikanın adı</label>
            <span className="ipucu">Örnek: AWS Certified Cloud Practitioner</span>
            <input id={`sertifika-${n}-ad`} className="girdi" value={s.ad} maxLength={150} onChange={(e) => degis(n, { ad: e.target.value })} />
          </div>
          <div className="alan">
            <label htmlFor={`sertifika-${n}-kurum`}>Veren kurum</label>
            <span className="ipucu">Örnek: Amazon Web Services, BTK Akademi, Pamukkale Üniversitesi</span>
            <input id={`sertifika-${n}-kurum`} className="girdi" value={s.kurum} maxLength={120} onChange={(e) => degis(n, { kurum: e.target.value })} />
          </div>
          <div className="iki-alan">
            <AyYil id={`sertifika-${n}-verilis`} etiket="Veriliş tarihi" ay={s.ay} yil={s.yil} yillar={veriYillari} degis={(ay, yil) => degis(n, { ay, yil })} />
            {!s.suresiz && (
              <AyYil id={`sertifika-${n}-bitis`} etiket="Geçerlilik bitişi" ay={s.bitisAy} yil={s.bitisYil} yillar={bitisYillari} degis={(bitisAy, bitisYil) => degis(n, { bitisAy, bitisYil })} />
            )}
          </div>
          <label className="secenek">
            <input type="checkbox" checked={s.suresiz} onChange={(e) => degis(n, { suresiz: e.target.checked })} /> <span>Bu sertifikanın süresi dolmaz</span>
          </label>
          <div className="iki-alan">
            <div className="alan">
              <label htmlFor={`sertifika-${n}-kimlik`}>
                Sertifika kimlik numarası <span className="istege-bagli">(isteğe bağlı)</span>
              </label>
              <input id={`sertifika-${n}-kimlik`} className="girdi" value={s.kimlikNo} maxLength={80} onChange={(e) => degis(n, { kimlikNo: e.target.value })} />
            </div>
            <div className="alan">
              <label htmlFor={`sertifika-${n}-url`}>
                Doğrulama bağlantısı <span className="istege-bagli">(isteğe bağlı)</span>
              </label>
              <input id={`sertifika-${n}-url`} className="girdi" inputMode="url" placeholder="www.credly.com/badges/…" value={s.url} maxLength={300} onChange={(e) => degis(n, { url: e.target.value })} />
            </div>
          </div>
          <div className="alan">
            <span className="alan-ad">
              İlgili beceriler <span className="istege-bagli">(isteğe bağlı, en fazla 10)</span>
            </span>
            {s.beceriler.length > 0 && (
              <ul className="sf-beceriler">
                {s.beceriler.map((b) => (
                  <li key={b}>
                    {beceriAdi(b)}
                    <button type="button" aria-label={`${beceriAdi(b)} becerisini çıkar`} onClick={() => degis(n, { beceriler: s.beceriler.filter((x) => x !== b) })}>
                      <Ikon ad="kapat" kucuk />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {s.beceriler.length < 10 && (
              <OneriliGirdi
                id={`sertifika-${n}-beceri`}
                etiket="İlgili beceri"
                secenekler={beceriler}
                haric={s.beceriler}
                placeholder="Beceri yaz ve listeden seç"
                sec={(b) => degis(n, { beceriler: [...s.beceriler, b.id] })}
              />
            )}
          </div>
          <BelgeAlani s={s} n={n} degis={(d) => degis(n, d)} />
          <div className="sf-sil">
            <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setSatirlar((x) => x.filter((_, m) => m !== n))}>
              <Ikon ad="cop" kucuk /> Bu sertifikayı sil
            </button>
          </div>
        </fieldset>
      ))}
      {satirlar.length < enFazla && (
        <button type="button" className="dugme dugme--ikincil" onClick={() => setSatirlar((x) => [...x, { ...BOS }])}>
          <Ikon ad="arti" kucuk /> Sertifika ekle
        </button>
      )}
    </div>
  )
}
