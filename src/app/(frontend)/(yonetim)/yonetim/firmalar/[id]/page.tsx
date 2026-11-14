import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DURUM_ADI, type IlanDurumu } from '@/alan/ilan'
import { HUNI_ADI } from '@/alan/kurulum'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { Ikon } from '@/arayuz/Ikon'
import { tarihYaz } from '@/arayuz/bicim'
import { DavetIslemi, FirmaKaydiFormu, PasiflikFormu, TakipNotuFormu, YetkiliDavetFormu } from '@/arayuz/yonetim/Firmalar'
import { moderasyonYapabilirMi, yoneticiMi } from '@/erisim'
import { firmaYonetimAyrintisi } from '@/veri/firmaYonetimi'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Firma · Yönetim' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ sonuc?: string; kapanan?: string }> }

const SONUC: Record<string, string> = {
  olusturuldu: 'Firma kaydı oluşturuldu. Yetkili bilgisi tamamsa aşağıdan davet gönderebilirsiniz.',
  kaydedildi: 'Değişiklikler kaydedildi.',
  davet: 'Davet gönderildi. Firma “Davet gönderildi” aşamasına geçti; kabul edilince “Devralındı” olur.',
  'davet-yeniden': 'Davet yeni bir bağlantıyla yeniden gönderildi. Eski bağlantı artık geçersiz.',
  'davet-iptal': 'Davet iptal edildi.',
  etkin: 'Firma yeniden etkin.',
}
const YETKI_ADI: Record<string, string> = { yonetici: 'Tam yetkili', 'ilan-sorumlusu': 'İlan sorumlusu', degerlendirici: 'Değerlendirici' }
const SAAT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

