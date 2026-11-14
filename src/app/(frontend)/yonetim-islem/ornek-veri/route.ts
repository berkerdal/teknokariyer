/**
 * Test ortamına örnek veri yükler (K13). Yayın ortamında kapalıdır. Tekrar çağrılabilir: var olan kayıtlar yeniden
 * oluşturulmaz, yarıda kalanlar tamamlanır.
 *
 * Yetki: Yönetici A.Ş. yöneticisi oturumu VEYA `x-ornek-anahtar` başlığı. Anahtar yalnızca Worker gizli değişkeni
 * `ORNEK_ANAHTAR` tanımlıysa çalışır; değeri depoda ve hiçbir yerde yazılı değildir (API ile yazılır, işten sonra silinir).
 */
import { yoneticiMi } from '@/erisim'
import { ortam } from '@/altyapi/eposta'
import { ornekVeriYukle } from '@/ornekVeri/yukle'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

/** Sabit süreli karşılaştırma: anahtarın ne kadarının doğru olduğu yanıt süresinden anlaşılmasın. */
function esit(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let fark = 0
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return fark === 0
}

export async function POST(istek: Request) {
  if (ortam() === 'yayin') return Response.json({ hata: 'Yayın ortamında örnek veri yüklenmez.' }, { status: 404 })
  const anahtar = process.env.ORNEK_ANAHTAR
  const verilen = istek.headers.get('x-ornek-anahtar') ?? ''
  const anahtarla = Boolean(anahtar && anahtar.length >= 32 && verilen && esit(verilen, anahtar))
  if (!anahtarla) {
    const k = await oturum()
    if (!k || !yoneticiMi(k)) return Response.json({ hata: 'Bu işlem yalnızca Yönetici A.Ş. yöneticisine açık.' }, { status: 403 })
  }
  const sonuc = await ornekVeriYukle(await payloadAl())
  return Response.json({ tamam: true, ...sonuc })
}
