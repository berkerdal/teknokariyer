/**
 * Node.js sunucusu girişi: PostgreSQL + S3 uyumlu depolama (ör. MinIO).
 * Türkiye'de bir sunucuya geçiş için (K2, docs/goc-rehberi.md). Kullanmak için: SAGLAYICI=node
 *
 * Gerekli ortam değişkenleri:
 *   DATABASE_URL   postgres://kullanici:sifre@sunucu:5432/teknokariyer
 *   S3_ENDPOINT    http://minio:9000
 *   S3_BUCKET      teknokariyer-dosyalar
 *   S3_REGION      us-east-1 (MinIO için önemsiz ama zorunlu)
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 */
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'

import { ortakYapilandirma } from './payload.ortak'
import { DOSYA_KOLEKSIYONLARI } from './koleksiyonlar'

export default buildConfig(
  ortakYapilandirma({
    db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' }, push: false }),
    eklentiler: [
      s3Storage({
        collections: Object.fromEntries(DOSYA_KOLEKSIYONLARI.map((k) => [k, true])),
        bucket: process.env.S3_BUCKET || '',
        config: {
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION || 'us-east-1',
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
        },
      }),
    ],
  }),
)
