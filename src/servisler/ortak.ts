/**
 * Servis katmanı ortak yardımcıları.
 *
 * Servisler iş akışlarını sunucuda uygular: önce yetkiyi denetler, sonra kayıtları (gerekirse erişim kuralını aşarak)
 * günceller. Arayüz (sunucu eylemleri) yalnızca bu servisleri çağırır; kural mantığı arayüzde tekrarlanmaz.
 */
import type { Payload, PayloadRequest } from 'payload'
import type { Kullanicilar } from '@/payload-types'
import type { OturumKullanicisi } from '@/erisim'

/** Kullanıcıya gösterilecek, Türkçe ve çözüm öneren hata (sessiz hata yok; CLAUDE.md 5). */
export class IslemHatasi extends Error {
  constructor(
    message: string,
    public durumKodu: 400 | 403 | 404 | 409 = 400,
  ) {
    super(message)
    this.name = 'IslemHatasi'
  }
}

/** Alan hataları: anahtar alan adı, değer kullanıcıya gösterilecek Türkçe mesaj. */
export class FormHatasi extends IslemHatasi {
  constructor(public alanlar: Record<string, string>) {
    super(Object.values(alanlar)[0] ?? 'Formda hata var.', 400)
    this.name = 'FormHatasi'
  }
}

export type Kullanici = Kullanicilar & OturumKullanicisi

export const kimlik = (x: unknown): number =>
  Number(x && typeof x === 'object' ? (x as { id: number | string }).id : x)

/** Yerel API çağrılarına kullanıcıyı ve işlem kaydı için isteği taşıyan istek nesnesi. */
export async function istekOlustur(payload: Payload, kullanici: Kullanici | null): Promise<PayloadRequest> {
  const { createLocalReq } = await import('payload')
  return createLocalReq({ user: kullanici ? ({ ...kullanici, collection: 'kullanicilar' } as never) : undefined }, payload)
}

export async function ayarlar(payload: Payload) {
  return payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
}
