/** Raporun Excel (.xlsx) çıktısı: ilk sayfa tanımlar ve özet, sonra her tablo ayrı sayfa. İndirme işlem kaydına yazılır. */
import { kurumKullanicisiMi } from '@/erisim'
import { excelOlustur } from '@/altyapi/excel'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { raporDonemi } from '@/alan/raporDonemi'
import { adresAdi } from '@/alan/kurulum'
import { istekOlustur } from '@/servisler/ortak'
import { raporHazirla, raporSayfalari } from '@/veri/raporlar'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request, { params }: { params: Promise<{ kod: string }> }) {
  const k = await oturum()
  if (!k || !kurumKullanicisiMi(k)) return new Response('Raporları yalnızca Yönetici A.Ş. indirebilir.', { status: 403 })
  const { kod } = await params
  const p = new URL(istek.url).searchParams
  const d = raporDonemi(p.get('donem') ?? undefined, p.get('bas') ?? undefined, p.get('bit') ?? undefined)
  if ('hata' in d) return new Response(d.hata, { status: 400 })
  const r = await raporHazirla(kod, d)
  if (!r) return new Response('Rapor bulunamadı.', { status: 404 })
  const sayfalar = raporSayfalari(r, 'Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş.')
  await islemKaydet(await istekOlustur(await payloadAl(), k), { islem: `Rapor indirildi: ${r.ad}`, tur: 'ayarlar', ayrinti: { donem: r.donem } })
  const dosya = `${adresAdi(r.ad)}-${adresAdi(r.donem)}.xlsx`
  return new Response(excelOlustur(sayfalar) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${dosya}"`,
      'Cache-Control': 'no-store',
    },
  })
}
