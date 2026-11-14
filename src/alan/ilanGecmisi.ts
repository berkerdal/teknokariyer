/**
 * İlan sürüm geçmişi (CLAUDE.md 5: içerik bazında sürüm geçmişi). İki sürüm arasında değişen alanları Türkçe adlarıyla
 * listeler. Kısa alanlarda eski ve yeni değer, uzun metinlerde yalnızca “değişti” yazar.
 */
import { DENEYIM_ADI, MODEL_ADI } from './eslesme'
import { DURUM_ADI } from './ilan'
import { ALT_TUR_ADI } from './ilanFiltre'

const SECENEK_ADI: Record<string, Record<string, string>> = {
  durum: DURUM_ADI,
  tur: { is: 'İş', staj: 'Staj' },
  altTur: ALT_TUR_ADI,
  model: MODEL_ADI,
  deneyim: DENEYIM_ADI,
  egitim: { lise: 'Lise', onlisans: 'Önlisans', lisans: 'Lisans', 'yuksek-lisans': 'Yüksek lisans', doktora: 'Doktora' },
  dil: { tr: 'Türkçe', en: 'İngilizce', ikisi: 'Her ikisi' },
  sgk: { okul: 'Okul', firma: 'Firma' },
}

type Kayit = Record<string, unknown>

export const GECMIS_ALANLARI: Record<string, { ad: string; kisa?: boolean }> = {
  durum: { ad: 'Durum', kisa: true },
  pozisyonAdi: { ad: 'Pozisyon adı', kisa: true },
  tur: { ad: 'İlan türü', kisa: true },
  altTur: { ad: 'Çalışma şekli', kisa: true },
  aile: { ad: 'Pozisyon ailesi' },
  model: { ad: 'Çalışma modeli', kisa: true },
  konum: { ad: 'Konum', kisa: true },
  deneyim: { ad: 'Aranan deneyim', kisa: true },
  egitim: { ad: 'Eğitim düzeyi', kisa: true },
  pozisyonSayisi: { ad: 'Pozisyon sayısı', kisa: true },
  sonBasvuru: { ad: 'Son başvuru tarihi', kisa: true },
  baslangic: { ad: 'Başlangıç tarihi', kisa: true },
  ucretEnAz: { ad: 'Ücret (en az)', kisa: true },
  ucretEnCok: { ad: 'Ücret (en çok)', kisa: true },
  ucretGorunur: { ad: 'Ücretin görünürlüğü', kisa: true },
  zorunluBeceriler: { ad: 'Zorunlu beceriler' },
  tercihBeceriler: { ad: 'Tercih sebebi beceriler' },
  bolumler: { ad: 'Tercih edilen bölümler' },
  diller: { ad: 'Dil şartları' },
  isTanimi: { ad: 'İş tanımı' },
  nitelikler: { ad: 'Aranan nitelikler' },
  yanHaklar: { ad: 'Yan haklar' },
  onElemeSorulari: { ad: 'Ön eleme soruları' },
  linkedinMetni: { ad: 'LinkedIn metni' },
  dil: { ad: 'İlanın dili', kisa: true },
  stajDonemi: { ad: 'Staj dönemi', kisa: true },
  ucretliStaj: { ad: 'Ücretli staj', kisa: true },
  sgk: { ad: 'SGK', kisa: true },
  stajBelgesi: { ad: 'Staj belgesi', kisa: true },
  pauOncelik: { ad: 'PAÜ öğrencisine öncelik', kisa: true },
  duzeltmeGerekcesi: { ad: 'Yönetici A.Ş. düzeltme notu' },
}

export interface AlanFarki {
  alan: string
  ad: string
  once?: string
  sonra?: string
}

/** Karşılaştırma için sadeleştirir: ilişkiler kimliğe, dizi satırları kimliksiz hâle gelir. */
function sade(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sade)
  if (x && typeof x === 'object') {
    const o = x as Kayit
    if (typeof o.id === 'number') return o.id // ilişki (dizi satırı kimlikleri metindir)
    return Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'id').map(([k, v]) => [k, sade(v)]))
  }
  return x ?? null
}

function yaz(alan: string, d: unknown, tarihYaz: (iso: string) => string): string {
  if (d === null || d === undefined || d === '') return 'boş'
  if (SECENEK_ADI[alan]) return SECENEK_ADI[alan]![String(d)] ?? String(d)
  if (typeof d === 'boolean') return d ? 'evet' : 'hayır'
  if ((alan === 'sonBasvuru' || alan === 'baslangic') && typeof d === 'string') return tarihYaz(d)
  if (typeof d === 'number') return new Intl.NumberFormat('tr-TR').format(d)
  return String(d)
}

export function surumFarklari(once: Kayit | null, sonra: Kayit, tarihYaz: (iso: string) => string = (s) => s.slice(0, 10)): AlanFarki[] {
  if (!once) return [{ alan: 'olusturma', ad: 'İlan oluşturuldu' }]
  const farklar: AlanFarki[] = []
  for (const [alan, t] of Object.entries(GECMIS_ALANLARI)) {
    const a = sade(once[alan])
    const b = sade(sonra[alan])
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    if (t.kisa) farklar.push({ alan, ad: t.ad, once: yaz(alan, a, tarihYaz), sonra: yaz(alan, b, tarihYaz) })
    else farklar.push({ alan, ad: t.ad })
  }
  return farklar
}
