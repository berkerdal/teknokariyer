/**
 * Pakette gelen resmî listeler: YÖK Atlas tercih kılavuzundaki yükseköğretim kurumları ve program (bölüm) adları.
 * Kaynak dosya `src/kaynakVeri/yokAtlas.json` (ham adlar, alınma tarihi). Yeni yıl listesi geldiğinde dosya
 * güncellenir veya gelişmiş yönetim ekranından Excel/CSV ile aktarılır. Temizlik `aktarmaAdlari` ile yapılır.
 */
import yok from '../kaynakVeri/yokAtlas.json'
import { aktarmaAdlari } from './listeAktarma'

export type ResmiListeTuru = 'universite' | 'bolum'

export const RESMI_LISTE_KAYNAGI = { ad: 'YÖK Atlas tercih kılavuzu', alinma: yok.alinma }

/** Paketteki listenin temizlenmiş adları (alfabetik, tekil). */
export function resmiListeAdlari(tur: ResmiListeTuru): string[] {
  const ham = tur === 'universite' ? yok.universiteler : yok.programlar
  return aktarmaAdlari(
    ham.map((a) => [a]),
    0,
    tur,
  )
}
