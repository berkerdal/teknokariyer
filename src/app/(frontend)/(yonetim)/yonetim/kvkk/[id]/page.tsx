import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { yoneticiMi } from '@/erisim'
import { Ikon } from '@/arayuz/Ikon'
import { tarihYaz } from '@/arayuz/bicim'
import { HesapSilFormu, IncelemeFormu, NotFormu, SonucFormu } from '@/arayuz/yonetim/Kvkk'
import { YetkiYok } from '@/arayuz/yonetim/YetkiYok'
import { kvkkAyrintisi } from '@/veri/kvkk'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'KVKK başvurusu · Yönetim' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ sonuc?: string; hesap?: string; eposta?: string }> }

const SAAT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

const SONUC: Record<string, [string, 'basari-kutu' | 'uyari-kutu']> = {
  kaydedildi: ['Başvuru kaydedildi. Yasal süre başvurunun ulaştığı günden sayılıyor.', 'basari-kutu'],
  incele: ['Başvuru incelemeye alındı.', 'basari-kutu'],
  not: ['Not eklendi.', 'basari-kutu'],
  sil: ['Hesap silindi. Şimdi başvurana cevabı yazıp gönderin.', 'basari-kutu'],
  sonuclandi: ['Başvuru sonuçlandı; cevap başvurana e-postayla gönderildi.', 'basari-kutu'],
  'sonuclandi-epostasiz': ['Başvuru sonuçlandı, ancak cevap e-postası gönderilemedi. Cevabı aşağıdan kopyalayıp kurumsal e-postanızdan gönderin ve not olarak yazın.', 'uyari-kutu'],
}

/** Başvurunun adımları (prototip): alındı → kimlik doğrulandı → işlem → cevap. */
function Adimlar({ durum, kimlikTamam }: { durum: string; kimlikTamam: boolean }) {
  const adimlar: Array<[string, boolean]> = [
    ['Başvuru alındı', true],
    ['Kimlik doğrulandı ve incelemeye alındı', durum !== 'alindi' && kimlikTamam],
    ['Cevap gönderildi', durum === 'sonuclandi'],
  ]
  const simdi = adimlar.findIndex(([, tamam]) => !tamam)
  return (
    <ol className="kvkk-adim">
      {adimlar.map(([ad, tamam], i) => (
        <li key={ad} className={tamam ? 'tamam' : i === simdi ? 'simdi' : undefined}>
          {ad}
        </li>
      ))}
    </ol>
  )
}

