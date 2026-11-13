/**
 * Sağlayıcıdan bağımsız Payload yapılandırması.
 *
 * Koleksiyonlar, dil, e-posta ve yönetim ayarları burada. Veritabanı ve dosya depolama seçimi iki ayrı giriş dosyasında:
 * - src/payload.config.ts       → Cloudflare (D1 + R2)
 * - src/payload.config.node.ts  → Node.js sunucusu (PostgreSQL + S3 uyumlu depolama, ör. MinIO)
 * Hangisinin kullanılacağını next.config.ts içindeki SAGLAYICI değişkeni seçer (K2, talimatlar 0.2).
 */
import path from 'path'
import { fileURLToPath } from 'url'
import type { Config, Plugin } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { tr } from '@payloadcms/translations/languages/tr'
import { en } from '@payloadcms/translations/languages/en'

import { koleksiyonlar } from './koleksiyonlar'
import { epostaAdaptoru } from './altyapi/eposta'

const dosyaAdi = fileURLToPath(import.meta.url)
const klasor = path.dirname(dosyaAdi)

export function ortakYapilandirma({
  db,
  eklentiler = [],
  logger,
}: {
  db: Config['db']
  eklentiler?: Plugin[]
  logger?: Config['logger']
}): Config {
  return {
    admin: {
      user: 'kullanicilar',
      importMap: { baseDir: path.resolve(klasor) },
      meta: { titleSuffix: ' · TeknoKariyer yönetim' },
    },
    collections: koleksiyonlar,
    // GraphQL kullanılmıyor; REST ve yerel API yeterli. Kapatmak paketi küçültür.
    graphQL: { disable: true },
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    i18n: {
      supportedLanguages: { tr, en },
      fallbackLanguage: 'tr',
    },
    typescript: { outputFile: path.resolve(klasor, 'payload-types.ts') },
    email: epostaAdaptoru(),
    db,
    plugins: eklentiler,
    logger,
  }
}
