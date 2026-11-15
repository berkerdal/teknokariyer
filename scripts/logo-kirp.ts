/**
 * Mevcut firma logolarının çevresindeki boşluğu kırpar (yüklemedeki kuralın aynısı: src/altyapi/logoKirp.ts).
 * Kırpma kuralı yeni yüklemelere kendiliğinden uygulanır; bu betik kural gelmeden yüklenmiş logolar içindir.
 * - Kırpılan logo yeni bir dosya kaydı olur (logo adresi bir yıl önbelleklendiği için aynı kimlikle değiştirilmez),
 *   firma yeni kayda bağlanır, eski kayıt ve depodaki eski nesne silinir.
 * - Önce kuru çalıştırılır (yalnızca ne yapılacağını yazar); `--uygula` ile uygulanır. Uygulamadan önce D1 Time Travel
 *   yer imi alınmalı.
 *
 *   CF_HESAP=… R2_KOVA=teknokariyer-test-dosyalar R2_YETKI_ALANI=eu \
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt pnpm exec tsx scripts/logo-kirp.ts [--uygula]
 */
import { d1Sorgu } from './d1'
import { logoyuKirp, type GorselTuru } from '../src/altyapi/logoKirp'
import { logoDosyaAdi } from '../src/alan/firmaLogosu'

const uygula = process.argv.includes('--uygula')
const hesap = process.env.CF_HESAP!
const kova = process.env.R2_KOVA
if (!kova) throw new Error('R2_KOVA (logo dosyalarının kovası) verilmeli.')
const basliklar = {
  authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? 'vekil-ekler'}`,
  ...(process.env.R2_YETKI_ALANI ? { 'cf-r2-jurisdiction': process.env.R2_YETKI_ALANI } : {}),
}
const nesne = (anahtar: string) => `https://api.cloudflare.com/client/v4/accounts/${hesap}/r2/buckets/${encodeURIComponent(kova)}/objects/${encodeURIComponent(anahtar)}`

const logolar = (await d1Sorgu(
  "SELECT d.id, d.alt, d.sahip_id, d.tarama_durumu, d.filename, d.mime_type, f.id AS firma, f.kisa_ad FROM dosyalar d JOIN firmalar f ON f.logo_id = d.id WHERE d.tur = 'logo' ORDER BY d.id",
)) as Array<{ id: number; alt: string | null; sahip_id: number | null; tarama_durumu: string | null; filename: string; mime_type: string; firma: number; kisa_ad: string }>

let kirpilan = 0
for (const l of logolar) {
  const y = await fetch(nesne(l.filename), { headers: basliklar })
  if (!y.ok) {
    console.log(`${l.kisa_ad}: depodan okunamadı (${y.status}), atlandı.`)
    continue
  }
  const veri = new Uint8Array(await y.arrayBuffer())
  const r = logoyuKirp(veri, l.mime_type as GorselTuru, 1024 * 1024)
  if (!r.kirpildi) {
    console.log(`${l.kisa_ad}: kırpmaya gerek yok.`)
    continue
  }
  kirpilan++
  const ad = logoDosyaAdi(l.firma, 'image/png')
  console.log(`${l.kisa_ad}: ${r.once!.w}×${r.once!.h} → ${r.sonra!.w}×${r.sonra!.h} (${veri.byteLength} → ${r.veri.byteLength} bayt) ${ad}`)
  if (!uygula) continue
  const k = await fetch(nesne(ad), { method: 'PUT', headers: { ...basliklar, 'content-type': 'image/png' }, body: r.veri })
  if (!k.ok) throw new Error(`${l.kisa_ad}: yeni dosya depoya yazılamadı (${k.status}) ${await k.text()}`)
  const [yeni] = await d1Sorgu(
    'INSERT INTO dosyalar (tur, alt, sahip_id, tarama_durumu, filename, url, mime_type, filesize, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    ['logo', l.alt, l.sahip_id, l.tarama_durumu, ad, `/api/dosyalar/file/${ad}`, 'image/png', r.veri.byteLength, r.sonra!.w, r.sonra!.h],
  )
  await d1Sorgu('UPDATE firmalar SET logo_id = ? WHERE id = ?', [yeni!.id, l.firma])
  await d1Sorgu('DELETE FROM dosyalar WHERE id = ?', [l.id])
  const s = await fetch(nesne(l.filename), { method: 'DELETE', headers: basliklar })
  if (!s.ok) console.log(`  eski nesne silinemedi (${s.status}); depoda kaldı: ${l.filename}`)
  console.log(`  uygulandı: yeni dosya ${yeni!.id}, eski ${l.id} silindi.`)
}
console.log(`${logolar.length} logo incelendi, ${kirpilan} tanesi ${uygula ? 'kırpıldı' : 'kırpılacak (kuru çalıştırma; uygulamak için --uygula)'}.`)
