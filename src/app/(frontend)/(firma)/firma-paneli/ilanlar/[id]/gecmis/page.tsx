import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { surumFarklari } from '@/alan/ilanGecmisi'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { tarihYaz } from '@/arayuz/bicim'
import { firmaIlani, firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Sürüm geçmişi · Firma paneli' }

const SAAT = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

/** İlanın her kaydı bir sürümdür. Yeniden eskiye, değişen alanlarla listelenir. */
export default async function SurumGecmisi({ params }: Props) {
  const { id } = await params
  await firmaOturumu(`/firma-paneli/ilanlar/${id}/gecmis`)
  const ilan = await firmaIlani(Number(id)) // kiracı ayrımı: başka firmanın ilanı burada bulunamaz
  if (!ilan) notFound()
  const payload = await payloadAl()
  const { docs } = await payload.findVersions({
    collection: 'ilanlar',
    where: { parent: { equals: ilan.id } },
    sort: 'createdAt',
    depth: 0,
    limit: 50,
    overrideAccess: true, // sahiplik yukarıda denetlendi
  })
  const satirlar = docs
    .map((v, n) => ({
      id: v.id,
      tarih: v.createdAt,
      farklar: surumFarklari(n === 0 ? null : (docs[n - 1]!.version as unknown as Record<string, unknown>), v.version as unknown as Record<string, unknown>, (s) =>
        tarihYaz(s, true),
      ),
    }))
    .filter((s) => s.farklar.length > 0)
    .reverse()

  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href={`/firma-paneli/ilanlar/${ilan.id}`}>
            <Ikon ad="geri" kucuk /> İlana dön
          </Link>
          <h1 className="b1">Sürüm geçmişi</h1>
          <p className="ikincil">{ilan.pozisyonAdi}</p>
        </div>
      </div>
      <ModulBilgisi kimlik="firma-ilan-gecmis" baslik="Sürüm geçmişi neyi gösterir?">
        <p>
          İlanı her kaydedişinizde ve ilanın durumu her değiştiğinde yeni bir sürüm oluşur. Burada hangi gün, hangi alanların değiştiğini
          görürsünüz. Kısa alanlarda eski ve yeni değer yazar; uzun metinlerde yalnızca değiştiği belirtilir. Son 50 sürüm saklanır.
        </p>
      </ModulBilgisi>
      {satirlar.length === 0 ? (
        <p className="ikincil">Bu ilan için henüz kayıtlı bir sürüm yok.</p>
      ) : (
        <ol className="gecmis-listesi">
          {satirlar.map((s) => (
            <li key={s.id} className="panel">
              <p className="ust-etiket">{SAAT.format(new Date(s.tarih))}</p>
              <ul>
                {s.farklar.map((f) => (
                  <li key={f.alan}>
                    <strong>{f.ad}</strong>
                    {f.once !== undefined && (
                      <>
                        : {f.once} <span aria-label="yerine">→</span> {f.sonra}
                      </>
                    )}
                    {f.once === undefined && f.alan !== 'olusturma' && ' değişti'}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
