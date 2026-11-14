/**
 * Cloudflare girişi: D1 (veritabanı) + R2 (dosyalar).
 * Uyarlandığı yer: Payload'ın resmî "with-cloudflare-d1" şablonu (v3.93.0).
 * Cloudflare'e özgü kod yalnızca bu dosyada ve src/altyapi/ altında bulunur.
 */
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { r2Storage } from '@payloadcms/storage-r2'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { ortakYapilandirma } from './payload.ortak'
import { DOSYA_KOLEKSIYONLARI } from './koleksiyonlar'
import { migrations } from './migrations'

const gercekYol = (deger: string) => {
  try {
    return fs.existsSync(deger) ? fs.realpathSync(deger) : undefined
  } catch {
    return undefined
  }
}

// Payload komut satırı veya `next` derlemesi içinden mi çalışıyoruz?
const komutSatiri = process.argv.some((deger) => {
  const yol = gercekYol(deger)
  if (!yol) return false
  return yol.endsWith(path.join('payload', 'bin.js')) || yol.endsWith(path.join('next', 'dist', 'bin', 'next'))
})
const uretim = process.env.NODE_ENV === 'production'

// Workers üzerinde yapılandırılmış (JSON) günlük; Cloudflare günlüklerinde aranabilir.
const gunluk =
  (seviye: string, fn: typeof console.log) => (nesneVeyaMesaj: object | string, mesaj?: string) => {
    if (typeof nesneVeyaMesaj === 'string') fn(JSON.stringify({ level: seviye, msg: nesneVeyaMesaj }))
    else fn(JSON.stringify({ level: seviye, ...nesneVeyaMesaj, msg: mesaj ?? (nesneVeyaMesaj as { msg?: string }).msg }))
  }
const cloudflareGunlugu = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: gunluk('trace', console.debug),
  debug: gunluk('debug', console.debug),
  info: gunluk('info', console.log),
  warn: gunluk('warn', console.warn),
  error: gunluk('error', console.error),
  fatal: gunluk('fatal', console.error),
  silent: () => {},
} as any // Payload günlük tipi dışa aktarılınca değiştirilecek

// Gerçekten Workers içinde miyiz? Değilsek (derleme, komut satırı, yerel geliştirme) yerel Wrangler bağlamı kullanılır.
// OpenNext'in bağlam fonksiyonu derleme sırasında "remote" işaretli bağlantılar için Cloudflare'e bağlanmaya çalışıyor;
// bu yüzden yalnızca Workers içinde kullanılır.
const workersIcinde = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'
// `next build` sayfa bilgisini birkaç işlemle paralel toplar; her işlem yerel simülasyonu açarsa aynı SQLite dosyasında
// "database is locked" ile derleme rastgele düşer (Cloudflare derleme kaydı, 14.11.2026). Tüm sayfalar dinamik olduğu
// için derlemede veritabanına hiç gidilmez: bağlantılar boş bırakılır, yalnızca istek anında kullanılır.
const derlemeAsamasi = process.env.NEXT_PHASE === 'phase-production-build'
const cloudflare: Pick<CloudflareContext, 'env'> = workersIcinde
  ? await getCloudflareContext({ async: true })
  : derlemeAsamasi
    ? { env: {} as CloudflareContext['env'] }
    : await wranglerBaglami()
void komutSatiri

export default buildConfig(
  ortakYapilandirma({
    // Göçler Worker ilk açıldığında Cloudflare içinde çalışır (prodMigrations). Uzak bağlantı gerektirmez.
    // push kapalı: geliştirmede de şema yalnızca göçle değişir (D1'de push tablo yeniden kurup bağlı satırları silebilir).
    db: sqliteD1Adapter({ binding: cloudflare.env.D1, prodMigrations: migrations, push: false }),
    logger: uretim ? cloudflareGunlugu : undefined,
    eklentiler: [
      r2Storage({
        bucket: cloudflare.env.R2,
        collections: Object.fromEntries(DOSYA_KOLEKSIYONLARI.map((k) => [k, true])),
      }),
    ],
  }),
)

// Yerel geliştirmede D1 ve R2'yi Wrangler'ın yerel simülasyonu sağlar; Cloudflare hesabı gerekmez.
function wranglerBaglami(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(({ getPlatformProxy }) =>
    getPlatformProxy({
      environment: process.env.CLOUDFLARE_ENV,
      // Uzak (gerçek Cloudflare) bağlantı yalnızca dağıtım/göç komutlarında açılır: CLOUDFLARE_UZAK=1.
      // Derleme ve yerel geliştirme yerel simülasyonla çalışır; Cloudflare hesabı gerekmez.
      remoteBindings: process.env.CLOUDFLARE_UZAK === '1',
      // Testler geçici bir klasörde, geliştirme verisinden ayrı bir yerel veritabanı kullanır.
      ...(process.env.TK_YEREL_VERI ? { persist: { path: process.env.TK_YEREL_VERI } } : {}),
    } satisfies GetPlatformProxyOptions),
  )
}
