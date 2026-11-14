'use client'
/**
 * Firma profili formu (K3, K30). Her alanın yanında açıklama; kaydedilmemiş değişiklik uyarısı; kayıttan sonra form
 * sunucudan gelen değerlerle yeniden kurulur.
 */
import { useActionState, useEffect, useRef, useState } from 'react'
import { firmaProfiliEylemi, logoEylemi } from '@/eylemler/firma'
import { AlanBilgisi } from '../BilgiKutusu'
import { DosyaSecici, GonderDugmesi, HataOzeti, type FormDurumu } from '../form'
import { Ikon } from '../Ikon'
import { OneriliGirdi } from '../OneriliGirdi'
import { TalepPenceresi, useTalepAcma } from '../TalepPenceresi'
import type { Secenek } from './IlanFormu'

export interface FirmaProfiliBaslangici {
  kisaTanitim: string
  uzunTanitim: string
  web: string
  sektor: number | null
  teknolojiler: Secenek[]
  calismaModelleri: string[]
  yanHaklar: string[]
  kurulusYili: string
  calisanAraligi: string
}

function useKayitBildirimi(durum: FormDurumu) {
  const [metin, setMetin] = useState('')
  const [anahtar, setAnahtar] = useState(0)
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    /* eslint-disable react-hooks/set-state-in-effect -- kayıt bitti */
    setMetin(durum.tamam ?? '')
    setAnahtar((a) => a + 1)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [durum])
  useEffect(() => {
    if (!metin) return
    const z = setTimeout(() => setMetin(''), 5000)
    return () => clearTimeout(z)
  }, [metin])
  return { metin, anahtar }
}

