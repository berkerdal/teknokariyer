/**
 * İşlem kaydı (talimatlar 10, 16): kim neyi ne zaman değiştirdi; kişisel veriye her erişim.
 * Kayıtlar yalnızca eklenir. Koleksiyonun güncelleme ve silme erişimi kapalıdır.
 */
import type { PayloadRequest } from 'payload'
import { kullanici } from '../erisim'

export type IslemTuru = 'kisisel-veri' | 'ilan' | 'moderasyon' | 'kurulum' | 'ayarlar' | 'hesap' | 'basvuru'

export async function islemKaydet(
  req: PayloadRequest,
  kayit: { islem: string; tur: IslemTuru; kayitTuru?: string; kayitId?: string | number; ayrinti?: unknown },
): Promise<void> {
  const k = kullanici(req)
  await req.payload.create({
    collection: 'islem-kayitlari',
    overrideAccess: true,
    req, // aynı işlem (transaction) içinde yazılsın
    data: {
      islem: kayit.islem,
      tur: kayit.tur,
      kim: k ? Number(k.id) || (k.id as never) : undefined,
      kayitTuru: kayit.kayitTuru,
      kayitId: kayit.kayitId !== undefined ? String(kayit.kayitId) : undefined,
      ayrinti: (kayit.ayrinti ?? null) as never,
    },
  })
}
