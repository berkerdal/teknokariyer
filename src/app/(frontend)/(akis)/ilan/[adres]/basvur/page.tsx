import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { adayMi } from '@/erisim'
import { ilgiEki } from '@/alan/metin'
import { suresiDolduMu } from '@/alan/ilan'
import { BasvuruAkisi } from '@/arayuz/aday/BasvuruAkisi'
import { Ust } from '@/arayuz/Ust'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { METINLER } from '@/metinler'
import { EN_FAZLA_CV } from '@/servisler/profil'
import { basvuruHazirligi, taksonomiSecenekleri } from '@/veri/basvuru'
import { oturum } from '@/veri/payload'
import { firmalariAl } from '@/veri/ilanlar'
import { kimlik } from '@/servisler/ortak'

export const metadata: Metadata = { title: 'Başvuru', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ adres: string }> }

const boyut = (b?: number) => (b ? `${(b / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB` : '')

export default async function BasvuruSayfasi({ params }: Props) {
  const { adres } = await params
  const id = Number(adres.match(/^(\d+)/)?.[1])
  if (!id) notFound()
  const k = await oturum()
  if (!k) redirect(`/giris?donus=${encodeURIComponent(`/ilan/${adres}/basvur`)}`)
  if (!adayMi(k))
    return (
      <Bilgi baslik="Başvuru aday hesabıyla yapılır">
        Firma veya Yönetici A.Ş. hesabıyla ilana başvurulamaz. Aday olarak başvurmak için çıkış yapıp aday hesabınla giriş yap.
      </Bilgi>
    )

  const h = await basvuruHazirligi(k, id)
  if (!h) notFound()
  const { ilan, aday } = h
  const firma = (await firmalariAl([kimlik(ilan.firma)])).get(kimlik(ilan.firma))
  const adresi = ilanAdresi(ilan)
  if (ilan.durum !== 'yayinda' || suresiDolduMu(new Date(ilan.sonBasvuru), new Date())) redirect(adresi)
  if (h.oncekiBasvuru)
    return (
      <Bilgi baslik="Bu ilana başvurdun">
        {tarihYaz(h.oncekiBasvuru.createdAt, true)} tarihinde başvurdun. Durumunu “Başvurularım” sayfasından izleyebilirsin.{' '}
        <Link href="/hesabim">Başvurularıma git</Link>
      </Bilgi>
    )

  const [okullar, bolumler] = await Promise.all([
    h.eksikler.includes('okul') ? taksonomiSecenekleri('universite') : [],
    h.eksikler.includes('bolum') ? taksonomiSecenekleri('bolum') : [],
  ])
  const ad = (x: unknown) => (x && typeof x === 'object' ? (x as { ad?: string }).ad : undefined)
  const firmaAd = firma?.ad ?? ''
  return (
    <BasvuruAkisi
      ilan={{ id: ilan.id, pozisyonAdi: ilan.pozisyonAdi, firmaAd, firmaAdIlgi: `${firmaAd}${ilgiEki(firmaAd)}`, adres: adresi }}
      sorular={(ilan.onElemeSorulari ?? []).map((s, n) => ({ id: s.id ?? String(n), soru: s.soru, tip: s.tip, secenekler: (s.secenekler ?? []).map((x) => x.ad) }))}
      eksikler={h.eksikler}
      okullar={okullar}
      bolumler={bolumler}
      dilSartlari={h.dilSartlari}
      cvler={h.cvler.map((c) => ({ id: c.id, ad: c.ad, bilgi: [boyut(c.boyut), c.tarih ? `${tarihYaz(c.tarih)} yüklendi` : ''].filter(Boolean).join(' · ') }))}
      enFazlaCv={EN_FAZLA_CV}
      profilOzeti={{ ad: k.ad ?? '', satir: [ad(aday.bolum), ad(aday.okul), aday.sinif].filter(Boolean).join(', '), eposta: k.email }}
      aydinlatma={{ surum: METINLER['basvuru-aydinlatma'].surum, tarih: tarihYaz(METINLER['basvuru-aydinlatma'].tarih, true) }}
      havuzMetni={{ surum: METINLER.havuz.surum }}
      havuzda={Boolean(aday.havuz?.rizaTarihi) && aday.havuz?.gorunurluk !== 'gizli'}
    />
  )
}

function Bilgi({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <>
    <Ust />
    <main id="icerik" className="sayfa-dar">
      <p>
        <Link className="geri" href="/ilanlar">
          İlanlara dön
        </Link>
      </p>
      <h1 className="b1">{baslik}</h1>
      <p>{children}</p>
    </main>
    </>
  )
}
