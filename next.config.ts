import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import type { NextConfig } from 'next'

// SAGLAYICI=cloudflare (varsayılan): D1 + R2. SAGLAYICI=node: PostgreSQL + S3 (Türkiye'de sunucu, K2).
const saglayici = process.env.SAGLAYICI === 'node' ? 'node' : 'cloudflare'
const goreliYol = saglayici === 'node' ? './src/payload.config.node.ts' : './src/payload.config.ts'
const payloadYapilandirmasi = path.resolve(goreliYol) // webpack mutlak yol ister

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/dosyalar/file/**',
      },
    ],
  },
  // Geliştirme sunucusu (Turbopack) için aynı yönlendirme
  turbopack: { resolveAlias: { '@payload-config': goreliYol } }, // Turbopack göreli yol ister
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = { ...webpackConfig.resolve.alias, '@payload-config': payloadYapilandirmasi }
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
