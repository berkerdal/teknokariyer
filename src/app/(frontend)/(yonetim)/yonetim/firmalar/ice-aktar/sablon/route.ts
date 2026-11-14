/** İçe aktarma şablonu: Excel'in Türkçe ayarında doğrudan açılan, noktalı virgüllü ve BOM'lu UTF-8 CSV. */
import { kurumKullanicisiMi } from '@/erisim'
import { SABLON_BASLIKLARI, SABLON_ORNEK } from '@/alan/iceAktarma'
import { oturum } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const k = await oturum()
  if (!k || !kurumKullanicisiMi(k)) return new Response('Bu dosyayı yalnızca Yönetici A.Ş. indirebilir.', { status: 403 })
  const hucre = (s: string) => `"${s.replace(/"/g, '""')}"`
  const govde = '﻿' + [SABLON_BASLIKLARI, SABLON_ORNEK].map((s) => s.map(hucre).join(';')).join('\r\n') + '\r\n'
  return new Response(govde, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="firma-iceaktarma-sablonu.csv"', 'Cache-Control': 'no-store' },
  })
}
