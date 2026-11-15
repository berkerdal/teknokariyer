/** Havuzdaki adayın sertifika belgesi (firma). PDF'e filigran eklenir; açılış kayda geçer. */
import { havuzBelgesi } from '@/servisler/havuz'
import { belgeYaniti } from '@/veri/belgeYaniti'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request, { params }: { params: Promise<{ id: string; dosya: string }> }) {
  const k = await oturum()
  if (!k) return new Response('Bu belgeyi açmak için firma hesabınızla giriş yapın.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  const { id, dosya } = await params
  return belgeYaniti(istek, async () => havuzBelgesi(await payloadAl(), k, Number(id), Number(dosya)))
}
