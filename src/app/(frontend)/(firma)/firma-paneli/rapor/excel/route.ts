/** Firma raporunun Excel çıktısı (yalnızca kendi firmasının verisi). */
import { firmaKullanicisiMi } from '@/erisim'
import { excelOlustur } from '@/altyapi/excel'
import { adresAdi } from '@/alan/kurulum'
import { raporDonemi } from '@/alan/raporDonemi'
import { firmaRaporuHazirla } from '@/veri/firmaRaporu'
import { oturum } from '@/veri/payload'
import { raporSayfalari } from '@/veri/raporlar'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request) {
  const k = await oturum()
  if (!k || !firmaKullanicisiMi(k)) return new Response('Raporu yalnızca firma kullanıcıları indirebilir.', { status: 403 })
  const p = new URL(istek.url).searchParams
  const d = raporDonemi(p.get('donem') ?? undefined, p.get('bas') ?? undefined, p.get('bit') ?? undefined)
  if ('hata' in d) return new Response(d.hata, { status: 400 })
  const r = await firmaRaporuHazirla(k, d)
  if (!r) return new Response('Rapor bulunamadı.', { status: 404 })
  return new Response(excelOlustur(raporSayfalari(r, 'TeknoKariyer · Pamukkale Teknokent')) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${adresAdi(r.ad)}-${adresAdi(r.donem)}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
