import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DURUM_ADI, ESASLI_ALAN_ADI, islemYapilabilirMi, yapilabilecekIslemler, type EsasliAlan, type IlanDurumu } from '@/alan/ilan'
import { ALT_TUR_ADI } from '@/alan/ilanFiltre'
import { Ikon } from '@/arayuz/Ikon'
import { IlanFormu } from '@/arayuz/firma/IlanFormu'
import { IlanIslemleri } from '@/arayuz/firma/IlanIslemleri'
import { ilanAdresi } from '@/arayuz/bicim'
import type { BekleyenDegisiklik } from '@/servisler/ilanFormu'
import { firmaIlani, firmaIlanlari, firmaOturumu, ilanFormuBaslangici, ilanFormuSecenekleri, ilanYonetebilirMi, tarihSiniri } from '@/veri/firma'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ kopya?: string; kaydedildi?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await firmaIlani(Number((await params).id))
  return { title: i ? `${i.pozisyonAdi} · İlanı düzenle` : 'İlan bulunamadı' }
}

const SAAT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
const PARA = new Intl.NumberFormat('tr-TR')

function degerYaz(alan: EsasliAlan, d: unknown): string {
  if (d === null || d === undefined || d === '') return 'boş'
  if (alan === 'tur') return d === 'staj' ? 'Staj' : 'İş'
  if (alan === 'altTur') return ALT_TUR_ADI[String(d)] ?? String(d)
  if (alan === 'ucretGorunur') return d ? 'görünsün' : 'gizli kalsın'
  if (typeof d === 'number') return `${PARA.format(d)} ₺`
  return String(d)
}

export default async function IlanDuzenle({ params, searchParams }: Props) {
  const [{ id }, p] = await Promise.all([params, searchParams])
  const k = await firmaOturumu(`/firma-paneli/ilanlar/${id}`)
  if (!ilanYonetebilirMi(k)) redirect('/firma-paneli/ilanlar')
  const ilan = await firmaIlani(Number(id))
  if (!ilan) notFound()
  const [secenekler, sinir, ilanlar] = await Promise.all([ilanFormuSecenekleri(), tarihSiniri(), firmaIlanlari()])
  const durum = ilan.durum as IlanDurumu
  const kopyaKaynagi = p.kopya ? ilanlar.find((x) => x.id === Number(p.kopya)) : undefined
  const bekleyen = ilan.bekleyenDegisiklik as unknown as BekleyenDegisiklik | null
  const herkeseAcik = ['yayinda', 'duraklatildi', 'kapandi', 'suresi-doldu'].includes(durum)
  const ozet = ilanlar.find((x) => x.id === ilan.id)

  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href="/firma-paneli/ilanlar">
            <Ikon ad="geri" kucuk /> İlanlar
          </Link>
          <h1 className="b1">{ilan.pozisyonAdi}</h1>
          <p>
            <span className={`durum durum--${durum}`}>{DURUM_ADI[durum]}</span>
          </p>
        </div>
        <div className="dugme-grubu">
          <Link className="dugme dugme--sade dugme--kucuk" href={`/firma-paneli/ilanlar/${ilan.id}/gecmis`}>
            Sürüm geçmişi
          </Link>
          <Link className="dugme dugme--ikincil dugme--kucuk" href={`/firma-paneli/ilanlar/${ilan.id}/onizleme`}>
            <Ikon ad="goz" kucuk /> Önizle
          </Link>
          <IlanIslemleri
            ilan={{ id: ilan.id, pozisyonAdi: ilan.pozisyonAdi, durum, sonBasvuru: ilan.sonBasvuru ?? '', basvuru: ozet?.basvuru ?? 0, adres: herkeseAcik ? ilanAdresi(ilan) : undefined }}
            islemler={yapilabilecekIslemler(durum).filter((x) => x !== 'duzenle')}
            sinir={sinir}
          />
        </div>
      </div>

      {p.kaydedildi && (
        <p className="bilgi" role="status">
          Taslak kaydedildi. Adaylar taslağı görmez; hazır olduğunuzda “Kaydet ve önizle” ile kontrol edip yayına gönderin.
        </p>
      )}
      {kopyaKaynagi && (
        <p className="bilgi">
          “{kopyaKaynagi.pozisyonAdi}” ilanından kopyalandı. Bütün alanlar dolu geldi; son başvuru tarihini seçip yayına gönderin.
        </p>
      )}
      {durum === 'duzeltme' && (
        <div className="hata-kutu" role="alert">
          <p>
            <strong>Yönetici A.Ş. bu ilanda düzeltme istedi.</strong>
          </p>
          <p>{ilan.duzeltmeGerekcesi}</p>
          <p className="kucuk">İlanı düzeltip “Kaydet ve önizle” ile kontrol edin, ardından yeniden yayına gönderin.</p>
        </div>
      )}
      {durum === 'onayda' && (
        <p className="bilgi">
          Yönetici A.Ş. bu ilanı inceliyor. Düzenleyebilirsiniz; kaydettiğiniz değişiklikler incelemeye dahil olur.
        </p>
      )}
      {(durum === 'yayinda' || durum === 'duraklatildi') && (
        <p className="bilgi">
          Bu ilan yayında. Kaydettiğiniz değişiklikler hemen yansır. Pozisyon adı, ilan türü, çalışma şekli ve ücret değişiklikleri ise firmanız
          güvenilir olarak işaretlenmediyse Yönetici A.Ş. onayından sonra yayına girer.
        </p>
      )}
      {bekleyen?.alanlar && !bekleyen.reddedildi && (
        <div className="uyari-kutu">
          <p>
            <strong>Onay bekleyen değişiklik:</strong> Aşağıdaki değerler Yönetici A.Ş. onayladıktan sonra yayına girecek. O zamana kadar ilanda eski
            değerler görünür.
          </p>
          <ul>
            {(Object.entries(bekleyen.alanlar) as Array<[EsasliAlan, unknown]>).map(([a, d]) => (
              <li key={a}>
                {ESASLI_ALAN_ADI[a]}: <strong>{degerYaz(a, d)}</strong>
              </li>
            ))}
          </ul>
          <p className="kucuk ikincil">İstek tarihi: {SAAT.format(new Date(bekleyen.tarih))}</p>
        </div>
      )}
      {bekleyen?.reddedildi && (
        <div className="hata-kutu">
          <p>
            <strong>İstediğiniz değişiklik onaylanmadı.</strong> Yönetici A.Ş.’nin notu: {bekleyen.gerekce}
          </p>
          <p className="kucuk">Bu not, ilanı bir sonraki kaydedişinizde kalkar.</p>
        </div>
      )}

      {islemYapilabilirMi('duzenle', durum) ? (
        <IlanFormu
          ilanId={ilan.id}
          durum={durum}
          baslangic={ilanFormuBaslangici(ilan)}
          secenekler={secenekler}
          sinir={sinir}
          sonKayit={SAAT.format(new Date(ilan.updatedAt))}
        />
      ) : (
        <div className="panel f-blok">
          <p>
            Bu ilan {DURUM_ADI[durum].toLocaleLowerCase('tr')} durumunda olduğu için düzenlenemez. İlanı yeniden yayınlamak isterseniz “İşlemler”
            düğmesinden “Yeniden yayınla”yı seçin; ilanın kopyası taslak olarak açılır.
          </p>
        </div>
      )}
    </>
  )
}
