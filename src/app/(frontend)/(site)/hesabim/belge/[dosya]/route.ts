/** Adayın kendi sertifika belgesi. Yalnızca belgenin sahibi açabilir (src/servisler/sertifika.ts → adayBelgesi). */
import { adayBelgesi } from '@/servisler/sertifika'
import { belgeYaniti } from '@/veri/belgeYaniti'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request, { params }: { params: Promise<{ dosya: string }> }) {
  const k = await oturum()
  const { dosya } = await params
  return belgeYaniti(istek, async () => adayBelgesi(await payloadAl(), k, Number(dosya)))
}
