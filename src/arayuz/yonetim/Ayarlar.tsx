'use client'
import { useActionState, useEffect, useState } from 'react'
import { ayarlarEylemi } from '@/eylemler/ayarlar'
import { AlanBilgisi } from '../BilgiKutusu'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

type Deger = { onayliIlanSayisi: number; enUzunSureGun: number; hatirlatmaGunleri: number[]; havuzRizaAy: number; basvuruAnonimlestirmeAy: number; islemKaydiAy: number }

function SayiAlani(p: { ad: string; etiket: string; bilgi: React.ReactNode; ipucu: string; durum: FormDurumu; deger: string; birim?: string; disabled: boolean }) {
  const hata = p.durum.hatalar?.[p.ad]
  return (
    <div className={hata ? 'alan alan--hata' : 'alan'}>
      <label htmlFor={`a-${p.ad}`}>
        {p.etiket}
        <AlanBilgisi etiket={p.etiket}>{p.bilgi}</AlanBilgisi>
      </label>
      <span className="ipucu">{p.ipucu}</span>
      {hata && <p className="hata-metni">{hata}</p>}
      <span className="y-birimli">
        <input id={`a-${p.ad}`} name={p.ad} className="girdi" inputMode="numeric" defaultValue={p.durum.degerler?.[p.ad] ?? p.deger} disabled={p.disabled} />
        {p.birim && <span>{p.birim}</span>}
      </span>
    </div>
  )
}

export function AyarlarFormu({ deger, yonetici }: { deger: Deger; yonetici: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ayarlarEylemi, {})
  const [kirli, setKirli] = useState(false)
  useEffect(() => {
    if (!kirli) return
    const uyar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [kirli])
  return (
    <form action={eylem} noValidate className="form-yigin" onChange={() => setKirli(true)} onSubmit={() => setKirli(false)}>
      <HataOzeti durum={durum} siz alanlar={Object.fromEntries(['onayliIlanSayisi', 'enUzunSureGun', 'hatirlatmaGunleri', 'havuzRizaAy', 'basvuruAnonimlestirmeAy', 'islemKaydiAy'].map((a) => [a, `a-${a}`]))} />
      {durum.tamam && (
        <p className="basari-kutu" role="status">
          {durum.tamam}
        </p>
      )}
      <section className="panel panel-ic y-sutun">
        <h2 className="b3">İlanlar</h2>
        <SayiAlani
          ad="onayliIlanSayisi"
          etiket="Onaydan geçecek ilk ilan sayısı"
          ipucu="Her firmanın ilk kaç ilanı Yönetici A.Ş. onayından geçsin? Şu an karar K4’e göre 3."
          bilgi="Bu sayıya ulaşan firmanın sonraki ilanları onay beklemeden yayına girer. Bir firmayı daha önce “güvenilir” yapabilirsiniz. 0 yazarsanız hiçbir ilan onaya gitmez."
          durum={durum}
          deger={String(deger.onayliIlanSayisi)}
          birim="ilan"
          disabled={!yonetici}
        />
        <SayiAlani
          ad="enUzunSureGun"
          etiket="En uzun ilan süresi"
          ipucu="Son başvuru tarihi, ilanın açıldığı günden en fazla kaç gün sonra olabilir?"
          bilgi="Ölü ilan kalmasın diye sınır vardır. Firmalar süreyi bu sınıra kadar uzatabilir. Mevcut ilanların tarihi değişmez."
          durum={durum}
          deger={String(deger.enUzunSureGun)}
          birim="gün"
          disabled={!yonetici}
        />
      </section>
      <section className="panel panel-ic y-sutun">
        <h2 className="b3">Firma kurulumu</h2>
        <SayiAlani
          ad="hatirlatmaGunleri"
          etiket="Otomatik hatırlatma günleri"
          ipucu="Virgülle ayırın. Örnek: 3, 7, 14"
          bilgi="Daveti kabul etmeyen veya profilini tamamlamayan firmaya bu günlerde e-posta gider. Son günden sonra firma “Kişisel takip” listesine düşer."
          durum={durum}
          deger={deger.hatirlatmaGunleri.join(', ')}
          disabled={!yonetici}
        />
      </section>
      <section className="panel panel-ic y-sutun">
        <h2 className="b3">Kişisel veriler (KVKK)</h2>
        <SayiAlani
          ad="havuzRizaAy"
          etiket="CV havuzu rızasının geçerliliği"
          ipucu="Aday rızasını yenilemezse profili bu sürenin sonunda havuz aramalarında görünmez."
          bilgi="Süre, adayın havuza katıldığı veya rızasını son yenilediği tarihten başlar. Değişiklik hukuk birimiyle birlikte kararlaştırılmalıdır."
          durum={durum}
          deger={String(deger.havuzRizaAy)}
          birim="ay"
          disabled={!yonetici}
        />
        <SayiAlani
          ad="basvuruAnonimlestirmeAy"
          etiket="Başvuruların saklama süresi"
          ipucu="İlan kapandıktan kaç ay sonra başvurulardaki kişisel veriler silinsin?"
          bilgi="Süre dolunca başvurudaki ad, iletişim, CV, cevaplar ve ekip notları silinir; başka yerde kullanılmayan CV dosyası da silinir. Durum ve tarih istatistik için kalır. İşlem her gece otomatik yapılır ve geri alınamaz."
          durum={durum}
          deger={String(deger.basvuruAnonimlestirmeAy)}
          birim="ay"
          disabled={!yonetici}
        />
        <SayiAlani
          ad="islemKaydiAy"
          etiket="İşlem kayıtlarının saklama süresi"
          ipucu="Kim neyi ne zaman yaptı kayıtları kaç ay saklansın? En az 12 ay."
          bilgi="Süresi dolan işlem kayıtları her gece silinir. Silme işleminin kendisi yeni bir kayıt olarak yazılır."
          durum={durum}
          deger={String(deger.islemKaydiAy)}
          birim="ay"
          disabled={!yonetici}
        />
        <p className="kucuk ikincil">Bu süreler önerilen varsayılanlardır (12 ve 24 ay). Hukuk biriminin onayıyla kesinleşmelidir.</p>
      </section>
      {yonetici ? (
        <div className="dugme-grubu">
          <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
            Ayarları kaydet
          </GonderDugmesi>
        </div>
      ) : (
        <p className="kucuk ikincil">Ayarları yalnızca tam yetkili kullanıcılar değiştirebilir.</p>
      )}
    </form>
  )
}
