import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { tarihYaz } from '@/arayuz/bicim'
import { IkiAdimKapatFormu, KurtarmaYenileFormu } from '@/arayuz/hesap/IkiAdimFormlari'
import { Ust } from '@/arayuz/Ust'
import { ikiAdimDurumu } from '@/servisler/ikiAdim'
import { rolAnaSayfasi } from '@/veri/cerez'
import { oturum, payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Hesap güvenliği', robots: { index: false } }

type Props = { searchParams: Promise<{ kurtarma?: string; sonuc?: string }> }

const SONUC: Record<string, string> = {
  kuruldu: 'İki aşamalı doğrulama açıldı. Bundan sonra girişte uygulamadaki kod da istenecek.',
  yenilendi: 'Yeni kurtarma kodları oluşturuldu; eski kodlar artık geçersiz.',
  kapatildi: 'İki aşamalı doğrulama kapatıldı.',
}

/** İki aşamalı doğrulamanın durumu, kurtarma kodları; adayda aç/kapat. Her rol için ortak sayfa. */
export default async function HesapGuvenligi({ searchParams }: Props) {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi')
  const sp = await searchParams
  const d = await ikiAdimDurumu(await payloadAl(), Number(k.id))
  const siz = k.rol !== 'aday'
  const kalan = sp.kurtarma !== undefined ? Number(sp.kurtarma) : null
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <Link className="geri kucuk" href={rolAnaSayfasi(String(k.rol))}>
          {k.rol === 'aday' ? 'Hesabım' : k.rol === 'firma' ? 'Firma paneli' : 'Yönetim paneli'}
        </Link>
        <h1 className="b1">Hesap güvenliği</h1>
        {kalan !== null && (
          <p className={kalan <= 3 ? 'uyari-kutu' : 'basari-kutu'} role="status">
            {siz ? `Kurtarma koduyla giriş yaptınız; ${kalan} kodunuz kaldı.` : `Kurtarma koduyla giriş yaptın; ${kalan} kodun kaldı.`}{' '}
            {kalan <= 3 && (siz ? 'Aşağıdan yeni kodlar oluşturun. Telefonunuzu kaybettiyseniz doğrulamanızın sıfırlanmasını isteyin.' : 'Aşağıdan yeni kodlar oluştur.')}
          </p>
        )}
        {sp.sonuc && SONUC[sp.sonuc] && (
          <p className="basari-kutu" role="status">
            {SONUC[sp.sonuc]}
          </p>
        )}

        <section className="profil-bolum">
          <h2 className="b3 kare-bas">İki aşamalı doğrulama</h2>
          {d.kurulu ? (
            <>
              <dl className="ozet-dl">
                <div>
                  <dt>Durum</dt>
                  <dd>Açık{d.kurulumTarihi ? ` · ${tarihYaz(d.kurulumTarihi, true)} tarihinde kuruldu` : ''}</dd>
                </div>
                <div>
                  <dt>Kurtarma kodu</dt>
                  <dd>{d.kalanKurtarma} kullanılmamış kod</dd>
                </div>
              </dl>
              <p className="kucuk ikincil">
                {siz
                  ? 'Girişte şifrenize ek olarak doğrulayıcı uygulamadaki kod istenir. Telefonunuzu değiştirecekseniz önce doğrulamanızın sıfırlanmasını isteyin; yeni telefonda bir sonraki girişte yeniden kurarsınız.'
                  : 'Girişte şifrene ek olarak doğrulayıcı uygulamadaki kod istenir.'}
              </p>
              <h3 className="b4">Yeni kurtarma kodları</h3>
              <p className="kucuk">{siz ? 'Yeni kodlar oluşturduğunuzda eski kodlar geçersiz olur.' : 'Yeni kodlar oluşturduğunda eski kodlar geçersiz olur.'}</p>
              <KurtarmaYenileFormu siz={siz} />
              {!d.zorunlu && (
                <>
                  <h3 className="b4">Kapat</h3>
                  <p className="kucuk">Kapatırsan girişte yalnızca şifren istenir.</p>
                  <IkiAdimKapatFormu />
                </>
              )}
            </>
          ) : d.zorunlu ? (
            <p>Bu hesapta iki aşamalı doğrulama zorunludur ve bir sonraki girişte kurulacak.</p>
          ) : (
            <>
              <p>
                İstersen şifrene ek olarak telefonundaki bir doğrulayıcı uygulamanın ürettiği kodu da isteyebiliriz. Böylece şifren başkasının eline geçse bile hesabına
                girilemez.
              </p>
              <Link className="dugme" href="/hesap-guvenligi/kur">
                İki aşamalı doğrulamayı aç
              </Link>
            </>
          )}
        </section>

        <section className="profil-bolum">
          <h2 className="b3 kare-bas">Şifre</h2>
          <p className="kucuk">{siz ? 'Şifrenizi değiştirmek için e-posta adresinize bir bağlantı göndeririz.' : 'Şifreni değiştirmek için e-posta adresine bir bağlantı göndeririz.'}</p>
          <Link className="dugme dugme--ikincil dugme--kucuk" href="/sifremi-unuttum">
            Şifremi değiştir
          </Link>
        </section>
      </main>
    </>
  )
}
