/** Bir KVKK başvurusu üzerine kişinin veri dökümü. Yalnızca tam yetkili; her indirme işlem kaydına yazılır. */
import { yoneticiMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { istekOlustur, kimlik } from '@/servisler/ortak'
import { adayVeriDokumu, dokumDosyaAdi } from '@/veri/adayDokumu'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await oturum()
  if (!k || !yoneticiMi(k)) return new Response('Bu dosyayı yalnızca tam yetkili Yönetici A.Ş. kullanıcıları indirebilir.', { status: 403 })
  const id = Number((await params).id)
  const payload = await payloadAl()
  const t = await payload.findByID({ collection: 'kvkk-talepleri', id, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!t?.kullanici) return new Response('Başvuru bulunamadı veya portaldaki bir hesaba bağlı değil.', { status: 404 })
  const veri = await adayVeriDokumu(payload, kimlik(t.kullanici))
  if (!veri) return new Response('Bağlı hesap bir aday hesabı değil.', { status: 404 })
  await islemKaydet(await istekOlustur(payload, k as never), { islem: 'KVKK başvurusu için veri dökümü indirildi', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: id })
  return new Response(JSON.stringify(veri, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dokumDosyaAdi()}"`,
      'Cache-Control': 'no-store',
    },
  })
}
