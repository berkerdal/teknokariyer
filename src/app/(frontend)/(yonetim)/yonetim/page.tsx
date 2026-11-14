import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { HatirlatDugmesi } from '@/arayuz/yonetim/Kararlar'
import { moderasyonYapabilirMi } from '@/erisim'
import { kurulumOzeti } from '@/veri/firmaYonetimi'
import { basvurusuzBitenler, bekleyenDegisiklikler, bekleyenTalepler, onayKuyrugu, yonetimOturumu, yonetimSayilari } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Bugün · Yönetim' }

const GUN = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'Europe/Istanbul' })

function Kuyruk({ baslik, sayi, bilgi, hedef, bos, children }: { baslik: string; sayi: number; bilgi: string; hedef?: string; bos: string; children: React.ReactNode }) {
  return (
    <section className="y-kuyruk">
      <header>
        <h2 className="b3">
          {baslik} <span className="y-n">{sayi}</span>
        </h2>
        <p className="kucuk">{bilgi}</p>
        {hedef && sayi > 0 && (
          <Link className="kucuk" href={hedef}>
            Tümünü aç
          </Link>
        )}
      </header>
      {sayi === 0 ? <p className="y-bos kucuk ikincil">{bos}</p> : <ul>{children}</ul>}
    </section>
  )
}

/** Açılış ekranı bir pano değil, iş listesi: bugün ne yapılması gerektiği, bekleme süreleriyle (prototip “Bugün”). */
type Props = { searchParams: Promise<{ hatirlatma?: string; ilan?: string }> }

