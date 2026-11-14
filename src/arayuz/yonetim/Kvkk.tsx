'use client'
/** KVKK başvuruları: elle kayıt, incelemeye alma, iç not, hesap silme ve sonuçlandırma formları. Hitap: siz (K9). */
import { useActionState, useState } from 'react'
import { KIMLIK_YONTEMLERI, KVKK_KANALLARI, KVKK_SONUC_ADI, KVKK_TALEP_TURLERI, aciklamaZorunluMu, cevapTaslagi, type KvkkSonuc, type KvkkTalepTuru } from '@/alan/kvkk'
import { kvkkIslemEylemi, kvkkKayitEylemi } from '@/eylemler/kvkk'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'
import { TarihSecici } from '../TarihSecici'

export function KvkkKayitFormu({ bugun, enErken }: { bugun: string; enErken: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkKayitEylemi, {})
  const h = durum.hatalar ?? {}
  const d = durum.degerler ?? {}
  const [tur, setTur] = useState<KvkkTalepTuru | ''>((d.tur as KvkkTalepTuru) || '')
  const sinif = (a: string) => (h[a] ? 'alan alan--hata' : 'alan')
  return (
    <form key={durum.surum ?? 0} action={eylem} noValidate className="y-karar">
      <HataOzeti durum={durum} siz alanlar={{ tur: 'kv-tur', kanal: 'kv-kanal', ad: 'kv-ad', eposta: 'kv-eposta', basvuruTarihi: 'kv-tarih', kimlik: 'kv-kimlik', aciklama: 'kv-aciklama' }} />
      <div className="y-iki-alan">
        <div className={sinif('ad')}>
          <label htmlFor="kv-ad">Başvuranın adı soyadı</label>
          {h.ad && <p className="hata-metni">{h.ad}</p>}
          <input id="kv-ad" name="ad" className="girdi" defaultValue={d.ad} autoComplete="off" />
        </div>
        <div className={sinif('eposta')}>
          <label htmlFor="kv-eposta">Cevap e-posta adresi</label>
          <span className="ipucu">Adres portalda kayıtlı bir aday hesabına aitse başvuru o hesaba bağlanır.</span>
          {h.eposta && <p className="hata-metni">{h.eposta}</p>}
          <input id="kv-eposta" name="eposta" type="email" className="girdi" defaultValue={d.eposta} autoComplete="off" />
        </div>
      </div>
      <div className={sinif('tur')}>
        <label htmlFor="kv-tur">Başvurunun konusu</label>
        {h.tur && <p className="hata-metni">{h.tur}</p>}
        <select id="kv-tur" name="tur" className="girdi" value={tur} onChange={(e) => setTur(e.target.value as KvkkTalepTuru)}>
          <option value="">Seçin</option>
          {KVKK_TALEP_TURLERI.map(([t, a]) => (
            <option key={t} value={t}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className={sinif('aciklama')}>
        <label htmlFor="kv-aciklama">
          Başvuranın istediği {!(tur && aciklamaZorunluMu(tur)) && <span className="istege-bagli">(isteğe bağlı)</span>}
        </label>
        <span className="ipucu">E-postanın veya dilekçenin özünü yazın. Belgenin kendisini buraya yapıştırmayın.</span>
        {h.aciklama && <p className="hata-metni">{h.aciklama}</p>}
        <textarea id="kv-aciklama" name="aciklama" className="girdi" rows={3} maxLength={3000} defaultValue={d.aciklama} />
      </div>
      <div className="y-iki-alan">
        <fieldset className={sinif('kanal')} id="kv-kanal">
          <legend>Nasıl geldi?</legend>
          {h.kanal && <p className="hata-metni">{h.kanal}</p>}
          {KVKK_KANALLARI.filter(([k]) => k !== 'portal').map(([k, a]) => (
            <label key={k} className="secenek">
              <input type="radio" name="kanal" value={k} defaultChecked={d.kanal === k} /> <span>{a}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className={sinif('kimlik')} id="kv-kimlik">
          <legend>Kimlik nasıl doğrulandı?</legend>
          {h.kimlik && <p className="hata-metni">{h.kimlik}</p>}
          {KIMLIK_YONTEMLERI.filter(([k]) => k !== 'hesap').map(([k, a]) => (
            <label key={k} className="secenek">
              <input type="radio" name="kimlik" value={k} defaultChecked={d.kimlik === k} /> <span>{a}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className={sinif('basvuruTarihi')} id="kv-tarih">
        <label htmlFor="kv-tarih-girdi">Başvurunun ulaştığı gün</label>
        <span className="ipucu">Yasal 30 günlük süre bu günden sayılır. E-postanın geldiği veya dilekçenin teslim alındığı günü seçin.</span>
        {h.basvuruTarihi && <p className="hata-metni">{h.basvuruTarihi}</p>}
        <TarihSecici ad="basvuruTarihi" id="kv-tarih-girdi" deger={d.basvuruTarihi || bugun} bugun={bugun} enErken={enErken} enGec={bugun} sinirNedeni="Başvuru tarihi bugünden sonra olamaz." />
      </div>
      <label className="secenek">
        <input type="checkbox" name="alindiBildir" defaultChecked={d.alindiBildir !== undefined ? d.alindiBildir === 'on' : true} />{' '}
        <span>
          Başvurana “başvurunuz alındı” e-postası gönder
          <span className="ipucu">E-postada başvurunun en geç hangi tarihte sonuçlanacağı yazar.</span>
        </span>
      </label>
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="Kaydediliyor…">
        Başvuruyu kaydet
      </GonderDugmesi>
    </form>
  )
}

function Hata({ durum }: { durum: FormDurumu }) {
  const mesaj = durum.genel ?? Object.values(durum.hatalar ?? {})[0]
  return mesaj ? (
    <p className="hata-metni" role="alert">
      {mesaj}
    </p>
  ) : null
}

export function IncelemeFormu({ talepId, kimlik, hesapVar }: { talepId: number; kimlik: string; hesapVar: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkIslemEylemi, {})
  const secenekler = KIMLIK_YONTEMLERI.filter(([k]) => k !== 'dogrulanmadi' && (k !== 'kayitli-eposta' || hesapVar) && (k !== 'hesap' || kimlik === 'hesap'))
  return (
    <form key={durum.surum ?? 0} action={eylem} className="y-karar">
      <input type="hidden" name="talep" value={talepId} />
      <input type="hidden" name="islem" value="incele" />
      {kimlik === 'hesap' ? (
        <p className="kucuk">Başvuran hesabına giriş yaparak başvurduğu için kimliği doğrulanmış sayılır.</p>
      ) : (
        <fieldset className="alan">
          <legend>Kimlik nasıl doğrulandı?</legend>
          <span className="ipucu">Kimliği doğrulanmayan kişiye kişisel veri verilmez. Gerekirse başvurandan ek bilgi isteyin ve not olarak yazın.</span>
          {secenekler.map(([k, a]) => (
            <label key={k} className="secenek">
              <input type="radio" name="kimlik" value={k} defaultChecked={(durum.degerler?.kimlik ?? kimlik) === k} /> <span>{a}</span>
            </label>
          ))}
        </fieldset>
      )}
      <Hata durum={durum} />
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="…">
        İncelemeye al
      </GonderDugmesi>
    </form>
  )
}

export function NotFormu({ talepId }: { talepId: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkIslemEylemi, {})
  return (
    <form key={durum.surum ?? 0} action={eylem} className="y-karar">
      <input type="hidden" name="talep" value={talepId} />
      <input type="hidden" name="islem" value="not" />
      <label htmlFor={`kv-not-${talepId}`} className="gizli">
        İç not
      </label>
      <textarea id={`kv-not-${talepId}`} name="not" className="girdi" rows={2} maxLength={2000} placeholder="Örnek: Başvurandan kimlik belgesi istendi." />
      <Hata durum={durum} />
      <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="…">
        Not ekle
      </GonderDugmesi>
    </form>
  )
}

export function HesapSilFormu({ talepId, ad, basvuruSayisi }: { talepId: number; ad: string; basvuruSayisi: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkIslemEylemi, {})
  const [onay, setOnay] = useState(false)
  return (
    <form key={durum.surum ?? 0} action={eylem} className="y-karar">
      <input type="hidden" name="talep" value={talepId} />
      <input type="hidden" name="islem" value="sil" />
      <p className="kucuk">
        {ad} adlı aday hesabı silinir: profil, bütün CV dosyaları, havuz kaydı ve onay kayıtları. {basvuruSayisi} başvurusu firmalarda “aday hesabını sildi” olarak
        kalır; başvurulardan ad, iletişim bilgileri, ön yazı ve CV çıkarılır. Bu işlem geri alınamaz.
      </p>
      <label className="secenek">
        <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} /> <span>Başvuranın kimliğini doğruladım; hesabın silinmesini onaylıyorum.</span>
      </label>
      <Hata durum={durum} />
      {onay && (
        <GonderDugmesi className="dugme dugme--tehlike dugme--kucuk" bekleme="Siliniyor…">
          Hesabı kalıcı olarak sil
        </GonderDugmesi>
      )}
    </form>
  )
}

export function SonucFormu({ talepId, tur, hitap }: { talepId: number; tur: KvkkTalepTuru; hitap: 'sen' | 'siz' }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(kvkkIslemEylemi, {})
  const d = durum.degerler ?? {}
  const h = durum.hatalar ?? {}
  const [sonuc, setSonuc] = useState<KvkkSonuc | ''>((d.sonuc as KvkkSonuc) || '')
  const [cevap, setCevap] = useState(d.cevap ?? '')
  return (
    <form key={durum.surum ?? 0} action={eylem} noValidate className="y-karar">
      <input type="hidden" name="talep" value={talepId} />
      <input type="hidden" name="islem" value="sonuc" />
      <HataOzeti durum={durum} siz alanlar={{ sonuc: 'kv-sonuc', cevap: 'kv-cevap' }} />
      <fieldset className={h.sonuc ? 'alan alan--hata' : 'alan'} id="kv-sonuc">
        <legend>Sonuç</legend>
        {h.sonuc && <p className="hata-metni">{h.sonuc}</p>}
        {(Object.entries(KVKK_SONUC_ADI) as Array<[KvkkSonuc, string]>).map(([s, a]) => (
          <label key={s} className="secenek">
            <input type="radio" name="sonuc" value={s} checked={sonuc === s} onChange={() => setSonuc(s)} /> <span>{a}</span>
          </label>
        ))}
      </fieldset>
      <div className={h.cevap ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="kv-cevap">Başvurana gidecek cevap</label>
        <span className="ipucu">
          Cevap e-postayla gönderilir ve kayıtta saklanır. Ret ve kısmi kabulde gerekçe yazmak yasal zorunluluktur. Taslağı kullanırsanız köşeli parantezli yerleri
          doldurun.
        </span>
        {h.cevap && <p className="hata-metni">{h.cevap}</p>}
        <textarea id="kv-cevap" name="cevap" className="girdi" rows={7} maxLength={5000} value={cevap} onChange={(e) => setCevap(e.target.value)} />
        <button type="button" className="dugme dugme--sade dugme--kucuk" disabled={!sonuc} onClick={() => sonuc && setCevap(cevapTaslagi(tur, sonuc, hitap))}>
          {sonuc ? 'Taslak metni yerleştir' : 'Taslak için önce sonucu seçin'}
        </button>
      </div>
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="Gönderiliyor…">
        Sonuçlandır ve cevabı gönder
      </GonderDugmesi>
    </form>
  )
}
