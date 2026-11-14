/** Yönetici özetindeki ilan tablosu, Excel'de açılan CSV olarak (aynı süzgeç ve dönemle). Kişisel veri içermez. */
import { kurumKullanicisiMi } from '@/erisim'
import { DURUM_ADI } from '@/alan/ilan'
import { donem } from '@/alan/ozet'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { istekOlustur } from '@/servisler/ortak'
import { ozetVerisi } from '@/veri/ozet'
import { tabloyuSuz } from '@/veri/ozetTablo'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

const hucre = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`
const tarih = (iso: string | null) => (iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' }).format(new Date(iso)) : '')

export async function GET(istek: Request) {
  const k = await oturum()
  if (!k || !kurumKullanicisiMi(k)) return new Response('Bu dosyayı yalnızca Yönetici A.Ş. indirebilir.', { status: 403 })
  const p = new URL(istek.url).searchParams
  const d = donem(p.get('donem') ?? undefined)
  const v = await ozetVerisi(d)
  const satirlar = tabloyuSuz(v.tablo, { durum: p.get('durum') ?? '', ara: p.get('ara') ?? '', sirala: p.get('sirala') ?? '', yon: p.get('yon') ?? '' })
  const govde = [
    ['İlan', 'Firma', 'Durum', 'Yayın tarihi', 'Kalan gün', 'Görüntülenme', 'Toplam başvuru', 'İncelenmemiş', `Başvuru (${d.ad.toLocaleLowerCase('tr')})`, 'Son başvuru alındı'],
    ...satirlar.map((i) => [i.pozisyonAdi, i.firma, DURUM_ADI[i.durum], tarih(i.yayinTarihi), i.kalan ?? '', i.goruntulenme, i.basvuru, i.yeni, i.donemBasvuru, tarih(i.sonBasvuruAni)]),
  ]
  await islemKaydet(await istekOlustur(await payloadAl(), k), { islem: 'Yönetici özeti ilan tablosu indirildi', tur: 'ayarlar', ayrinti: { satir: satirlar.length, donem: d.kod } })
  return new Response('﻿' + govde.map((s) => s.map(hucre).join(';')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ilanlar-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
