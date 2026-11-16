import type { Metadata } from 'next'
import Link from 'next/link'
import { Ikon } from '@/arayuz/Ikon'
import { GonderDugmesi } from '@/arayuz/form'
import { tarihYaz } from '@/arayuz/bicim'
import { cikisEylemi } from '@/eylemler/hesap'
import { METINLER, type MetinKimligi } from '@/metinler'
import { HesapSilmeFormu, KvkkBasvuruFormu } from '@/arayuz/hesap/KvkkFormlari'
import { KURUM } from '@/altyapi/kurum'
import { payloadAl } from '@/veri/payload'
import { adayOturumu } from '@/veri/aday'
import { adayinKvkkBasvurulari } from '@/veri/kvkk'

export const metadata: Metadata = { title: 'Hesap ve gizlilik', robots: { index: false } }

const SONUC_RENGI = { kabul: 'yayinda', kismen: 'onayda', ret: 'reddedildi' } as const

type Props = { searchParams: Promise<{ kvkk?: string }> }

/** Verilen onaylar (sürüm ve tarihiyle), verilerin bir kopyası, KVKK başvuruları, hesabı silme (K27), çıkış. */
export default async function HesapSayfasi({ searchParams }: Props) {
  const sp = await searchParams
  const k = await adayOturumu('/hesabim/hesap')
  const payload = await payloadAl()
  const [{ docs: rizalar }, kvkk, basvuru] = await Promise.all([
    payload.find({ collection: 'rizalar', where: { kullanici: { equals: k.id } }, sort: '-createdAt', limit: 200, depth: 0, overrideAccess: true }),
    adayinKvkkBasvurulari(Number(k.id)),
    payload.count({ collection: 'basvurular', where: { adayKullanici: { equals: k.id } }, overrideAccess: true }),
  ])
  return (
    <>
      <h1 className="b1">Hesap ve gizlilik</h1>
      <section className="profil-bolum">
        <h2 className="b3 kare-bas">Hesap</h2>
        <dl className="ozet-dl">
          <div>
            <dt>Ad soyad</dt>
            <dd>{k.ad}</dd>
          </div>
          <div>
            <dt>E-posta</dt>
            <dd>{k.email}</dd>
          </div>
        </dl>
        <div className="dugme-grubu">
          <Link className="dugme dugme--ikincil dugme--kucuk" href="/hesap-guvenligi">
            Şifre ve iki aşamalı doğrulama
          </Link>
          <form action={cikisEylemi}>
            <GonderDugmesi className="dugme dugme--sade dugme--kucuk" bekleme="Çıkılıyor…">
              Çıkış yap
            </GonderDugmesi>
          </form>
        </div>
      </section>

      <section className="profil-bolum">
        <h2 className="b3 kare-bas">Verdiğin onaylar</h2>
        <p className="ikincil kucuk">Her onay, metnin sürümü ve tarihiyle kaydedilir. CV havuzu rızasını “CV havuzu” sayfasından geri alabilirsin.</p>
        <div className="tablo-kap" tabIndex={0}>
          <table className="tablo">
            <thead>
              <tr>
                <th>Onay</th>
                <th>Metin sürümü</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {rizalar.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/metin/${r.tur}`}>{METINLER[r.tur as MetinKimligi]?.baslik ?? r.tur}</Link>
                    {r.geriAlinma && <span className="kucuk ikincil"> · geri alındı</span>}
                  </td>
                  <td>{r.metinSurumu}</td>
                  <td>{tarihYaz(r.geriAlinma ?? r.createdAt, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="profil-bolum">
        <h2 className="b3 kare-bas">Verilerin</h2>
        <p>Hesap bilgilerini, profilini, başvurularını ve onay kayıtlarını tek bir dosya (JSON) olarak indirebilirsin. CV dosyaların profil sayfasında yer alır.</p>
        <div className="dugme-grubu">
          <a className="dugme dugme--ikincil" href="/hesabim/verilerim" download>
            <Ikon ad="indir" /> Verilerimi indir
          </a>
        </div>
      </section>

      <section className="profil-bolum" id="kvkk">
        <h2 className="b3 kare-bas">Kişisel verilerinle ilgili başvurular</h2>
        <p>
          Kişisel Verilerin Korunması Kanunu’nun 11. maddesindeki haklarını kullanmak için buradan başvurabilirsin. Hesabına giriş yaptığın için ayrıca kimlik
          belgesi istemiyoruz. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır ve cevabı {k.email} adresine gönderilir.
        </p>
        {sp.kvkk && (
          <p className={sp.kvkk === 'alindi' ? 'basari-kutu' : 'uyari-kutu'} role="status">
            {sp.kvkk === 'alindi'
              ? 'Başvurun alındı. Onay e-postası gönderdik; durumunu bu sayfadan izleyebilirsin.'
              : 'Başvurun alındı, ancak onay e-postası gönderilemedi. Başvurunun durumunu bu sayfadan izleyebilirsin.'}
          </p>
        )}
        {kvkk.length > 0 && (
          <ul className="kvkk-liste">
            {kvkk.map((t) => (
              <li key={t.id}>
                <p>
                  <strong>{t.turAdi}</strong> · {tarihYaz(t.basvuruTarihi)} ·{' '}
                  <span className={`durum durum--${t.acik ? t.durum : SONUC_RENGI[t.sonuc ?? 'kabul']}`}>{t.acik ? t.durumAdi : t.sonucAdi}</span>
                </p>
                {t.acik ? (
                  <p className="kucuk ikincil">En geç {tarihYaz(t.sonGun)} tarihine kadar sonuçlandırılacak.</p>
                ) : (
                  t.cevap && (
                    <details>
                      <summary className="kucuk">Cevabı oku ({tarihYaz(t.cevapTarihi!)})</summary>
                      <p className="kvkk-cevap">{t.cevap}</p>
                    </details>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
        <details className="kvkk-yeni">
          <summary className="dugme dugme--ikincil">Yeni başvuru yap</summary>
          <KvkkBasvuruFormu />
        </details>
        <p className="kucuk ikincil">
          İstersen başvurunu {KURUM.kvkkEposta} adresine, portalda kayıtlı e-posta adresinden de gönderebilirsin.
        </p>
      </section>

      <section className="profil-bolum" id="hesabi-sil">
        <h2 className="b3 kare-bas">Hesabı sil</h2>
        <details className="kvkk-yeni">
          <summary className="dugme dugme--sade y-tehlike">Hesabımı silmek istiyorum</summary>
          <HesapSilmeFormu basvuruSayisi={basvuru.totalDocs} />
        </details>
      </section>
    </>
  )
}
