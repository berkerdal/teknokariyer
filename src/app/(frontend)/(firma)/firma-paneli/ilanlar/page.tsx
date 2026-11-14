import type { Metadata } from 'next'
import Link from 'next/link'
import { DURUM_ADI, KAPATMA_NEDENLERI, kalanGun, yapilabilecekIslemler, type IlanDurumu } from '@/alan/ilan'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { IlanIslemleri } from '@/arayuz/firma/IlanIslemleri'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { firmaIlanlari, firmaOturumu, ilanYonetebilirMi, tarihSiniri, type FirmaIlani } from '@/veri/firma'

export const metadata: Metadata = { title: 'İlanlar · Firma paneli' }

const SEKMELER: Array<[string, string, IlanDurumu[] | null]> = [
  ['tum', 'Tümü', null],
  ['yayinda', 'Yayında', ['yayinda']],
  ['onayda', 'Onayda', ['onayda']],
  ['duzeltme', 'Düzeltme bekliyor', ['duzeltme']],
  ['taslak', 'Taslak', ['taslak']],
  ['duraklatildi', 'Duraklatıldı', ['duraklatildi']],
  ['kapali', 'Kapanan', ['kapandi', 'suresi-doldu']],
]

const KAPANIS_ADI: Record<string, string> = { ...KAPATMA_NEDENLERI, sure: 'Süresi doldu', moderasyon: 'Yönetici A.Ş. yayından kaldırdı' }
const herkeseAcik = (d: string) => ['yayinda', 'duraklatildi', 'kapandi', 'suresi-doldu'].includes(d)

/** Satırın altındaki açıklama: her durumda firmanın bilmesi gereken tek cümle. */
function ayrinti(i: FirmaIlani, simdi: Date): string {
  const k = kalanGun(new Date(i.sonBasvuru), simdi)
  switch (i.durum) {
    case 'yayinda':
      return `Son başvuru ${tarihYaz(i.sonBasvuru, true)}; ${k === 0 ? 'bugün son gün' : `${k} gün kaldı`}.`
    case 'onayda':
      return 'Yönetici A.Ş. ilanınızı inceliyor. Hedef onay süresi 1 iş günüdür.'
    case 'duzeltme':
      return `Yönetici A.Ş.’nin notu: ${i.duzeltmeGerekcesi ?? ''}`
    case 'taslak':
      return `Henüz yayına gönderilmedi. Son değişiklik: ${tarihYaz(i.guncelleme, true)}.`
    case 'duraklatildi':
      return `Başvuru almıyor. Son başvuru ${tarihYaz(i.sonBasvuru, true)}.`
    case 'kapandi':
      return `Kapandı: ${KAPANIS_ADI[i.kapanisNedeni ?? ''] ?? 'neden belirtilmedi'}.`
    case 'suresi-doldu':
      return `Son başvuru tarihi ${tarihYaz(i.sonBasvuru, true)} günü doldu.`
  }
}

