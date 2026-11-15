import type { Metadata } from 'next'
import Link from 'next/link'
import { Ust } from '@/arayuz/Ust'
import { epostaDogrulaEylemi } from '@/eylemler/hesap'

export const metadata: Metadata = { title: 'E-posta doğrulama', robots: { index: false }, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | undefined>> }

/**
 * E-posta doğrulama. Bağlantı açılınca hiçbir şey değişmez; aday düğmeye basınca doğrulanır (eylem POST ile).
 * Kurumsal e-posta tarayıcıları (ör. bağlantı güvenliği denetimi) bağlantıyı önceden açtığında anahtar tüketilmez.
 */
export default async function DogrulaSayfasi({ searchParams }: Props) {
  const sp = await searchParams
  const anahtar = sp.anahtar ?? ''
  const gecersiz = sp.gecersiz === '1' || !/^[0-9a-f]{20,128}$/i.test(anahtar)
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        {gecersiz ? (
          <>
            <h1 className="b1">Bağlantı geçersiz</h1>
            <p>Bu doğrulama bağlantısı daha önce kullanılmış ya da eksik kopyalanmış olabilir. Adresin zaten doğrulandıysa giriş yapabilirsin.</p>
            <p>
              <Link className="dugme" href="/giris">
                Giriş yap
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="b1">E-posta adresini doğrula</h1>
            <p>Hesabını kullanmaya başlamak için aşağıdaki düğmeye bas. Ardından giriş sayfasına yönlendirileceksin.</p>
            <form action={epostaDogrulaEylemi}>
              <input type="hidden" name="anahtar" value={anahtar} />
              <button type="submit" className="dugme">
                E-posta adresimi doğrula
              </button>
            </form>
          </>
        )}
      </main>
    </>
  )
}
