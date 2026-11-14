/**
 * Firma rehberinden içe aktarma (talimatlar 0.3, 1; K3). Saf kurallar: CSV okuma, başlık eşleme, önizleme denetimleri.
 * Tek modül olarak tasarlandı: ARGEPORTAL'dan veri gelirse yalnızca bu dosyanın girişi değişir (talimatlar 0.3, 9).
 */
import { genelEpostaMi } from './kurulum'
import { normallestir } from './metin'

export const ICE_AKTARMA_EN_FAZLA = 300

export interface HamFirma {
  /** Dosyadaki satır numarası (başlık 1. satır) */
  satir: number
  unvan: string
  kisaAd: string
  konum: string
  sektor: string
  web: string
  yetkiliAd: string
  yetkiliEposta: string
  yetkiliTelefon: string
}

/** Excel'in Türkçe ayarı noktalı virgül, diğerleri virgül kullanır; ilk satıra bakılarak seçilir. Tırnaklı alanlar desteklenir. */
export function csvOku(metin: string): string[][] {
  const temiz = metin.replace(/^﻿/, '')
  const ilkSatir = temiz.split(/\r?\n/, 1)[0] ?? ''
  const ayrac = (ilkSatir.match(/;/g)?.length ?? 0) >= (ilkSatir.match(/,/g)?.length ?? 0) ? ';' : ','
  const satirlar: string[][] = []
  let alan = ''
  let satir: string[] = []
  let tirnak = false
  for (let i = 0; i < temiz.length; i++) {
    const c = temiz[i]!
    if (tirnak) {
      if (c === '"' && temiz[i + 1] === '"') {
        alan += '"'
        i++
      } else if (c === '"') tirnak = false
      else alan += c
    } else if (c === '"') tirnak = true
    else if (c === ayrac) {
      satir.push(alan)
      alan = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && temiz[i + 1] === '\n') i++
      satir.push(alan)
      satirlar.push(satir)
      satir = []
      alan = ''
    } else alan += c
  }
  if (alan || satir.length) {
    satir.push(alan)
    satirlar.push(satir)
  }
  return satirlar.filter((s) => s.some((x) => x.trim()))
}

/** Başlık adlarının kabul edilen yazımları (Türkçe harf ve büyük/küçük harf farkı gözetilmez). */
const BASLIKLAR: Record<keyof Omit<HamFirma, 'satir'>, string[]> = {
  unvan: ['unvan', 'ticaret unvani', 'firma unvani', 'firma', 'firma adi'],
  kisaAd: ['kisa ad', 'kisa adi', 'marka'],
  konum: ['blok oda', 'blok/oda', 'konum', 'teknokentteki yeri', 'yer', 'ofis', 'blok'],
  sektor: ['sektor', 'faaliyet alani'],
  web: ['web', 'web sitesi', 'internet sitesi', 'web adresi'],
  yetkiliAd: ['yetkili', 'yetkili ad soyad', 'yetkili adi', 'yetkili kisi', 'ad soyad'],
  yetkiliEposta: ['e-posta', 'eposta', 'e posta', 'email', 'e-mail', 'yetkili e-posta', 'yetkili eposta'],
  yetkiliTelefon: ['telefon', 'tel', 'yetkili telefon', 'gsm'],
}

