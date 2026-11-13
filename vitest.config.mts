import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Birim testleri: src/alan altındaki saf iş kuralları. Veritabanı ve Cloudflare gerektirmez.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/birim/**/*.test.ts'],
  },
})
