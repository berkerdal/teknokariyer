'use client'
/**
 * Yönetici A.Ş. firma formları (talimatlar 0.3). Her alanın yanında “?” açıklaması (K30); kaydedilmemiş değişiklik
 * uyarısı; hatalar alanın altında ve formun üstünde Türkçe.
 */
import { useActionState, useEffect, useRef, useState } from 'react'
import { davetIslemiEylemi, firmaKaydiEylemi, pasiflikEylemi, takipNotuEylemi, topluDavetEylemi, yetkiliDavetEylemi } from '@/eylemler/firmaYonetimi'
import { AlanBilgisi } from '../BilgiKutusu'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

function useKaydedilmemis() {
  const [kirli, setKirli] = useState(false)
  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])
  return { onChange: () => setKirli(true), onSubmit: () => setKirli(false) }
}

type Alanlar = Record<string, string | boolean | number | null | undefined>

function Girdi(p: { ad: string; etiket: string; bilgi?: React.ReactNode; ipucu?: string; durum: FormDurumu; deger?: string | null; istegeBagli?: boolean; tur?: string; otomatik?: string }) {
  const hata = p.durum.hatalar?.[p.ad]
  return (
    <div className={hata ? 'alan alan--hata' : 'alan'}>
      <label htmlFor={`f-${p.ad}`}>
        {p.etiket} {p.istegeBagli && <span className="istege-bagli">(isteğe bağlı)</span>}
        {p.bilgi && <AlanBilgisi etiket={p.etiket}>{p.bilgi}</AlanBilgisi>}
      </label>
      {p.ipucu && <span className="ipucu">{p.ipucu}</span>}
      {hata && <p className="hata-metni">{hata}</p>}
      <input
        id={`f-${p.ad}`}
        name={p.ad}
        type={p.tur ?? 'text'}
        className="girdi"
        defaultValue={p.durum.degerler?.[p.ad] ?? p.deger ?? ''}
        autoComplete={p.otomatik ?? 'off'}
        aria-invalid={hata ? true : undefined}
      />
    </div>
  )
}

export function FirmaKaydiFormu({ firma, sektorler, yonetici }: { firma?: Alanlar & { id: number }; sektorler: Array<{ id: number; ad: string }>; yonetici: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(firmaKaydiEylemi, {})
  const k = useKaydedilmemis()
  const d = (a: string) => (firma?.[a] as string | null | undefined) ?? ''
  const isaret = (a: string) => (durum.degerler ? durum.degerler[a] === 'on' : Boolean(firma?.[a]))
  return (
    <form action={eylem} noValidate className="form-yigin" onChange={k.onChange} onSubmit={k.onSubmit}>
      {firma && <input type="hidden" name="firma" value={firma.id} />}
      <HataOzeti durum={durum} siz alanlar={Object.fromEntries(['unvan', 'kisaAd', 'konum', 'yetkiliEposta'].map((a) => [a, `f-${a}`]))} />
      <fieldset disabled={!yonetici} className="y-form-bolum">
        <legend className="b3">Firma</legend>
        <Girdi ad="unvan" etiket="Ticaret unvanı" durum={durum} deger={d('unvan')} ipucu="Örnek: Kodpit Teknoloji Yazılım A.Ş." bilgi="Firmanın resmî unvanı. Firma sayfasında ve davet e-postasında görünür." />
        <Girdi
          ad="kisaAd"
          etiket="Kısa ad"
          durum={durum}
          deger={d('kisaAd')}
          ipucu="Örnek: Kodpit Teknoloji"
          bilgi="İlan listelerinde ve aramalarda görünen ad. Aynı ada sahip ikinci bir firma kaydı açılamaz."
        />
        <Girdi ad="konum" etiket="Teknokent’teki yeri" durum={durum} deger={d('konum')} ipucu="Blok ve oda: D Blok 208" bilgi="Firma logosu gelene kadar firma, bu koddan üretilen karoyla gösterilir (ör. D208)." />
        <div className="alan">
          <label htmlFor="f-sektor">
            Sektör <span className="istege-bagli">(isteğe bağlı)</span>
            <AlanBilgisi etiket="Sektör">Firma profilini devraldığında firma da değiştirebilir. Profilin herkese açık görünmesi için gereklidir.</AlanBilgisi>
          </label>
          <select id="f-sektor" name="sektor" className="secim" defaultValue={durum.degerler?.sektor ?? String(firma?.sektor ?? '')}>
            <option value="">Seçilmedi</option>
            {sektorler.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad}
              </option>
            ))}
          </select>
        </div>
        <Girdi ad="web" etiket="Web sitesi" durum={durum} deger={d('web')} istegeBagli ipucu="www.firma.com.tr" />
      </fieldset>

      <fieldset disabled={!yonetici} className="y-form-bolum">
        <legend className="b3">Yetkili kişi</legend>
        <p className="kucuk ikincil">
          Davet bu kişiye gider ve kişi firmanın ilk tam yetkili kullanıcısı olur. Genel kutular (info@, iletisim@) kişiye özel olmadığı için davet
          gönderilmez; yetkilinin kendi iş e-postasını yazın.
        </p>
        <Girdi ad="yetkiliAd" etiket="Ad soyad" durum={durum} deger={d('yetkiliAd')} istegeBagli otomatik="off" />
        <Girdi ad="yetkiliEposta" etiket="İş e-postası" tur="email" durum={durum} deger={d('yetkiliEposta')} istegeBagli otomatik="off" />
        <Girdi ad="yetkiliTelefon" etiket="Telefon" tur="tel" durum={durum} deger={d('yetkiliTelefon')} istegeBagli otomatik="off" bilgi="Yalnızca Yönetici A.Ş. görür. Davet kabul edilmezse takip için aranır." />
      </fieldset>

      {firma && (
        <fieldset disabled={!yonetici} className="y-form-bolum">
          <legend className="b3">Yönetici A.Ş. ayarları</legend>
          <label className="secenek">
            <input type="checkbox" name="guvenilir" defaultChecked={isaret('guvenilir')} />{' '}
            <span>
              Güvenilir firma
              <span className="ipucu">İşaretliyse firmanın ilanları ve ilan değişiklikleri onay beklemeden yayına girer.</span>
            </span>
          </label>
          <label className="secenek">
            <input type="checkbox" name="testFirmasi" defaultChecked={isaret('testFirmasi')} />{' '}
            <span>
              Test firması
              <span className="ipucu">Kurum içi denemeler için. Test firması ve ilanları herkese açık sayfalarda görünmez.</span>
            </span>
          </label>
        </fieldset>
      )}
      {yonetici ? (
        <div className="dugme-grubu">
          <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
            {firma ? 'Değişiklikleri kaydet' : 'Firma kaydını oluştur'}
          </GonderDugmesi>
        </div>
      ) : (
        <p className="kucuk ikincil">Firma kaydını yalnızca tam yetkili Yönetici A.Ş. kullanıcıları değiştirebilir.</p>
      )}
    </form>
  )
}

