import fs from 'fs'
import os from 'os'
import path from 'path'

/** Her çalıştırmada boş, geçici bir yerel veritabanı. Geliştirme verisine dokunulmaz. */
export default function hazirlik() {
  const klasor = fs.mkdtempSync(path.join(os.tmpdir(), 'teknokariyer-test-'))
  process.env.TK_YEREL_VERI = klasor
  process.env.PAYLOAD_SECRET ||= 'entegrasyon-testi-icin-gecici-anahtar'
  process.env.ORTAM = 'test'
  return () => fs.rmSync(klasor, { recursive: true, force: true })
}
