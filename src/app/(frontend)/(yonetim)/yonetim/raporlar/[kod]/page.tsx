import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { raporDonemi } from '@/alan/raporDonemi'
import { trGunMetni } from '@/alan/tarih'
import { Ikon } from '@/arayuz/Ikon'
import { DonemSecimi, YazdirDugmesi } from '@/arayuz/yonetim/Raporlar'
import { RaporGovdesi } from '@/arayuz/RaporGovdesi'
import { RAPORLAR, raporHazirla } from '@/veri/raporlar'
import { yonetimOturumu } from '@/veri/yonetim'

type Props = { params: Promise<{ kod: string }>; searchParams: Promise<{ donem?: string; bas?: string; bit?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params
  return { title: `${RAPORLAR.find((r) => r.kod === kod)?.ad ?? 'Rapor'} · Yönetim` }
}

const SAAT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

export default async function RaporSayfasi({ params, searchParams }: Props) {
  const { kod } = await params
  await yonetimOturumu(`/yonetim/raporlar/${kod}`)
  if (!RAPORLAR.some((r) => r.kod === kod)) notFound()
  const sp = await searchParams
  const d = raporDonemi(sp.donem, sp.bas, sp.bit)
  const bugun = trGunMetni(new Date())
  if ('hata' in d)
    return (
      <>
        <h1 className="b1">{RAPORLAR.find((r) => r.kod === kod)!.ad}</h1>
        <p className="hata-metni" role="alert">
          {d.hata}
        </p>
        <DonemSecimi eylem={`/yonetim/raporlar/${kod}`} deger={sp.donem ?? 'bu-ay'} bas={sp.bas} bit={sp.bit} bugun={bugun} />
      </>
    )
  const r = (await raporHazirla(kod, d))!
  const sorgu = `?${new URLSearchParams(d.sorgu)}`
  return (
    <article className="rapor">
      <div className="y-bas rapor-eylemler">
        <Link className="geri kucuk" href={`/yonetim/raporlar${sorgu}`}>
          <Ikon ad="geri" kucuk /> Raporlar
        </Link>
        <p className="dugme-grubu">
          <a className="dugme dugme--kucuk" href={`/yonetim/raporlar/${kod}/excel${sorgu}`} download>
            <Ikon ad="indir" kucuk /> Excel olarak indir
          </a>
          <YazdirDugmesi />
        </p>
      </div>
      <header className="rapor-bas">
        <img className="rapor-logo" src="/logo/logo-yatay-renkli.svg" alt="TeknoKariyer" width={180} height={32} />
        <h1 className="b1">{r.ad}</h1>
        <p>
          <strong>Dönem:</strong> {r.donem}
        </p>
        <p className="kucuk ikincil">
          {r.amac} Rapor {SAAT.format(new Date(r.olusturma))} tarihinde, o anki kayıtlardan hesaplandı. Pamukkale Teknokent Yönetici A.Ş.
        </p>
      </header>
      <section className="panel panel-ic rapor-eylemler">
        <DonemSecimi eylem={`/yonetim/raporlar/${kod}`} deger={d.kod} bas={sp.bas} bit={sp.bit} bugun={bugun} />
      </section>
      <RaporGovdesi rapor={r} />
    </article>
  )
}
