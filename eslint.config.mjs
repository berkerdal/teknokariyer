import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Testlerde kötüye kullanım denemeleri için tip dışı veri bilerek gönderilir.
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  globalIgnores([
    '.next/**', '.open-next/**', '.wrangler/**', 'out/**', 'build/**', 'next-env.d.ts',
    // Tasarım prototipi ve kimlik betikleri uygulama kodu değil
    'docs/**', 'tools/**',
    // Üretilen dosyalar
    'src/payload-types.ts', 'src/app/(payload)/admin/importMap.js', 'cloudflare-env.d.ts', 'src/migrations/**',
  ]),
])
