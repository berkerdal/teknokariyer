/**
 * Firma logosu (K37): `/firma-logosu/<dosya kimliği>`. Yalnızca `logo` türündeki görseller sunulur; CV ve diğer
 * dosyalar bu adresten hiçbir zaman verilmez. Adres her yüklemede değiştiği için yanıt bir yıl “değişmez” olarak
 * önbelleklenir: Cloudflare'in kenar sunucuları ve tarayıcı logoyu tekrar istemez (CDN işlevi; ayrı alt alan gerekmez).
 */
import { dosyaIcerigi } from '@/altyapi/depolama'
import { payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

const GORSEL = ['image/png', 'image/jpeg', 'image/webp']

const bulunamadi = () => new Response('Logo bulunamadı.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{1,12}$/.test(id)) return bulunamadi()
  const payload = await payloadAl()
  const dosya = await payload.findByID({ collection: 'dosyalar', id: Number(id), depth: 0, overrideAccess: true, disableErrors: true })
  if (!dosya || dosya.tur !== 'logo' || !dosya.filename || !GORSEL.includes(dosya.mimeType ?? '')) return bulunamadi()
  const icerik = await dosyaIcerigi(dosya.filename)
  if (!icerik) return bulunamadi()
  return new Response(icerik as unknown as BodyInit, {
    headers: {
      'Content-Type': dosya.mimeType!,
      'Content-Length': String(icerik.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Content-Disposition': `inline; filename="${dosya.filename}"`,
    },
  })
}
