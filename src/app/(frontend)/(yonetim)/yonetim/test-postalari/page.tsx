import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { yoneticiMi } from '@/erisim'
import { ortam } from '@/altyapi/eposta'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { YetkiYok } from '@/arayuz/yonetim/YetkiYok'
import { KutuyuBosalt, PostaGovdesi } from '@/arayuz/yonetim/TestPostaKutusu'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Test posta kutusu · Yönetim' }

const ZAMAN = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
const EN_FAZLA = 100

type Props = { searchParams: Promise<{ id?: string; q?: string; bosaltildi?: string }> }

/**
 * Test posta kutusu (talimatlar 0.5, prototip “Yönetim: Test posta kutusu”). Yayın dışı ortamda hiçbir e-posta gerçek
 * alıcıya gitmez; hepsi burada toplanır. Personel test senaryolarında davet, doğrulama ve bildirim e-postalarını buradan
 * açar. Yayın ortamında sayfa yoktur (404).
 */
export default async function TestPostaKutusuSayfasi({ searchParams }: Props) {
  if (ortam() === 'yayin') notFound()
  const k = await yonetimOturumu('/yonetim/test-postalari')
  if (!yoneticiMi(k)) return <YetkiYok baslik="Test posta kutusu" neden="Test e-postaları kişi adları ve davet bağlantıları içerdiği için yalnızca tam yetkili kullanıcılara açıktır." />
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const payload = await payloadAl()
  const where = q ? { or: [{ kime: { like: q } }, { konu: { like: q } }] } : undefined
  const { docs, totalDocs } = await payload.find({
    collection: 'test-postalar',
    where,
    sort: '-createdAt',
    limit: EN_FAZLA,
    depth: 0,
    select: { kime: true, konu: true, createdAt: true },
    overrideAccess: true,
  })
  const seciliId = Number(sp.id) || docs[0]?.id
  const secili = seciliId
    ? await payload.findByID({ collection: 'test-postalar', id: seciliId, depth: 0, overrideAccess: true, disableErrors: true })
    : null
  const tumu = q ? (await payload.count({ collection: 'test-postalar', overrideAccess: true })).totalDocs : totalDocs
  const adres = (id: number) => `/yonetim/test-postalari?${new URLSearchParams({ ...(q ? { q } : {}), id: String(id) })}`

  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Test posta kutusu</h1>
          <p className="ikincil">
            {tumu ? `Kutuda ${tumu} e-posta var.` : 'Kutu boş.'} {totalDocs > EN_FAZLA ? `En yeni ${EN_FAZLA} e-posta listeleniyor.` : ''}
          </p>
        </div>
        <KutuyuBosalt sayi={tumu} />
      </div>
      <ModulBilgisi kimlik="yonetim-test-posta" baslik="Bu kutu ne işe yarar?">
        <p>
          Test ortamında portal hiçbir e-postayı gerçek alıcıya göndermez. Davet, e-posta doğrulama, şifre yenileme, giriş kodu, başvuru ve hatırlatma
          e-postalarının hepsi bu kutuya düşer. Test senaryolarında e-postadaki bağlantıyı buradan açabilirsiniz. Yayın ortamında bu sayfa bulunmaz.
        </p>
      </ModulBilgisi>
      {sp.bosaltildi && (
        <p className="basari-kutu" role="status">
          Kutu boşaltıldı.
        </p>
      )}
      <form className="posta-arama" method="get" role="search">
        <label htmlFor="posta-ara" className="gizli">
          Alıcıya veya konuya göre ara
        </label>
        <input id="posta-ara" name="q" type="search" className="girdi" defaultValue={q} placeholder="Alıcı veya konu" />
        <button type="submit" className="dugme dugme--ikincil dugme--kucuk">
          Ara
        </button>
        {q && (
          <Link className="kucuk" href="/yonetim/test-postalari">
            Aramayı temizle
          </Link>
        )}
      </form>
      {docs.length ? (
        <div className={`y-iki posta-duzen${sp.id ? ' posta-duzen--acik' : ''}`}>
          <section className="panel" aria-label="E-postalar">
            <ul className="posta-liste">
              {docs.map((d) => (
                <li key={d.id} className={d.id === secili?.id ? 'secili' : undefined}>
                  <Link href={adres(d.id)} aria-current={d.id === secili?.id ? 'true' : undefined}>
                    <span className="kucuk ikincil">
                      {d.kime} · {ZAMAN.format(new Date(d.createdAt))}
                    </span>
                    <strong>{d.konu || '(konusuz)'}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {secili ? (
            <section className="panel panel-ic posta-onizleme" aria-label="Seçili e-posta">
              <Link className="kucuk posta-geri" href={q ? `/yonetim/test-postalari?q=${encodeURIComponent(q)}` : '/yonetim/test-postalari'}>
                ← Kutuya dön
              </Link>
              <p className="kucuk ikincil">
                Kime: {secili.kime} · {ZAMAN.format(new Date(secili.createdAt))}
              </p>
              <h2 className="b3">{secili.konu || '(konusuz)'}</h2>
              {Array.isArray(secili.ekler) && secili.ekler.length > 0 && (
                <p className="kucuk">
                  Ekler:{' '}
                  {(secili.ekler as Array<{ dosyaAdi: string; tur: string; icerik: string }>).map((e) => (
                    <a key={e.dosyaAdi} className="posta-ek" href={`data:${e.tur.split(';')[0]};charset=utf-8,${encodeURIComponent(e.icerik)}`} download={e.dosyaAdi}>
                      {e.dosyaAdi}
                    </a>
                  ))}
                </p>
              )}
              {secili.html ? (
                <PostaGovdesi html={secili.html} baslik={secili.konu ?? ''} />
              ) : (
                <pre className="posta-metin">{secili.metin}</pre>
              )}
            </section>
          ) : (
            <p className="ikincil">Görmek istediğiniz e-postayı listeden seçin.</p>
          )}
        </div>
      ) : (
        <p className="ikincil">{q ? 'Aramanıza uyan e-posta yok.' : 'Henüz e-posta yok. Davet gönderdiğinizde veya bir aday kayıt olduğunda e-postalar burada görünür.'}</p>
      )}
    </>
  )
}
