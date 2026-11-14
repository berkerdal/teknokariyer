import type { Metadata } from 'next'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { DegisiklikKarari } from '@/arayuz/yonetim/Kararlar'
import { moderasyonYapabilirMi } from '@/erisim'
import { bekleyenDegisiklikler, yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'İlan değişiklikleri · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string; ilan?: string; eposta?: string }> }

export default async function Degisiklikler({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/degisiklikler')
  const [liste, sp] = await Promise.all([bekleyenDegisiklikler(), searchParams])
  const karar = moderasyonYapabilirMi(k)
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">İlan değişiklikleri</h1>
          <p className="ikincil">{liste.length ? `${liste.length} değişiklik onay bekliyor.` : 'Onay bekleyen değişiklik yok.'}</p>
        </div>
      </div>
      {sp.sonuc && sp.ilan && (
        <div role="status">
          <p className="basari-kutu">
            {sp.sonuc === 'onay'
              ? `“${sp.ilan}” ilanındaki değişiklik onaylandı ve yayındaki ilana yansıdı.`
              : `“${sp.ilan}” ilanındaki değişiklik onaylanmadı. İlan önceki hâliyle yayında kalıyor.`}
          </p>
          {sp.eposta === '0' && <p className="uyari-kutu">Karar kaydedildi ancak firmaya e-posta gönderilemedi. Firmaya ayrıca bilgi verin.</p>}
        </div>
      )}
      <ModulBilgisi kimlik="yonetim-degisiklik" baslik="Bu sayfa ne işe yarar?">
        <p>
          Henüz güvenilir olmayan bir firma yayındaki ilanında <strong>esaslı bir alanı</strong> (pozisyon adı, ilan türü, çalışma şekli veya ücret)
          değiştirirse değişiklik hemen yansımaz; burada onayınızı bekler. Bu sırada ilan önceki hâliyle yayında kalır.
        </p>
        <ul>
          <li>Tabloda alanın şu anki değeri ve firmanın istediği değer yan yana görünür.</li>
          <li>Onaylarsanız değişiklik ilana yansır. Onaylamazsanız firmaya nedenini yazmanız gerekir; ilan değişmeden kalır.</li>
          <li>Açıklama ve nitelikler gibi diğer alanlardaki değişiklikler onay beklemeden yansır.</li>
        </ul>
      </ModulBilgisi>
      {liste.map((d) => (
        <section key={d.id} id={`d-${d.id}`} className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">{d.pozisyonAdi}</h2>
            <span className="kucuk ikincil">
              {d.firma} · {d.bekleme} önce istendi
            </span>
          </header>
          <div className="panel-ic">
            <div className="tablo-kap">
              <table className="tablo y-tablo">
                <thead>
                  <tr>
                    <th>Alan</th>
                    <th>Şu an</th>
                    <th>Firmanın istediği</th>
                  </tr>
                </thead>
                <tbody>
                  {d.farklar.map((f) => (
                    <tr key={f.alan}>
                      <td>{f.ad}</td>
                      <td className="ikincil">{f.once}</td>
                      <td>
                        <strong>{f.sonra}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="kucuk">
              <a href={`/yonetim/onay/${d.id}`}>İlanın tamamını görüntüleyin</a>
            </p>
            {karar && <DegisiklikKarari ilanId={d.id} />}
          </div>
        </section>
      ))}
    </>
  )
}
