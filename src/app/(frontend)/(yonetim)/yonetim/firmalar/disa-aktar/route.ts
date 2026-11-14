/**
 * Yetkili e-postası eksik iskelet firmaların listesi (telefonla tamamlamak için; talimatlar 0.3, 2).
 * Excel'in Türkçe ayarında doğrudan açılsın diye noktalı virgülle ayrılmış, BOM'lu UTF-8 CSV.
 * Kişisel veri içermez: yetkili adı ve e-postası listeye yazılmaz, yalnızca neyin eksik olduğu yazılır.
 */
import { kurumKullanicisiMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { istekOlustur } from '@/servisler/ortak'
import { kurulumOzeti } from '@/veri/firmaYonetimi'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

const hucre = (s: string) => `"${s.replace(/"/g, '""')}"`

export async function GET() {
  const k = await oturum()
  if (!k || !kurumKullanicisiMi(k)) return new Response('Bu listeyi yalnızca Yönetici A.Ş. indirebilir.', { status: 403 })
  const payload = await payloadAl()
  const { yetkiliEksik } = await kurulumOzeti()
  const firmalar = await payload.find({ collection: 'firmalar', where: { id: { in: yetkiliEksik.map((f) => f.id) } }, select: { unvan: true, kisaAd: true, konum: true, web: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })
  const satirlar = [
    ['Kısa ad', 'Unvan', 'Teknokent’teki yeri', 'Web sitesi', 'Eksik'],
    ...firmalar.docs.map((f) => {
      const e = yetkiliEksik.find((x) => x.id === f.id)
      return [f.kisaAd, f.unvan, f.konum, f.web ?? '', e?.yetkili === 'genel' ? 'Yetkili e-postası genel bir kutu (info@ gibi)' : 'Yetkili adı veya e-postası yok']
    }),
  ]
  await islemKaydet(await istekOlustur(payload, k), { islem: 'Yetkilisi eksik firmalar listesi indirildi', tur: 'kurulum', ayrinti: { adet: firmalar.docs.length } })
  const govde = '﻿' + satirlar.map((s) => s.map(hucre).join(';')).join('\r\n')
  const gun = new Date().toISOString().slice(0, 10)
  return new Response(govde, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="yetkilisi-eksik-firmalar-${gun}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