export default async function FirmaAyrintisi({ params, searchParams }: Props) {
  const { id } = await params
  const k = await yonetimOturumu(`/yonetim/firmalar/${id}`)
  const [v, sp] = await Promise.all([firmaYonetimAyrintisi(Number(id)), searchParams])
  if (!v) notFound()
  const { firma, satir, uyeler, davetler, ilanlar, kayitlar, sektorler } = v
  const yonetici = yoneticiMi(k)
  const karar = moderasyonYapabilirMi(k)
  const etkinTamYetkili = uyeler.some((u) => u.firmaYetkisi === 'yonetici' && !u.pasif)
  const bekleyen = davetler.filter((d) => !d.kullanildi)
  const sonucMetni = sp.sonuc === 'pasif' ? `Firma pasif yapıldı. ${Number(sp.kapanan) || 0} ilan kapatıldı.` : sp.sonuc ? SONUC[sp.sonuc] : null
  const notlar = [...(firma.takipNotlari ?? [])].reverse()

  return (
    <>
      <div className="y-bas">
        <div>
          <Link className="geri kucuk" href="/yonetim/firmalar">
            <Ikon ad="geri" kucuk /> Firmalar
          </Link>
          <div className="y-firma-baslik">
            <FirmaKaro konum={firma.konum} boy={44} />
            <div>
              <h1 className="b1">{firma.kisaAd}</h1>
              <p className="ikincil">
                {firma.unvan} · {firma.konum}
              </p>
            </div>
          </div>
        </div>
        <p>
          <span className={`y-asama y-asama--${firma.asama}`}>{satir?.ilkIlan && firma.asama !== 'pasif' ? HUNI_ADI['ilk-ilan'] : satir?.asamaAdi}</span>
          {firma.yayinaHazir && firma.asama !== 'pasif' && !firma.testFirmasi && (
            <>
              {' '}
              <Link className="kucuk" href={`/firma/${firma.slug}`}>
                Herkese açık sayfa
              </Link>
            </>
          )}
        </p>
      </div>
      {sonucMetni && (
        <p className="basari-kutu" role="status">
          {sonucMetni}
        </p>
      )}
      {satir?.takipGun != null && (
        <p className="uyari-kutu">
          Bu firma {satir.takipGun} gündür ilerlemedi. Yetkiliyi arayın ve sonucu aşağıya takip notu olarak yazın.
          {firma.yetkiliTelefon ? ` Telefon: ${firma.yetkiliTelefon}` : ''}
        </p>
      )}
      <ModulBilgisi kimlik="yonetim-firma" baslik="Bu sayfada neler yapabilirsiniz?">
        <ul>
          <li>Firmanın Yönetici A.Ş.’ye ait bilgilerini (unvan, yer, yetkili kişi) düzeltebilirsiniz. Tanıtım, logo ve yan hakları firma kendisi doldurur.</li>
          <li>Yetkiliye davet gönderebilir, süresi dolan daveti yeniden gönderebilir veya iptal edebilirsiniz.</li>
          <li>Firmayla yaptığınız görüşmeleri takip notu olarak yazabilirsiniz. Notları yalnızca Yönetici A.Ş. görür.</li>
          <li>Teknokent’ten ayrılan firmayı pasif yapabilirsiniz.</li>
        </ul>
      </ModulBilgisi>

      <div className="y-iki">
        <div className="y-sutun">
          <section className="panel">
            <header className="panel-ic y-panel-bas">
              <h2 className="b3">Davet ve ekip</h2>
              <span className="kucuk ikincil">
                {uyeler.filter((u) => !u.pasif).length} etkin kullanıcı · {bekleyen.length} bekleyen davet
              </span>
            </header>
            <div className="panel-ic y-sutun">
              {uyeler.length > 0 && (
                <ul className="y-satirlar">
                  {uyeler.map((u) => (
                    <li key={u.id}>
                      <span>
                        <strong>{u.ad}</strong>
                        {u.unvan && <span className="kucuk ikincil"> · {u.unvan}</span>}
                        <br />
                        <span className="kucuk">{u.email}</span>
                      </span>
                      <span className="kucuk">{u.pasif ? 'Ekipten çıkarıldı' : YETKI_ADI[u.firmaYetkisi ?? ''] ?? ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              {davetler.length > 0 && (
                <>
                  <h3 className="b4">Davetler</h3>
                  <ul className="y-satirlar">
                    {davetler.map((d) => {
                      const doldu = d.doldu
                      return (
                        <li key={d.id}>
                          <span>
                            <strong>{d.ad}</strong> <span className="kucuk ikincil">· {YETKI_ADI[d.firmaYetkisi] ?? d.firmaYetkisi}</span>
                            <br />
                            <span className="kucuk">
                              {d.eposta} · {tarihYaz(d.createdAt)} gönderildi
                              {d.hatirlatmalar?.length ? ` · ${d.hatirlatmalar.length} hatırlatma` : ''}
                            </span>
                          </span>
                          <span className="y-davet-durum">
                            {d.kullanildi ? (
                              <span className="kucuk">{tarihYaz(d.kullanildi)} kabul edildi</span>
                            ) : (
                              <>
                                <span className={doldu ? 'durum durum--reddedildi' : 'durum durum--onayda'}>{doldu ? 'Süresi doldu' : `${tarihYaz(d.sonGecerlilik)} tarihine kadar geçerli`}</span>
                                {karar && (
                                  <span className="satir-ici">
                                    <DavetIslemi firmaId={firma.id} davetId={d.id} />
                                    <DavetIslemi firmaId={firma.id} davetId={d.id} iptal />
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
              {karar && firma.asama !== 'pasif' && (!etkinTamYetkili || firma.asama === 'iskelet') && bekleyen.length === 0 && (
                <>
                  <h3 className="b4">{firma.asama === 'iskelet' ? 'Yetkiliye davet gönder' : 'Yeni yetkiliye davet gönder'}</h3>
                  <YetkiliDavetFormu firmaId={firma.id} ad={firma.yetkiliAd ?? ''} eposta={firma.yetkiliEposta ?? ''} ilkDavet={firma.asama === 'iskelet'} />
                </>
              )}
              {etkinTamYetkili && <p className="kucuk ikincil">Firmanın tam yetkili kullanıcısı var. Yeni ekip üyelerini firma kendi panelinden davet eder.</p>}
            </div>
          </section>

          <section className="panel">
            <header className="panel-ic y-panel-bas">
              <h2 className="b3">Firma kaydı</h2>
            </header>
            <div className="panel-ic">
              <FirmaKaydiFormu
                yonetici={yonetici}
                sektorler={sektorler}
                firma={{
                  id: firma.id,
                  unvan: firma.unvan,
                  kisaAd: firma.kisaAd,
                  konum: firma.konum,
                  sektor: firma.sektor && typeof firma.sektor === 'object' ? firma.sektor.id : ((firma.sektor as number | null | undefined) ?? null),
                  web: firma.web,
                  yetkiliAd: firma.yetkiliAd,
                  yetkiliEposta: firma.yetkiliEposta,
                  yetkiliTelefon: firma.yetkiliTelefon,
                  guvenilir: firma.guvenilir,
                  testFirmasi: firma.testFirmasi,
                }}
              />
            </div>
          </section>
        </div>

        <div className="y-sutun">
          <section className="panel panel-ic y-sutun">
            <h2 className="b3">Takip notları</h2>
            {karar && <TakipNotuFormu firmaId={firma.id} />}
            {notlar.length === 0 ? (
              <p className="kucuk ikincil">Henüz not yok.</p>
            ) : (
              <ul className="y-notlar">
                {notlar.map((n, i) => (
                  <li key={n.id ?? i}>
                    <span className="kucuk ikincil">{SAAT.format(new Date(n.tarih))}</span>
                    <p>{n.not}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel panel-ic">
            <h2 className="b3">İlanlar</h2>
            {ilanlar.length === 0 ? (
              <p className="kucuk ikincil">Firmanın ilanı yok.</p>
            ) : (
              <ul className="y-satirlar">
                {ilanlar.map((i) => (
                  <li key={i.id}>
                    <span>
                      {i.durum === 'onayda' ? <Link href={`/yonetim/onay/${i.id}`}>{i.pozisyonAdi}</Link> : i.pozisyonAdi}
                      <br />
                      <span className="kucuk ikincil">Son değişiklik {tarihYaz(i.updatedAt)}</span>
                    </span>
                    <span className={`durum durum--${i.durum}`}>{DURUM_ADI[i.durum as IlanDurumu]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel panel-ic">
            <h2 className="b3">Son işlemler</h2>
            {kayitlar.length === 0 ? (
              <p className="kucuk ikincil">Kayıt yok.</p>
            ) : (
              <ul className="y-notlar">
                {kayitlar.map((r) => (
                  <li key={r.id}>
                    <span className="kucuk ikincil">
                      {SAAT.format(new Date(r.createdAt))}
                      {r.kim && typeof r.kim === 'object' ? ` · ${r.kim.ad ?? ''}` : ''}
                    </span>
                    <p className="kucuk">{r.islem}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {yonetici && (
            <section className="panel panel-ic">
              <h2 className="b3">{firma.asama === 'pasif' ? 'Firmayı yeniden etkin yap' : 'Firma Teknokent’ten ayrıldı mı?'}</h2>
              <PasiflikFormu firmaId={firma.id} pasif={firma.asama === 'pasif'} yayindakiIlan={satir?.yayindakiIlan ?? 0} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}