export function PasiflikFormu({ firmaId, pasif, yayindakiIlan }: { firmaId: number; pasif: boolean; yayindakiIlan: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(pasiflikEylemi, {})
  const [onay, setOnay] = useState(false)
  return (
    <form action={eylem} className="y-karar">
      <input type="hidden" name="firma" value={firmaId} />
      <input type="hidden" name="pasif" value={pasif ? '0' : '1'} />
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      {pasif ? (
        <p className="kucuk">Firma pasif. Yeniden etkin yaparsanız aşaması ekibine göre belirlenir; kapanmış ilanlar kendiliğinden açılmaz.</p>
      ) : (
        <>
          <p className="kucuk">
            Teknokent’ten ayrılan firmayı pasif yapın. Firma sayfası herkese açık listelerden kalkar
            {yayindakiIlan > 0 ? ` ve yayındaki, duraklatılmış veya onaydaki ilanları (${yayindakiIlan} yayında) kapanır` : ''}. Başvurular ve kayıtlar silinmez.
          </p>
          <label className="secenek kucuk">
            <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} /> <span>Firmanın Teknokent’ten ayrıldığını doğruladım.</span>
          </label>
        </>
      )}
      {(pasif || onay) && (
        <GonderDugmesi className={pasif ? 'dugme dugme--ikincil' : 'dugme dugme--tehlike'} bekleme="Kaydediliyor…">
          {pasif ? 'Firmayı yeniden etkin yap' : 'Firmayı pasif yap'}
        </GonderDugmesi>
      )}
    </form>
  )
}

