'use client'
/**
 * Başvuru akışı (talimatlar 5; prototip “Başvuru akışı”).
 * - Profili tam aday en fazla 3 ekranda başvurur; profil eksikse önce yalnızca bu ilanın gerektirdikleri sorulur.
 * - Her adım geçilmeden denetlenir; hatalar formun üstünde özetlenir ve alanın altında yazar.
 * - Aydınlatma onayı ile CV havuzu rızası ayrı kutulardır; havuz kutusu varsayılan olarak işaretsizdir.
 * - Tek form: tüm adımlar aynı formda, yalnızca görünen adım değişir. Sunucu her şeyi yeniden denetler.
 */
import { TalepPenceresi } from '../TalepPenceresi'
import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { basvurEylemi, type BasvuruDurumu } from '@/eylemler/aday'
import { CEFR, DENEYIM_ADI, DENEYIM_SIRASI } from '@/alan/eslesme'
import { SINIFLAR } from '@/alan/basvuru'
import { Ikon } from '../Ikon'
import { DosyaSecici, GonderDugmesi, HataOzeti } from '../form'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const EKSIK_ADI: Record<string, string> = { okul: 'okul', bolum: 'bölüm', deneyim: 'deneyim düzeyi', sinif: 'sınıf', mezuniyet: 'mezuniyet tarihi' }

type Secenek = { id: number; ad: string }
export interface BasvuruAkisiProps {
  ilan: { id: number; pozisyonAdi: string; firmaAd: string; firmaAdIlgi: string; adres: string }
  /** Paylaşım bağlantısından gelindiyse (ör. linkedin) */
  kaynak?: string
  sorular: Array<{ id: string; soru: string; tip: string; secenekler: string[] }>
  eksikler: string[]
  okullar: Secenek[]
  bolumler: Secenek[]
  dilSartlari: Array<{ id: number; ad: string; seviye: string }>
  cvler: Array<{ id: number; ad: string; bilgi: string }>
  enFazlaCv: number
  profilOzeti: { ad: string; satir: string; eposta: string }
  aydinlatma: { surum: string; tarih: string }
  havuzMetni: { surum: string }
  havuzda: boolean
}

type Adim = 'eksik' | 'cv' | 'sorular' | 'onay'
const ADIM_ADI: Record<Adim, string> = { eksik: 'Eksik bilgiler', cv: 'CV ve ön yazı', sorular: 'Sorular', onay: 'Onay' }

