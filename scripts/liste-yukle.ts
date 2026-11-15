/**
 * Pakette gelen resmî üniversite ve bölüm listesini (src/kaynakVeri/yokAtlas.json) D1 veritabanına API üzerinden ekler.
 * Gelişmiş yönetim ekranındaki “Liste aktarma” ile aynı kuralı kullanır (`aktarmaSiniflandir`): listede zaten olan veya
 * aynı kökte yazımı bulunan ad eklenmez, hiçbir şey silinmez. İşlem kaydına sistem adına yazılır.
 *
 *   CF_HESAP=<hesap> pnpm exec tsx scripts/liste-yukle.ts            → yalnızca neyin ekleneceğini yazar
 *   CF_HESAP=<hesap> pnpm exec tsx scripts/liste-yukle.ts --uygula   → ekler
 */
import { aktarmaSiniflandir } from '../src/alan/listeAktarma'
import { aramaMetni } from '../src/alan/metin'
import { RESMI_LISTE_KAYNAGI, resmiListeAdlari, type ResmiListeTuru } from '../src/alan/resmiListeler'
import { d1Sorgu } from './d1'

const uygula = process.argv.includes('--uygula')
const SATIR = 30 // satır başına 3 parametre; sorgu başına en fazla 100

for (const tur of ['universite', 'bolum'] as ResmiListeTuru[]) {
  const ogeler = await d1Sorgu('SELECT id, ad FROM taksonomiler WHERE tur = ?', [tur])
  const es = await d1Sorgu('SELECT e._parent_id AS p, e.ad FROM taksonomiler_es_anlamlilar e JOIN taksonomiler t ON t.id = e._parent_id WHERE t.tur = ?', [tur])
  const mevcut = ogeler.map((o) => ({ ad: String(o.ad), esAnlamlilar: es.filter((e) => e.p === o.id).map((e) => ({ ad: String(e.ad) })) }))
  const adlar = resmiListeAdlari(tur)
  const s = aktarmaSiniflandir(adlar, mevcut)
  console.log(`${tur}: kaynakta ${adlar.length}, listede ${mevcut.length}; eklenecek ${s.yeni.length}, zaten var ${s.zatenVar}, başka yazımla var ${s.benzer.length}`)
  for (const b of s.benzer) console.log(`  benzer: “${b.ad}” → “${b.listede}”`)
  if (!uygula || !s.yeni.length) continue
  for (let i = 0; i < s.yeni.length; i += SATIR) {
    const parca = s.yeni.slice(i, i + SATIR)
    await d1Sorgu(
      `INSERT INTO taksonomiler (tur, ad, aktif, arama) VALUES ${parca.map(() => '(?, ?, 1, ?)').join(', ')}`,
      parca.flatMap((ad) => [tur, ad, aramaMetni([ad])]),
    )
  }
  await d1Sorgu('INSERT INTO islem_kayitlari (islem, tur, kayit_turu, ayrinti) VALUES (?, ?, ?, ?)', [
    `Listeye toplu aktarıldı (${tur === 'universite' ? 'üniversite' : 'bölüm'})`,
    'ayarlar',
    'taksonomiler',
    JSON.stringify({ adet: s.yeni.length, kaynak: `${RESMI_LISTE_KAYNAGI.ad} ${RESMI_LISTE_KAYNAGI.alinma} (betik)` }),
  ])
  console.log(`  eklendi: ${s.yeni.length}`)
}
if (!uygula) console.log('Eklemek için --uygula ile çalıştırın.')
