/** Takvim dosyası indirme yanıtı (aday ve firma uçları ortak). */
import { gorusmeTakvimDosyasi } from '@/servisler/gorusme'
import { IslemHatasi } from '@/servisler/ortak'
import { oturum, payloadAl } from '@/veri/payload'

const metinYaniti = (m: string, status: number) => new Response(m, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } })

export async function takvimYaniti(id: string): Promise<Response> {
  const k = await oturum()
  if (!k) return metinYaniti('Takvim dosyasını indirmek için giriş yapın.', 401)
  try {
    const ics = await gorusmeTakvimDosyasi(await payloadAl(), k, Number(id))
    return new Response(ics, {
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': 'attachment; filename="gorusme.ics"',
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    if (!(e instanceof IslemHatasi)) console.error(e)
    return metinYaniti(e instanceof IslemHatasi ? e.message : 'Takvim dosyası hazırlanamadı. Biraz sonra yeniden deneyin.', e instanceof IslemHatasi ? e.durumKodu : 500)
  }
}
