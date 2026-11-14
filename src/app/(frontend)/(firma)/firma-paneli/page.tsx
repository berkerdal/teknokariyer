import type { Metadata } from 'next'
import Link from 'next/link'
import { DURUM_ADI, kalanGun, yapilabilecekIslemler } from '@/alan/ilan'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { HizliIslem, IlanIslemleri } from '@/arayuz/firma/IlanIslemleri'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { paylasimBilgisi, firmaIlanlari, firmaKurallari, firmaOturumu, ilanYonetebilirMi, oturumdakiFirma, tarihSiniri, type FirmaIlani } from '@/veri/firma'

export const metadata: Metadata = { title: 'Firma paneli' }

const GUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'Europe/Istanbul' })
const herkeseAcik = (d: string) => ['yayinda', 'duraklatildi', 'kapandi', 'suresi-doldu'].includes(d)

/** Açılış ekranı görev odaklı: yeni başvurular, dikkat isteyen ilanlar, yayındakiler ve onay kuralı (K4). */
export default async function FirmaOzeti() {
  const k = await firmaOturumu()
  const [firma, ilanlar, kurallar, sinir] = await Promise.all([oturumdakiFirma(), firmaIlanlari(), firmaKurallari(), tarihSiniri()])
  if (!firma) return null
  const firmaAdi = firma.kisaAd
  const yonetir = ilanYonetebilirMi(k)
  const simdi = new Date()
  const yeniler = ilanlar.filter((i) => i.yeni > 0)
  const yayinda = ilanlar.filter((i) => i.durum === 'yayinda')
  const dikkat = ilanlar.filter(
    (i) =>
      ['duzeltme', 'onayda', 'duraklatildi', 'taslak'].includes(i.durum) || (i.durum === 'yayinda' && kalanGun(new Date(i.sonBasvuru), simdi) <= 3),
  )
  const onayli = firma.onaylanmisIlanSayisi ?? 0
  const kural = kurallar.onayliIlanSayisi
  const islemIlani = (i: FirmaIlani) => ({
    id: i.id,
    pozisyonAdi: i.pozisyonAdi,
    durum: i.durum,
    sonBasvuru: i.sonBasvuru,
    basvuru: i.basvuru,
    adres: herkeseAcik(i.durum) ? ilanAdresi(i) : undefined,
    paylasim: paylasimBilgisi(i, firmaAdi),
  })

  return (
    <>
      <div className="f-bas">
        <div>
          <p className="ust-etiket">{GUN.format(simdi)}</p>
          <h1 className="b1">Özet</h1>
        </div>
        {yonetir && (
          <div className="dugme-grubu">
            <Link className="dugme" href="/firma-paneli/ilanlar/yeni">
              <Ikon ad="arti" /> Yeni ilan
            </Link>
            {ilanlar.length > 0 && (
              <Link className="dugme dugme--ikincil" href="/firma-paneli/ilanlar/yeni?kopya=sec">
                <Ikon ad="kopya" /> Önceki ilandan kopyala
              </Link>
            )}
          </div>
        )}
      </div>

      <ModulBilgisi kimlik="firma-ozet" baslik="Bu sayfa ne işe yarar?">
        <p>Özet, bugün ilgilenmeniz gereken işleri bir arada gösterir. Her kutudaki bağlantı sizi ilgili işleme götürür.</p>
        <ul>
          <li>
            <strong>Yeni başvurular:</strong> Henüz incelemediğiniz başvuruları ilan ilan gösterir.
          </li>
          <li>
            <strong>Dikkat isteyenler:</strong> Düzeltme istenen, onay bekleyen, duraklatılmış, taslakta kalmış ve süresi dolmak üzere olan ilanlarınızı
            listeler.
          </li>
          <li>
            <strong>Onay durumu:</strong> İlk {kural} ilanınızın Yönetici A.Ş. onayından geçtiğini ve kaçıncı ilanda olduğunuzu gösterir.
          </li>
        </ul>
      </ModulBilgisi>

      {ilanlar.length === 0 ? (
        <section className="panel f-blok bos-durum">
          <h2 className="b3">İlk ilanınızı oluşturun</h2>
          <p>
            Henüz ilanınız yok. Yeni ilan formu sizi adım adım yönlendirir; zorunlu alanları doldurmanız birkaç dakika sürer. Formu yarıda bırakırsanız
            taslak olarak kaydedebilirsiniz.
          </p>
          {yonetir && (
            <p>
              <Link className="dugme" href="/firma-paneli/ilanlar/yeni">
                <Ikon ad="arti" /> Yeni ilan oluştur
              </Link>
            </p>
          )}
        </section>
      ) : (
        <div className="f-izgara">
          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Yeni başvurular</h2>
            {yeniler.length === 0 ? (
              <p className="ikincil">İncelemediğiniz başvuru yok.</p>
            ) : (
              <ul className="f-satirlar">
                {yeniler.map((i) => (
                  <li key={i.id}>
                    <Link href={`/firma-paneli/basvurular?ilan=${i.id}`}>
                      <span>
                        <strong>{i.pozisyonAdi}</strong>
                        <span className="kucuk ikincil">Toplam {i.basvuru} başvuru</span>
                      </span>
                      <span className="yeni-sayi">{i.yeni} yeni</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Dikkat isteyenler</h2>
            {dikkat.length === 0 ? (
              <p className="ikincil">Şu anda sizden işlem bekleyen bir ilan yok.</p>
            ) : (
              <ul className="f-satirlar">
                {dikkat.map((i) => {
                  const kalan = kalanGun(new Date(i.sonBasvuru), simdi)
                  return (
                    <li key={i.id}>
                      <div>
                        <p>
                          <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum]}</span> <strong>{i.pozisyonAdi}</strong>
                        </p>
                        <p className={i.durum === 'duzeltme' ? 'kucuk' : 'kucuk ikincil'}>
                          {i.durum === 'duzeltme' && <>Yönetici A.Ş.’nin notu: {i.duzeltmeGerekcesi}</>}
                          {i.durum === 'onayda' && <>Yönetici A.Ş. ilanınızı inceliyor. Hedef onay süresi 1 iş günüdür.</>}
                          {i.durum === 'duraklatildi' && <>İlan şu anda başvuru almıyor. Son başvuru tarihi: {tarihYaz(i.sonBasvuru, true)}.</>}
                          {i.durum === 'taslak' && <>Taslak henüz yayına gönderilmedi. Son değişiklik: {tarihYaz(i.guncelleme, true)}.</>}
                          {i.durum === 'yayinda' && (kalan === 0 ? <>Bugün son başvuru günü.</> : <>Son başvuru tarihine {kalan} gün kaldı.</>)}
                        </p>
                      </div>
                      {yonetir && (
                        <>
                          {(i.durum === 'duzeltme' || i.durum === 'taslak') && (
                            <Link className="dugme dugme--kucuk" href={`/firma-paneli/ilanlar/${i.id}`}>
                              {i.durum === 'duzeltme' ? 'Düzelt' : 'Devam et'}
                            </Link>
                          )}
                          {i.durum === 'duraklatildi' && (
                            <HizliIslem ilanId={i.id} islem="yeniden-baslat" ikincil>
                              Yeniden başlat
                            </HizliIslem>
                          )}
                          {i.durum === 'yayinda' && (
                            <IlanIslemleri ilan={islemIlani(i)} islemler={yapilabilecekIslemler(i.durum)} sinir={sinir} />
                          )}
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Yayındaki ilanlar</h2>
            {yayinda.length === 0 ? (
              <p className="ikincil">Şu anda yayında ilanınız yok.</p>
            ) : (
              <div className="tablo-kap">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>İlan</th>
                      <th className="sag">Başvuru</th>
                      <th className="sag">Görüntülenme</th>
                      <th>Son başvuru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yayinda.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <Link href={`/firma-paneli/ilanlar?durum=yayinda#ilan-${i.id}`}>{i.pozisyonAdi}</Link>
                        </td>
                        <td className="sag sayi">{i.basvuru}</td>
                        <td className="sag sayi">{i.goruntulenme}</td>
                        <td>{tarihYaz(i.sonBasvuru)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Onay durumu</h2>
            {firma.guvenilir ? (
              <p>Firmanız güvenilir olarak işaretlendi. Yayına gönderdiğiniz ilanlar onay beklemeden yayına girer.</p>
            ) : onayli >= kural ? (
              <p>İlk {kural} ilanınız onaylandı. Bundan sonraki ilanlarınız onay beklemeden yayına girer.</p>
            ) : (
              <>
                <p>
                  İlk {kural} ilanınız Yönetici A.Ş. onayından geçer. Şimdiye kadar <strong>{onayli} ilanınız onaylandı</strong>
                  {ilanlar.some((i) => i.durum === 'onayda') ? '; onay bekleyen ilanınız var.' : '.'}
                </p>
                <div className="onay-kareler" role="img" aria-label={`${kural} ilandan ${onayli} tanesi onaylandı`}>
                  {Array.from({ length: kural }, (_, n) => (
                    <i key={n} className={n < onayli ? 'dolu' : n === onayli && ilanlar.some((i) => i.durum === 'onayda') ? 'bekliyor' : ''} />
                  ))}
                </div>
                <p className="kucuk ikincil">Hedef onay süresi 1 iş günüdür. Onaylanan ilan kendiliğinden yayına girer.</p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
