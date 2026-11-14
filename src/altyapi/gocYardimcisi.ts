/**
 * Göçlerde tablo yeniden kurmayı güvenli yapan yardımcılar (D1 / SQLite).
 *
 * SQLite bir sütunun NOT NULL kısıtını kaldıramaz; Drizzle bunun için tabloyu yeniden kurar: yeni tablo, kopyala,
 * `DROP TABLE eski`, `RENAME yeni → eski ad`. D1'de bu adım tehlikelidir (yerelde denenerek doğrulandı, 14.11.2026):
 * - Yabancı anahtar denetimi kapatılamaz: `PRAGMA foreign_keys=OFF` etkisizdir, `defer_foreign_keys` zincirleme
 *   işlemleri durdurmaz, `legacy_alter_table` ne tek tek ne toplu işlemde uygulanır.
 * - Bu yüzden `DROP TABLE` bağlı satırları zincirleme siler (CASCADE) veya bağlantıyı boşaltır (SET NULL). Bağlantı
 *   sütunu NOT NULL ise (ör. başvurunun ilanı) silme tamamen reddedilir.
 *
 * Yöntem: bağlı satırların hepsi yedek tablolara alınır, NOT NULL bağlantılı satırlar geçici olarak kaldırılır, tablo
 * yeniden kurulur, satırlar geri yüklenir ve sayılar yedekle karşılaştırılır. Sayılar tutmazsa göç hata verir ve
 * yedekler silinmez; veri yedek tablolardan (`_yedek_…`) elle kurtarılabilir.
 */
import { sql } from '@payloadcms/db-d1-sqlite'

type Sorgu = ReturnType<typeof sql.raw>
type Db = { run: (q: Sorgu) => Promise<unknown>; all: (q: Sorgu) => Promise<unknown[]> }

const q = (t: string) => `\`${t}\``
const yedek = (t: string) => `_yedek_${t.replace(/^_+/, '')}`

async function sayi(db: Db, tablo: string): Promise<number> {
  const r = (await db.all(sql.raw(`SELECT count(*) AS n FROM ${q(tablo)};`)))[0] as { n?: number } | [number]
  return Number((r as { n?: number }).n ?? (r as [number])[0])
}

export interface KorumaPlani {
  /** Yeniden kurulan tablolara zincirleme silmeyle bağlı tablolar; geri yükleme sırasıyla (üst tablo önce). */
  zincirleme: string[]
  /** Bağlantısı boşaltılan (SET NULL) tablo ve sütunlar; satırlar yerinde kalır, sütun geri yazılır. */
  bosaltilan: Array<[tablo: string, sutun: string]>
  /** NOT NULL bağlantısı olduğu için geçici olarak kaldırılıp geri yüklenen tablolar (üst tablo önce). */
  gecici: string[]
}

export async function bagliSatirlariKoru(db: Db, plan: KorumaPlani, yenidenKur: () => Promise<void>) {
  const satirTablolari = [...plan.gecici, ...plan.zincirleme]
  const hepsi = [...satirTablolari, ...plan.bosaltilan.map(([t]) => t)]
  const once: Record<string, number> = {}
  for (const t of [...new Set(hepsi)]) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS ${q(yedek(t))};`))
    await db.run(sql.raw(`CREATE TABLE ${q(yedek(t))} AS SELECT * FROM ${q(t)};`))
    once[t] = await sayi(db, t)
  }
  // NOT NULL bağlantılı satırlar geçici olarak kaldırılır (kendi alt tabloları yedekte; zincirleme silinirler).
  for (const t of [...plan.gecici].reverse()) await db.run(sql.raw(`DELETE FROM ${q(t)};`))

  await yenidenKur()

  for (const [t, s] of plan.bosaltilan)
    await db.run(
      sql.raw(
        `UPDATE ${q(t)} SET ${q(s)} = (SELECT y.${q(s)} FROM ${q(yedek(t))} y WHERE y.id = ${q(t)}.id) WHERE id IN (SELECT id FROM ${q(yedek(t))} WHERE ${q(s)} IS NOT NULL);`,
      ),
    )
  for (const t of satirTablolari) await db.run(sql.raw(`INSERT OR IGNORE INTO ${q(t)} SELECT * FROM ${q(yedek(t))};`))

  const farklar: string[] = []
  for (const t of Object.keys(once)) {
    const sonra = await sayi(db, t)
    if (sonra !== once[t]) farklar.push(`${t}: önce ${once[t]}, sonra ${sonra}`)
  }
  for (const [t, s] of plan.bosaltilan) {
    const r = (await db.all(sql.raw(`SELECT count(*) AS n FROM ${q(yedek(t))} y JOIN ${q(t)} x ON x.id = y.id WHERE y.${q(s)} IS NOT x.${q(s)};`)))[0] as { n?: number } | [number]
    const n = Number((r as { n?: number }).n ?? (r as [number])[0])
    if (n) farklar.push(`${t}.${s}: ${n} satırda bağlantı geri yazılamadı`)
  }
  if (farklar.length) throw new Error(`Göç durduruldu; yedek tablolar silinmedi (_yedek_…). Tutmayan sayılar: ${farklar.join('; ')}`)
  for (const t of [...new Set(hepsi)]) await db.run(sql.raw(`DROP TABLE IF EXISTS ${q(yedek(t))};`))
}

/** İlan ve ilan sürümü tablolarını yeniden kuran göçler için plan (ilk şemadan çıkarıldı). */
export const ILAN_KORUMA_PLANI: KorumaPlani = {
  gecici: ['basvurular', 'basvurular_etiketler', 'basvurular_ekip_notlari'],
  zincirleme: [
    'ilanlar_diller',
    'ilanlar_yan_haklar',
    'ilanlar_on_eleme_sorulari',
    'ilanlar_on_eleme_sorulari_secenekler',
    'ilanlar_rels',
    '_ilanlar_v_version_diller',
    '_ilanlar_v_version_yan_haklar',
    '_ilanlar_v_version_on_eleme_sorulari',
    '_ilanlar_v_version_on_eleme_sorulari_secenekler',
    '_ilanlar_v_rels',
    'payload_locked_documents_rels',
  ],
  bosaltilan: [['_ilanlar_v', 'parent_id']],
}
