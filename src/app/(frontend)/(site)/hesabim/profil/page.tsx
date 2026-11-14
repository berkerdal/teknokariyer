import type { Metadata } from 'next'
import Link from 'next/link'
import type { Adaylar } from '@/payload-types'
import { DENEYIM_ADI, MODEL_ADI, type CalismaModeli, type Deneyim } from '@/alan/eslesme'
import { CINSIYET_ADI, type Cinsiyet } from '@/alan/havuz'
import { Ikon } from '@/arayuz/Ikon'
import { DuzenlemePenceresi } from '@/arayuz/aday/DuzenlemePenceresi'
import {
  AYLAR,
  BaglantiAlanlari,
  BeceriAlanlari,
  DeneyimAlanlari,
  DilAlanlari,
  EgitimAlanlari,
  HakkindaAlanlari,
  KimlikAlanlari,
  SEVIYE_ADI,
  SertifikaAlanlari,
  TercihAlanlari,
} from '@/arayuz/aday/ProfilAlanlari'
import { CvSilDugmesi, CvYukleFormu } from '@/arayuz/aday/ProfilFormlari'
import { tarihYaz } from '@/arayuz/bicim'
import { EN_FAZLA_CV, kendiAdayKaydi } from '@/servisler/profil'
import { cvOzetleri, taksonomiSecenekleri } from '@/veri/basvuru'
import { adayOturumu } from '@/veri/aday'
import { payloadAl } from '@/veri/payload'
import { profilEksikleri } from '@/veri/profil'

export const metadata: Metadata = { title: 'Profil ve CV’ler', robots: { index: false } }

const ad = (x: unknown) => (x && typeof x === 'object' ? ((x as { ad?: string }).ad ?? '') : '')
const ayYilYaz = (iso?: string | null) => (iso ? `${AYLAR[new Date(iso).getUTCMonth()]} ${new Date(iso).getUTCFullYear()}` : '')

/** Bölüm kartı: başlık, sağda düzenleme düğmesi, altında okunur özet. */
function Kart(props: { id: string; baslik: string; eylem: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="profil-kart" id={props.id} aria-labelledby={`${props.id}-b`}>
      <div className="profil-kart-bas">
        <h2 className="b3" id={`${props.id}-b`}>
          {props.baslik}
        </h2>
        {props.eylem}
      </div>
      <div className="profil-kart-govde">{props.children}</div>
    </section>
  )
}
const Bos = ({ children }: { children: React.ReactNode }) => <p className="ikincil">{children}</p>

/**
 * Profil (K28): LinkedIn usulü okunur özet. Her bölüm “Düzenle” ile açılır pencerede düzenlenir;
 * kaydedince pencere kapanır ve özet yeni bilgilerle görünür. Eksikler sihirbaza yönlendirir.
 */
