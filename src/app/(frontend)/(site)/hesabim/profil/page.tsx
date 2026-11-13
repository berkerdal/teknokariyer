import type { Metadata } from 'next'
import { DENEYIM_ADI, DENEYIM_SIRASI } from '@/alan/eslesme'
import { SINIFLAR } from '@/alan/basvuru'
import { CINSIYET_ADI } from '@/alan/havuz'
import { Ikon } from '@/arayuz/Ikon'
import { CEFR_SEVIYELERI, CvSilDugmesi, CvYukleFormu, ListeDuzenleyici, ProfilBolumu } from '@/arayuz/aday/ProfilFormlari'
import { tarihYaz } from '@/arayuz/bicim'
import { EN_FAZLA_CV, kendiAdayKaydi } from '@/servisler/profil'
import { cvOzetleri, taksonomiSecenekleri } from '@/veri/basvuru'
import { payloadAl } from '@/veri/payload'
import { adayOturumu } from '@/veri/aday'

export const metadata: Metadata = { title: 'Profil ve CV’ler', robots: { index: false } }

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const SEVIYE: Array<[string, string]> = [['baslangic', 'Başlangıç'], ['orta', 'Orta'], ['iyi', 'İyi'], ['uzman', 'Uzman']]
const ad = (x: unknown) => (x && typeof x === 'object' ? ((x as { ad?: string }).ad ?? '') : '')
const id = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : (x as number | null))

