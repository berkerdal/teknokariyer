import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { onayKuyrugu, kurumKurallari, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'İlan onayı · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; ilan?: string; eposta?: string; guvenilir?: string }> }

function SonucKutusu({ sonuc, ilan, eposta, guvenilir }: Awaited<Props['searchParams']>) {
  if (!sonuc || !ilan) return null
  const metin =
    sonuc === 'onay'
      ? `“${ilan}” onaylandı ve yayına girdi.${guvenilir === '1' ? ' Firma güvenilir olarak işaretlendi.' : ''}`
      : `“${ilan}” için düzeltme istendi. Firma ilanı düzeltip yeniden gönderdiğinde kuyruğa geri gelir.`
  return (
    <div role="status">
      <p className="basari-kutu">{metin}</p>
      {eposta === '0' && (
        <p className="uyari-kutu">Karar kaydedildi ancak firmaya e-posta gönderilemedi. Firmaya telefonla veya e-postayla ayrıca bilgi verin.</p>
      )}
    </div>
  )
}

export default async function OnayKuyrugu({ searchParams }: Props) {
  await yonetimOturumu('/yonetim/onay')
  const [kuyruk, kurallar, sp] = await Promise.all([onayKuyrugu(), kurumKurallari(), searchParams])
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">İlan onayı</h1>
          <p className="ikincil">{kuyruk.length ? `${kuyruk.length} ilan onay bekliyor. En uzun bekleyen en üstte.` : 'Onay bekleyen ilan yok.'}</p>
        </div>
      </div>
      <SonucKutusu {...sp} />
      <ModulBilgisi kimlik="yonetim-onay" baslik="İlan onayı nasıl çalışır?">
        <p>
          Her firmanın ilk {kurallar.onayliIlanSayisi} ilanı yayına girmeden önce sizin onayınızdan geçer. Bu sınırı geçen veya güvenilir olarak işaretlenen
          firmaların ilanları doğrudan yayına girer.
        </p>
        <ul>
          <li>İlanı açınca adayların göreceği hâlini, otomatik tarama sonucunu ve kontrol listesini görürsünüz.</li>
          <li>
            Uygun olmayan ilanı reddetmezsiniz; <strong>düzeltme istersiniz</strong>. Firmaya neyi düzelteceğini yazarsınız, firma düzeltip yeniden
            gönderir.
          </li>
          <li>Hedef onay süresi 1 iş günüdür. Hafta sonu sayılmaz. Süreyi aşan ilan kırmızı çizgiyle işaretlenir.</li>
        </ul>
      </ModulBilgisi>
      {kuyruk.length > 0 && (
        <section className="y-kuyruk">
          <ul>
            {kuyruk.map((o) => (
              <li key={o.id} className={o.gecikti ? 'risk' : undefined}>
                <Link href={`/yonetim/onay/${o.id}`}>
                  <span>
                    <strong>{o.pozisyonAdi}</strong>
                    <span className="kucuk">
                      {o.firma.ad} · {o.firma.konum} · {o.kacinci}. ilanı{o.duzeltilmis ? ' · düzeltilip yeniden gönderildi' : ''}
                    </span>
                  </span>
                  <span className="y-sure">
                    {o.uyari > 0 && <span className="durum durum--duzeltme">{o.uyari} uyarı</span>}
                    <span>{o.bekleme}</span>
                    {o.gecikti && <span className="kucuk">Hedef süre aşıldı</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