export function BasvuruAkisi(p: BasvuruAkisiProps) {
  const adimlar = useMemo<Adim[]>(() => [...(p.eksikler.length ? ['eksik' as const] : []), 'cv', ...(p.sorular.length ? ['sorular' as const] : []), 'onay'], [p.eksikler.length, p.sorular.length])
  const [durum, eylem] = useActionState<BasvuruDurumu, FormData>(basvurEylemi, {})
  const [adim, setAdim] = useState<Adim>(adimlar[0]!)
  const [yerel, setYerel] = useState<Record<string, string>>({})
  const [cvSecim, setCvSecim] = useState<string>(p.cvler[0] ? String(p.cvler[0].id) : 'yeni')
  const [onYazi, setOnYazi] = useState('')
  const [kirli, setKirli] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  // Sunucudan gelen alan hatası: hatanın bulunduğu adıma dön.
  const hatalar = { ...(durum.hatalar ?? {}), ...yerel }
  useEffect(() => {
    const ilk = Object.keys(durum.hatalar ?? {})[0]
    if (!ilk) return
    const hedef: Adim = ilk.startsWith('soru') ? 'sorular' : ilk.startsWith('cv') ? 'cv' : ilk === 'aydinlatma' ? 'onay' : 'eksik'
    if (adimlar.includes(hedef)) setAdim(hedef) // eslint-disable-line react-hooks/set-state-in-effect
  }, [durum, adimlar])

  // Kaydedilmemiş değişiklik uyarısı (yarım kalan başvuru).
  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])

  const no = adimlar.indexOf(adim) + 1
  const deger = (ad: string) => (form.current ? new FormData(form.current).get(ad) : null)

  function denetle(a: Adim): Record<string, string> {
    const h: Record<string, string> = {}
    if (a === 'eksik') {
      for (const e of p.eksikler) {
        if (e === 'mezuniyet') {
          if (!deger('mezuniyetAy') || !deger('mezuniyetYil')) h.mezuniyet = 'Mezuniyet ayını ve yılını seç.'
        } else if (e.startsWith('dil:')) {
          if (!deger(`dil-${e.slice(4)}`)) h[`dil-${e.slice(4)}`] = `${p.dilSartlari.find((d) => String(d.id) === e.slice(4))?.ad ?? 'Dil'} seviyeni seç.`
        } else if (!deger(e)) h[e] = `${EKSIK_ADI[e]![0]!.toLocaleUpperCase('tr')}${EKSIK_ADI[e]!.slice(1)} bilgisini seç.`
      }
    }
    if (a === 'cv') {
      const d = deger('cvDosya')
      if (cvSecim === 'yeni' && !(d instanceof File && d.size > 0)) h.cvDosya = 'Gönderilecek CV’yi seç veya bir PDF yükle.'
      if (cvSecim === 'yeni' && d instanceof File && d.size > 5 * 1024 * 1024) h.cvDosya = 'Dosya 5 MB’tan büyük. PDF’i sıkıştırıp tekrar yükle.'
      if (cvSecim === 'yeni' && d instanceof File && d.size > 0 && d.type && d.type !== 'application/pdf') h.cvDosya = 'Yalnızca PDF yüklenebilir.'
    }
    if (a === 'sorular') {
      for (const s of p.sorular) if (!String(deger(`soru:${s.id}`) ?? '').trim()) h[`soru:${s.id}`] = s.tip === 'kisa' ? 'Bu soruyu cevapla.' : 'Bir seçenek işaretle.'
    }
    if (a === 'onay' && !deger('aydinlatma')) h.aydinlatma = 'Başvurmak için aydınlatma metnini okuduğunu onayla.'
    return h
  }

  function ileri() {
    const h = denetle(adim)
    setYerel(h)
    if (Object.keys(h).length) return
    setAdim(adimlar[no]!)
    window.scrollTo({ top: 0 })
  }
  function geri() {
    setYerel({})
    setAdim(adimlar[no - 2]!)
    window.scrollTo({ top: 0 })
  }

  const hataOzeti = { ...durum, hatalar }
  return (
    <>
      <Ust {...p} />
      <div className="cubuk-ilerleme" role="progressbar" aria-valuemin={1} aria-valuemax={adimlar.length} aria-valuenow={no} aria-label={`Başvuru adımı ${no}/${adimlar.length}`}>
        <span style={{ width: `${(no / adimlar.length) * 100}%` }} />
      </div>
      <ol className="adimlar bv-adimlar">
        {adimlar.map((a, n) => (
          <li key={a} className={n + 1 < no ? 'tamam' : undefined} aria-current={a === adim ? 'step' : undefined}>
            <span className="no">{n + 1}</span>
            <span className={a === adim ? undefined : 'adim-ad'}>{ADIM_ADI[a]}</span>
          </li>
        ))}
      </ol>
      <form
        ref={form}
        action={eylem}
        noValidate
        onChange={() => setKirli(true)}
        onSubmit={(e) => {
          const h = denetle('onay')
          setYerel(h)
          if (Object.keys(h).length) e.preventDefault()
        }}
      >
        <input type="hidden" name="ilan" value={p.ilan.id} />
        {p.kaynak && <input type="hidden" name="kaynak" value={p.kaynak} />}
        <input type="hidden" name="eksikler" value={p.eksikler.join(',')} />
        <main id="icerik" className="bv">
          <div className="bv-govde">
            <HataOzeti durum={hataOzeti} alanlar={{ okul: 'okul', bolum: 'bolum', deneyim: 'deneyim-0', sinif: 'sinif', mezuniyet: 'mezuniyetAy', aydinlatma: 'aydinlatma', cvDosya: 'cvDosya', cv: 'cv-0' }} />

            {p.eksikler.length > 0 && (
              <section hidden={adim !== 'eksik'} className="form-yigin">
                <h1 className="b2">Bu ilan için {p.eksikler.length} bilgi eksik</h1>
                <p className="ikincil">Cevapların profiline de kaydedilir; sonraki başvurularında bu bilgileri yeniden sormayız.</p>
                {p.eksikler.includes('okul') && (
                  <>
                    <Secim id="okul" etiket="Okul" hata={hatalar.okul} secenekler={p.okullar} ipucu="Listede yoksa şimdilik en yakın seçeneği seç ve eklenmesini iste." />
                    <TalepPenceresi tur="universite" kaynak="basvuru:okul" hitap="sen" dugme="Okulun listede yok mu? Eklenmesini iste" />
                  </>
                )}
                {p.eksikler.includes('bolum') && <Secim id="bolum" etiket="Bölüm" hata={hatalar.bolum} secenekler={p.bolumler} />}
                {p.eksikler.includes('deneyim') && (
                  <fieldset className={hatalar.deneyim ? 'alan alan--hata' : 'alan'}>
                    <legend>Deneyim düzeyin</legend>
                    {hatalar.deneyim && <p className="hata-metni">{hatalar.deneyim}</p>}
                    <div className="yan-yana">
                      {DENEYIM_SIRASI.map((d, n) => (
                        <label key={d} className="secenek secenek-kutu">
                          <input id={`deneyim-${n}`} type="radio" name="deneyim" value={d} /> <span>{DENEYIM_ADI[d]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {p.eksikler.includes('sinif') && (
                  <Secim id="sinif" etiket="Sınıfın" hata={hatalar.sinif} secenekler={SINIFLAR.map((s) => ({ id: s, ad: s }))} />
                )}
                {p.eksikler.includes('mezuniyet') && (
                  <fieldset className={hatalar.mezuniyet ? 'alan alan--hata' : 'alan'}>
                    <legend>Mezuniyet tarihin (beklenen)</legend>
                    {hatalar.mezuniyet && <p className="hata-metni">{hatalar.mezuniyet}</p>}
                    <div className="iki-alan">
                      <Secim id="mezuniyetAy" etiket="Ay" secenekler={AYLAR.map((a, n) => ({ id: n + 1, ad: a }))} />
                      <Secim id="mezuniyetYil" etiket="Yıl" secenekler={Array.from({ length: 16 }, (_, n) => 2031 - n).map((y) => ({ id: y, ad: String(y) }))} />
                    </div>
                  </fieldset>
                )}
                {p.dilSartlari
                  .filter((d) => p.eksikler.includes(`dil:${d.id}`))
                  .map((d) => (
                    <fieldset key={d.id} className={hatalar[`dil-${d.id}`] ? 'alan alan--hata' : 'alan'}>
                      <legend>{d.ad} seviyen</legend>
                      <span className="ipucu">Avrupa Ortak Dil Çerçevesi (CEFR). Bu ilan en az {d.seviye} istiyor. Emin değilsen kendini değerlendirdiğin seviyeyi seç.</span>
                      {hatalar[`dil-${d.id}`] && <p className="hata-metni">{hatalar[`dil-${d.id}`]}</p>}
                      <div className="yan-yana">
                        {CEFR.map((s, n) => (
                          <label key={s} className="secenek secenek-kutu">
                            <input id={n === 0 ? `dil-${d.id}` : undefined} type="radio" name={`dil-${d.id}`} value={s} /> <span>
                              <strong>{s}</strong>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
              </section>
            )}

            <section hidden={adim !== 'cv'} className="form-yigin">
              <h1 className="b2">CV’ni seç</h1>
              <div className="panel panel-ic profil-ozet">
                <div>
                  <p className="ust-etiket">Bu başvuruyla gönderilecek profil</p>
                  <p>
                    <strong>{p.profilOzeti.ad}</strong>
                    {p.profilOzeti.satir ? ` · ${p.profilOzeti.satir}` : ''}
                  </p>
                </div>
                <Link href="/hesabim/profil" className="kucuk" target="_blank">
                  Düzenle
                </Link>
              </div>
              <fieldset className={hatalar.cvDosya || hatalar.cv ? 'alan alan--hata' : 'alan'}>
                <legend>Hangi CV gönderilsin?</legend>
                {(hatalar.cvDosya || hatalar.cv) && <p className="hata-metni">{hatalar.cvDosya || hatalar.cv}</p>}
                {p.cvler.map((cv, n) => (
                  <label key={cv.id} className="secenek secenek-kutu">
                    <input id={`cv-${n}`} type="radio" name="cv" value={cv.id} checked={cvSecim === String(cv.id)} onChange={() => setCvSecim(String(cv.id))} />
                    <span>
                      <Ikon ad="dosya" kucuk /> <strong>{cv.ad}</strong>
                      <span className="ipucu">{cv.bilgi}</span>
                    </span>
                  </label>
                ))}
                {p.cvler.length < p.enFazlaCv && (
                  <label className="secenek secenek-kutu">
                    <input type="radio" name="cv" value="" checked={cvSecim === 'yeni'} onChange={() => setCvSecim('yeni')} />
                    <span>
                      <Ikon ad="arti" kucuk /> <strong>Yeni CV yükle</strong>
                      <span className="ipucu">Yalnızca PDF dosyası yükleyebilirsin; dosya en fazla 5 MB olabilir. Yüklediğin CV profiline de eklenir.</span>
                    </span>
                  </label>
                )}
                {cvSecim === 'yeni' && (
                  <div className="dosya">
                    <DosyaSecici id="cvDosya" ad="cvDosya" />
                    <div className="alan">
                      <label htmlFor="cvAd">
                        CV’ye bir ad ver <span className="istege-bagli">(isteğe bağlı)</span>
                      </label>
                      <input id="cvAd" name="cvAd" className="girdi" placeholder="Ör. CV – Türkçe" maxLength={60} />
                    </div>
                  </div>
                )}
              </fieldset>
              <div className="alan">
                <label htmlFor="onYazi">
                  Ön yazı <span className="istege-bagli">(isteğe bağlı)</span>
                </label>
                <span className="ipucu" id="onYazi-ipucu">
                  Firmaya neden bu ilana başvurduğunu birkaç cümleyle anlatabilirsin.
                </span>
                <textarea id="onYazi" name="onYazi" className="metin-alani" maxLength={1500} value={onYazi} onChange={(e) => setOnYazi(e.target.value)} aria-describedby="onYazi-ipucu onYazi-say" />
                <span className="sayac-metin" id="onYazi-say">
                  {onYazi.length} / 1500
                </span>
              </div>
            </section>

            {p.sorular.length > 0 && (
              <section hidden={adim !== 'sorular'} className="form-yigin">
                <h1 className="b2">{p.ilan.firmaAdIlgi} soruları</h1>
                {p.sorular.map((s) => {
                  const h = hatalar[`soru:${s.id}`]
                  const ad = `soru:${s.id}`
                  if (s.tip === 'kisa')
                    return (
                      <div key={s.id} className={h ? 'alan alan--hata' : 'alan'}>
                        <label htmlFor={ad}>{s.soru}</label>
                        {h && <p className="hata-metni">{h}</p>}
                        <textarea id={ad} name={ad} className="metin-alani" maxLength={1000} />
                      </div>
                    )
                  const secenekler = s.tip === 'evet-hayir' ? ['Evet', 'Hayır'] : s.secenekler
                  return (
                    <fieldset key={s.id} className={h ? 'alan alan--hata' : 'alan'} id={ad}>
                      <legend>{s.soru}</legend>
                      {h && <p className="hata-metni">{h}</p>}
                      {secenekler.map((x) => (
                        <label key={x} className="secenek secenek-kutu">
                          <input type="radio" name={ad} value={x} /> <span>{x}</span>
                        </label>
                      ))}
                    </fieldset>
                  )
                })}
              </section>
            )}

            <section hidden={adim !== 'onay'} className="form-yigin">
              <h1 className="b2">Kontrol et ve gönder</h1>
              <Kontrol form={form} adim={adim} p={p} cvSecim={cvSecim} onYazi={onYazi} git={setAdim} />
              <div className={hatalar.aydinlatma ? 'alan alan--hata' : 'alan'}>
                {hatalar.aydinlatma && <p className="hata-metni">{hatalar.aydinlatma}</p>}
                <label className="secenek">
                  <input id="aydinlatma" type="checkbox" name="aydinlatma" value="1" />
                  <span>
                    <Link href="/metin/basvuru-aydinlatma" target="_blank">
                      Başvuru aydınlatma metnini
                    </Link>{' '}
                    okudum. Profilimin ve CV’min {p.ilan.firmaAd} ile paylaşılacağını biliyorum.
                    <span className="ipucu">
                      Metin sürümü {p.aydinlatma.surum} · {p.aydinlatma.tarih}
                    </span>
                  </span>
                </label>
              </div>
              {p.havuzda ? (
                <p className="bilgi kucuk">CV havuzundasın. Ayarlarını “CV havuzu” sayfasından değiştirebilirsin.</p>
              ) : (
                <div className="havuz-kutu">
                  <label className="secenek">
                    <input type="checkbox" name="havuz" value="1" />
                    <span>
                      <strong>Bilgilerimi CV havuzuna ekle</strong> <span className="istege-bagli">(isteğe bağlı)</span>
                      <span className="ipucu">
                        Teknokent firmaları ilan açmadan da seni bulabilir. Arama listesinde adın ve iletişim bilgin görünmez; bir firma profilini açtığında adın, iletişim
                        bilgin ve CV’n ona görünür, sana ayrıca sorulmaz. Kaç firmanın açtığını görürsün. Rızan 12 ay geçerli; istediğin zaman geri alabilirsin.{' '}
                        <Link href="/metin/havuz" target="_blank">
                          Açık rıza metni (sürüm {p.havuzMetni.surum})
                        </Link>
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </section>
          </div>
        </main>
        <div className="yapiskan-alt bv-ayak">
          {no > 1 && (
            <button type="button" className="dugme dugme--ikincil" onClick={geri}>
              Geri
            </button>
          )}
          {adim !== 'onay' ? (
            <button type="button" className="dugme dugme--genis" onClick={ileri}>
              Devam et
            </button>
          ) : (
            <GonderDugmesi bekleme="Gönderiliyor…">Başvurunu gönder</GonderDugmesi>
          )}
        </div>
      </form>
    </>
  )
}

function Ust({ ilan }: BasvuruAkisiProps) {
  return (
    <header className="bv-ust">
      <Link className="geri" href={ilan.adres}>
        <Ikon ad="kapat" kucuk />
        <span>Vazgeç</span>
      </Link>
      <span className="bv-ilan">
        <strong>{ilan.pozisyonAdi}</strong>
        <span className="kucuk ikincil">{ilan.firmaAd}</span>
      </span>
    </header>
  )
}

function Secim(props: { id: string; etiket: string; hata?: string; ipucu?: string; secenekler: Array<{ id: number | string; ad: string }> }) {
  return (
    <div className={props.hata ? 'alan alan--hata' : 'alan'}>
      <label htmlFor={props.id}>{props.etiket}</label>
      {props.ipucu && <span className="ipucu">{props.ipucu}</span>}
      {props.hata && <p className="hata-metni">{props.hata}</p>}
      <select id={props.id} name={props.id} className="secim" defaultValue="">
        <option value="" disabled>
          Seç
        </option>
        {props.secenekler.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ad}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Son adımda özet: her satırdan ilgili adıma dönülür. */
function Kontrol(props: { form: React.RefObject<HTMLFormElement | null>; adim: Adim; p: BasvuruAkisiProps; cvSecim: string; onYazi: string; git: (a: Adim) => void }) {
  const { p } = props
  if (props.adim !== 'onay' || !props.form.current) return null
  const fd = new FormData(props.form.current)
  const dosya = fd.get('cvDosya')
  const cv = props.cvSecim === 'yeni' ? (dosya instanceof File && dosya.name ? `Yeni: ${dosya.name}` : '—') : (p.cvler.find((c) => String(c.id) === props.cvSecim)?.ad ?? '—')
  return (
    <dl className="kontrol-dl panel">
      <div>
        <dt>CV</dt>
        <dd>{cv}</dd>
        <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => props.git('cv')}>
          Değiştir
        </button>
      </div>
      <div>
        <dt>Ön yazı</dt>
        <dd>{props.onYazi ? `${props.onYazi.slice(0, 80)}${props.onYazi.length > 80 ? '…' : ''}` : 'Yok'}</dd>
        <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => props.git('cv')}>
          Değiştir
        </button>
      </div>
      {p.sorular.map((s) => (
        <div key={s.id}>
          <dt>{s.soru}</dt>
          <dd>{String(fd.get(`soru:${s.id}`) ?? '—').slice(0, 120) || '—'}</dd>
          <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => props.git('sorular')}>
            Değiştir
          </button>
        </div>
      ))}
    </dl>
  )
}
