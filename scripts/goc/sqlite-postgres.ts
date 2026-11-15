/**
 * SQLite (D1 dökümü) → PostgreSQL veri aktarımı (K2, docs/goc-rehberi.md).
 *
 * İki veritabanı aynı Payload yapılandırmasından üretildiği için tablo ve sütun adları aynıdır. Hedefte şema önceden
 * PostgreSQL göçleriyle kurulmuş olmalıdır (`src/migrations-pg`). Betik:
 *  1. Hedefin boş olduğunu denetler (`--bosalt` verilirse önce bütün verileri siler; yalnızca prova için).
 *  2. Her tabloyu tek işlemde kopyalar. Sütun türüne göre dönüştürür: 0/1 → boolean; tarih, JSON ve seçim değerleri metin
 *     olarak gider ve PostgreSQL kendisi çevirir. Yükleme sırasında yabancı anahtar tetikleri askıya alınır
 *     (`session_replication_role = replica`; veritabanı sahibi veya süper kullanıcı gerekir).
 *  3. Sayaçları (id dizileri) en büyük değere getirir.
 *  4. Denetler: her tabloda satır sayısı aynı mı, her yabancı anahtarın bağlandığı kayıt var mı. Tutmazsa işlem geri alınır.
 * `payload_migrations` kopyalanmaz: PostgreSQL'in kendi göç kaydı geçerlidir.
 *
 *   DATABASE_URL=postgres://... pnpm exec tsx scripts/goc/sqlite-postgres.ts yedek.sqlite [--bosalt]
 */
import { DatabaseSync } from 'node:sqlite'
import pg from 'pg'

const [dosya] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const bosalt = process.argv.includes('--bosalt')
if (!dosya) throw new Error('Kullanım: sqlite-postgres.ts <kaynak.sqlite> [--bosalt]')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL (hedef PostgreSQL) verilmeli.')

const ATLANAN = new Set(['payload_migrations'])
const kaynak = new DatabaseSync(dosya, { readOnly: true })
const hedef = new pg.Client({ connectionString: process.env.DATABASE_URL })
await hedef.connect()

