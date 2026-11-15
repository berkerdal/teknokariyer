/**
 * D1 SQL dökümünü (wrangler d1 export) yerel bir SQLite dosyasına açar. Döküm aynı zamanda sağlayıcıdan bağımsız
 * yedektir. Node'un yerleşik SQLite'ı kullanılır (Node 22.5+), ek araç gerekmez.
 *
 *   pnpm exec tsx scripts/goc/dokumu-ac.ts yedek.sql yedek.sqlite
 */
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const [dokum, hedef] = process.argv.slice(2)
if (!dokum || !hedef) throw new Error('Kullanım: dokumu-ac.ts <döküm.sql> <hedef.sqlite>')
if (existsSync(hedef)) rmSync(hedef)
/** SQL'i komutlara böler; tek tırnaklı metin, çift tırnaklı ve ters tırnaklı adlar içindeki `;` bölmez. */
function komutlar(sql: string): string[] {
  const sonuc: string[] = []
  let bas = 0
  let tirnak: string | null = null
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]!
    if (tirnak) {
      if (c === tirnak) {
        if (sql[i + 1] === tirnak) i++ // '' kaçışı
        else tirnak = null
      }
    } else if (c === "'" || c === '"' || c === '`') tirnak = c
    else if (c === ';') {
      const k = sql.slice(bas, i).trim()
      if (k) sonuc.push(k)
      bas = i + 1
    }
  }
  const son = sql.slice(bas).trim()
  if (son) sonuc.push(son)
  return sonuc
}

// Döküm tablo sırasına göre değil, ada göre yazılır: yükleme sırasında yabancı anahtar denetimi kapalı, sonda topluca denetlenir
const db = new DatabaseSync(hedef, { enableForeignKeyConstraints: false })
const hepsi = komutlar(readFileSync(dokum, 'utf8')).filter((k) => !/^PRAGMA\b/i.test(k))
// Dökümde dizinler tablolarından önce gelebiliyor: önce tablolar, sonra dizinler ve veriler
const tabloMu = (k: string) => /^CREATE TABLE\b/i.test(k)
db.exec('BEGIN')
for (const k of [...hepsi.filter(tabloMu), ...hepsi.filter((k) => !tabloMu(k))]) db.exec(k)
db.exec('COMMIT')
const kopuk = db.prepare('PRAGMA foreign_key_check').all()
if (kopuk.length) {
  console.error('Bağlantısı kopuk satırlar:', kopuk.slice(0, 20))
  throw new Error(`${kopuk.length} satırın bağlandığı kayıt yok. Döküm eksik olabilir.`)
}
const tablolar = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all() as { name: string }[]
let toplam = 0
for (const { name } of tablolar) toplam += Number((db.prepare(`SELECT count(*) AS n FROM "${name}"`).get() as { n: number }).n)
console.log(`${tablolar.length} tablo, ${toplam} satır → ${hedef}`)
db.close()
