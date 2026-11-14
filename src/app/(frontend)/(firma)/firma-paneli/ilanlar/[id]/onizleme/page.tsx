import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DURUM_ADI, ilanEksikleri, islemYapilabilirMi, type IlanDurumu } from '@/alan/ilan'
import { Ikon } from '@/arayuz/Ikon'
import { IlanGovdesi } from '@/arayuz/IlanGovdesi'
import { YayinaGonder } from '@/arayuz/firma/YayinaGonder'
import { firmaIlani, firmaKurallari, firmaOturumu, oturumdakiFirma } from '@/veri/firma'
import { firmaOzeti, ilanAyrintisinaCevir } from '@/veri/ilanlar'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Önizleme · Firma paneli' }

/** Hata anahtarından formdaki alan kimliğine (hata özetindeki bağlantılar düzenleme sayfasındaki alana gider). */
const ALAN_KIMLIGI: Record<string, string> = { sonBasvuru: 'sonBasvuru-alan' }

/** İlanın adayların göreceği hâli. Eksik varsa önce eksikler listelenir; tamamsa buradan yayına gönderilir (K4). */
export default async function IlanOnizleme({ params }: Props) {
  const { id } = await params
  await firmaOturumu(`/firma-paneli/ilanlar/${id}/onizleme`)
  const [ilan, firma, kurallar] = await Promise.all([firmaIlani(Number(id)), oturumdakiFirma(), firmaKurallari()])
  if (!ilan || !firma) notFound()
  const durum = ilan.durum as IlanDurumu
  const eksik = ilanEksikleri(ilan as unknown as Record<string, unknown>)
  const tamam = Object.keys(eksik).length === 0
  const gonderilebilir = islemYapilabilirMi('yayina-gonder', durum)
  const onayli = firma.onaylanmisIlanSayisi ?? 0
  const onayaGider = !firma.guvenilir && onayli < kurallar.onayliIlanSayisi
  const f = firmaOzeti(firma)
  const a = tamam ? ilanAyrintisinaCevir(ilan, f) : null

  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href={`/firma-paneli/ilanlar/${ilan.id}`}>
            <Ikon ad="geri" kucuk /> Düzenlemeye dön
          </Link>
          <p className="ust-etiket">Önizleme · Adayların göreceği hâliyle</p>
          <h1 className="b1">{ilan.pozisyonAdi}</h1>
          <p>
            <span className={`durum durum--${durum}`}>{DURUM_ADI[durum]}</span>
          </p>
        </div>
      </div>

      {gonderilebilir && tamam && (
        <div className="bilgi">
          {onayaGider ? (
            <p>
              <strong>Bu ilan Yönetici A.Ş. onayına gidecek.</strong> İlk {kurallar.onayliIlanSayisi} ilanınız onaydan geçer; şimdiye kadar {onayli}{' '}
              ilanınız onaylandı. Hedef onay süresi 1 iş günüdür. Onaylanan ilan kendiliğinden yayına girer.
            </p>
          ) : (
            <p>
              <strong>Bu ilan gönderdiğiniz anda yayına girer.</strong> Adaylar hemen görüp başvurabilir.
            </p>
          )}
        </div>
      )}

      {!tamam && (
        <div className="hata-ozeti" role="alert">
          <h2>İlanı yayına göndermeden önce şunları tamamlayın</h2>
          <ul>
            {Object.entries(eksik).map(([alan, mesaj]) => (
              <li key={alan}>
                <Link href={`/firma-paneli/ilanlar/${ilan.id}#${ALAN_KIMLIGI[alan] ?? alan}`}>{mesaj}</Link>
              </li>
            ))}
          </ul>
          <p className="kucuk">Eksikler tamamlanınca ilan burada adayların göreceği hâliyle görünür.</p>
        </div>
      )}

      {a && (
        <div className="onizleme-cerceve" aria-label="İlan önizlemesi">
          <IlanGovdesi a={a} f={f} />
        </div>
      )}

      <div className="yapiskan-alt f-form-ayak">
        <Link className="dugme dugme--ikincil" href={`/firma-paneli/ilanlar/${ilan.id}`}>
          Düzenlemeye dön
        </Link>
        {gonderilebilir && tamam && <YayinaGonder ilanId={ilan.id} metin={onayaGider ? 'İlanı onaya gönder' : 'İlanı yayınla'} />}
      </div>
    </>
  )
}
