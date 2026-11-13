/**
 * Örnek veriyi yükler (test ortamı). Kullanım:
 *   pnpm ornek-veri                       → yerel veritabanı
 *   CLOUDFLARE_UZAK=1 pnpm ornek-veri     → Cloudflare'deki test veritabanı
 * Giriş yapılabilen örnek aday hesabı için ORNEK_SIFRE ortam değişkeni verilir.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { ornekVeriYukle } from '@/ornekVeri/yukle'

const payload = await getPayload({ config })
const sonuc = await ornekVeriYukle(payload)
console.log(`Örnek veri yüklendi: ${sonuc.firma} firma, ${sonuc.ilan} ilan, ${sonuc.taksonomi} taksonomi, ${sonuc.kullanici} kullanıcı.`)
process.exit(0)
