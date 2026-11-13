import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Ust } from '@/arayuz/Ust'
import { epostaDogrula } from '@/servisler/hesap'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'E-posta doğrulama', robots: { index: false }, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function DogrulaSayfasi({ searchParams }: Props) {
  const anahtar = (await searchParams).anahtar ?? ''
  if (await epostaDogrula(await payloadAl(), anahtar)) redirect('/giris?dogrulandi=1')
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <h1 className="b1">Bağlantı geçersiz</h1>
        <p>Bu doğrulama bağlantısı daha önce kullanılmış ya da eksik kopyalanmış olabilir. Adresin zaten doğrulandıysa giriş yapabilirsin.</p>
        <p>
          <Link className="dugme" href="/giris">
            Giriş yap
          </Link>
        </p>
      </main>
    </>
  )
}
