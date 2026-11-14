/**
 * Profil alan grupları (K28). Düzenleme pencereleri ve profil sihirbazı aynı grupları kullanır.
 * Metinler: docs/tasarim/metin-kilavuzu.md (tam cümle; adaya “sen”).
 */
import type { Adaylar } from '@/payload-types'
import { CEFR, DENEYIM_ADI, DENEYIM_SIRASI } from '@/alan/eslesme'
import { SINIFLAR } from '@/alan/basvuru'
import { CINSIYET_ADI } from '@/alan/havuz'
import { ListeDuzenleyici } from './ProfilFormlari'
import { SatirListesi } from './SatirListesi'

export type Secenek = { id: number; ad: string }
export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const BECERI_SEVIYE: Array<[string, string]> = [
  ['baslangic', 'Başlangıç'],
  ['orta', 'Orta'],
  ['iyi', 'İyi'],
  ['uzman', 'Uzman'],
]
export const SEVIYE_ADI = Object.fromEntries(BECERI_SEVIYE) as Record<string, string>
const ad = (x: unknown) => (x && typeof x === 'object' ? ((x as { ad?: string }).ad ?? '') : '')
const kimlik = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : (x as number | null))
const ayYil = (iso?: string | null) => (iso ? { ay: new Date(iso).getUTCMonth() + 1, yil: new Date(iso).getUTCFullYear() } : null)

