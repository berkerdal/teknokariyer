import type { Metadata } from 'next'
import { rizaBitisTarihi, rizaGecerliMi } from '@/alan/havuz'
import { FirmaGizlemeFormu, GorunurlukFormu, HavuzaKatilFormu, RizaIslemleri } from '@/arayuz/aday/HavuzFormlari'
import { tarihYaz } from '@/arayuz/bicim'
import { METINLER } from '@/metinler'
import { goruntuleyenFirmaSayisi } from '@/servisler/havuz'
import { kendiAdayKaydi } from '@/servisler/profil'
import { kimlik } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { adayOturumu } from '@/veri/aday'

export const metadata: Metadata = { title: 'CV havuzu', robots: { index: false } }

/** CV havuzu ayarları (K24, K25, K5): rıza, görünürlük, firmalardan gizleme, görüntülenme sayısı. */
export default async function HavuzSayfasi() {
  const k = await adayOturumu()
  const payload = await payloadAl()
  const a = await kendiAdayKaydi(payload, k)
  const riza = a.havuz?.rizaTarihi ? new Date(a.havuz.rizaTarihi) : null
  const gecerli = rizaGecerliMi(riza, new Date())
  const { docs: firmalar } = await payload.find({ collection: 'firmalar', where: { asama: { not_equals: 'pasif' } }, limit: 500, depth: 0, sort: 'kisaAd', overrideAccess: true, select: { kisaAd: true } })
  const sayi = gecerli ? await goruntuleyenFirmaSayisi(payload, k) : 0
  const gorunenler = `bölümünü, okulunu, deneyimini, becerilerini, dillerini${a.cinsiyet ? ', tercihlerini ve cinsiyetini' : ' ve tercihlerini'}`
  return (
    <>
      <h1 className="b1">CV havuzu</h1>
      <div className="ap-ust-bilgi">
        {gecerli && (
          <div className="goruntulenme">
            <p className="ust-etiket">Son 30 gün</p>
            <p>
              <strong className="buyuk-sayi">{sayi}</strong> firma profilini görüntüledi.
            </p>
            <p className="kucuk ikincil">Firmaların adları gösterilmez.</p>
          </div>
        )}
        <div className="gorev">
          <p className="ust-etiket">Havuzda neler görünür?</p>
          <p className="kucuk">
            Firmalar arama listesinde {gorunenler} görür; adın ve iletişim bilgilerin bu listede görünmez. Bir firma profilini açtığında adın, iletişim
            bilgilerin ve CV’n o firmaya görünür; bunun için sana ayrıca sorulmaz.
          </p>
        </div>
      </div>

      {!gecerli ? (
        <section className="profil-bolum">
          <h2 className="b3 kare-bas">{riza ? 'Rızanın süresi doldu' : 'Havuza katıl'}</h2>
          <p>
            {riza
              ? `Havuz rızan ${tarihYaz(rizaBitisTarihi(riza), true)} tarihinde doldu ve profilin havuzdan çıktı. Yeniden katılmak için rızanı yenile.`
              : 'Havuza katılırsan Teknokent firmaları ilan açmadan da seni bulabilir. Katılmak isteğe bağlıdır; ilanlara başvurmak için gerekmez.'}
          </p>
          <HavuzaKatilFormu surum={METINLER.havuz.surum} />
        </section>
      ) : (
        <>
          <GorunurlukFormu deger={a.havuz?.gorunurluk ?? 'acik'} />
          <section className="profil-bolum">
            <h2 className="b3 kare-bas">Şu firmalardan gizle</h2>
            <p className="ikincil">Teknokent’te bir firmada çalışıyorsan o firmanın seni havuzda görmesini engelleyebilirsin.</p>
            <FirmaGizlemeFormu firmalar={firmalar.map((f) => ({ id: f.id, ad: f.kisaAd }))} secili={(a.havuz?.gizlenenFirmalar ?? []).map(kimlik)} />
          </section>
          <section className="profil-bolum">
            <h2 className="b3 kare-bas">Açık rızan</h2>
            <p>
              Havuz rızan <strong>{tarihYaz(rizaBitisTarihi(riza!), true)}</strong> tarihine kadar geçerli. Süre dolmadan bir ay önce hatırlatacağız; yenilemezsen
              havuzdan otomatik çıkarsın.
            </p>
            <RizaIslemleri surum={METINLER.havuz.surum} />
          </section>
        </>
      )}
    </>
  )
}