export default async function FirmaIlanlari({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const k = await firmaOturumu('/firma-paneli/ilanlar')
  const [ilanlar, sinir, p] = await Promise.all([firmaIlanlari(), tarihSiniri(), searchParams])
  const yonetir = ilanYonetebilirMi(k)
  const sekme = SEKMELER.find(([s]) => s === p.durum) ?? SEKMELER[0]!
  const uygun = (i: FirmaIlani, durumlar: IlanDurumu[] | null) => !durumlar || durumlar.includes(i.durum)
  const satirlar = ilanlar.filter((i) => uygun(i, sekme[2]))
  const simdi = new Date()
  const islemIlani = (i: FirmaIlani) => ({
    id: i.id,
    pozisyonAdi: i.pozisyonAdi,
    durum: i.durum,
    sonBasvuru: i.sonBasvuru,
    basvuru: i.basvuru,
    adres: herkeseAcik(i.durum) ? ilanAdresi(i) : undefined,
  })
  const anaEylem = (i: FirmaIlani) => {
    if (!yonetir) return null
    if (i.durum === 'taslak' || i.durum === 'duzeltme')
      return (
        <span className="dugme-grubu dugme-grubu--sikisik">
          <Link className="dugme dugme--kucuk" href={`/firma-paneli/ilanlar/${i.id}`}>
            {i.durum === 'duzeltme' ? 'Düzelt' : 'Devam et'}
            <span className="gizli">: {i.pozisyonAdi}</span>
          </Link>
          <IlanIslemleri ilan={islemIlani(i)} islemler={yapilabilecekIslemler(i.durum)} sinir={sinir} dugme="Diğer" />
        </span>
      )
    return <IlanIslemleri ilan={islemIlani(i)} islemler={yapilabilecekIslemler(i.durum)} sinir={sinir} />
  }

  return (
    <>
      <div className="f-bas">
        <h1 className="b1">İlanlar</h1>
        {yonetir && (
          <Link className="dugme" href="/firma-paneli/ilanlar/yeni">
            <Ikon ad="arti" /> Yeni ilan
          </Link>
        )}
      </div>

      <ModulBilgisi kimlik="firma-ilanlar" baslik="İlanlarınızı buradan yönetirsiniz">
        <p>Firmanızın bütün ilanları, durumlarına göre sekmelerde listelenir. Her ilanın yanındaki düğme, o ilanda yapabileceğiniz işlemleri açar.</p>
        <ul>
          <li>
            <strong>Taslak:</strong> Kaydettiğiniz ama yayına göndermediğiniz ilanlar. Adaylar görmez.
          </li>
          <li>
            <strong>Onayda:</strong> Yönetici A.Ş.’nin incelediği ilanlar. İlk ilanlarınız onaydan geçer.
          </li>
          <li>
            <strong>Düzeltme bekliyor:</strong> Yönetici A.Ş. bir düzeltme istedi. Notu okuyup ilanı düzeltin ve yeniden gönderin.
          </li>
          <li>
            <strong>Yayında:</strong> Adayların görüp başvurabildiği ilanlar. Süre uzatabilir, başvuruyu durdurabilir veya ilanı kapatabilirsiniz.
          </li>
          <li>
            <strong>Kapanan:</strong> Kapattığınız veya süresi dolan ilanlar. Kopyalayıp yeniden yayınlayabilirsiniz.
          </li>
        </ul>
      </ModulBilgisi>

      <nav className="sekmeler sekmeler--kaydir" aria-label="İlan durumları">
        {SEKMELER.map(([s, ad, durumlar]) => (
          <Link key={s} className="sekme" href={s === 'tum' ? '/firma-paneli/ilanlar' : `/firma-paneli/ilanlar?durum=${s}`} aria-current={s === sekme[0] ? 'page' : undefined}>
            {ad} <span className="sayi">{ilanlar.filter((i) => uygun(i, durumlar)).length}</span>
          </Link>
        ))}
      </nav>

      {satirlar.length === 0 ? (
        <p className="ikincil">{sekme[0] === 'tum' ? 'Henüz ilanınız yok.' : `“${sekme[1]}” durumunda ilanınız yok.`}</p>
      ) : (
        <>
          <ul className="f-ilan-kartlar yalniz-mobil">
            {satirlar.map((i) => (
              <li key={i.id} id={`ilan-${i.id}-m`} className={i.durum === 'duzeltme' ? 'f-ilan-kart f-ilan-kart--hata' : 'f-ilan-kart'}>
                <div>
                  <p className="poz-ad">{i.pozisyonAdi}</p>
                  <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum]}</span>
                </div>
                <p className={i.durum === 'duzeltme' ? 'kucuk' : 'kucuk ikincil'}>{ayrinti(i, simdi)}</p>
                <div className="f-ilan-kart-alt">
                  <span className="kucuk">
                    {i.basvuru ? (
                      <>
                        {i.basvuru} başvuru{i.yeni ? <strong> · {i.yeni} yeni</strong> : null}
                      </>
                    ) : (
                      'Başvuru yok'
                    )}
                  </span>
                  {anaEylem(i)}
                </div>
              </li>
            ))}
          </ul>
          <div className="tablo-kap yalniz-masa">
            <table className="tablo f-tablo">
              <thead>
                <tr>
                  <th>İlan</th>
                  <th>Durum</th>
                  <th className="sag">Başvuru</th>
                  <th className="sag">Görüntülenme</th>
                  <th>
                    <span className="gizli">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((i) => (
                  <tr key={i.id} id={`ilan-${i.id}`} className={i.durum === 'duzeltme' ? 'satir-hata' : undefined}>
                    <td>
                      <strong>{i.pozisyonAdi}</strong>
                      <span className={i.durum === 'duzeltme' ? 'kucuk satir-alt' : 'kucuk ikincil satir-alt'}>{ayrinti(i, simdi)}</span>
                    </td>
                    <td>
                      <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum]}</span>
                    </td>
                    <td className="sag sayi">
                      {i.basvuru ? (
                        <Link href={`/firma-paneli/basvurular?ilan=${i.id}`}>{i.basvuru}</Link>
                      ) : (
                        '–'
                      )}
                      {i.yeni ? (
                        <span className="kucuk satir-alt">
                          <strong>{i.yeni} yeni</strong>
                        </span>
                      ) : null}
                    </td>
                    <td className="sag sayi">{herkeseAcik(i.durum) ? i.goruntulenme : '–'}</td>
                    <td className="sag">{anaEylem(i)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
