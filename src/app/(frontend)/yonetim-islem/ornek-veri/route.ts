/**
 * Test ortamına örnek veri yükler (K13). Yalnızca Yönetici A.Ş. yöneticisi çağırabilir; yayın ortamında kapalıdır.
 * Tekrar çağrılabilir: var olan kayıtlar yeniden oluşturulmaz.
 */
import { yoneticiMi } from '@/erisim'
import { ortam } from '@/altyapi/eposta'
import { ornekVeriYukle } from '@/ornekVeri/yukle'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (ortam() === 'yayin') return Response.json({ hata: 'Yayın ortamında örnek veri yüklenmez.' }, { status: 404 })
  const k = await oturum()
  if (!k || !yoneticiMi(k)) return Response.json({ hata: 'Bu işlem yalnızca Yönetici A.Ş. yöneticisine açık.' }, { status: 403 })
  const sonuc = await ornekVeriYukle(await payloadAl())
  return Response.json({ tamam: true, ...sonuc })
}
