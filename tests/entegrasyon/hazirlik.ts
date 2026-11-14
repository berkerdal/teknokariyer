import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Her çalıştırmada boş, geçici bir yerel veritabanı. Geliştirme verisine dokunulmaz.
 * Şema göçlerle kurulur (push kapalı); böylece göçler de her test çalışmasında baştan denenir.
 */
export default function hazirlik() {
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), 'teknokariyer-test-'))
  process.env.TK_YEREL_VERI = klasor
  process.env.PAYLOAD_SECRET ||= 'entegrasyon-testi-icin-gecici-anahtar'
  process.env.ORTAM = 'test'
  execSync('pnpm payload migrate', { env: { ...process.env, NODE_OPTIONS: '--no-deprecation' }, stdio: ['ignore', 'ignore', 'inherit'] })
  return () => fs.rmSync(klasor, { recursive: true, force: true })
}
