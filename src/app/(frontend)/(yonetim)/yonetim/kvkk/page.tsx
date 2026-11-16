import type { Metadata } from 'next'
import Link from 'next/link'
import { trGunMetni } from '@/alan/tarih'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { tarihYaz } from '@/arayuz/bicim'
import { KvkkKayitFormu } from '@/arayuz/yonetim/Kvkk'
import { YetkiYok } from '@/arayuz/yonetim/YetkiYok'
import { kvkkListesi } from '@/veri/kvkk'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'KVKK başvuruları · Yönetim' }

const kalanMetni = (t: { durum: string; kalan: number; cevapGun: number | null }) =>
  t.durum === 'sonuclandi' ? (t.cevapGun === 0 ? 'Aynı gün cevaplandı' : `${t.cevapGun} günde cevaplandı`) : t.kalan < 0 ? `${-t.kalan} gün gecikti` : t.kalan === 0 ? 'Bugün son gün' : `${t.kalan} gün kaldı`

/** İlgili kişi başvuruları (prototip “Yönetim: KVKK talepleri”): yasal 30 günlük süre, öncelik sırası, elle kayıt. */
export default async function KvkkBasvurulari() {
  const k = await yonetimOturumu('/yonetim/kvkk')
  if (!yoneticiMi(k)) return <YetkiYok baslik="KVKK başvuruları" neden="KVKK başvuruları kişisel veri içerdiği için yalnızca tam yetkili kullanıcılara açıktır." />
  const liste = await kvkkListesi()
  const acik = liste.filter((t) => t.durum !== 'sonuclandi')
  const simdi = new Date()
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">KVKK başvuruları</h1>
          <p className="ikincil">Kişilerin kişisel verileriyle ilgili başvuruları: portal formundan, e-postayla veya yazılı olarak gelenler.</p>
        </div>
        <p className="kucuk ikincil">{acik.length === 0 ? 'Açık başvuru yok.' : `${acik.length} açık başvuru var.`}</p>
      </div>

      <ModulBilgisi kimlik="yonetim-kvkk" baslik="Bu sayfa ne işe yarar?">
        <p>
          Kişisel Verilerin Korunması Kanunu’na göre bir kişi, hakkında hangi verilerin işlendiğini öğrenmek, düzeltilmesini veya silinmesini istemek için
          başvurabilir. Başvuru, bize ulaştığı günden başlayarak en geç 30 gün içinde ücretsiz olarak cevaplanmalıdır.
        </p>
        <ul>
          <li>Adaylar hesaplarından başvurduğunda başvuru buraya kendiliğinden düşer ve kimlikleri doğrulanmış sayılır.</li>
          <li>
            kvkk@pauteknokent.com.tr adresine gelen e-postaları ve elden teslim edilen dilekçeleri sayfanın altındaki formla kaydedin. Böylece süre takibi ve
            cevap tek yerde olur.
          </li>
          <li>Başvuruyu açın, başvuranın kimliğini doğrulayıp incelemeye alın, gerekiyorsa işlemi yapın (örneğin hesabı silin) ve cevabı yazıp gönderin.</li>
          <li>Süresi 7 günden az kalan veya geçen başvurular listede kırmızı çizgiyle işaretlenir. Her adım işlem kayıtlarına yazılır.</li>
        </ul>
      </ModulBilgisi>

      <section className="panel">
        <div className="tablo-kap" tabIndex={0}>
          <table className="tablo y-tablo">
            <caption className="gizli">KVKK başvuruları; açık olanlar en az süresi kalandan başlayarak</caption>
            <thead>
              <tr>
                <th>Konu</th>
                <th>Başvuran</th>
                <th>Kanal</th>
                <th>Başvuru</th>
                <th>Süre</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <tr>
                  <td colSpan={6} className="ikincil">
                    Henüz başvuru yok.
                  </td>
                </tr>
              )}
              {liste.map((t) => (
                <tr key={t.id} className={t.yaklasan || t.gecikti ? 'risk' : undefined}>
                  <td>
                    <Link href={`/yonetim/kvkk/${t.id}`}>
                      <strong>{t.turAdi}</strong>
                    </Link>
                  </td>
                  <td>
                    {t.basvuranAd}
                    {t.hesapVar && <span className="kucuk ikincil"> · hesabı var</span>}
                  </td>
                  <td className="kucuk">{t.kanalAdi}</td>
                  <td className="kucuk" style={{ whiteSpace: 'nowrap' }}>
                    {tarihYaz(t.basvuruTarihi, true)}
                  </td>
                  <td className="kucuk" style={{ whiteSpace: 'nowrap' }}>
                    {kalanMetni(t)}
                  </td>
                  <td className="kucuk">{t.sonucAdi ?? t.durumAdi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel-ic" id="yeni">
        <h2 className="b3">E-postayla veya yazılı gelen başvuruyu kaydet</h2>
        <p className="kucuk ikincil">Portal formundan gelen başvurular kendiliğinden listelenir; onları burada kaydetmeyin.</p>
        <KvkkKayitFormu bugun={trGunMetni(simdi)} enErken={trGunMetni(new Date(simdi.getTime() - 365 * 86_400_000))} />
      </section>
    </>
  )
}
