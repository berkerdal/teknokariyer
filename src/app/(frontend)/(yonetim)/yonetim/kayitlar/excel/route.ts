/** İşlem kayıtlarının Excel çıktısı (ekrandaki süzgeçle, en fazla 10.000 satır). Yalnızca tam yetkili; dışa aktarma kayda geçer. */
import { yoneticiMi } from '@/erisim'
import { excelOlustur } from '@/altyapi/excel'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { istekOlustur } from '@/servisler/ortak'
import { islemKayitlariHepsi } from '@/veri/islemKayitlari'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

const ZAMAN = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Istanbul' })

export async function GET(istek: Request) {
  const k = await oturum()
  if (!k || !yoneticiMi(k)) return new Response('İşlem kayıtlarını yalnızca tam yetkili Yönetici A.Ş. kullanıcıları indirebilir.', { status: 403 })
  const p = new URL(istek.url).searchParams
  const suzgec = { q: p.get('q') ?? '', tur: p.get('tur') ?? '', bas: p.get('bas') ?? '', bit: p.get('bit') ?? '' }
  const satirlar = await islemKayitlariHepsi(suzgec)
  const dosya = excelOlustur([
    {
      ad: 'İşlem kayıtları',
      baslikli: true,
      satirlar: [['Zaman', 'Kim', 'İşlem', 'Tür', 'Kayıt', 'Ayrıntı'], ...satirlar.map((s) => [ZAMAN.format(new Date(s.zaman)), s.kim, s.islem, s.turAdi, s.kayit ?? '', s.ayrinti])],
    },
  ])
  await islemKaydet(await istekOlustur(await payloadAl(), k as never), { islem: 'İşlem kayıtları dışa aktarıldı', tur: 'kisisel-veri', ayrinti: { satir: satirlar.length, suzgec } })
  return new Response(dosya as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="islem-kayitlari-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