export default async function Bugun({ searchParams }: Props) {
  const sp = await searchParams
  const k = await yonetimOturumu()
  const karar = moderasyonYapabilirMi(k)
  const [onay, degisiklik, talep, basvurusuz, sayilar, kurulum] = await Promise.all([onayKuyrugu(), bekleyenDegisiklikler(), bekleyenTalepler(), basvurusuzBitenler(), yonetimSayilari(), kurulumOzeti()])
  const enEski = onay[0]
  return (
    <>
      <div className="y-bas">
        <div>
          <p className="ust-etiket">{GUN.format(new Date())}</p>
          <h1 className="b1">Bugün</h1>
        </div>
        <p className="kucuk ikincil">
          {sayilar.toplam === 0 ? 'Bekleyen iş yok.' : `${sayilar.toplam} iş bekliyor${enEski ? `; en eski onay ${enEski.bekleme} önce gönderildi` : ''}.`}
        </p>
      </div>

      {sp.hatirlatma !== undefined && (
        <p className={sp.hatirlatma === '0' ? 'uyari-kutu' : 'basari-kutu'} role="status">
          {sp.hatirlatma === '0'
            ? `“${sp.ilan ?? ''}” için hatırlatma kaydedildi, ancak firmanın ilanlarla ilgilenen etkin kullanıcısı olmadığı için e-posta gitmedi. Firmaya telefonla ulaşın.`
            : `“${sp.ilan ?? ''}” için firmanın ${sp.hatirlatma} kullanıcısına hatırlatma e-postası gönderildi.`}
        </p>
      )}

      <ModulBilgisi kimlik="yonetim-bugun" baslik="Bu sayfa ne işe yarar?">
        <p>Bu sayfa, Yönetici A.Ş. olarak bugün ilgilenmeniz gereken işleri kuyruklar hâlinde gösterir. Her satır sizi işi yapacağınız ekrana götürür.</p>
        <ul>
          <li>
            <strong>İlan onayı:</strong> Firmaların ilk ilanları yayına girmeden önce sizin onayınızdan geçer. Hedef süre 1 iş günüdür; süreyi aşan ilan
            kırmızı çizgiyle öne çıkar.
          </li>
          <li>
            <strong>İlan değişiklikleri:</strong> Yayındaki ilanda pozisyon adı, ilan türü, çalışma şekli veya ücret değişirse değişiklik sizin
            onayınızla yansır.
          </li>
          <li>
            <strong>Liste talepleri:</strong> Firmalar ve adaylar listede bulamadıkları beceri, bölüm veya dili buradan ister. Onayladığınız öğe listeye hemen
            eklenir.
          </li>
          <li>
            <strong>Kurulumda kişisel takip:</strong> Davet gönderildikten veya hesap devralındıktan sonra 14 gün ilerlemeyen firmalar. Firmayı arayıp
            sonucu not olarak yazın.
          </li>
          <li>
            <strong>Başvurusuz bitmek üzere:</strong> Son başvuruya 7 günden az kalmış ve hiç başvuru almamış ilanlar. Firmaya tek düğmeyle hatırlatma
            gönderebilirsiniz.
          </li>
        </ul>
      </ModulBilgisi>

      <div className="y-kuyruklar">
        <Kuyruk baslik="İlan onayı" sayi={onay.length} bilgi="Hedef: 1 iş günü" hedef="/yonetim/onay" bos="Onay bekleyen ilan yok.">
          {onay.slice(0, 6).map((o) => (
            <li key={o.id} className={o.gecikti ? 'risk' : undefined}>
              <Link href={`/yonetim/onay/${o.id}`}>
                <span>
                  <strong>{o.pozisyonAdi}</strong>
                  <span className="kucuk">
                    {o.firma.ad} · {o.kacinci}. ilanı{o.duzeltilmis ? ' · düzeltilip yeniden gönderildi' : ''}
                  </span>
                </span>
                <span className="y-sure">
                  {o.uyari > 0 && <span className="durum durum--duzeltme">{o.uyari} uyarı</span>}
                  {o.bekleme}
                </span>
              </Link>
            </li>
          ))}
        </Kuyruk>

        <Kuyruk baslik="İlan değişiklikleri" sayi={degisiklik.length} bilgi="Yayındaki ilanda onay gerektiren değişiklik" hedef="/yonetim/degisiklikler" bos="Onay bekleyen değişiklik yok.">
          {degisiklik.slice(0, 6).map((d) => (
            <li key={d.id}>
              <Link href={`/yonetim/degisiklikler#d-${d.id}`}>
                <span>
                  <strong>{d.pozisyonAdi}</strong>
                  <span className="kucuk">
                    {d.firma} · {d.farklar.map((f) => f.ad).join(', ')}
                  </span>
                </span>
                <span className="y-sure">{d.bekleme}</span>
              </Link>
            </li>
          ))}
        </Kuyruk>

        <Kuyruk baslik="Liste talepleri" sayi={talep.length} bilgi="Firmaların ve adayların listeye eklenmesini istedikleri" hedef="/yonetim/talepler" bos="Bekleyen talep yok.">
          {talep.slice(0, 6).map((t) => (
            <li key={t.id}>
              <Link href={`/yonetim/talepler#t-${t.id}`}>
                <span>
                  <strong>{t.ogeler.join(', ')}</strong>
                  <span className="kucuk">
                    {t.turAdi.charAt(0).toLocaleUpperCase('tr') + t.turAdi.slice(1)} · {t.isteyenTuru}
                  </span>
                </span>
                <span className="y-sure">{t.bekleme}</span>
              </Link>
            </li>
          ))}
        </Kuyruk>

        <Kuyruk baslik="Kurulumda kişisel takip" sayi={kurulum.takip.length} bilgi="14 gündür ilerlemeyen firmalar" hedef="/yonetim/firmalar?asama=takip#liste" bos="Takip gerektiren firma yok.">
          {kurulum.takip.slice(0, 6).map((f) => (
            <li key={f.id}>
              <Link href={`/yonetim/firmalar/${f.id}`}>
                <span>
                  <strong>{f.kisaAd}</strong>
                  <span className="kucuk">
                    {f.asamaAdi}
                    {f.sonNot ? ` · son not: ${f.sonNot.not.slice(0, 60)}` : ' · not yok'}
                  </span>
                </span>
                <span className="y-sure">{f.takipGun} gün</span>
              </Link>
            </li>
          ))}
        </Kuyruk>

        <Kuyruk
          baslik="Başvurusuz bitmek üzere"
          sayi={basvurusuz.length}
          bilgi="Son başvuruya 7 günden az kalan, hiç başvuru almamış ilanlar"
          bos="Başvurusuz bitmek üzere olan ilan yok."
        >
          {basvurusuz.map((i) => (
            <li key={i.id} className="y-eylemli">
              <span>
                <strong>{i.pozisyonAdi}</strong>
                <span className="kucuk">
                  {i.firma} · {i.kalan === 0 ? 'bugün son gün' : `${i.kalan} gün kaldı`}
                </span>
              </span>
              {i.hatirlatildi ? <span className="kucuk ikincil">Hatırlatıldı</span> : karar ? <HatirlatDugmesi ilanId={i.id} ad={i.pozisyonAdi} /> : null}
            </li>
          ))}
        </Kuyruk>
      </div>
    </>
  )
}
