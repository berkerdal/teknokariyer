/**
 * Ön yüzün Payload erişimi. Yalnızca sunucuda (sunucu bileşenleri ve sunucu eylemleri) kullanılır.
 */
import { cache } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Kullanici } from '@/servisler/ortak'

export const payloadAl = () => getPayload({ config })

/** Bu isteğin oturumu (Payload çerezi). Oturum yoksa null. İstek başına bir kez çözülür. */
export const oturum = cache(async (): Promise<Kullanici | null> => {
  const payload = await payloadAl()
  const { user } = await payload.auth({ headers: await headers() })
  return (user as Kullanici | null) ?? null
})