export function LogoFormu({ logo, firmaAd }: { logo: string | null; firmaAd: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(logoEylemi, {})
  const { metin, anahtar } = useKayitBildirimi(durum)
  return (
    <form action={eylem} key={anahtar} className="logo-formu">
      <div className="logo-onizleme">{logo ? <img src={logo} alt={`${firmaAd} logosu`} /> : <span className="kucuk ikincil">Logo yok</span>}</div>
      <div className="form-yigin">
        <div className={durum.hatalar?.logo || durum.genel ? 'alan alan--hata' : 'alan'}>
          <span className="alan-ad">
            Logo
            <AlanBilgisi etiket="Logo">
              İlanlarda, firma listesinde ve firma sayfanızda görünür. Kare veya yatay, şeffaf zeminli bir PNG en iyi sonucu verir. Logo yüklenene kadar
              firmanız blok ve oda koduyla gösterilir.
            </AlanBilgisi>
          </span>
          <span className="ipucu">PNG, JPEG veya WebP; en fazla 1 MB.</span>
          {(durum.hatalar?.logo || durum.genel) && <p className="hata-metni">{durum.hatalar?.logo ?? durum.genel}</p>}
          <DosyaSecici id="logo" ad="logo" kabul="image/png,image/jpeg,image/webp" etiket="Görsel seç" />
        </div>
        <div>
          <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Yükleniyor…">
            <Ikon ad="yukle" kucuk /> Logoyu yükle
          </GonderDugmesi>
        </div>
      </div>
      {metin && (
        <div className="bildirim" role="status">
          {metin}
        </div>
      )}
    </form>
  )
}

export function FirmaProfiliFormu(p: { baslangic: FirmaProfiliBaslangici; sektorler: Secenek[]; beceriler: Secenek[] }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(firmaProfiliEylemi, {})
  const { metin, anahtar } = useKayitBildirimi(durum)
  return (
    <>
      <Govde key={anahtar} {...p} durum={durum} eylem={eylem} />
      {metin && (
        <div className="bildirim" role="status">
          {metin}
        </div>
      )}
    </>
  )
}

function Govde(p: { baslangic: FirmaProfiliBaslangici; sektorler: Secenek[]; beceriler: Secenek[]; durum: FormDurumu; eylem: (f: FormData) => void }) {
  const b = p.baslangic
  const h = p.durum.hatalar ?? {}
  const [kirli, setKirli] = useState(false)
  const [kisa, setKisa] = useState(b.kisaTanitim)
  const [teknolojiler, setTeknolojiler] = useState(b.teknolojiler)
  const [yanHaklar, setYanHaklar] = useState(b.yanHaklar)
  const [yeniYanHak, setYeniYanHak] = useState('')
  const talepAcma = useTalepAcma()
  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])
  const sinif = (a: string) => (h[a] ? 'alan alan--hata' : 'alan')
  const yanHakEkle = () => {
    const y = yeniYanHak.trim()
    if (y && !yanHaklar.includes(y)) setYanHaklar([...yanHaklar, y])
    setYeniYanHak('')
    setKirli(true)
  }

  return (
    <form action={p.eylem} noValidate className="form-yigin firma-profili-formu" onChange={() => setKirli(true)} onSubmit={() => setKirli(false)}>
      <HataOzeti durum={p.durum} siz />
      <section className="form-bolum">
        <h2 className="b3">Tanıtım</h2>
        <div className={sinif('kisaTanitim')}>
          <label htmlFor="kisaTanitim">
            Kısa tanıtım
            <AlanBilgisi etiket="Kısa tanıtım">
              İlan sayfalarında ve firma listesinde görünür. Firmanızın ne yaptığını bir iki cümleyle anlatın. Profilin herkese açık görünmesi için
              gereklidir.
            </AlanBilgisi>
          </label>
          {h.kisaTanitim && <p className="hata-metni">{h.kisaTanitim}</p>}
          <textarea id="kisaTanitim" name="kisaTanitim" className="metin-alani" rows={3} maxLength={300} value={kisa} onChange={(e) => setKisa(e.target.value)} />
          <span className="sayac-metin">{kisa.length} / 300</span>
        </div>
        <div className={sinif('uzunTanitim')}>
          <label htmlFor="uzunTanitim">
            Burada çalışmak nasıl? <span className="istege-bagli">(isteğe bağlı)</span>
            <AlanBilgisi etiket="Burada çalışmak nasıl?">
              Adayların en çok merak ettiği bölümdür: ekip yapısı, günlük iş, öğrenme imkânları, çalışma düzeni. Firma sayfanızda görünür.
            </AlanBilgisi>
          </label>
          {h.uzunTanitim && <p className="hata-metni">{h.uzunTanitim}</p>}
          <textarea id="uzunTanitim" name="uzunTanitim" className="metin-alani" rows={6} maxLength={4000} defaultValue={b.uzunTanitim} />
        </div>
        <div className="iki-alan">
          <div className={sinif('sektor')}>
            <label htmlFor="sektor">
              Sektör
              <AlanBilgisi etiket="Sektör">Firma listesinde süzgeç olarak kullanılır. Profilin herkese açık görünmesi için gereklidir.</AlanBilgisi>
            </label>
            <select id="sektor" name="sektor" className="secim" defaultValue={b.sektor ?? ''}>
              <option value="">Seçin</option>
              {p.sektorler.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad}
                </option>
              ))}
            </select>
            <TalepPenceresi tur="sektor" kaynak="firma-profili:sektor" />
          </div>
          <div className={sinif('web')}>
            <label htmlFor="web">
              Web sitesi <span className="istege-bagli">(isteğe bağlı)</span>
            </label>
            {h.web && <p className="hata-metni">{h.web}</p>}
            <input id="web" name="web" className="girdi" inputMode="url" defaultValue={b.web} placeholder="www.firmaniz.com.tr" />
          </div>
        </div>
      </section>

      <section className="form-bolum">
        <h2 className="b3">Teknolojiler ve çalışma düzeni</h2>
        <div className="alan" id="teknolojiler">
          <span className="alan-ad">
            Teknolojiler ve uzmanlıklar <span className="istege-bagli">(isteğe bağlı)</span>
            <AlanBilgisi etiket="Teknolojiler">
              Firmanızın kullandığı teknolojiler firma sayfanızda görünür; adaylar firmanızı bu becerilerle bulur.
            </AlanBilgisi>
          </span>
          {teknolojiler.length > 0 && (
            <ul className="cip-listesi">
              {teknolojiler.map((t) => (
                <li key={t.id} className="beceri-cip">
                  {t.ad}
                  <input type="hidden" name="teknoloji" value={t.id} />
                  <button
                    type="button"
                    aria-label={`${t.ad} öğesini kaldır`}
                    onClick={() => {
                      setTeknolojiler(teknolojiler.filter((x) => x.id !== t.id))
                      setKirli(true)
                    }}
                  >
                    <Ikon ad="kapat" kucuk />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <OneriliGirdi
            id="teknoloji-girdi"
            etiket="Teknoloji ekle"
            secenekler={p.beceriler}
            haric={teknolojiler.map((t) => t.id)}
            sec={(s) => {
              setTeknolojiler([...teknolojiler, s])
              setKirli(true)
            }}
            placeholder="Yazmaya başlayın: Flutter, SolidWorks…"
            bulunamadi={talepAcma.baglanti}
          />
          <TalepPenceresi tur="beceri" kaynak="firma-profili:teknoloji" baslangic={talepAcma.talep.metin} disAcma={talepAcma.talep.n} tetikYok />
        </div>
        <fieldset className="alan">
          <legend>Çalışma modelleri</legend>
          <div className="yan-yana">
            {(
              [
                ['ofiste', 'Ofiste'],
                ['hibrit', 'Hibrit'],
                ['uzaktan', 'Uzaktan'],
              ] as const
            ).map(([d, a]) => (
              <label key={d} className="secenek secenek-kutu">
                <input type="checkbox" name="calismaModeli" value={d} defaultChecked={b.calismaModelleri.includes(d)} /> <span>{a}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="alan">
          <span className="alan-ad">
            Yan haklar <span className="istege-bagli">(isteğe bağlı)</span>
            <AlanBilgisi etiket="Yan haklar">Yeni ilan açtığınızda bu liste ilana hazır gelir; ilan bazında değiştirebilirsiniz.</AlanBilgisi>
          </span>
          {yanHaklar.length > 0 && (
            <ul className="cip-listesi">
              {yanHaklar.map((y) => (
                <li key={y} className="beceri-cip">
                  {y}
                  <input type="hidden" name="yanHak" value={y} />
                  <button
                    type="button"
                    aria-label={`${y} yan hakkını kaldır`}
                    onClick={() => {
                      setYanHaklar(yanHaklar.filter((x) => x !== y))
                      setKirli(true)
                    }}
                  >
                    <Ikon ad="kapat" kucuk />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="arama">
            <label className="gizli" htmlFor="yeni-yan-hak">
              Yan hak ekle
            </label>
            <input
              id="yeni-yan-hak"
              className="girdi"
              value={yeniYanHak}
              maxLength={80}
              placeholder="Örnek: Yemek kartı"
              onChange={(e) => setYeniYanHak(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  yanHakEkle()
                }
              }}
            />
            <button type="button" className="dugme dugme--ikincil" onClick={yanHakEkle}>
              Ekle
            </button>
          </div>
        </div>
        <div className="iki-alan">
          <div className={sinif('kurulusYili')}>
            <label htmlFor="kurulusYili">
              Kuruluş yılı <span className="istege-bagli">(isteğe bağlı)</span>
            </label>
            {h.kurulusYili && <p className="hata-metni">{h.kurulusYili}</p>}
            <input id="kurulusYili" name="kurulusYili" className="girdi" inputMode="numeric" maxLength={4} defaultValue={b.kurulusYili} />
          </div>
          <div className={sinif('calisanAraligi')}>
            <label htmlFor="calisanAraligi">
              Çalışan sayısı <span className="istege-bagli">(isteğe bağlı)</span>
            </label>
            <select id="calisanAraligi" name="calisanAraligi" className="secim" defaultValue={b.calisanAraligi}>
              <option value="">Seçin</option>
              {['1–9', '10–49', '50–99', '100–249', '250+'].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="yapiskan-alt f-form-ayak">
        <p className="kayit-durumu" aria-live="polite">
          {kirli ? (
            <>
              <span className="kirli-nokta" /> Kaydedilmemiş değişiklik var
            </>
          ) : null}
        </p>
        <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
          Profili kaydet
        </GonderDugmesi>
      </div>
    </form>
  )
}
