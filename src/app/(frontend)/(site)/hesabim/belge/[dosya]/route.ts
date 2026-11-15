/** Adayın kendi sertifika belgesi. Yalnızca belgenin sahibi açabilir. */
import { adayMi } from '@/erisim'
import { belgeHazirla } from '@/servisler/sertifika'
import { IslemHatasi } from '@/servisler/ortak'
import { belgeYaniti } from '@/veri/belgeYaniti'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request, { params }: { params: Promise<{ dosya: string }> }) {
  const k = await oturum()
  const { dosya } = await params
  return belgeYaniti(istek, async () => {
    if (!k || !adayMi(k)) throw new IslemHatasi('Belgeyi görmek için aday hesabınla giriş yap.', 403)
    const payload = await payloadAl()
    const d = await payload.findByID({ collection: 'dosyalar', id: Number(dosya), depth: 0, overrideAccess: true, disableErrors: true })
    if (!d || d.tur !== 'sertifika' || Number(typeof d.sahip === 'object' ? d.sahip?.id : d.sahip) !== Number(k.id)) throw new IslemHatasi('Belge bulunamadı.', 404)
    return belgeHazirla(payload, Number(dosya), null)
  })
}
