import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Entegrasyon testleri: Payload + yerel D1 simülasyonu, geçici veritabanıyla. Sırayla çalışır.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/entegrasyon/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    globalSetup: ['./tests/entegrasyon/hazirlik.ts'],
  },
})