export function TakipNotuFormu({ firmaId }: { firmaId: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(takipNotuEylemi, {})
  const [anahtar, setAnahtar] = useState(0)
  const son = useRef(durum.surum)
  useEffect(() => {
    if (durum.surum && durum.surum !== son.current) {
      son.current = durum.surum
      setAnahtar((n) => n + 1) // kayıttan sonra formu boşalt
    }
  }, [durum])
  return (
    <form action={eylem} key={anahtar} className="y-karar">
      <input type="hidden" name="firma" value={firmaId} />
      <div className={durum.hatalar?.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={`not-${firmaId}`}>Yeni takip notu</label>
        <span className="ipucu">Örnek: Aradım, yetkili izinde; 18 Kasım’da dönecek. Not adınız ve tarihle kaydedilir.</span>
        {durum.hatalar?.not && <p className="hata-metni">{durum.hatalar.not}</p>}
        <textarea id={`not-${firmaId}`} name="not" className="metin-alani" rows={2} maxLength={1000} defaultValue={durum.degerler?.not ?? ''} />
      </div>
      {durum.genel && <p className="hata-metni">{durum.genel}</p>}
      <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Kaydediliyor…">
        Notu kaydet
      </GonderDugmesi>
    </form>
  )
}

export function YetkiliDavetFormu({ firmaId, ad, eposta, ilkDavet }: { firmaId: number; ad: string; eposta: string; ilkDavet: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(yetkiliDavetEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <form action={eylem} noValidate className="y-karar">
      <input type="hidden" name="firma" value={firmaId} />
      <p className="kucuk">
        {ilkDavet
          ? 'Davet, firma yetkilisinin kişisel iş e-postasına gider. Bağlantı 14 gün geçerlidir ve tek kullanımlıktır. Kabul eden kişi firmanın ilk tam yetkili kullanıcısı olur.'
          : 'Firmanın yetkilisi değiştiyse veya ekipte tam yetkili kalmadıysa yeni kişiye davet gönderin.'}
      </p>
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <div className={h.ad ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={`d-ad-${firmaId}`}>Ad soyad</label>
        {h.ad && <p className="hata-metni">{h.ad}</p>}
        <input id={`d-ad-${firmaId}`} name="ad" className="girdi" defaultValue={durum.degerler?.ad ?? ad} autoComplete="off" />
      </div>
      <div className={h.eposta ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={`d-ep-${firmaId}`}>İş e-postası</label>
        {h.eposta && <p className="hata-metni">{h.eposta}</p>}
        <input id={`d-ep-${firmaId}`} name="eposta" type="email" className="girdi" defaultValue={durum.degerler?.eposta ?? eposta} autoComplete="off" />
      </div>
      <input type="hidden" name="firmaYetkisi" value="yonetici" />
      <GonderDugmesi className="dugme dugme--kucuk" bekleme="Gönderiliyor…">
        Daveti gönder
      </GonderDugmesi>
    </form>
  )
}

export function DavetIslemi({ firmaId, davetId, iptal }: { firmaId: number; davetId: number; iptal?: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(davetIslemiEylemi, {})
  return (
    <form action={eylem} className="satir-ici">
      <input type="hidden" name="firma" value={firmaId} />
      <input type="hidden" name="davet" value={davetId} />
      <input type="hidden" name="islem" value={iptal ? 'iptal' : 'yeniden'} />
      <GonderDugmesi className="dugme dugme--sade dugme--kucuk" bekleme="…">
        {iptal ? 'İptal et' : 'Yeniden gönder'}
      </GonderDugmesi>
      {durum.genel && <span className="hata-metni kucuk">{durum.genel}</span>}
    </form>
  )
}

export function TopluDavetFormu({ firmalar }: { firmalar: Array<{ id: number; kisaAd: string; konum: string }> }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(topluDavetEylemi, {})
  const [secili, setSecili] = useState<number[]>(firmalar.map((f) => f.id))
  // Gönderimden sonra liste yenilenir; artık listede olmayan firmalar seçimden düşer
  const gecerli = secili.filter((id) => firmalar.some((f) => f.id === id))
  const hepsi = gecerli.length === firmalar.length
  return (
    <form action={eylem} className="y-karar">
      {durum.tamam && (
        <p className="basari-kutu" role="status">
          {durum.tamam}
        </p>
      )}
      {(durum.genel || durum.hatalar?.firma) && (
        <p className="hata-metni" role="alert">
          {durum.genel ?? durum.hatalar?.firma}
        </p>
      )}
      {firmalar.length === 0 ? (
        <p className="ikincil">Davet gönderilmeye hazır iskelet firma yok. Yetkilisi eksik firmaları tamamlayınca burada görünür.</p>
      ) : (
        <>
          <label className="secenek">
            <input type="checkbox" checked={hepsi} onChange={(e) => setSecili(e.target.checked ? firmalar.map((f) => f.id) : [])} />{' '}
            <span>
              <strong>Hepsini seç</strong> ({firmalar.length} firma)
            </span>
          </label>
          <ul className="y-secim-listesi">
            {firmalar.map((f) => (
              <li key={f.id}>
                <label className="secenek">
                  <input
                    type="checkbox"
                    name="firma"
                    value={f.id}
                    checked={secili.includes(f.id)}
                    onChange={(e) => setSecili((x) => (e.target.checked ? [...x, f.id] : x.filter((y) => y !== f.id)))}
                  />{' '}
                  <span>
                    {f.kisaAd} <span className="kucuk ikincil">{f.konum}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <GonderDugmesi className="dugme" bekleme="Davetler gönderiliyor…">
            {`Seçilen ${gecerli.length} firmaya davet gönder`}
          </GonderDugmesi>
        </>
      )}
    </form>
  )
}
