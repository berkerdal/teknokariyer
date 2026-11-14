/**
 * Açıklanabilir eşleşme (talimatlar 8. bölüm).
 *
 * Kara kutu bir yüzde yerine gerekçeli bir liste üretir: "Zorunlu 4 becerinin 3’ü var · eksik: RTOS".
 * Sıralama için kural tabanlı bir puan da hesaplanır; ağırlıklar yönetim panelinden ayarlanır. Puan kullanıcıya gösterilmez.
 *
 * K25: Cinsiyet bu modülün girdi tiplerinde bilerek yoktur. Eşleştirmede ve sıralamada kullanılamaz.
 */
import { sayiIyelikEki } from './metin'

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type Cefr = (typeof CEFR)[number]
export const DENEYIM_SIRASI = ['ogrenci', 'yeni-mezun', '1-3', '3-5', '5+'] as const
export type Deneyim = (typeof DENEYIM_SIRASI)[number]
export const DENEYIM_ADI: Record<Deneyim, string> = {
  ogrenci: 'Öğrenci',
  'yeni-mezun': 'Yeni mezun',
  '1-3': '1–3 yıl',
  '3-5': '3–5 yıl',
  '5+': '5+ yıl',
}
export type CalismaModeli = 'ofiste' | 'hibrit' | 'uzaktan'
export const MODEL_ADI: Record<CalismaModeli, string> = { ofiste: 'Ofiste', hibrit: 'Hibrit', uzaktan: 'Uzaktan' }

export interface IlanKosullari {
  zorunluBeceriler: string[]
  tercihBeceriler: string[]
  model: CalismaModeli
  bolumler: string[]
  deneyim: Deneyim
  diller: Array<{ dil: string; seviye: Cefr }>
}

/** Eşleştirmeye giren aday bilgisi. Kimlik ve iletişim bilgisi bilerek yok. */
export interface EslesmeProfili {
  beceriler: string[]
  modeller: CalismaModeli[]
  bolum?: string
  deneyim?: Deneyim
  diller: Array<{ dil: string; seviye: Cefr }>
}

export interface EslesmeAgirliklari {
  zorunluBeceri: number
  tercihBeceri: number
  model: number
  bolum: number
  deneyim: number
  dil: number
}

export const VARSAYILAN_AGIRLIKLAR: EslesmeAgirliklari = {
  zorunluBeceri: 50,
  tercihBeceri: 10,
  model: 15,
  bolum: 10,
  deneyim: 10,
  dil: 5,
}

export type SatirDurumu = 'var' | 'eksik' | 'notr'
export interface EslesmeSatiri {
  durum: SatirDurumu
  metin: string
}

export interface EslesmeSonucu {
  satirlar: EslesmeSatiri[]
  kisa: string
  eksikZorunlu: string[]
  /** 0–100, yalnızca sıralama içindir; arayüzde gösterilmez. */
  siralamaPuani: number
}

export type Bakis = 'aday' | 'firma'

const anahtar = (b: string) => b.trim().toLocaleLowerCase('tr')

