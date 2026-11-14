'use client'
/**
 * Firma ilan formu (K1, K30; prototip “Yeni ilan”).
 *
 * - Dört bölüm: Pozisyon · Beceriler ve nitelikler · Tarih ve başvuru · Paylaşım ve dil. Staj ilanında staj bölümü
 *   açılır. Masaüstünde solda bölüm içindekiler.
 * - Taslak eksik kaydedilebilir; yalnızca pozisyon adı gerekir. Eksikler önizlemede ve yayına gönderirken listelenir.
 * - Her alanın yanında “?” açıklaması var (K30). Hatalar üstte özet ve alanın altında, Türkçe ve çözüm söyleyerek.
 * - Kaydedilmemiş değişiklik varken sayfadan çıkılırsa tarayıcı uyarır (CLAUDE.md 5).
 * - Başarılı kayıttan sonra form sunucudan gelen yeni değerlerle yeniden kurulur (K28'de öğrenilen form sıfırlaması).
 */
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { ilanFormuEylemi } from '@/eylemler/firma'
import { CEFR, DENEYIM_ADI, DENEYIM_SIRASI } from '@/alan/eslesme'
import { IS_ALT_TURLERI, STAJ_ALT_TURLERI } from '@/alan/ilan'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { EN_FAZLA_BECERI, EN_FAZLA_SORU, EN_FAZLA_YAN_HAK } from '@/alan/ilanFormu'
import { AlanBilgisi } from '../BilgiKutusu'
import { HataOzeti, GonderDugmesi, type FormDurumu } from '../form'
import { Ikon } from '../Ikon'
import { TarihSecici, tarihMetni } from '../TarihSecici'
import type { TarihSiniri } from './IlanIslemleri'

export type Secenek = { id: number; ad: string }

export interface IlanFormBaslangici {
  pozisyonAdi: string
  tur: 'is' | 'staj' | ''
  altTur: string
  aile: number | null
  model: string
  konum: string
  deneyim: string
  egitim: string
  pozisyonSayisi: number
  bolumler: Secenek[]
  zorunluBeceriler: Secenek[]
  tercihBeceriler: Secenek[]
  diller: Array<Secenek & { seviye: string }>
  sonBasvuru: string
  baslangic: string
  ucretEnAz: string
  ucretEnCok: string
  ucretGorunur: boolean
  yanHaklar: string[]
  isTanimi: string
  nitelikler: string
  sorular: Array<{ soru: string; tip: string; eleyici: boolean; beklenenCevap: string; secenekler: string }>
  linkedinMetni: string
  dil: string
  stajDonemi: string
  ucretliStaj: boolean
  sgk: string
  stajBelgesi: boolean
  pauOncelik: boolean
}

export interface IlanFormuProps {
  ilanId: number | null
  durum: string
  baslangic: IlanFormBaslangici
  secenekler: { aileler: Secenek[]; beceriler: Secenek[]; bolumler: Secenek[]; diller: Secenek[] }
  sinir: TarihSiniri
  /** Son kayıt zamanı (ör. “14:32”); yeni ilanda boş */
  sonKayit?: string
}

const EGITIM: Array<[string, string]> = [
  ['lise', 'Lise'],
  ['onlisans', 'Önlisans'],
  ['lisans', 'Lisans'],
  ['yuksek-lisans', 'Yüksek lisans'],
  ['doktora', 'Doktora'],
]
const MODELLER: Array<[string, string, string]> = [
  ['ofiste', 'Ofiste', 'Bütün hafta Teknokent’teki ofiste'],
  ['hibrit', 'Hibrit', 'Haftanın bir kısmı ofiste, bir kısmı uzaktan'],
  ['uzaktan', 'Uzaktan', 'Ofise gelmesi gerekmez'],
]

/* ---------- Küçük parçalar ---------- */

function Hata({ metin }: { metin?: string }) {
  return metin ? <p className="hata-metni">{metin}</p> : null
}

