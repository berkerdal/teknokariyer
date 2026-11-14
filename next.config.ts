import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import type { NextConfig } from 'next'

// SAGLAYICI=cloudflare (varsayılan): D1 + R2. SAGLAYICI=node: PostgreSQL + S3 (Türkiye'de sunucu, K2).
const saglayici = process.env.SAGLAYICI === 'node' ? 'node' : 'cloudflare'
const goreliYol = saglayici === 'node' ? './src/payload.config.node.ts' : './src/payload.config.ts'
const payloadYapilandirmasi = path.resolve(goreliYol) // webpack mutlak yol ister

const nextConfig: NextConfig = {
  // İki kök düzen var (site ve yönetim paneli); eşleşmeyen adresler için tek ve gerçek 404 sayfası.
  experimental: { globalNotFound: true },
  poweredByHeader: false,
  // Güvenlik başlıkları (talimatlar 12). Betik kaynağı kısıtı (nonce'lu CSP) ayrı bir adımda eklenecek.
  async headers() {
    return [
      {
        source: '/:yol*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
    ]
  },
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
  webpack: (webpackConfig, { isServer, dev }) => {
    // Tarayıcıya giden JS dosyalarının adında rota adları geçmesin: `(frontend)`, `[adres]` gibi karakterler bazı
    // sunucularda (Cloudflare statik katmanı) kodlama farkı yüzünden yönlendirme döngüsüne yol açıyor.
    // Bu parçalar yalnızca içerik özetinden oluşan bir ad alır; dosya listesi Next'in derleme kaydından okunduğu için
    // başka bir şey değişmez.
    if (!isServer && !dev) {
      const asil = webpackConfig.output.filename
      webpackConfig.output.filename = (veri: { chunk?: { name?: string | null } }, bilgi: unknown) => {
        if (/[()[\]]/.test(veri.chunk?.name ?? '')) return 'static/chunks/r/[contenthash].js'
        return typeof asil === 'function' ? asil(veri, bilgi) : asil
      }
    }
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
