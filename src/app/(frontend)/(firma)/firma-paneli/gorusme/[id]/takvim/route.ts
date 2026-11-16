/** Kesinleşmiş görüşmenin takvim dosyası (.ics). Erişim servis içinde denetlenir (src/servisler/gorusme.ts). */
import { takvimYaniti } from '@/altyapi/takvimYaniti'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return takvimYaniti((await params).id)
}