const baslikAnahtari = (s: string) => normallestir(s).replace(/[^a-z0-9/ -]/g, '').replace(/’|'/g, '').trim()

export interface CozumSonucu {
  firmalar: HamFirma[]
  hata?: string
  /** Tanınmayan başlıklar (bilgi için) */
  taninmayan: string[]
}

export function rehberiCoz(metin: string): CozumSonucu {
  const satirlar = csvOku(metin)
  if (satirlar.length < 2) return { firmalar: [], taninmayan: [], hata: 'Dosyada başlık satırından başka satır yok. İlk satırda sütun adları, sonraki satırlarda firmalar olmalı.' }
  const baslik = satirlar[0]!.map(baslikAnahtari)
  const sutun: Partial<Record<keyof typeof BASLIKLAR, number>> = {}
  const taninmayan: string[] = []
  baslik.forEach((b, i) => {
    const alan = (Object.keys(BASLIKLAR) as Array<keyof typeof BASLIKLAR>).find((a) => BASLIKLAR[a].some((x) => baslikAnahtari(x) === b))
    if (alan && sutun[alan] === undefined) sutun[alan] = i
    else if (b) taninmayan.push(satirlar[0]![i]!.trim())
  })
  if (sutun.unvan === undefined) return { firmalar: [], taninmayan, hata: 'Dosyada “Unvan” sütunu bulunamadı. Şablondaki sütun adlarını kullanın.' }
  if (satirlar.length - 1 > ICE_AKTARMA_EN_FAZLA)
    return { firmalar: [], taninmayan, hata: `Bir dosyada en fazla ${ICE_AKTARMA_EN_FAZLA} firma olabilir. Dosyayı bölerek yükleyin.` }
  const al = (s: string[], a: keyof typeof BASLIKLAR) => (sutun[a] === undefined ? '' : (s[sutun[a]!] ?? '').replace(/\s+/g, ' ').trim())
  const firmalar = satirlar.slice(1).map((s, i) => {
    const unvan = al(s, 'unvan')
    return {
      satir: i + 2,
      unvan,
      kisaAd: al(s, 'kisaAd') || kisaAdTuret(unvan),
      konum: al(s, 'konum'),
      sektor: al(s, 'sektor'),
      web: al(s, 'web'),
      yetkiliAd: al(s, 'yetkiliAd'),
      yetkiliEposta: al(s, 'yetkiliEposta').toLowerCase(),
      yetkiliTelefon: al(s, 'yetkiliTelefon'),
    }
  })
  return { firmalar, taninmayan }
}

const SIRKET_EKLERI = [
  /\s+(ltd\.?|limited)\s*(şti\.?|şirketi)?\.?$/i,
  /\s+(a\.?\s?ş\.?|anonim şirketi)$/i,
  /\s+(san\.?|sanayi)\s*(ve|&)?\s*(tic\.?|ticaret)\.?$/i,
  /\s+(tic\.?|ticaret)\.?$/i,
]

/** Unvandan kısa ad: şirket türü ekleri atılır (“Ratel Bilişim Hizmetleri Ltd. Şti.” → “Ratel Bilişim Hizmetleri”). */
export function kisaAdTuret(unvan: string): string {
  let s = unvan.trim()
  for (let tur = 0; tur < 4; tur++) for (const e of SIRKET_EKLERI) s = s.replace(e, '').trim()
  return s.slice(0, 40).trim()
}

/** Şirket türü eki olmayan unvan çoğunlukla şahıs firmasıdır ve kişi adı içerir (CLAUDE.md: bazı unvanlar kişi adıdır). */
export function sahisFirmasiOlabilir(unvan: string): boolean {
  return !/\b(ltd|limited|a\.?\s?ş|anonim|kooperatif|vakf|derne)/i.test(unvan)
}

export type OnizlemeDurumu = 'yeni' | 'kayitli' | 'tekrar' | 'hatali'

export interface OnizlemeSatiri extends HamFirma {
  durum: OnizlemeDurumu
  /** Engel olmayan, kontrol edilmesi gereken durumlar */
  uyarilar: string[]
  /** Aktarımı engelleyen sorunlar */
  hatalar: string[]
}

export function onizle(firmalar: HamFirma[], mevcut: Array<{ unvan: string; kisaAd: string }>, sektorler: string[]): OnizlemeSatiri[] {
  const kayitli = new Set(mevcut.flatMap((m) => [normallestir(m.unvan), normallestir(m.kisaAd)]))
  const sektorSet = new Set(sektorler.map(normallestir))
  const gorulen = new Map<string, number>()
  return firmalar.map((f) => {
    const hatalar: string[] = []
    const uyarilar: string[] = []
    if (f.unvan.length < 3) hatalar.push('Unvan yok.')
    if (!f.konum) hatalar.push('Teknokent’teki yeri (blok ve oda) yok.')
    if (f.kisaAd.length > 40) hatalar.push('Kısa ad 40 karakterden uzun.')
    if (f.yetkiliEposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.yetkiliEposta)) hatalar.push('E-posta adresi geçersiz.')
    if (!f.yetkiliEposta) uyarilar.push('E-posta yok; davet için yetkili e-postası girilmeli.')
    else if (genelEpostaMi(f.yetkiliEposta)) uyarilar.push('E-posta genel bir kutu (info@ gibi); davet için yetkilinin kendi e-postası gerekir.')
    if (f.yetkiliEposta && !f.yetkiliAd) uyarilar.push('Yetkili adı yok; davet göndermeden önce girilmeli.')
    if (f.sektor && !sektorSet.has(normallestir(f.sektor))) uyarilar.push(`“${f.sektor}” sektör listesinde yok; sektör boş bırakılacak.`)
    if (f.unvan && sahisFirmasiOlabilir(f.unvan)) uyarilar.push('Unvanda şirket türü yok; şahıs firması olabilir ve kişi adı içerebilir. Kısa adı kontrol edin.')
    const anahtar = [normallestir(f.unvan), normallestir(f.kisaAd)]
    const once = anahtar.map((a) => gorulen.get(a)).find((x) => x !== undefined)
    anahtar.forEach((a) => a && !gorulen.has(a) && gorulen.set(a, f.satir))
    const durum: OnizlemeDurumu = hatalar.length ? 'hatali' : anahtar.some((a) => kayitli.has(a)) ? 'kayitli' : once !== undefined ? 'tekrar' : 'yeni'
    if (durum === 'tekrar') uyarilar.unshift(`Dosyada ${once}. satırla aynı firma.`)
    return { ...f, durum, uyarilar, hatalar }
  })
}

/** Örnek şablon (kurgusal firma; gerçek kişi bilgisi içermez). */
export const SABLON_BASLIKLARI = ['Unvan', 'Kısa ad', 'Blok/oda', 'Sektör', 'Web sitesi', 'Yetkili ad soyad', 'E-posta', 'Telefon']
export const SABLON_ORNEK = ['Örnek Yazılım Teknolojileri A.Ş.', 'Örnek Yazılım', 'C Blok 101', 'Yazılım', 'www.ornek.com.tr', '', 'info@ornek.com.tr', '']
