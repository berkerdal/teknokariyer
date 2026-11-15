import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { tarihYaz } from '@/arayuz/bicim'
import { CihazUnutDugmesi, IkiAdimKapatFormu, KurtarmaYenileFormu } from '@/arayuz/hesap/IkiAdimFormlari'
import { Ust } from '@/arayuz/Ust'
import { guvenlikAyarlariniAl, guvenlikDurumu, taninanCihazlar } from '@/servisler/ikiAdim'
import { cihazAnahtari, rolAnaSayfasi } from '@/veri/cerez'
import { oturum, payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Hesap güvenliği', robots: { index: false } }

type Props = { searchParams: Promise<{ kurtarma?: string; sonuc?: string }> }

const SONUC: Record<string, string> = {
  kuruldu: 'Doğrulayıcı uygulama kuruldu. Yeni bir cihazdan girişte artık uygulamadaki kod istenecek.',
  yenilendi: 'Yeni kurtarma kodları oluşturuldu; eski kodlar artık geçersiz.',
  kapatildi: 'Doğrulayıcı uygulama kaldırıldı.',
  'cihaz-unutuldu': 'Cihaz unutuldu. O cihazdan bir sonraki girişte yeniden doğrulama istenecek.',
  'cihazlar-unutuldu': 'Bütün cihazlar unutuldu. Her cihazdan bir sonraki girişte yeniden doğrulama istenecek.',
}

/** Şifre, yeni cihaz doğrulaması, önerilen doğrulayıcı uygulama ve tanınan cihazlar (K33). Her rol için ortak sayfa. */
export default async function HesapGuvenligi({ searchParams }: Props) {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  const sp = await searchParams
  const payload = await payloadAl()
  const [d, cihazlar, { cihazGun: CIHAZ_GUN }] = await Promise.all([guvenlikDurumu(payload, Number(k.id)), taninanCihazlar(payload, Number(k.id), await cihazAnahtari()), guvenlikAyarlariniAl(payload)])
  const siz = k.rol !== 'aday'
  const kalan = sp.kurtarma !== undefined ? Number(sp.kurtarma) : null
  const cihazBolumu = d.zorunlu || d.uygulama || cihazlar.length > 0
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <Link className="geri kucuk" href={k.rol === 'aday' ? '/hesabim/hesap' : rolAnaSayfasi(String(k.rol))}>
          {k.rol === 'aday' ? 'Hesabım' : k.rol === 'firma' ? 'Firma paneli' : 'Yönetim paneli'}
        </Link>
        <h1 className="b1">Hesap güvenliği</h1>
        {kalan !== null && (
          <p className={kalan <= 3 ? 'uyari-kutu' : 'basari-kutu'} role="status">
            {siz ? `Kurtarma koduyla giriş yaptınız; ${kalan} kodunuz kaldı.` : `Kurtarma koduyla giriş yaptın; ${kalan} kodun kaldı.`}{' '}
            {kalan <= 3 && (siz ? 'Aşağıdan yeni kodlar oluşturun.' : 'Aşağıdan yeni kodlar oluştur.')}
          </p>
        )}
        {sp.sonuc && SONUC[sp.sonuc] && (
          <p className="basari-kutu" role="status">
            {SONUC[sp.sonuc]}
          </p>
        )}

        <section className="profil-bolum">
          <h2 className="b3 kare-bas">
            Doğrulayıcı uygulama <span className="etiket etiket--oneri">Önerilen</span>
          </h2>
          {d.uygulama ? (
            <>
              <dl className="ozet-dl">
                <div>
                  <dt>Durum</dt>
                  <dd>Kurulu{d.kurulumTarihi ? ` · ${tarihYaz(d.kurulumTarihi, true)}` : ''}</dd>
                </div>
                <div>
                  <dt>Kurtarma kodu</dt>
                  <dd>{d.kalanKurtarma} kullanılmamış kod</dd>
                </div>
              </dl>
              <p className="kucuk ikincil">
                {siz
                  ? 'Yeni bir cihazdan girişte telefonunuzdaki uygulamanın ürettiği kod istenir. Telefonunuz yanınızda değilse kurtarma kodlarından birini kullanırsınız.'
                  : 'Yeni bir cihazdan girişte telefonundaki uygulamanın ürettiği kod istenir. Telefonun yanında değilse kurtarma kodlarından birini kullanırsın.'}
              </p>
              <h3 className="b4">Yeni kurtarma kodları</h3>
              <p className="kucuk">{siz ? 'Yeni kodlar oluşturduğunuzda eski kodlar geçersiz olur.' : 'Yeni kodlar oluşturduğunda eski kodlar geçersiz olur.'}</p>
              <KurtarmaYenileFormu siz={siz} />
              <details className="kucuk guvenlik-kaldir">
                <summary>Uygulamayı kaldırmak istiyorum</summary>
                <p>
                  {d.zorunlu
                    ? 'Kaldırırsanız yeni bir cihazdan girişte e-postanıza kod gönderilir.'
                    : 'Kaldırırsan girişte yalnızca şifren istenir.'}
                </p>
                <IkiAdimKapatFormu siz={siz} />
              </details>
            </>
          ) : (
            <>
              <p>
                {siz
                  ? 'Telefonunuza Google Authenticator veya Microsoft Authenticator gibi ücretsiz bir uygulama kurarsanız, yeni bir cihazdan girişte e-posta yerine bu uygulamanın ürettiği kod istenir. Bu yöntem e-postadan daha güvenlidir; e-posta hesabınız ele geçse bile portala girilemez. Kurulum birkaç dakika sürer.'
                  : 'Telefonuna Google Authenticator veya Microsoft Authenticator gibi ücretsiz bir uygulama kurarsan, yeni bir cihazdan girişte şifrene ek olarak bu uygulamanın ürettiği kod istenir. Böylece şifren başkasının eline geçse bile hesabına girilemez.'}
              </p>
              <Link className="dugme" href="/hesap-guvenligi/kur">
                {siz ? 'Doğrulayıcı uygulamayı kurun' : 'Doğrulayıcı uygulamayı kur'}
              </Link>
            </>
          )}
        </section>

        {cihazBolumu && (
          <section className="profil-bolum">
            <h2 className="b3 kare-bas">Tanınan cihazlar</h2>
            <p className="kucuk">
              {d.uygulama
                ? siz
                  ? `Bu cihazlardan girişte yalnızca şifreniz istenir. Başka bir cihazdan girişte uygulamadaki kod sorulur. Bir cihaz ${CIHAZ_GUN} gün kullanılmazsa listeden düşer.`
                  : `Bu cihazlardan girişte yalnızca şifren istenir. Bir cihaz ${CIHAZ_GUN} gün kullanılmazsa listeden düşer.`
                : `Bu cihazlardan girişte yalnızca şifreniz istenir. Başka bir cihazdan girişte e-postanıza 6 haneli kod gönderilir. Bir cihaz ${CIHAZ_GUN} gün kullanılmazsa listeden düşer.`}
            </p>
            {cihazlar.length === 0 ? (
              <p className="kucuk ikincil">Tanınan cihaz yok.</p>
            ) : (
              <ul className="y-satirlar cihaz-listesi">
                {cihazlar.map((c) => (
                  <li key={c.kimlik}>
                    <span>
                      <strong>{c.ad}</strong>
                      {c.buCihaz && <span className="etiket">Bu cihaz</span>}
                      <br />
                      <span className="kucuk ikincil">
                        İlk doğrulama {tarihYaz(c.ilk, true)} · son giriş {tarihYaz(c.son, true)}
                      </span>
                    </span>
                    <CihazUnutDugmesi cihaz={c.kimlik} metin="Unut" />
                  </li>
                ))}
              </ul>
            )}
            {cihazlar.length > 1 && <CihazUnutDugmesi metin="Bütün cihazları unut" />}
          </section>
        )}

        <section className="profil-bolum">
          <h2 className="b3 kare-bas">Şifre</h2>
          <p className="kucuk">
            {siz
              ? 'Şifrenizi değiştirmek için e-posta adresinize bir bağlantı göndeririz. Şifre değişince tanınan cihazlar unutulur.'
              : 'Şifreni değiştirmek için e-posta adresine bir bağlantı göndeririz.'}
          </p>
          <Link className="dugme dugme--ikincil dugme--kucuk" href="/sifremi-unuttum">
            Şifremi değiştir
          </Link>
        </section>
      </main>
    </>
  )
}