export default async function KvkkAyrinti({ params, searchParams }: Props) {
  const { id } = await params
  const k = await yonetimOturumu(`/yonetim/kvkk/${id}`)
  if (!yoneticiMi(k)) return <YetkiYok baslik="KVKK başvurusu" neden="KVKK başvuruları kişisel veri içerdiği için yalnızca tam yetkili kullanıcılara açıktır." />
  const t = await kvkkAyrintisi(Number(id))
  if (!t) notFound()
  const sp = await searchParams
  const sonuc = sp.sonuc ? SONUC[sp.sonuc] : undefined
  const acik = t.durum !== 'sonuclandi'
  const hitap = t.kanal === 'portal' || t.hesap ? 'sen' : 'siz'
  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/kvkk">
            <Ikon ad="geri" kucuk /> KVKK başvuruları
          </Link>
          <p className="ust-etiket">KVKK başvurusu</p>
          <h1 className="b1">{t.turAdi}</h1>
          <p className="ikincil">
            {t.basvuranAd} · {t.kanalAdi} · {tarihYaz(t.basvuruTarihi, true)}
          </p>
        </div>
        <p className={`kucuk ${t.yaklasan || t.gecikti ? 'y-tehlike' : 'ikincil'}`}>
          {acik
            ? t.kalan < 0
              ? `Yasal süre ${-t.kalan} gün önce doldu (${tarihYaz(t.sonGun, true)}).`
              : `Yasal süre ${tarihYaz(t.sonGun, true)} tarihinde doluyor: ${t.kalan === 0 ? 'bugün son gün' : `${t.kalan} gün kaldı`}.`
            : `${tarihYaz(t.cevapTarihi!, true)} tarihinde sonuçlandı (${t.cevapGun === 0 ? 'başvuruyla aynı gün' : `${t.cevapGun} günde`}).`}
        </p>
      </div>

      {sonuc && (
        <p className={sonuc[1]} role="status">
          {sonuc[0]}
          {sp.hesap === '1' && ' Başvuru, aynı e-posta adresiyle kayıtlı aday hesabına bağlandı.'}
          {sp.eposta === '0' && ' “Başvurunuz alındı” e-postası gönderilemedi.'}
        </p>
      )}

      <div className="y-iki">
        <section className="panel panel-ic">
          <h2 className="b3">Başvuru</h2>
          <Adimlar durum={t.durum} kimlikTamam={t.kimlik !== 'dogrulanmadi'} />
          <dl className="ozet-dl">
            <div>
              <dt>Başvuran</dt>
              <dd>{t.basvuranAd}</dd>
            </div>
            <div>
              <dt>Cevap adresi</dt>
              <dd>{t.basvuranEposta}</dd>
            </div>
            <div>
              <dt>Kimlik doğrulama</dt>
              <dd>{t.kimlikAdi}</dd>
            </div>
            <div>
              <dt>Portal hesabı</dt>
              <dd>{t.hesap ? `${t.hesap.ad} · ${t.hesap.basvuruSayisi} başvuru` : 'Bağlı hesap yok (hesap hiç olmamış veya silinmiş)'}</dd>
            </div>
          </dl>
          <h3 className="b4">Başvuranın istediği</h3>
          <p className="kvkk-cevap">{t.aciklama || 'Açıklama yazılmamış; başvuru türü yukarıda.'}</p>
          {t.hesap?.aday && (
            <div className="kvkk-dokum">
              <a className="dugme dugme--ikincil dugme--kucuk" href={`/yonetim/kvkk/${t.id}/dokum`} download>
                <Ikon ad="indir" /> Kişinin veri dökümünü indir (JSON)
              </a>
              <p className="kucuk ikincil">
                Döküm; hesap, profil, başvurular, onaylar ve KVKK başvurularını içerir. Firma ekibinin iç notları yer almaz. İndirme işlem kaydına yazılır. Kişi aynı
                dökümü kendi hesabından da alabilir.
              </p>
            </div>
          )}
        </section>

        <section className="panel panel-ic">
          {t.durum === 'alindi' && (
            <>
              <h2 className="b3">1. Kimliği doğrulayıp incelemeye alın</h2>
              <IncelemeFormu talepId={t.id} kimlik={t.kimlik} hesapVar={Boolean(t.hesap)} />
            </>
          )}
          {t.durum === 'inceleniyor' && (
            <>
              {t.tur === 'silme' && t.hesap?.aday && (
                <>
                  <h2 className="b3">2. Hesabı silin</h2>
                  <HesapSilFormu talepId={t.id} ad={t.hesap.ad} basvuruSayisi={t.hesap.basvuruSayisi} />
                </>
              )}
              <h2 className="b3">{t.tur === 'silme' && t.hesap?.aday ? '3' : '2'}. Cevabı yazıp gönderin</h2>
              <SonucFormu talepId={t.id} tur={t.tur} hitap={hitap} />
            </>
          )}
          {!acik && (
            <>
              <h2 className="b3">Sonuç: {t.sonucAdi}</h2>
              <p className="kucuk ikincil">
                {t.cevapGonderildi ? `Cevap ${t.basvuranEposta} adresine gönderildi.` : 'Cevap e-postası gönderilemedi; kurumsal e-postadan gönderilmesi gerekir.'}
              </p>
              <p className="kvkk-cevap">{t.cevap}</p>
            </>
          )}
        </section>
      </div>

      <div className="y-iki">
        <section className="panel panel-ic">
          <h2 className="b3">İç notlar</h2>
          <p className="kucuk ikincil">Notları yalnızca tam yetkili Yönetici A.Ş. kullanıcıları görür; başvurana gönderilmez.</p>
          {t.notlar.length > 0 && (
            <ul className="y-notlar">
              {t.notlar.map((n, i) => (
                <li key={i}>
                  <p>{n.metin}</p>
                  <p className="kucuk ikincil">
                    {n.yazan} · {SAAT.format(new Date(n.tarih))}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <NotFormu talepId={t.id} />
        </section>
        <section className="panel panel-ic">
          <h2 className="b3">Geçmiş</h2>
          <ul className="y-notlar">
            {t.gecmis.map((g, i) => (
              <li key={i}>
                <p>{g.islem}</p>
                <p className="kucuk ikincil">
                  {g.kim} · {SAAT.format(new Date(g.tarih))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
