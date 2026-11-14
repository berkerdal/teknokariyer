import type { Metadata } from 'next'
import Link from 'next/link'
import { DavetKabulFormu } from '@/arayuz/hesap/SifreFormlari'
import { Ust } from '@/arayuz/Ust'
import { davetiBul } from '@/servisler/ekip'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Ekip daveti', robots: { index: false } }

type Props = { searchParams: Promise<{ anahtar?: string }> }

const HATA: Record<string, { baslik: string; metin: string }> = {
  yok: { baslik: 'Davet bağlantısı geçersiz', metin: 'Bağlantıyı e-postadan eksiksiz kopyaladığınızdan emin olun. Sorun sürerse sizi davet eden kişiden daveti yeniden göndermesini isteyin.' },
  kullanildi: { baslik: 'Bu davet daha önce kabul edildi', metin: 'Hesabınız açılmış. Giriş sayfasından e-posta adresiniz ve şifrenizle giriş yapabilirsiniz.' },
  'suresi-doldu': { baslik: 'Davetin süresi dolmuş', metin: 'Davet bağlantıları 14 gün geçerlidir. Sizi davet eden kişiden daveti yeniden göndermesini isteyin.' },
}

/** Firma ekibine davet: kişi bağlantıyı açar, şifresini belirler ve firma paneline girer. */
export default async function Davet({ searchParams }: Props) {
  const { anahtar = '' } = await searchParams
  const b = await davetiBul(await payloadAl(), anahtar)
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <div className="giris-kutu form-yigin">
          {'hata' in b ? (
            <>
              <h1 className="b2">{HATA[b.hata]!.baslik}</h1>
              <p>{HATA[b.hata]!.metin}</p>
              <p>
                <Link className="dugme dugme--ikincil" href="/giris?firma=1">
                  Firma girişi
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="ust-etiket">Ekip daveti</p>
              <h1 className="b2">{b.firmaAd} ekibine katılın</h1>
              <p>
                <strong>{b.davet.eposta}</strong> adresi için bir hesap açılacak. Şifrenizi belirlediğinizde firma paneline girersiniz.
              </p>
              <DavetKabulFormu anahtar={anahtar} ad={b.davet.ad} />
            </>
          )}
        </div>
      </main>
    </>
  )
}
