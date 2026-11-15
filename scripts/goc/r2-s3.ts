/**
 * R2 → S3 uyumlu depolama (SeaweedFS, MinIO, kurumun nesne deposu) dosya aktarımı (K2, docs/goc-rehberi.md).
 *
 * Kaynak Cloudflare API'si üzerinden okunur (hesap kimliği ve API anahtarı; R2 erişim anahtarı gerekmez). Nesne
 * anahtarları olduğu gibi korunur: iki depolama eklentisi de anahtar olarak dosya adını kullanır. Hedefte aynı boyutta
 * nesne varsa atlanır, betik yarıda kalırsa yeniden çalıştırılabilir. Sonda:
 *  - kaynaktaki her nesne hedefte aynı boyutta mı,
 *  - DATABASE_URL verilmişse veritabanındaki her dosya kaydının nesnesi hedefte var mı
 * denetlenir.
 *
 *   CF_HESAP=… R2_KOVA=teknokariyer-test-dosyalar [R2_YETKI_ALANI=eu] \
 *   S3_ENDPOINT=http://localhost:8333 S3_BUCKET=… S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… [DATABASE_URL=…] \
 *   pnpm exec tsx scripts/goc/r2-s3.ts
 */
import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import pg from 'pg'

const gerekli = (ad: string) => {
  const d = process.env[ad]
  if (!d) throw new Error(`${ad} verilmeli.`)
  return d
}
const hesap = gerekli('CF_HESAP')
const r2Kova = gerekli('R2_KOVA')
const s3Kova = gerekli('S3_BUCKET')
const cfBasliklar: Record<string, string> = {
  authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? 'vekil-ekler'}`,
  ...(process.env.R2_YETKI_ALANI ? { 'cf-r2-jurisdiction': process.env.R2_YETKI_ALANI } : {}),
}
const s3 = new S3Client({
  endpoint: gerekli('S3_ENDPOINT'),
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: gerekli('S3_ACCESS_KEY_ID'), secretAccessKey: gerekli('S3_SECRET_ACCESS_KEY') },
})
const r2 = `https://api.cloudflare.com/client/v4/accounts/${hesap}/r2/buckets/${encodeURIComponent(r2Kova)}/objects`

async function r2Listesi(): Promise<Array<{ key: string; size: number }>> {
  const liste: Array<{ key: string; size: number }> = []
  let imlec: string | undefined
  do {
    const y = await fetch(`${r2}?per_page=1000${imlec ? `&cursor=${encodeURIComponent(imlec)}` : ''}`, { headers: cfBasliklar })
    const j = (await y.json()) as { success: boolean; errors?: unknown[]; result?: Array<{ key: string; size: number }>; result_info?: { cursor?: string; is_truncated?: boolean } }
    if (!j.success) throw new Error(`R2 listesi alınamadı: ${JSON.stringify(j.errors)}`)
    liste.push(...(j.result ?? []))
    imlec = j.result_info?.is_truncated ? j.result_info.cursor : undefined
  } while (imlec)
  return liste
}

async function hedefBoyutu(anahtar: string): Promise<number | null> {
  try {
    return (await s3.send(new HeadObjectCommand({ Bucket: s3Kova, Key: anahtar }))).ContentLength ?? null
  } catch {
    return null
  }
}

try {
  await s3.send(new HeadBucketCommand({ Bucket: s3Kova }))
} catch {
  await s3.send(new CreateBucketCommand({ Bucket: s3Kova }))
  console.log(`Hedef kova oluşturuldu: ${s3Kova}`)
}

const nesneler = await r2Listesi()
let kopyalanan = 0
let atlanan = 0
for (const n of nesneler) {
  if ((await hedefBoyutu(n.key)) === n.size) {
    atlanan++
    continue
  }
  const y = await fetch(`${r2}/${encodeURIComponent(n.key)}`, { headers: cfBasliklar })
  if (!y.ok) throw new Error(`R2'den okunamadı: ${n.key} (${y.status})`)
  const govde = new Uint8Array(await y.arrayBuffer())
  if (govde.length !== n.size) throw new Error(`Boyut tutmuyor: ${n.key} (${govde.length} / ${n.size})`)
  await s3.send(new PutObjectCommand({ Bucket: s3Kova, Key: n.key, Body: govde, ContentType: y.headers.get('content-type') ?? undefined }))
  kopyalanan++
}

// Denetim: kaynaktaki her nesne hedefte aynı boyutta
const eksik: string[] = []
for (const n of nesneler) if ((await hedefBoyutu(n.key)) !== n.size) eksik.push(n.key)
if (eksik.length) throw new Error(`Hedefte eksik veya farklı boyutta: ${eksik.slice(0, 20).join(', ')}`)
let hedefSayisi = 0
let imlec: string | undefined
do {
  const r = await s3.send(new ListObjectsV2Command({ Bucket: s3Kova, ContinuationToken: imlec }))
  hedefSayisi += r.KeyCount ?? 0
  imlec = r.IsTruncated ? r.NextContinuationToken : undefined
} while (imlec)
console.log(`R2'de ${nesneler.length} nesne: ${kopyalanan} kopyalandı, ${atlanan} zaten vardı. Hedef kovada ${hedefSayisi} nesne var; boyutlar tutuyor.`)

// Denetim: veritabanındaki dosya kayıtları
if (process.env.DATABASE_URL) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const kayitlar = (await db.query<{ filename: string }>('SELECT filename FROM dosyalar WHERE filename IS NOT NULL')).rows
  await db.end()
  const yok: string[] = []
  for (const k of kayitlar) if ((await hedefBoyutu(k.filename)) === null) yok.push(k.filename)
  if (yok.length) throw new Error(`Veritabanında kaydı olup depoda bulunmayan dosyalar: ${yok.slice(0, 20).join(', ')}`)
  console.log(`Veritabanındaki ${kayitlar.length} dosya kaydının hepsi hedef depoda var.`)
}
