import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { KurulumAdimlari } from '@/arayuz/hesap/KurulumAdimlari'
import { Ust } from '@/arayuz/Ust'
import { kurulumBilgisi } from '@/servisler/ikiAdim'
import { oturum, payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'İki aşamalı doğrulamayı aç', robots: { index: false } }

/** Oturum açıkken kurulum (adayın isteğe bağlı olarak açması). Zaten kuruluysa güvenlik sayfasına döner. */
export default async function HesapKurulumSayfasi() {
  const k = await oturum()
  if (!k) redirect('/giris?donus=%2Fhesap-guvenligi%2Fkur')
  const { gizli, adres } = await kurulumBilgisi(await payloadAl(), Number(k.id)).catch(() => redirect('/hesap-guvenligi'))
  const siz = k.rol !== 'aday'
  return (
    <>
      <Ust />
      <main id="icerik" className="sayfa-dar">
        <Link className="geri kucuk" href="/hesap-guvenligi">
          Hesap güvenliği
        </Link>
        <h1 className="b1">{siz ? 'İki aşamalı doğrulamayı açın' : 'İki aşamalı doğrulamayı aç'}</h1>
        <KurulumAdimlari gizli={gizli} adres={adres} siz={siz} yer="hesap" />
      </main>
    </>
  )
}