/** Profil bir kez doldurulur, her başvuruda kullanılır. Tamamlanma göstergesi puan değil, eksikler listesi. */
export default async function ProfilSayfasi() {
  const k = await adayOturumu()
  const a = await kendiAdayKaydi(await payloadAl(), k)
  const [okullar, bolumler, beceriler, diller] = await Promise.all(['universite', 'bolum', 'beceri', 'dil'].map((t) => taksonomiSecenekleri(t as never)))
  const cvler = cvOzetleri(a)
  const mez = a.mezuniyet ? new Date(a.mezuniyet) : null

  const eksikler: Array<[string, string]> = [
    ...(!a.okul || !a.bolum ? [['Okul ve bölüm', '#egitim'] as [string, string]] : []),
    ...(!a.deneyimSeviyesi ? [['Deneyim düzeyi', '#egitim'] as [string, string]] : []),
    ...(!(a.beceriler ?? []).length ? [['Beceriler', '#beceriler'] as [string, string]] : []),
    ...(!(a.diller ?? []).length ? [['Diller', '#beceriler'] as [string, string]] : []),
    ...(!cvler.length ? [['CV', '#cvler'] as [string, string]] : []),
    ...(!(a.tercihler?.modeller ?? []).length ? [['Çalışma tercihleri', '#tercihler'] as [string, string]] : []),
  ]

  return (
    <>
      <h1 className="b1">Profil ve CV’ler</h1>
      {eksikler.length > 0 ? (
        <section className="panel panel-ic eksik-panel">
          <h2 className="b3">Profilinde eksik olanlar</h2>
          <ul className="eksikler">
            {eksikler.map(([e, h]) => (
              <li key={e}>
                <span>{e}</span>
                <a className="dugme dugme--sade dugme--kucuk" href={h}>
                  Ekle
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="basari-kutu">Profilin tamam. Başvurularında otomatik kullanılır.</p>
      )}

      <ProfilBolumu ad="kimlik" baslik="Kimlik ve iletişim">
        <dl className="ozet-dl">
          <div>
            <dt>Ad soyad</dt>
            <dd>{k.ad}</dd>
          </div>
          <div>
            <dt>E-posta</dt>
            <dd>{k.email}</dd>
          </div>
        </dl>
        <div className="alan">
          <label htmlFor="telefon">
            Telefon <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <input id="telefon" name="telefon" className="girdi" type="tel" inputMode="tel" autoComplete="tel" defaultValue={a.telefon ?? ''} />
        </div>
        <fieldset className="alan">
          <legend>
            Cinsiyet <span className="istege-bagli">(isteğe bağlı)</span>
          </legend>
          <span className="ipucu">CV havuzunda görünür; arama, filtre, sıralama ve eşleştirmede kullanılmaz.</span>
          <div className="yan-yana">
            {Object.entries(CINSIYET_ADI).map(([d, e]) => (
              <label key={d} className="secenek secenek-kutu">
                <input type="radio" name="cinsiyet" value={d} defaultChecked={a.cinsiyet === d} /> <span>{e}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="alan">
          <label htmlFor="tanitim">
            Kısa tanıtım <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <span className="ipucu">En fazla 500 karakter. Ne aradığını ve neyle ilgilendiğini birkaç cümleyle yaz.</span>
          <textarea id="tanitim" name="tanitim" className="metin-alani" maxLength={500} defaultValue={a.tanitim ?? ''} />
        </div>
      </ProfilBolumu>

      <ProfilBolumu ad="egitim" baslik="Eğitim ve deneyim">
        <div className="iki-alan">
          <Secim id="okul" etiket="Okul" secenekler={okullar} deger={id(a.okul)} />
          <Secim id="bolum" etiket="Bölüm" secenekler={bolumler} deger={id(a.bolum)} />
        </div>
        <div className="iki-alan">
          <Secim id="sinif" etiket="Sınıf" secenekler={SINIFLAR.map((s) => ({ id: s, ad: s }))} deger={a.sinif} />
          <div className="alan">
            <label htmlFor="gano">
              GANO <span className="istege-bagli">(isteğe bağlı)</span>
            </label>
            <input id="gano" name="gano" className="girdi" inputMode="decimal" defaultValue={a.gano != null ? String(a.gano).replace('.', ',') : ''} placeholder="Ör. 3,12" />
          </div>
        </div>
        <fieldset className="alan">
          <legend>Mezuniyet tarihi (beklenen de olur)</legend>
          <div className="iki-alan">
            <Secim id="mezuniyetAy" etiket="Ay" secenekler={AYLAR.map((x, n) => ({ id: n + 1, ad: x }))} deger={mez ? mez.getUTCMonth() + 1 : null} />
            <Secim id="mezuniyetYil" etiket="Yıl" secenekler={Array.from({ length: 30 }, (_, n) => 2031 - n).map((y) => ({ id: y, ad: String(y) }))} deger={mez?.getUTCFullYear() ?? null} />
          </div>
        </fieldset>
        <fieldset className="alan">
          <legend>Deneyim düzeyi</legend>
          <div className="yan-yana">
            {DENEYIM_SIRASI.map((d) => (
              <label key={d} className="secenek secenek-kutu">
                <input type="radio" name="deneyim" value={d} defaultChecked={a.deneyimSeviyesi === d} /> <span>{DENEYIM_ADI[d]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </ProfilBolumu>

      <ProfilBolumu ad="beceriler" baslik="Beceriler ve diller">
        <ListeDuzenleyici
          ad="beceri"
          etiket="Beceriler"
          secenekler={beceriler}
          seviyeler={SEVIYE}
          baslangic={(a.beceriler ?? []).map((b) => ({ ad: ad(b.beceri), seviye: b.seviye }))}
          enFazla={30}
        />
        <ListeDuzenleyici
          ad="dil"
          etiket="Diller (CEFR)"
          secenekler={diller}
          seviyeler={CEFR_SEVIYELERI}
          baslangic={(a.diller ?? []).map((d) => ({ ad: ad(d.dil), seviye: d.seviye }))}
          enFazla={10}
        />
      </ProfilBolumu>

      <section className="profil-bolum" id="cvler" aria-labelledby="b-cvler">
        <div className="bolum-bas">
          <h2 className="b3 kare-bas" id="b-cvler">
            CV’ler
          </h2>
          <span className="kucuk ikincil">
            {cvler.length} / {EN_FAZLA_CV}
          </span>
        </div>
        {cvler.map((cv) => (
          <div key={cv.id} className="dosya-satiri">
            <Ikon ad="dosya" />
            <span className="ad">
              {cv.ad}
              {cv.tarih && (
                <span className="kucuk ikincil" style={{ display: 'block' }}>
                  {tarihYaz(cv.tarih, true)} yüklendi
                </span>
              )}
            </span>
            <CvSilDugmesi dosyaId={cv.id} ad={cv.ad} />
          </div>
        ))}
        <CvYukleFormu kalan={EN_FAZLA_CV - cvler.length} />
      </section>

      <ProfilBolumu ad="tercihler" baslik="Tercihler">
        <fieldset className="alan">
          <legend>İlan türü</legend>
          <div className="yan-yana">
            {[
              ['staj', 'Staj'],
              ['is', 'İş'],
            ].map(([d, e]) => (
              <label key={d} className="secenek secenek-kutu">
                <input type="checkbox" name="tur" value={d} defaultChecked={(a.tercihler?.turler ?? []).includes(d as never)} /> <span>{e}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="alan">
          <legend>Çalışma modeli</legend>
          <div className="yan-yana">
            {[
              ['ofiste', 'Ofiste'],
              ['hibrit', 'Hibrit'],
              ['uzaktan', 'Uzaktan'],
            ].map(([d, e]) => (
              <label key={d} className="secenek secenek-kutu">
                <input type="checkbox" name="model" value={d} defaultChecked={(a.tercihler?.modeller ?? []).includes(d as never)} /> <span>{e}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="iki-alan">
          <div className="alan">
            <label htmlFor="sehir">Şehir</label>
            <input id="sehir" name="sehir" className="girdi" autoComplete="address-level2" defaultValue={a.tercihler?.sehir ?? ''} />
          </div>
          <div className="alan">
            <label htmlFor="baslama">
              Ne zaman başlayabilirsin? <span className="istege-bagli">(isteğe bağlı)</span>
            </label>
            <input id="baslama" name="baslama" className="girdi" placeholder="Ör. Şubat 2027" defaultValue={a.tercihler?.baslama ?? ''} />
          </div>
        </div>
        <label className="secenek">
          <input type="checkbox" name="tasinmayaAcik" value="1" defaultChecked={Boolean(a.tercihler?.tasinmayaAcik)} /> <span>Başka şehre taşınmaya açığım</span>
        </label>
        <div className="alan">
          <label htmlFor="ucretBeklentisi">
            Ücret beklentisi, net/ay (₺) <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <span className="ipucu">Yalnızca CV havuzunda eşleştirme için kullanılır; firmalara ve başvurularına gösterilmez.</span>
          <input id="ucretBeklentisi" name="ucretBeklentisi" className="girdi" inputMode="numeric" defaultValue={a.tercihler?.ucretBeklentisi ?? ''} />
        </div>
      </ProfilBolumu>
    </>
  )
}

function Secim(props: { id: string; etiket: string; secenekler: Array<{ id: number | string; ad: string }>; deger?: number | string | null }) {
  return (
    <div className="alan">
      <label htmlFor={props.id}>{props.etiket}</label>
      <select id={props.id} name={props.id} className="secim" defaultValue={props.deger != null ? String(props.deger) : ''}>
        <option value="">Seç</option>
        {props.secenekler.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ad}
          </option>
        ))}
      </select>
    </div>
  )
}
