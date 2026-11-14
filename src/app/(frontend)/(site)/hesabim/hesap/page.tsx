import type { Metadata } from 'next'
import Link from 'next/link'
import { Ikon } from '@/arayuz/Ikon'
import { GonderDugmesi } from '@/arayuz/form'
import { tarihYaz } from '@/arayuz/bicim'
import { cikisEylemi } from '@/eylemler/hesap'
import { METINLER, type MetinKimligi } from '@/metinler'
import { payloadAl } from '@/veri/payload'
import { adayOturumu } from '@/veri/aday'

export const metadata: Metadata = { title: 'Hesap ve gizlilik', robots: { index: false } }

/** Verilen onaylar (sürüm ve tarihiyle), verilerin bir kopyası, çıkış. */
export default async function HesapSayfasi() {
  const k = await adayOturumu()
  const payload = await payloadAl()
  const { docs: rizalar } = await payload.find({ collection: 'rizalar', where: { kullanici: { equals: k.id } }, sort: '-createdAt', limit: 200, depth: 0, overrideAccess: true })
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
          <Link className="dugme dugme--ikincil dugme--kucuk" href="/sifremi-unuttum">
            Şifremi değiştir
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
        <div className="tablo-kap">
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

      <section className="profil-bolum">
        <h2 className="b3 kare-bas">Hesabı sil</h2>
        <p>
          Hesabını silmek istersen <a href="mailto:kvkk@pauteknokent.com.tr?subject=Hesap%20silme%20talebi">kvkk@pauteknokent.com.tr</a> adresine kayıtlı e-posta
          adresinden yaz. Talebin en geç 30 gün içinde sonuçlandırılır.
        </p>
      </section>
    </>
  )
}