export default async function ProfilSayfasi() {
  const k = await adayOturumu('/hesabim/profil')
  const a: Adaylar = await kendiAdayKaydi(await payloadAl(), k)
  const [okullar, bolumler, beceriler, diller] = await Promise.all(['universite', 'bolum', 'beceri', 'dil'].map((t) => taksonomiSecenekleri(t as never)))
  const cvler = cvOzetleri(a)
  const eksikler = profilEksikleri(a, cvler.length)
  const t = a.tercihler
  const egitimSatiri = [ad(a.bolum), a.sinif].filter(Boolean).join(' · ')

  return (
    <>
      <header className="profil-ust">
        <p className="ust-etiket">Profilin</p>
        <h1 className="b1">{k.ad}</h1>
        <p className="profil-ust-alt">
          {egitimSatiri || ad(a.okul) ? (
            <>
              {egitimSatiri}
              {egitimSatiri && ad(a.okul) ? ', ' : ''}
              {ad(a.okul)}
            </>
          ) : (
            <span className="ikincil">Okul ve bölüm bilgisi henüz eklenmedi.</span>
          )}
        </p>
        <p className="kucuk ikincil">
          {[a.deneyimSeviyesi ? DENEYIM_ADI[a.deneyimSeviyesi as Deneyim] : null, t?.sehir].filter(Boolean).join(' · ')}
        </p>
        <p className="kucuk ikincil">Başvurduğun firmalar, profilinin başvuru anındaki kopyasını görür.</p>
      </header>

      {eksikler.length > 0 ? (
        <section className="panel panel-ic eksik-panel" aria-labelledby="eksik-b">
          <h2 className="b3" id="eksik-b">
            Profilini tamamla
          </h2>
          <p className="ikincil">Profilin ne kadar eksiksiz olursa ilanlarla eşleşmen o kadar doğru hesaplanır. Aşağıdaki bilgiler henüz eklenmedi.</p>
          <ul className="eksikler">
            {eksikler.map((e) => (
              <li key={e.ad}>
                <span>{e.ad}</span>
                <Link className="dugme dugme--sade dugme--kucuk" href={`/hesabim/profil/sihirbaz?adim=${e.adim}`}>
                  Ekle
                </Link>
              </li>
            ))}
          </ul>
          <p>
            <Link className="dugme" href={`/hesabim/profil/sihirbaz?adim=${eksikler[0]!.adim}`}>
              Adım adım tamamla
            </Link>
          </p>
        </section>
      ) : (
        <p className="basari-kutu">Profilin eksiksiz. Başvurularında otomatik olarak kullanılır.</p>
      )}

      <Kart
        id="hakkinda"
        baslik="Hakkında"
        eylem={
          <DuzenlemePenceresi baslik="Hakkında" bolumler={['hakkinda']} dugme={a.tanitim ? 'Düzenle' : 'Ekle'} tamamMetni="Tanıtım yazın kaydedildi.">
            <HakkindaAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        {a.tanitim ? <p className="profil-metin">{a.tanitim}</p> : <Bos>Henüz kendini tanıtan bir yazı eklemedin.</Bos>}
      </Kart>

      <Kart
        id="egitim"
        baslik="Eğitim"
        eylem={
          <DuzenlemePenceresi
            baslik="Eğitim bilgileri"
            bolumler={['egitim']}
            dugme={a.okul ? 'Düzenle' : 'Ekle'}
            tamamMetni="Eğitim bilgilerin kaydedildi."
            alanlar={{ mezuniyetAy: 'mezuniyetAy' }}
          >
            <EgitimAlanlari aday={a} okullar={okullar} bolumler={bolumler} />
          </DuzenlemePenceresi>
        }
      >
        {a.okul || a.bolum ? (
          <div className="profil-oge">
            <p className="profil-oge-bas">{ad(a.okul) || 'Okul seçilmedi'}</p>
            <p>{[ad(a.bolum), a.sinif].filter(Boolean).join(' · ')}</p>
            <p className="kucuk ikincil">
              {[a.mezuniyet ? `Mezuniyet: ${ayYilYaz(a.mezuniyet)}` : null, a.gano != null ? `GANO: ${String(a.gano).replace('.', ',')}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : (
          <Bos>Henüz eğitim bilgisi eklemedin.</Bos>
        )}
      </Kart>

      <Kart
        id="deneyim"
        baslik="Deneyim"
        eylem={
          <DuzenlemePenceresi
            baslik="Deneyim"
            aciklama="Deneyim düzeyini seç ve varsa iş ya da staj deneyimlerini ekle."
            bolumler={['deneyim', 'deneyimler']}
            dugme={a.deneyimSeviyesi || a.deneyimler?.length ? 'Düzenle' : 'Ekle'}
            tamamMetni="Deneyim bilgilerin kaydedildi."
          >
            <DeneyimAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        {a.deneyimSeviyesi && <p>Deneyim düzeyi: {DENEYIM_ADI[a.deneyimSeviyesi as Deneyim]}</p>}
        {(a.deneyimler ?? []).length ? (
          <ul className="profil-liste">
            {(a.deneyimler ?? []).map((d, n) => (
              <li key={n} className="profil-oge">
                <p className="profil-oge-bas">{d.pozisyon}</p>
                <p>{d.kurum}</p>
                {d.baslangic && (
                  <p className="kucuk ikincil">
                    {ayYilYaz(d.baslangic)} – {d.bitis ? ayYilYaz(d.bitis) : 'Devam ediyor'}
                  </p>
                )}
                {d.aciklama && <p className="profil-metin kucuk">{d.aciklama}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Henüz iş veya staj deneyimi eklemedin.</Bos>
        )}
      </Kart>

      <Kart
        id="beceriler"
        baslik="Beceriler"
        eylem={
          <DuzenlemePenceresi baslik="Beceriler" bolumler={['beceriler']} dugme={a.beceriler?.length ? 'Düzenle' : 'Ekle'} tamamMetni="Becerilerin kaydedildi.">
            <BeceriAlanlari aday={a} beceriler={beceriler} />
          </DuzenlemePenceresi>
        }
      >
        {(a.beceriler ?? []).length ? (
          <ul className="beceri-seviye">
            {(a.beceriler ?? []).map((b) => (
              <li key={ad(b.beceri)}>
                <span>{ad(b.beceri)}</span>
                <span className="ikincil">{SEVIYE_ADI[b.seviye] ?? b.seviye}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Henüz beceri eklemedin. Beceri eklersen ilanlarla eşleşmen daha doğru hesaplanır.</Bos>
        )}
      </Kart>

      <Kart
        id="diller"
        baslik="Diller"
        eylem={
          <DuzenlemePenceresi baslik="Yabancı diller" bolumler={['diller']} dugme={a.diller?.length ? 'Düzenle' : 'Ekle'} tamamMetni="Dil bilgilerin kaydedildi.">
            <DilAlanlari aday={a} diller={diller} />
          </DuzenlemePenceresi>
        }
      >
        {(a.diller ?? []).length ? (
          <ul className="beceri-seviye">
            {(a.diller ?? []).map((d) => (
              <li key={ad(d.dil)}>
                <span>{ad(d.dil)}</span>
                <span className="ikincil">{d.seviye}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Henüz yabancı dil eklemedin.</Bos>
        )}
      </Kart>

      <Kart
        id="cvler"
        baslik="CV’ler"
        eylem={
          <span className="kucuk ikincil">
            {cvler.length} / {EN_FAZLA_CV}
          </span>
        }
      >
        {cvler.length === 0 && <Bos>Henüz CV yüklemedin. Başvuru yapabilmek için en az bir CV gerekir.</Bos>}
        {cvler.map((cv) => (
          <div key={cv.id} className="dosya-satiri">
            <Ikon ad="dosya" />
            <span className="ad">
              {cv.ad}
              {cv.tarih && (
                <span className="kucuk ikincil" style={{ display: 'block' }}>
                  {tarihYaz(cv.tarih, true)} tarihinde yüklendi
                </span>
              )}
            </span>
            <CvSilDugmesi dosyaId={cv.id} ad={cv.ad} />
          </div>
        ))}
        {cvler.length < EN_FAZLA_CV && (
          <details className="cv-ekle">
            <summary className="dugme dugme--ikincil dugme--kucuk">
              <Ikon ad="arti" kucuk /> CV ekle
            </summary>
            <CvYukleFormu kalan={EN_FAZLA_CV - cvler.length} />
          </details>
        )}
      </Kart>

      <Kart
        id="sertifikalar"
        baslik="Sertifikalar"
        eylem={
          <DuzenlemePenceresi baslik="Sertifikalar" bolumler={['sertifikalar']} dugme={a.sertifikalar?.length ? 'Düzenle' : 'Ekle'} tamamMetni="Sertifikaların kaydedildi.">
            <SertifikaAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        {(a.sertifikalar ?? []).length ? (
          <ul className="profil-liste">
            {(a.sertifikalar ?? []).map((s, n) => (
              <li key={n} className="profil-oge">
                <p className="profil-oge-bas">{s.ad}</p>
                <p className="kucuk ikincil">{[s.kurum, s.yil].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Henüz sertifika eklemedin.</Bos>
        )}
      </Kart>

      <Kart
        id="baglantilar"
        baslik="Projeler ve bağlantılar"
        eylem={
          <DuzenlemePenceresi baslik="Projeler ve bağlantılar" bolumler={['baglantilar']} dugme={a.baglantilar?.length ? 'Düzenle' : 'Ekle'} tamamMetni="Bağlantıların kaydedildi.">
            <BaglantiAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        {(a.baglantilar ?? []).length ? (
          <ul className="profil-liste">
            {(a.baglantilar ?? []).map((b, n) => (
              <li key={n}>
                <a href={b.adres} rel="noopener nofollow" target="_blank">
                  {b.ad}
                </a>{' '}
                <span className="kucuk ikincil">{b.adres.replace(/^https?:\/\//, '')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Bos>Henüz bağlantı eklemedin.</Bos>
        )}
      </Kart>

      <Kart
        id="tercihler"
        baslik="İş arama tercihleri"
        eylem={
          <DuzenlemePenceresi baslik="İş arama tercihleri" bolumler={['tercihler']} dugme={t?.modeller?.length ? 'Düzenle' : 'Ekle'} tamamMetni="Tercihlerin kaydedildi.">
            <TercihAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        {t?.modeller?.length || t?.turler?.length || t?.sehir ? (
          <dl className="ozet-dl">
            {(t?.turler ?? []).length > 0 && (
              <div>
                <dt>İlan türü</dt>
                <dd>{(t?.turler ?? []).map((x) => (x === 'is' ? 'İş' : 'Staj')).join(', ')}</dd>
              </div>
            )}
            {(t?.modeller ?? []).length > 0 && (
              <div>
                <dt>Çalışma modeli</dt>
                <dd>{(t?.modeller ?? []).map((m) => MODEL_ADI[m as CalismaModeli]).join(', ')}</dd>
              </div>
            )}
            {t?.sehir && (
              <div>
                <dt>Şehir</dt>
                <dd>
                  {t.sehir}
                  {t.tasinmayaAcik ? ' (taşınmaya açık)' : ''}
                </dd>
              </div>
            )}
            {t?.baslama && (
              <div>
                <dt>Başlayabileceği tarih</dt>
                <dd>{t.baslama}</dd>
              </div>
            )}
            <div>
              <dt>Ücret beklentisi</dt>
              <dd>{t?.ucretBeklentisi ? `${t.ucretBeklentisi.toLocaleString('tr-TR')} ₺ (yalnızca sen görürsün)` : 'Belirtilmedi'}</dd>
            </div>
          </dl>
        ) : (
          <Bos>Henüz iş arama tercihlerini belirtmedin.</Bos>
        )}
      </Kart>

      <Kart
        id="iletisim"
        baslik="İletişim ve kişisel bilgiler"
        eylem={
          <DuzenlemePenceresi baslik="İletişim ve kişisel bilgiler" bolumler={['kimlik']} dugme="Düzenle" tamamMetni="Bilgilerin kaydedildi.">
            <KimlikAlanlari aday={a} />
          </DuzenlemePenceresi>
        }
      >
        <dl className="ozet-dl">
          <div>
            <dt>E-posta</dt>
            <dd>{k.email}</dd>
          </div>
          <div>
            <dt>Telefon</dt>
            <dd>{a.telefon || <span className="ikincil">Eklenmedi</span>}</dd>
          </div>
          <div>
            <dt>Cinsiyet</dt>
            <dd>{a.cinsiyet ? CINSIYET_ADI[a.cinsiyet as Cinsiyet] : <span className="ikincil">Belirtilmedi</span>}</dd>
          </div>
        </dl>
      </Kart>
    </>
  )
}