function Secim(props: { id: string; etiket: string; secenekler: Array<{ id: number | string; ad: string }>; deger?: number | string | null; ipucu?: string; istegeBagli?: boolean }) {
  return (
    <div className="alan">
      <label htmlFor={props.id}>
        {props.etiket} {props.istegeBagli && <span className="istege-bagli">(isteğe bağlı)</span>}
      </label>
      {props.ipucu && <span className="ipucu">{props.ipucu}</span>}
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

export function HakkindaAlanlari({ aday }: { aday: Adaylar }) {
  return (
    <div className="alan">
      <label htmlFor="tanitim">Kendini kısaca tanıt</label>
      <span className="ipucu">Neyle ilgilendiğini, ne tür bir iş veya staj aradığını iki üç cümleyle yaz. En fazla 500 karakter yazabilirsin.</span>
      <textarea id="tanitim" name="tanitim" className="metin-alani" maxLength={500} defaultValue={aday.tanitim ?? ''} />
    </div>
  )
}

export function KimlikAlanlari({ aday }: { aday: Adaylar }) {
  return (
    <>
      <div className="alan">
        <label htmlFor="telefon">
          Telefon <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        <span className="ipucu">Numaranı yalnızca başvurduğun firmalar ve profilini açan firmalar görür.</span>
        <input id="telefon" name="telefon" className="girdi" type="tel" inputMode="tel" autoComplete="tel" defaultValue={aday.telefon ?? ''} />
      </div>
      <fieldset className="alan" id="cinsiyet">
        <legend>
          Cinsiyet <span className="istege-bagli">(isteğe bağlı)</span>
        </legend>
        <span className="ipucu">Bu bilgi CV havuzunda görünür ama arama, filtreleme ve eşleştirmede hiçbir zaman kullanılmaz.</span>
        <div className="yan-yana">
          {Object.entries(CINSIYET_ADI).map(([d, e]) => (
            <label key={d} className="secenek secenek-kutu">
              <input type="radio" name="cinsiyet" value={d} defaultChecked={aday.cinsiyet === d} /> <span>{e}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  )
}

export function EgitimAlanlari({ aday, okullar, bolumler }: { aday: Adaylar; okullar: Secenek[]; bolumler: Secenek[] }) {
  const m = ayYil(aday.mezuniyet)
  return (
    <>
      <Secim id="okul" etiket="Okul" secenekler={okullar} deger={kimlik(aday.okul)} ipucu="Okulun listede yoksa Yönetici A.Ş.’ye yaz; listeye ekleriz." />
      <Secim id="bolum" etiket="Bölüm" secenekler={bolumler} deger={kimlik(aday.bolum)} />
      <div className="iki-alan">
        <Secim id="sinif" etiket="Sınıf" secenekler={SINIFLAR.map((s) => ({ id: s, ad: s }))} deger={aday.sinif} />
        <div className="alan">
          <label htmlFor="gano">
            Genel not ortalaması (GANO) <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <input id="gano" name="gano" className="girdi" inputMode="decimal" placeholder="Örneğin 3,12" defaultValue={aday.gano != null ? String(aday.gano).replace('.', ',') : ''} />
        </div>
      </div>
      <fieldset className="alan">
        <legend>Mezuniyet tarihi</legend>
        <span className="ipucu">Henüz mezun olmadıysan beklediğin tarihi seç.</span>
        <div className="iki-alan">
          <Secim id="mezuniyetAy" etiket="Ay" secenekler={AYLAR.map((x, n) => ({ id: n + 1, ad: x }))} deger={m?.ay} />
          <Secim id="mezuniyetYil" etiket="Yıl" secenekler={Array.from({ length: 40 }, (_, n) => new Date().getFullYear() + 6 - n).map((y) => ({ id: y, ad: String(y) }))} deger={m?.yil} />
        </div>
      </fieldset>
    </>
  )
}

export function DeneyimAlanlari({ aday }: { aday: Adaylar }) {
  return (
    <>
      <fieldset className="alan" id="deneyimSeviyesi">
        <legend>Deneyim düzeyin</legend>
        <span className="ipucu">İlanlardaki deneyim şartıyla karşılaştırmak için kullanılır.</span>
        <div className="yan-yana">
          {DENEYIM_SIRASI.map((d) => (
            <label key={d} className="secenek secenek-kutu">
              <input type="radio" name="deneyimSeviyesi" value={d} defaultChecked={aday.deneyimSeviyesi === d} /> <span>{DENEYIM_ADI[d]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="alan">
        <legend>İş ve staj deneyimlerin</legend>
        <SatirListesi
          ad="deneyimlerJson"
          hataOneki="deneyim"
          satirAdi="deneyim"
          ekleMetni="Deneyim ekle"
          bosMetin="Henüz deneyim eklemedin. Stajlar, yarı zamanlı işler ve gönüllü çalışmalar da deneyim sayılır."
          enFazla={20}
          alanlar={[
            { ad: 'pozisyon', etiket: 'Pozisyon', tip: 'metin', zorunlu: true, ornek: 'Örneğin Yazılım Stajyeri' },
            { ad: 'kurum', etiket: 'Kurum', tip: 'metin', zorunlu: true, ornek: 'Örneğin Kodpit Teknoloji' },
            { ad: 'baslangic', etiket: 'Başlangıç', tip: 'ayYil' },
            { ad: 'devam', etiket: 'Hâlâ burada çalışıyorum', tip: 'onay' },
            { ad: 'bitis', etiket: 'Bitiş', tip: 'ayYil', gizleEger: 'devam' },
            { ad: 'aciklama', etiket: 'Neler yaptın?', tip: 'uzunMetin', ipucu: 'Üstlendiğin işleri ve kullandığın araçları kısaca yaz.' },
          ]}
          baslangic={(aday.deneyimler ?? []).map((d) => {
            const b = ayYil(d.baslangic)
            const s = ayYil(d.bitis)
            return { kurum: d.kurum, pozisyon: d.pozisyon, baslangicAy: b?.ay, baslangicYil: b?.yil, bitisAy: s?.ay, bitisYil: s?.yil, devam: Boolean(b && !s), aciklama: d.aciklama ?? '' }
          })}
        />
      </fieldset>
    </>
  )
}

export function BeceriAlanlari({ aday, beceriler }: { aday: Adaylar; beceriler: Secenek[] }) {
  return (
    <ListeDuzenleyici
      ad="beceri"
      etiket="Becerilerin"
      ipucu="Becerileri listeden seç. İlanlar da aynı listeyi kullandığı için eşleşmen doğru hesaplanır."
      secenekler={beceriler}
      seviyeler={BECERI_SEVIYE}
      baslangic={(aday.beceriler ?? []).map((b) => ({ ad: ad(b.beceri), seviye: b.seviye }))}
      enFazla={30}
    />
  )
}

export function DilAlanlari({ aday, diller }: { aday: Adaylar; diller: Secenek[] }) {
  return (
    <ListeDuzenleyici
      ad="dil"
      etiket="Bildiğin yabancı diller"
      ipucu="Seviyeni Avrupa Ortak Dil Çerçevesine (CEFR) göre seç: A1 başlangıç, C2 ana dil düzeyidir."
      secenekler={diller}
      seviyeler={CEFR.map((c) => [c, c])}
      baslangic={(aday.diller ?? []).map((d) => ({ ad: ad(d.dil), seviye: d.seviye }))}
      enFazla={10}
    />
  )
}

export function TercihAlanlari({ aday }: { aday: Adaylar }) {
  const t = aday.tercihler
  return (
    <>
      <fieldset className="alan">
        <legend>Ne tür ilanlarla ilgileniyorsun?</legend>
        <div className="yan-yana">
          {[
            ['staj', 'Staj'],
            ['is', 'İş'],
          ].map(([d, e]) => (
            <label key={d} className="secenek secenek-kutu">
              <input type="checkbox" name="tur" value={d} defaultChecked={(t?.turler ?? []).includes(d as never)} /> <span>{e}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="alan">
        <legend>Hangi çalışma modellerine uygunsun?</legend>
        <div className="yan-yana">
          {[
            ['ofiste', 'Ofiste'],
            ['hibrit', 'Hibrit'],
            ['uzaktan', 'Uzaktan'],
          ].map(([d, e]) => (
            <label key={d} className="secenek secenek-kutu">
              <input type="checkbox" name="model" value={d} defaultChecked={(t?.modeller ?? []).includes(d as never)} /> <span>{e}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="iki-alan">
        <div className="alan">
          <label htmlFor="sehir">Yaşadığın şehir</label>
          <input id="sehir" name="sehir" className="girdi" autoComplete="address-level2" defaultValue={t?.sehir ?? ''} />
        </div>
        <div className="alan">
          <label htmlFor="baslama">
            Ne zaman başlayabilirsin? <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <input id="baslama" name="baslama" className="girdi" placeholder="Örneğin Şubat 2027" defaultValue={t?.baslama ?? ''} />
        </div>
      </div>
      <label className="secenek">
        <input type="checkbox" name="tasinmayaAcik" value="1" defaultChecked={Boolean(t?.tasinmayaAcik)} /> <span>Başka bir şehre taşınabilirim.</span>
      </label>
      <div className="alan">
        <label htmlFor="ucretBeklentisi">
          Aylık net ücret beklentin (₺) <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        <span className="ipucu">Bu bilgi yalnızca CV havuzunda eşleştirme için kullanılır; firmalar ve başvuruların bu bilgiyi görmez.</span>
        <input id="ucretBeklentisi" name="ucretBeklentisi" className="girdi" inputMode="numeric" defaultValue={t?.ucretBeklentisi ?? ''} />
      </div>
    </>
  )
}

export function SertifikaAlanlari({ aday }: { aday: Adaylar }) {
  return (
    <SatirListesi
      ad="sertifikalarJson"
      hataOneki="sertifika"
      satirAdi="sertifika"
      ekleMetni="Sertifika ekle"
      bosMetin="Henüz sertifika eklemedin. Kurslar, eğitim programları ve yarışma derecelerini de ekleyebilirsin."
      enFazla={20}
      alanlar={[
        { ad: 'ad', etiket: 'Sertifikanın adı', tip: 'metin', zorunlu: true },
        { ad: 'kurum', etiket: 'Veren kurum', tip: 'metin' },
        { ad: 'yil', etiket: 'Yıl', tip: 'yil' },
      ]}
      baslangic={(aday.sertifikalar ?? []).map((s) => ({ ad: s.ad, kurum: s.kurum ?? '', yil: s.yil ?? '' }))}
    />
  )
}

export function BaglantiAlanlari({ aday }: { aday: Adaylar }) {
  return (
    <SatirListesi
      ad="baglantilarJson"
      hataOneki="baglanti"
      satirAdi="bağlantı"
      ekleMetni="Bağlantı ekle"
      bosMetin="Henüz bağlantı eklemedin. GitHub, Behance, LinkedIn veya kişisel siten çalışmalarını göstermenin iyi bir yoludur."
      enFazla={10}
      alanlar={[
        { ad: 'ad', etiket: 'Bağlantının adı', tip: 'metin', zorunlu: true, ornek: 'Örneğin GitHub' },
        { ad: 'adres', etiket: 'Adres', tip: 'adres', zorunlu: true, ornek: 'github.com/kullanici-adin' },
      ]}
      baslangic={(aday.baglantilar ?? []).map((b) => ({ ad: b.ad, adres: b.adres }))}
    />
  )
}
