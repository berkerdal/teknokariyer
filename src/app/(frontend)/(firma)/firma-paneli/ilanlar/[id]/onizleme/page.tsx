import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DURUM_ADI, ilanEksikleri, islemYapilabilirMi, type IlanDurumu } from '@/alan/ilan'
import { Ikon } from '@/arayuz/Ikon'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { IlanEtiketleri, IlanOzetListesi, Metin } from '@/arayuz/IlanParcalari'
import { BeceriListesi } from '@/arayuz/IlanSatiri'
import { YayinaGonder } from '@/arayuz/firma/YayinaGonder'
import { firmaIlani, firmaKurallari, firmaOturumu, oturumdakiFirma } from '@/veri/firma'
import { firmaOzeti, ilanAyrintisinaCevir } from '@/veri/ilanlar'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Önizleme · Firma paneli' }

const EGITIM_ADI: Record<string, string> = { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans', 'yuksek-lisans': 'Yüksek lisans', doktora: 'Doktora' }

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
          <div className="il-bas">
            <FirmaKaro konum={f.konum} boy={40} />
            <div>
              <p>
                <strong>{f.ad}</strong>
              </p>
              <p className="kucuk ikincil">{[f.sektor, f.konum].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <h2 className="b2">{a.pozisyonAdi}</h2>
          <IlanEtiketleri ilan={a} uzun />
          <IlanOzetListesi ilan={a} />
          <h3 className="b3 kare-bas">Ne yapacaksın?</h3>
          <Metin metin={a.isTanimi} />
          <h3 className="b3 kare-bas">Aranan nitelikler</h3>
          <Metin metin={a.nitelikler} />
          <p>
            <strong>Eğitim:</strong> {EGITIM_ADI[a.egitim] ?? a.egitim}
            {a.bolumler.length ? ` · ${a.bolumler.join(', ')}` : ''}
          </p>
          {a.diller.length > 0 && (
            <p>
              <strong>Dil:</strong> {a.diller.map((d) => `${d.dil} ${d.seviye}`).join(', ')}
            </p>
          )}
          <h3 className="b3 kare-bas">Beceriler</h3>
          <BeceriListesi zorunlu={a.zorunluBeceriler} tercih={a.tercihBeceriler} />
          {a.yanHaklar.length > 0 && (
            <>
              <h3 className="b3 kare-bas">Yan haklar</h3>
              <ul className="madde">
                {a.yanHaklar.map((y) => (
                  <li key={y}>{y}</li>
                ))}
              </ul>
            </>
          )}
          {a.soruSayisi > 0 && <p className="kucuk ikincil">Başvururken adaya {a.soruSayisi} ön eleme sorusu sorulur.</p>}
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