/** Taksonomiden seçilen öğeler (beceri, bölüm). Listede olmayan öğe eklenemez: eşleşme aynı listeye göre çalışır. */
function CipSecici(p: {
  id: string
  ad: string
  etiket: string
  bilgi: React.ReactNode
  ipucu?: string
  secenekler: Secenek[]
  baslangic: Secenek[]
  enFazla: number
  hata?: string
  ornek: string
  degisti: () => void
  /** Seçim değişince güncel kimlikler (ör. zorunlu beceriler tercih listesinde tekrar edilmesin diye) */
  secimDegisti?: (idler: number[]) => void
  haric?: number[]
}) {
  const [secili, setSecili] = useState<Secenek[]>(p.baslangic)
  const [yeni, setYeni] = useState('')
  const [uyari, setUyari] = useState('')
  const listeId = `${p.id}-liste`
  const ekle = () => {
    const ad = yeni.trim().toLocaleLowerCase('tr')
    if (!ad) return
    const s = p.secenekler.find((x) => x.ad.toLocaleLowerCase('tr') === ad)
    if (!s) return setUyari(`“${yeni.trim()}” listede yok. Listeden bir seçenek seçin; listede olmayan bir seçeneğin eklenmesini Yönetici A.Ş.’den isteyebilirsiniz.`)
    if (secili.some((x) => x.id === s.id)) return setUyari(`${s.ad} zaten ekli.`)
    if (p.haric?.includes(s.id)) return setUyari(`${s.ad} diğer listede ekli. Bir beceri yalnızca bir listede olabilir.`)
    const yeniListe = [...secili, s]
    setSecili(yeniListe)
    p.secimDegisti?.(yeniListe.map((x) => x.id))
    setYeni('')
    setUyari('')
    p.degisti()
  }
  return (
    <div className={p.hata ? 'alan alan--hata' : 'alan'} id={p.id}>
      <span className="alan-ad">
        {p.etiket}
        <AlanBilgisi etiket={p.etiket}>{p.bilgi}</AlanBilgisi>
      </span>
      {p.ipucu && <span className="ipucu">{p.ipucu}</span>}
      <Hata metin={p.hata} />
      {secili.length > 0 && (
        <ul className="cip-listesi">
          {secili.map((s) => (
            <li key={s.id} className="beceri-cip">
              {s.ad}
              <input type="hidden" name={p.ad} value={s.id} />
              <button
                type="button"
                aria-label={`${s.ad} öğesini kaldır`}
                onClick={() => {
                  const kalan = secili.filter((x) => x.id !== s.id)
                  setSecili(kalan)
                  p.secimDegisti?.(kalan.map((x) => x.id))
                  p.degisti()
                }}
              >
                <Ikon ad="kapat" kucuk />
              </button>
            </li>
          ))}
        </ul>
      )}
      {secili.length < p.enFazla ? (
        <div className="arama">
          <label className="gizli" htmlFor={`${p.id}-girdi`}>
            {p.etiket}: ekle
          </label>
          <input
            id={`${p.id}-girdi`}
            className="girdi"
            list={listeId}
            value={yeni}
            placeholder={p.ornek}
            autoComplete="off"
            onChange={(e) => setYeni(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ekle()
              }
            }}
          />
          <button type="button" className="dugme dugme--ikincil" onClick={ekle}>
            Ekle
          </button>
          <datalist id={listeId}>
            {p.secenekler.map((s) => (
              <option key={s.id} value={s.ad} />
            ))}
          </datalist>
        </div>
      ) : (
        <p className="kucuk ikincil">En fazla {p.enFazla} öğe ekleyebilirsiniz.</p>
      )}
      {uyari && (
        <p className="kucuk uyari-metni" role="status">
          {uyari}
        </p>
      )}
    </div>
  )
}

/* ---------- Form ---------- */

export function IlanFormu(p: IlanFormuProps) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ilanFormuEylemi, {})
  const [anahtar, setAnahtar] = useState(0)
  const [bildirim, setBildirim] = useState('')
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    /* eslint-disable react-hooks/set-state-in-effect -- kayıt bitti: form yeni değerlerle kurulur */
    setAnahtar((a) => a + 1)
    setBildirim(durum.tamam ?? '')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [durum])
  useEffect(() => {
    if (!bildirim) return
    const z = setTimeout(() => setBildirim(''), 6000)
    return () => clearTimeout(z)
  }, [bildirim])
  return (
    <>
      <FormGovdesi key={anahtar} {...p} formDurumu={durum} eylem={eylem} />
      {bildirim && (
        <div className="bildirim" role="status">
          {bildirim}
        </div>
      )}
    </>
  )
}

