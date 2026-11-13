/**
 * Arayüz biçimleri: tarih, para, son başvuru metni. Tarihler Türkiye saatine göre yazılır.
 */
import { kalanGun } from '@/alan/ilan'
import { yonelmeEki } from '@/alan/metin'

const GUN_AY = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })
const GUN_AY_YIL = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })
const PARA = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

export const tarihYaz = (iso: string | Date, yil = false) => (yil ? GUN_AY_YIL : GUN_AY).format(new Date(iso))

/** “20 Kasım’a kadar”, son iki günde “Son 2 gün” / “Son gün”. */
export function sonTarih(iso: string, simdi = new Date()): { metin: string; vurgu: boolean; doldu: boolean } {
  const k = kalanGun(new Date(iso), simdi)
  if (k < 0) return { metin: 'Süresi doldu', vurgu: false, doldu: true }
  if (k <= 2) return { metin: k === 0 ? 'Son gün' : `Son ${k} gün`, vurgu: true, doldu: false }
  const t = tarihYaz(iso)
  return { metin: `${t}${yonelmeEki(t)} kadar`, vurgu: false, doldu: false }
}

export function ucretYaz(u?: { enAz?: number; enCok?: number }): string | undefined {
  if (!u) return undefined
  if (u.enAz && u.enCok) return `${PARA.format(u.enAz)}–${PARA.format(u.enCok)} ₺ (net, aylık)`
  if (u.enAz) return `${PARA.format(u.enAz)} ₺ ve üzeri (net, aylık)`
  if (u.enCok) return `${PARA.format(u.enCok)} ₺’ye kadar (net, aylık)`
  return undefined
}

/** İlan adresi: /ilan/12-flutter-gelistirici (sayı belirleyicidir, ad yalnızca okunurluk için). */
export function ilanAdresi(i: { id: number; pozisyonAdi: string }): string {
  const ad = i.pozisyonAdi
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60)
  return `/ilan/${i.id}${ad ? `-${ad}` : ''}`
}