const kaynakTablolar = new Set(
  (kaynak.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'").all() as { name: string }[]).map((t) => t.name),
)
const sutunlar = new Map<string, Array<{ ad: string; tur: string }>>()
for (const r of (
  await hedef.query<{ tablo: string; ad: string; tur: string }>(
    "SELECT table_name AS tablo, column_name AS ad, data_type AS tur FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position",
  )
).rows) {
  if (!sutunlar.has(r.tablo)) sutunlar.set(r.tablo, [])
  sutunlar.get(r.tablo)!.push({ ad: r.ad, tur: r.tur })
}
const hedefTablolar = [...sutunlar.keys()].filter((t) => !ATLANAN.has(t))

const uyarilar: string[] = []
for (const t of kaynakTablolar) if (!sutunlar.has(t) && !ATLANAN.has(t)) uyarilar.push(`Kaynaktaki “${t}” tablosu hedefte yok; aktarılmadı.`)
for (const t of hedefTablolar) if (!kaynakTablolar.has(t)) uyarilar.push(`Hedefteki “${t}” tablosu kaynakta yok; boş kalır.`)

const q = (ad: string) => `"${ad.replace(/"/g, '""')}"`

function donustur(deger: unknown, tur: string): unknown {
  if (deger === null || deger === undefined) return null
  if (tur === 'boolean') return deger === 1 || deger === '1' || deger === true || deger === 'true'
  if (typeof deger === 'bigint') return deger.toString()
  if (deger instanceof Uint8Array) return Buffer.from(deger)
  return deger
}

await hedef.query('BEGIN')
try {
  if (bosalt) {
    await hedef.query(`TRUNCATE ${hedefTablolar.map(q).join(', ')} RESTART IDENTITY CASCADE`)
  } else {
    for (const t of hedefTablolar) {
      const n = Number((await hedef.query(`SELECT count(*) AS n FROM ${q(t)}`)).rows[0].n)
      if (n) throw new Error(`Hedefte “${t}” tablosu boş değil (${n} satır). Göç boş veritabanına yapılır; prova için --bosalt.`)
    }
  }
  await hedef.query("SET LOCAL session_replication_role = 'replica'")

  const sayilar: Array<{ tablo: string; kaynak: number; hedef?: number }> = []
  for (const t of hedefTablolar.filter((t) => kaynakTablolar.has(t))) {
    const kaynakSutunlari = new Set((kaynak.prepare(`PRAGMA table_info(${q(t)})`).all() as { name: string }[]).map((s) => s.name))
    const ortak = sutunlar.get(t)!.filter((s) => kaynakSutunlari.has(s.ad))
    for (const s of kaynakSutunlari) if (!ortak.some((o) => o.ad === s)) uyarilar.push(`“${t}.${s}” sütunu hedefte yok; aktarılmadı.`)
    for (const s of sutunlar.get(t)!) if (!kaynakSutunlari.has(s.ad)) uyarilar.push(`“${t}.${s.ad}” sütunu kaynakta yok; varsayılan değer kalır.`)
    const satirlar = kaynak.prepare(`SELECT ${ortak.map((s) => q(s.ad)).join(', ')} FROM ${q(t)}`).all() as Record<string, unknown>[]
    sayilar.push({ tablo: t, kaynak: satirlar.length })
    // PostgreSQL bir sorguda en fazla 65.535 parametre kabul eder
    const parca = Math.max(1, Math.floor(30000 / ortak.length))
    for (let i = 0; i < satirlar.length; i += parca) {
      const dilim = satirlar.slice(i, i + parca)
      const degerler: unknown[] = []
      const yer = dilim.map((r) => `(${ortak.map((s) => (degerler.push(donustur(r[s.ad], s.tur)), `$${degerler.length}`)).join(', ')})`)
      await hedef.query(`INSERT INTO ${q(t)} (${ortak.map((s) => q(s.ad)).join(', ')}) VALUES ${yer.join(', ')}`, degerler)
    }
  }
  await hedef.query("SET LOCAL session_replication_role = 'origin'")

  // Sayaçlar
  const diziler = (
    await hedef.query<{ tablo: string; sutun: string; dizi: string }>(
      `SELECT c.table_name AS tablo, c.column_name AS sutun, pg_get_serial_sequence(quote_ident(c.table_name), c.column_name) AS dizi
       FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.column_default LIKE 'nextval(%'`,
    )
  ).rows
  for (const d of diziler) await hedef.query(`SELECT setval($1, coalesce((SELECT max(${q(d.sutun)}) FROM ${q(d.tablo)}), 0) + 1, false)`, [d.dizi])

  // Denetim 1: satır sayıları
  for (const s of sayilar) s.hedef = Number((await hedef.query(`SELECT count(*) AS n FROM ${q(s.tablo)}`)).rows[0].n)
  const farkli = sayilar.filter((s) => s.kaynak !== s.hedef)
  if (farkli.length) throw new Error(`Satır sayısı tutmayan tablolar: ${farkli.map((s) => `${s.tablo} ${s.kaynak}→${s.hedef}`).join(', ')}`)

  // Denetim 2: yabancı anahtarlar (yükleme sırasında askıya alınmıştı)
  const anahtarlar = (
    await hedef.query<{ ad: string; tablo: string; sutun: string; ust: string; ustSutun: string }>(
      `SELECT con.conname AS ad, cl.relname AS tablo, a.attname AS sutun, ucl.relname AS ust, ua.attname AS "ustSutun"
       FROM pg_constraint con
       JOIN pg_class cl ON cl.oid = con.conrelid JOIN pg_namespace n ON n.oid = cl.relnamespace
       JOIN pg_class ucl ON ucl.oid = con.confrelid
       JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
       JOIN pg_attribute ua ON ua.attrelid = con.confrelid AND ua.attnum = con.confkey[1]
       WHERE con.contype = 'f' AND n.nspname = 'public' AND array_length(con.conkey, 1) = 1`,
    )
  ).rows
  const kopuk: string[] = []
  for (const k of anahtarlar) {
    const n = Number(
      (await hedef.query(`SELECT count(*) AS n FROM ${q(k.tablo)} c WHERE c.${q(k.sutun)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ${q(k.ust)} p WHERE p.${q(k.ustSutun)} = c.${q(k.sutun)})`)).rows[0].n,
    )
    if (n) kopuk.push(`${k.tablo}.${k.sutun} → ${k.ust}: ${n}`)
  }
  if (kopuk.length) throw new Error(`Bağlandığı kayıt olmayan satırlar: ${kopuk.join('; ')}`)

  await hedef.query('COMMIT')
  const toplam = sayilar.reduce((a, s) => a + s.kaynak, 0)
  console.log(`Aktarıldı: ${sayilar.length} tablo, ${toplam} satır. Satır sayıları tutuyor; ${anahtarlar.length} yabancı anahtar denetlendi; ${diziler.length} sayaç ayarlandı.`)
  for (const u of uyarilar) console.log(`Uyarı: ${u}`)
} catch (e) {
  await hedef.query('ROLLBACK')
  console.error('Aktarma geri alındı. Hedefte değişiklik yok.')
  throw e
} finally {
  await hedef.end()
  kaynak.close()
}