function FormGovdesi(p: IlanFormuProps & { formDurumu: FormDurumu; eylem: (f: FormData) => void }) {
  const b = p.baslangic
  const h = p.formDurumu.hatalar ?? {}
  const [kirli, setKirli] = useState(false)
  const [tur, setTur] = useState(b.tur)
  const [altTur, setAltTur] = useState(b.altTur)
  const [ucretAcik] = useState(Boolean(b.ucretEnAz || b.ucretEnCok))
  const [diller, setDiller] = useState(b.diller)
  const [yeniDil, setYeniDil] = useState('')
  const [yanHaklar, setYanHaklar] = useState(b.yanHaklar)
  const [yeniYanHak, setYeniYanHak] = useState('')
  const [sorular, setSorular] = useState(() => b.sorular.map((s, n) => ({ ...s, no: n })))
  const [linkedin, setLinkedin] = useState(b.linkedinMetni)
  const [zorunlu, setZorunlu] = useState(b.zorunluBeceriler.map((x) => x.id))
  const sonNo = useRef(b.sorular.length)
  const degisti = () => setKirli(true)

  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])

  const altTurler = tur === 'staj' ? STAJ_ALT_TURLERI : IS_ALT_TURLERI
  const yayinda = ['yayinda', 'duraklatildi'].includes(p.durum)
  const taslak = p.durum === 'yeni' || p.durum === 'taslak'

  const bolum = (no: number, ad: string, icerik: React.ReactNode) => (
    <section className="form-bolum" id={`fb-${no}`} aria-labelledby={`fb-${no}-b`}>
      <h2 className="b3" id={`fb-${no}-b`}>
        <span className="bolum-no">{no}</span>
        {ad}
      </h2>
      {icerik}
    </section>
  )
  const sinif = (k: string) => (h[k] ? 'alan alan--hata' : 'alan')

  return (
    <form
      action={p.eylem}
      noValidate
      className="ilan-formu"
      onChange={degisti}
      onSubmit={() => setKirli(false)}
    >
      <input type="hidden" name="ilanId" value={p.ilanId ?? ''} />
      <div className="f-bas">
        <p className="kayit-durumu" aria-live="polite">
          {kirli ? (
            <>
              <span className="kirli-nokta" /> Kaydedilmemiş değişiklik var
            </>
          ) : p.sonKayit ? (
            <>
              <Ikon ad="tik" kucuk /> Son kayıt: {p.sonKayit}
            </>
          ) : (
            'Henüz kaydedilmedi'
          )}
        </p>
      </div>
      <div className="form-duzen">
        <nav className="form-icindekiler yalniz-masa" aria-label="Form bölümleri">
          <ol>
            <li>
              <a href="#fb-1">Pozisyon</a>
            </li>
            <li>
              <a href="#fb-2">Beceriler ve nitelikler</a>
            </li>
            <li>
              <a href="#fb-3">Tarih ve başvuru</a>
            </li>
            {tur === 'staj' && (
              <li>
                <a href="#fb-staj">Staj bilgileri</a>
              </li>
            )}
            <li>
              <a href="#fb-4">Paylaşım ve dil</a>
            </li>
          </ol>
          <p className="kucuk ikincil">
            {taslak
              ? 'Taslağı istediğiniz zaman kaydedebilirsiniz; yalnızca pozisyon adı gereklidir. Eksik alanlar önizlemede listelenir.'
              : 'Yayındaki ilanda pozisyon adı, ilan türü, çalışma şekli ve ücret değişiklikleri Yönetici A.Ş. onayından geçebilir.'}
          </p>
        </nav>

        <div className="form-yigin form-ilan">
          <HataOzeti durum={p.formDurumu} siz />

          {bolum(
            1,
            'Pozisyon',
            <>
              <div className={sinif('pozisyonAdi')}>
                <label htmlFor="pozisyonAdi">
                  Pozisyon adı
                  <AlanBilgisi etiket="Pozisyon adı">
                    Adayların ilan listesinde ilk gördüğü bilgidir. Kısa ve açık yazın: “Gömülü Yazılım Mühendisi”, “Yazılım Stajyeri”. Firma adını
                    yazmanıza gerek yoktur; ilanda zaten görünür.
                  </AlanBilgisi>
                </label>
                <Hata metin={h.pozisyonAdi} />
                <input id="pozisyonAdi" name="pozisyonAdi" className="girdi" defaultValue={b.pozisyonAdi} maxLength={120} required />
              </div>

              <fieldset className={sinif('tur')} id="tur">
                <legend>
                  İlan türü
                  <AlanBilgisi etiket="İlan türü">
                    Staj ilanında staj türü, dönem, SGK ve staj belgesi bilgileri sorulur. Adaylar ilanları bu türe göre süzer.
                  </AlanBilgisi>
                </legend>
                <Hata metin={h.tur} />
                <div className="yan-yana">
                  {(
                    [
                      ['is', 'İş'],
                      ['staj', 'Staj'],
                    ] as const
                  ).map(([d, a]) => (
                    <label key={d} className="secenek secenek-kutu">
                      <input
                        type="radio"
                        name="tur"
                        value={d}
                        defaultChecked={b.tur === d}
                        onChange={() => {
                          setTur(d)
                          setAltTur('')
                        }}
                      />{' '}
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="iki-alan">
                <div className={sinif('altTur')}>
                  <label htmlFor="altTur">
                    {tur === 'staj' ? 'Staj türü' : 'Çalışma şekli'}
                    <AlanBilgisi etiket={tur === 'staj' ? 'Staj türü' : 'Çalışma şekli'}>
                      {tur === 'staj'
                        ? 'Zorunlu staj okulun programındaki stajdır. Gönüllü staj zorunlu olmayan stajdır. Uzun dönem staj genellikle bir dönem boyunca haftanın birkaç günüdür.'
                        : 'Tam zamanlı, yarı zamanlı veya proje bazlı / sözleşmeli çalışma.'}
                    </AlanBilgisi>
                  </label>
                  <Hata metin={h.altTur} />
                  {tur ? (
                    <select id="altTur" name="altTur" className="secim" value={altTur} onChange={(e) => setAltTur(e.target.value)}>
                      <option value="">Seçin</option>
                      {altTurler.map((a) => (
                        <option key={a} value={a}>
                          {ALT_TUR_ADI[a] ?? a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="kucuk ikincil" id="altTur">
                      Önce ilan türünü seçin.
                    </p>
                  )}
                </div>
                <div className={sinif('aile')}>
                  <label htmlFor="aile">
                    Pozisyon ailesi
                    <AlanBilgisi etiket="Pozisyon ailesi">
                      Adaylar ilanları bu gruba göre süzer. Örnek: “Yazılım geliştirme”, “Gömülü sistemler”. Uygun bir aile yoksa Yönetici A.Ş.’den
                      eklemesini isteyebilirsiniz.
                    </AlanBilgisi>
                  </label>
                  <Hata metin={h.aile} />
                  <select id="aile" name="aile" className="secim" defaultValue={b.aile ?? ''}>
                    <option value="">Seçin</option>
                    {p.secenekler.aileler.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className={sinif('model')} id="model">
                <legend>
                  Çalışma modeli
                  <AlanBilgisi etiket="Çalışma modeli">
                    Adayın tercihiyle karşılaştırılır ve eşleşme açıklamasında görünür. Hibrit ilanda haftada kaç gün ofiste olunacağını iş tanımında
                    belirtmeniz adaylara yardımcı olur.
                  </AlanBilgisi>
                </legend>
                <Hata metin={h.model} />
                <div className="yan-yana">
                  {MODELLER.map(([d, a, ac]) => (
                    <label key={d} className="secenek secenek-kutu">
                      <input type="radio" name="model" value={d} defaultChecked={b.model === d} /> <span>{a}</span>
                      <span className="gizli">: {ac}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="iki-alan">
                <div className={sinif('konum')}>
                  <label htmlFor="konum">
                    Konum
                    <AlanBilgisi etiket="Konum">Firma profilinizdeki blok ve oda bilgisiyle dolu gelir. Çalışma başka bir yerdeyse değiştirin.</AlanBilgisi>
                  </label>
                  <Hata metin={h.konum} />
                  <input id="konum" name="konum" className="girdi" defaultValue={b.konum} maxLength={120} />
                </div>
                <div className={sinif('deneyim')}>
                  <label htmlFor="deneyim">
                    Aranan deneyim
                    <AlanBilgisi etiket="Aranan deneyim">
                      Adayın deneyimi bu düzeyin altındaysa eşleşme açıklamasında belirtilir; aday yine de başvurabilir.
                    </AlanBilgisi>
                  </label>
                  <Hata metin={h.deneyim} />
                  <select id="deneyim" name="deneyim" className="secim" defaultValue={b.deneyim}>
                    <option value="">Seçin</option>
                    {DENEYIM_SIRASI.map((d) => (
                      <option key={d} value={d}>
                        {DENEYIM_ADI[d]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`${sinif('pozisyonSayisi')} alan--dar`}>
                <label htmlFor="pozisyonSayisi">
                  Pozisyon sayısı
                  <AlanBilgisi etiket="Pozisyon sayısı">Bu ilanla kaç kişi almak istediğinizi yazın. İlanda görünür.</AlanBilgisi>
                </label>
                <Hata metin={h.pozisyonSayisi} />
                <input id="pozisyonSayisi" name="pozisyonSayisi" className="girdi" inputMode="numeric" defaultValue={b.pozisyonSayisi} />
              </div>
            </>,
          )}

          {bolum(
            2,
            'Beceriler ve nitelikler',
            <>
              <CipSecici
                id="zorunluBeceriler"
                ad="zorunluBeceri"
                etiket="Zorunlu beceriler"
                ipucu="Adayda mutlaka olması gerekenler. Eşleşme bu listeye göre hesaplanır."
                bilgi={
                  <>
                    Adaylar ilan sayfasında “Bu becerilerden hangileri bende var?” sorusunun cevabını görür. Liste kısa ve gerçekçi olursa doğru adaylar
                    başvurur; 3–6 beceri genellikle yeterlidir.
                  </>
                }
                secenekler={p.secenekler.beceriler}
                baslangic={b.zorunluBeceriler}
                enFazla={EN_FAZLA_BECERI}
                hata={h.zorunluBeceriler}
                ornek="Beceri yazın: Python, SolidWorks…"
                degisti={degisti}
                secimDegisti={setZorunlu}
              />
              <CipSecici
                id="tercihBeceriler"
                ad="tercihBeceri"
                etiket="Tercih sebebi beceriler"
                ipucu="Olursa iyi olur; olmaması başvuruyu engellemez."
                bilgi="Eşleşme açıklamasında “tercih sebebi” olarak ayrıca gösterilir. Zorunlu listedeki bir beceri burada tekrar edilemez."
                secenekler={p.secenekler.beceriler}
                baslangic={b.tercihBeceriler}
                enFazla={EN_FAZLA_BECERI}
                ornek="Beceri yazın"
                degisti={degisti}
                haric={zorunlu}
              />
              <div className="iki-alan">
                <div className={sinif('egitim')}>
                  <label htmlFor="egitim">
                    Eğitim düzeyi
                    <AlanBilgisi etiket="Eğitim düzeyi">Aranan en düşük eğitim düzeyi. Staj ilanında adayın şu an okuduğu düzeyi seçin.</AlanBilgisi>
                  </label>
                  <Hata metin={h.egitim} />
                  <select id="egitim" name="egitim" className="secim" defaultValue={b.egitim}>
                    <option value="">Seçin</option>
                    {EGITIM.map(([d, a]) => (
                      <option key={d} value={d}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <CipSecici
                id="bolumler"
                ad="bolum"
                etiket="Tercih edilen bölümler (isteğe bağlı)"
                bilgi="Boş bırakırsanız her bölümden aday başvurabilir. Seçerseniz adayın bölümü eşleşme açıklamasında karşılaştırılır."
                secenekler={p.secenekler.bolumler}
                baslangic={b.bolumler}
                enFazla={20}
                ornek="Bölüm yazın: Bilgisayar Mühendisliği…"
                degisti={degisti}
              />

              <fieldset className="alan" id="diller">
                <legend>
                  Dil şartları (isteğe bağlı)
                  <AlanBilgisi etiket="Dil şartları">
                    Seviyeler Avrupa Ortak Dil Çerçevesi’ne göredir: A1–A2 temel, B1–B2 orta, C1–C2 ileri. Adayın seviyesi eşleşme açıklamasında
                    karşılaştırılır.
                  </AlanBilgisi>
                </legend>
                {diller.length > 0 && (
                  <ul className="beceri-duzen">
                    {diller.map((d, n) => (
                      <li key={d.id}>
                        <span>{d.ad}</span>
                        <label className="gizli" htmlFor={`dil-sev-${d.id}`}>
                          {d.ad} için en düşük seviye
                        </label>
                        <select
                          id={`dil-sev-${d.id}`}
                          className="secim secim--kucuk"
                          value={d.seviye}
                          onChange={(e) => setDiller(diller.map((x, m) => (m === n ? { ...x, seviye: e.target.value } : x)))}
                        >
                          {CEFR.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input type="hidden" name="dilSarti" value={`${d.id}:${d.seviye}`} />
                        <button
                          type="button"
                          className="ikon-dugme"
                          aria-label={`${d.ad} şartını kaldır`}
                          onClick={() => {
                            setDiller(diller.filter((_, m) => m !== n))
                            degisti()
                          }}
                        >
                          <Ikon ad="kapat" kucuk />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="arama">
                  <label className="gizli" htmlFor="yeni-dil">
                    Dil ekle
                  </label>
                  <select id="yeni-dil" className="secim" value={yeniDil} onChange={(e) => setYeniDil(e.target.value)}>
                    <option value="">Dil seçin</option>
                    {p.secenekler.diller
                      .filter((d) => !diller.some((x) => x.id === d.id))
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.ad}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="dugme dugme--ikincil"
                    disabled={!yeniDil}
                    onClick={() => {
                      const d = p.secenekler.diller.find((x) => x.id === Number(yeniDil))
                      if (!d) return
                      setDiller([...diller, { ...d, seviye: 'B1' }])
                      setYeniDil('')
                      degisti()
                    }}
                  >
                    Ekle
                  </button>
                </div>
              </fieldset>

              <div className={sinif('isTanimi')}>
                <label htmlFor="isTanimi">
                  İş tanımı: Bu kişi ne yapacak?
                  <AlanBilgisi etiket="İş tanımı">
                    Adayların en dikkatli okuduğu bölümdür. Satır başına “-” koyarsanız maddeler hâlinde görünür. Günlük işi, kullanılacak araçları ve
                    ekibi anlatın.
                  </AlanBilgisi>
                </label>
                <span className="ipucu">Satır başına “-” koyarak maddeler hâlinde yazabilirsiniz.</span>
                <Hata metin={h.isTanimi} />
                <textarea id="isTanimi" name="isTanimi" className="metin-alani" rows={6} defaultValue={b.isTanimi} maxLength={5000} />
              </div>
              <div className={sinif('nitelikler')}>
                <label htmlFor="nitelikler">
                  Aranan nitelikler
                  <AlanBilgisi etiket="Aranan nitelikler">
                    Eğitim, deneyim ve kişisel özellikler. Zorunlu becerileri burada tekrar yazmanıza gerek yoktur; onlar ilanda ayrıca listelenir.
                  </AlanBilgisi>
                </label>
                <Hata metin={h.nitelikler} />
                <textarea id="nitelikler" name="nitelikler" className="metin-alani" rows={5} defaultValue={b.nitelikler} maxLength={5000} />
              </div>
            </>,
          )}

          {bolum(
            3,
            'Tarih ve başvuru',
            <>
              <div className={sinif('sonBasvuru')} id="sonBasvuru-alan">
                <span className="alan-ad">
                  Son başvuru tarihi
                  <AlanBilgisi etiket="Son başvuru tarihi">
                    İlan seçtiğiniz günün sonuna kadar başvuru alır, ertesi gün kendiliğinden kapanır. Gerekirse yayındayken süreyi uzatabilirsiniz.
                  </AlanBilgisi>
                </span>
                <span className="ipucu">En geç {tarihMetni(p.sinir.enGec)} seçilebilir.</span>
                <Hata metin={h.sonBasvuru} />
                <TarihSecici
                  ad="sonBasvuru"
                  id="sonBasvuru"
                  deger={b.sonBasvuru || undefined}
                  bugun={p.sinir.bugun}
                  enErken={b.sonBasvuru && b.sonBasvuru < p.sinir.enErken ? b.sonBasvuru : p.sinir.enErken}
                  enGec={p.sinir.enGec}
                  sinirNedeni={`Bir ilan en fazla ${p.sinir.gun} gün sonrasına kadar açık kalabilir.`}
                  degisince={degisti}
                />
              </div>

              <details className="acilir" open={ucretAcik || Boolean(h.ucretEnAz || h.ucretEnCok)}>
                <summary>
                  Ücret aralığı <span className="istege-bagli kucuk">isteğe bağlı</span>
                </summary>
                <div className="icerik">
                  <p className="kucuk">
                    Ücret yazmak zorunlu değildir. Yazarsanız ve “ilanda görünsün” derseniz adaylar aralığı görür. Gizli kalsa da adayın beklentisiyle
                    karşılaştırılır.
                  </p>
                  <div className="iki-alan">
                    <div className={sinif('ucretEnAz')}>
                      <label htmlFor="ucretEnAz">En az (₺, net, aylık)</label>
                      <Hata metin={h.ucretEnAz} />
                      <input id="ucretEnAz" name="ucretEnAz" className="girdi" inputMode="numeric" defaultValue={b.ucretEnAz} placeholder="Örnek: 45.000" />
                    </div>
                    <div className={sinif('ucretEnCok')}>
                      <label htmlFor="ucretEnCok">En çok (₺, net, aylık)</label>
                      <Hata metin={h.ucretEnCok} />
                      <input id="ucretEnCok" name="ucretEnCok" className="girdi" inputMode="numeric" defaultValue={b.ucretEnCok} placeholder="Örnek: 60.000" />
                    </div>
                  </div>
                  <label className="secenek">
                    <input type="checkbox" name="ucretGorunur" defaultChecked={b.ucretGorunur} /> <span>Ücret ilanda görünsün</span>
                  </label>
                </div>
              </details>

              <details className="acilir" open={sorular.length > 0}>
                <summary>
                  Ön eleme soruları{' '}
                  <span className="istege-bagli kucuk">
                    isteğe bağlı · {sorular.length} / {EN_FAZLA_SORU}
                  </span>
                </summary>
                <div className="icerik form-yigin">
                  <p className="kucuk">
                    Adaya başvururken sorulur. Eleyici bir soruya beklediğinizden farklı cevap veren aday başvurabilir, ancak başvuru listenizde ayrıca
                    işaretlenir.
                  </p>
                  {sorular.map((s, n) => (
                    <fieldset key={s.no} className="soru-kart">
                      <legend>{n + 1}. soru</legend>
                      <input type="hidden" name="soruNo" value={s.no} />
                      <div className="alan">
                        <label htmlFor={`soru-${s.no}`}>Soru</label>
                        <input id={`soru-${s.no}`} name={`soru-${s.no}`} className="girdi" defaultValue={s.soru} maxLength={300} />
                      </div>
                      <div className="iki-alan">
                        <div className="alan">
                          <label htmlFor={`soruTip-${s.no}`}>Cevap türü</label>
                          <select
                            id={`soruTip-${s.no}`}
                            name={`soruTip-${s.no}`}
                            className="secim"
                            value={s.tip}
                            onChange={(e) => setSorular(sorular.map((x) => (x.no === s.no ? { ...x, tip: e.target.value } : x)))}
                          >
                            <option value="kisa">Kısa cevap</option>
                            <option value="evet-hayir">Evet / Hayır</option>
                            <option value="secmeli">Çoktan seçmeli</option>
                          </select>
                        </div>
                      </div>
                      {s.tip === 'secmeli' && (
                        <div className={sinif(`soruSecenekler-${s.no}`)}>
                          <label htmlFor={`soruSecenekler-${s.no}`}>Seçenekler (her satıra bir seçenek)</label>
                          <Hata metin={h[`soruSecenekler-${s.no}`]} />
                          <textarea id={`soruSecenekler-${s.no}`} name={`soruSecenekler-${s.no}`} className="metin-alani" rows={3} defaultValue={s.secenekler} />
                        </div>
                      )}
                      <label className="secenek">
                        <input
                          type="checkbox"
                          name={`soruEleyici-${s.no}`}
                          checked={s.eleyici}
                          onChange={(e) => setSorular(sorular.map((x) => (x.no === s.no ? { ...x, eleyici: e.target.checked } : x)))}
                        />{' '}
                        <span>
                          Eleyici soru
                          <span className="ipucu">Beklenen cevabı vermeyen aday başvuru listenizde ayrıca işaretlenir.</span>
                        </span>
                      </label>
                      {s.eleyici && (
                        <div className={sinif(`soruBeklenen-${s.no}`)}>
                          <label htmlFor={`soruBeklenen-${s.no}`}>Beklenen cevap</label>
                          <Hata metin={h[`soruBeklenen-${s.no}`]} />
                          {s.tip === 'evet-hayir' ? (
                            <select id={`soruBeklenen-${s.no}`} name={`soruBeklenen-${s.no}`} className="secim" defaultValue={s.beklenenCevap}>
                              <option value="">Seçin</option>
                              <option value="Evet">Evet</option>
                              <option value="Hayır">Hayır</option>
                            </select>
                          ) : (
                            <input id={`soruBeklenen-${s.no}`} name={`soruBeklenen-${s.no}`} className="girdi" defaultValue={s.beklenenCevap} />
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className="dugme dugme--sade dugme--kucuk satir-sil"
                        onClick={() => {
                          setSorular(sorular.filter((x) => x.no !== s.no))
                          degisti()
                        }}
                      >
                        <Ikon ad="cop" kucuk /> Bu soruyu kaldır
                      </button>
                    </fieldset>
                  ))}
                  {sorular.length < EN_FAZLA_SORU && (
                    <button
                      type="button"
                      className="dugme dugme--ikincil dugme--kucuk"
                      onClick={() => {
                        setSorular([...sorular, { no: sonNo.current++, soru: '', tip: 'kisa', eleyici: false, beklenenCevap: '', secenekler: '' }])
                        degisti()
                      }}
                    >
                      <Ikon ad="arti" kucuk /> Soru ekle
                    </button>
                  )}
                </div>
              </details>

              <details className="acilir" open={yanHaklar.length > 0}>
                <summary>
                  Yan haklar <span className="istege-bagli kucuk">isteğe bağlı</span>
                </summary>
                <div className="icerik form-yigin">
                  <p className="kucuk">Yemek kartı, servis, eğitim bütçesi gibi. Yeni ilanda firma profilinizdeki yan haklar dolu gelir.</p>
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
                              degisti()
                            }}
                          >
                            <Ikon ad="kapat" kucuk />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {yanHaklar.length < EN_FAZLA_YAN_HAK && (
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
                          if (e.key !== 'Enter') return
                          e.preventDefault()
                          const y = yeniYanHak.trim()
                          if (y && !yanHaklar.includes(y)) setYanHaklar([...yanHaklar, y])
                          setYeniYanHak('')
                          degisti()
                        }}
                      />
                      <button
                        type="button"
                        className="dugme dugme--ikincil"
                        onClick={() => {
                          const y = yeniYanHak.trim()
                          if (y && !yanHaklar.includes(y)) setYanHaklar([...yanHaklar, y])
                          setYeniYanHak('')
                          degisti()
                        }}
                      >
                        Ekle
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </>,
          )}

          {tur === 'staj' && (
            <section className="form-bolum" id="fb-staj" aria-labelledby="fb-staj-b">
              <h2 className="b3" id="fb-staj-b">
                <span className="bolum-no">S</span>Staj bilgileri
              </h2>
              <div className="alan">
                <label htmlFor="stajDonemi">
                  Staj dönemi <span className="istege-bagli">(isteğe bağlı)</span>
                  <AlanBilgisi etiket="Staj dönemi">Örnek: “Temmuz–Ağustos 2027” veya “Bahar dönemi boyunca haftada 3 gün”.</AlanBilgisi>
                </label>
                <input id="stajDonemi" name="stajDonemi" className="girdi" defaultValue={b.stajDonemi} maxLength={120} />
              </div>
              <fieldset className="alan">
                <legend>
                  SGK primini kim ödüyor?
                  <AlanBilgisi etiket="SGK">
                    Zorunlu stajda SGK primi çoğunlukla okul tarafından ödenir. Adaylar okullarına bu bilgiyle başvurur.
                  </AlanBilgisi>
                </legend>
                <div className="yan-yana">
                  {(
                    [
                      ['okul', 'Okul'],
                      ['firma', 'Firma'],
                    ] as const
                  ).map(([d, a]) => (
                    <label key={d} className="secenek secenek-kutu">
                      <input type="radio" name="sgk" value={d} defaultChecked={b.sgk === d} /> <span>{a}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="secenek">
                <input type="checkbox" name="ucretliStaj" defaultChecked={b.ucretliStaj} /> <span>Ücretli staj</span>
              </label>
              <label className="secenek">
                <input type="checkbox" name="stajBelgesi" defaultChecked={b.stajBelgesi} /> <span>Zorunlu staj belgesini imzalıyoruz</span>
              </label>
              <label className="secenek">
                <input type="checkbox" name="pauOncelik" defaultChecked={b.pauOncelik} />{' '}
                <span>
                  Pamukkale Üniversitesi öğrencilerine öncelik veriyoruz
                  <span className="ipucu">İlanda “PAÜ öğrencisine öncelik” etiketi görünür.</span>
                </span>
              </label>
            </section>
          )}

          {bolum(
            4,
            'Paylaşım ve dil',
            <>
              <div className="alan">
                <label htmlFor="linkedinMetni">
                  LinkedIn metni <span className="istege-bagli">(isteğe bağlı)</span>
                  <AlanBilgisi etiket="LinkedIn metni">
                    İlan yayına girdikten sonra “İlanı adayların gördüğü gibi aç” sayfasından bağlantıyı kopyalayıp bu metinle paylaşabilirsiniz.
                  </AlanBilgisi>
                </label>
                <textarea
                  id="linkedinMetni"
                  name="linkedinMetni"
                  className="metin-alani"
                  rows={3}
                  maxLength={700}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
                <span className="sayac-metin">{linkedin.length} / 700</span>
              </div>
              <fieldset className="alan">
                <legend>
                  İlanın dili
                  <AlanBilgisi etiket="İlanın dili">İngilizce ilan, Türkçe bilmeyen adayların da başvurabileceğini gösterir.</AlanBilgisi>
                </legend>
                <div className="yan-yana">
                  {(
                    [
                      ['tr', 'Türkçe'],
                      ['en', 'İngilizce'],
                      ['ikisi', 'Her ikisi'],
                    ] as const
                  ).map(([d, a]) => (
                    <label key={d} className="secenek secenek-kutu">
                      <input type="radio" name="ilanDili" value={d} defaultChecked={(b.dil || 'tr') === d} /> <span>{a}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>,
          )}
        </div>
      </div>

      <div className="yapiskan-alt f-form-ayak">
        <Link className="dugme dugme--sade" href="/firma-paneli/ilanlar">
          İlanlara dön
        </Link>
        <GonderDugmesi className="dugme dugme--ikincil" bekleme="Kaydediliyor…">
          {taslak ? 'Taslağı kaydet' : yayinda ? 'Değişiklikleri kaydet' : 'Kaydet'}
        </GonderDugmesi>
        <button type="submit" name="hedef" value="onizle" className="dugme">
          Kaydet ve önizle
        </button>
      </div>
    </form>
  )
}