export function eslesmeHesapla(
  ilan: IlanKosullari,
  profil: EslesmeProfili,
  bakis: Bakis,
  agirlik: EslesmeAgirliklari = VARSAYILAN_AGIRLIKLAR,
): EslesmeSonucu {
  const sahip = new Set(profil.beceriler.map(anahtar))
  const varZorunlu = ilan.zorunluBeceriler.filter((b) => sahip.has(anahtar(b)))
  const eksikZorunlu = ilan.zorunluBeceriler.filter((b) => !sahip.has(anahtar(b)))
  const varTercih = ilan.tercihBeceriler.filter((b) => sahip.has(anahtar(b)))
  const sen = bakis === 'aday'

  const satirlar: EslesmeSatiri[] = []
  // Metinler tam cümledir (K29). Adaya “sen”, firmaya üçüncü kişi (“adayın”) bakışıyla yazılır.
  const profilinde = sen ? 'profilinde' : 'adayın profilinde'
  const zorunluMetni = `İlanın istediği ${ilan.zorunluBeceriler.length} zorunlu beceriden ${varZorunlu.length}${sayiIyelikEki(varZorunlu.length)} ${profilinde} var.`
  if (ilan.zorunluBeceriler.length) satirlar.push({ durum: eksikZorunlu.length ? 'eksik' : 'var', metin: zorunluMetni })
  if (varTercih.length) satirlar.push({ durum: 'var', metin: `Tercih sebebi olan becerilerden ${varTercih.join(', ')} ${profilinde} var.` })

  const modelUyar = profil.modeller.includes(ilan.model)
  const ilanModeli = MODEL_ADI[ilan.model].toLocaleLowerCase('tr')
  satirlar.push(
    modelUyar
      ? { durum: 'var', metin: `İlanın çalışma modeli (${ilanModeli}) ${sen ? 'tercihinle' : 'adayın tercihiyle'} uyuşuyor.` }
      : profil.modeller.length
        ? {
            durum: 'eksik',
            metin: `İlan ${ilanModeli} çalışmayı öngörüyor; ${sen ? 'sen' : 'aday'} ${profil.modeller
              .map((m) => MODEL_ADI[m].toLocaleLowerCase('tr'))
              .join(' veya ')} çalışmayı tercih ${sen ? 'ediyorsun' : 'ediyor'}.`,
          }
        : { durum: 'notr', metin: `İlan ${ilanModeli} çalışmayı öngörüyor; ${sen ? 'çalışma modeli tercihini henüz belirtmedin' : 'aday çalışma modeli tercihini belirtmemiş'}.` },
  )

  let bolumUyar = true
  if (ilan.bolumler.length) {
    bolumUyar = Boolean(profil.bolum && ilan.bolumler.includes(profil.bolum))
    satirlar.push(
      bolumUyar
        ? { durum: 'var', metin: `${sen ? 'Bölümün' : 'Adayın bölümü'} ilanın tercih ettiği bölümler arasında.` }
        : {
            durum: 'notr',
            metin: profil.bolum
              ? `${sen ? 'Bölümün' : 'Adayın bölümü'} (${profil.bolum}) ilanın tercih ettiği bölümler arasında değil.`
              : `${sen ? 'Bölüm bilgin henüz eklenmedi.' : 'Adayın bölüm bilgisi eklenmemiş.'}`,
          },
    )
  }

  let deneyimUyar = true
  if (profil.deneyim) {
    deneyimUyar = DENEYIM_SIRASI.indexOf(profil.deneyim) >= DENEYIM_SIRASI.indexOf(ilan.deneyim)
    if (!deneyimUyar)
      satirlar.push({
        durum: 'eksik',
        metin: `Bu ilan “${DENEYIM_ADI[ilan.deneyim]}” deneyim düzeyini arıyor; ${sen ? 'senin deneyim düzeyin' : 'adayın deneyim düzeyi'} “${DENEYIM_ADI[profil.deneyim]}”.`,
      })
  }

  let dilPuani = 1
  for (const istenen of ilan.diller) {
    const var_ = profil.diller.find((d) => d.dil === istenen.dil)
    if (!var_) {
      satirlar.push({ durum: 'eksik', metin: `İlan ${istenen.dil} için en az ${istenen.seviye} seviyesi istiyor; ${profilinde} ${istenen.dil} bulunmuyor.` })
      dilPuani = 0
    } else if (CEFR.indexOf(var_.seviye) >= CEFR.indexOf(istenen.seviye)) {
      satirlar.push({ durum: 'var', metin: `${sen ? `${istenen.dil} seviyen` : `Adayın ${istenen.dil} seviyesi`} (${var_.seviye}) ilanın istediği ${istenen.seviye} seviyesini karşılıyor.` })
    } else {
      satirlar.push({ durum: 'eksik', metin: `İlan ${istenen.dil} için ${istenen.seviye} seviyesi istiyor; ${sen ? 'senin seviyen' : 'adayın seviyesi'} ${var_.seviye}.` })
      dilPuani = Math.min(dilPuani, 0.5)
    }
  }

  const oran = (a: number, b: number) => (b === 0 ? 1 : a / b)
  const toplamAgirlik = Object.values(agirlik).reduce((a, b) => a + b, 0) || 1
  const puan =
    (agirlik.zorunluBeceri * oran(varZorunlu.length, ilan.zorunluBeceriler.length) +
      agirlik.tercihBeceri * oran(varTercih.length, ilan.tercihBeceriler.length) +
      agirlik.model * (modelUyar ? 1 : 0) +
      agirlik.bolum * (bolumUyar ? 1 : 0) +
      agirlik.deneyim * (deneyimUyar ? 1 : 0) +
      agirlik.dil * dilPuani) /
    toplamAgirlik

  // Listelerde tek satırlık özet (veri satırı).
  const kisa = ilan.zorunluBeceriler.length
    ? `${ilan.zorunluBeceriler.length} zorunlu beceriden ${varZorunlu.length}${sayiIyelikEki(varZorunlu.length)} var` +
      (eksikZorunlu.length ? ` (eksik: ${eksikZorunlu.join(', ')})` : '')
    : satirlar[0]?.metin ?? ''

  return { satirlar, kisa, eksikZorunlu, siralamaPuani: Math.round(puan * 100) }
}
