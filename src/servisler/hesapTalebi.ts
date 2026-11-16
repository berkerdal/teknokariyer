/**
 * Firma hesap talebi (kurallar src/alan/hesapTalebi.ts).
 * - Herkese açık form: alan denetimi, aydınlatma onayı, aynı adresten açık talep varsa yenisi açılmaz (sonuç aynı
 *   görünür; adresin kayıtlı olup olmadığı dışarıya belli edilmez). Talep edene “alındı” e-postası gider.
 * - Yönetici A.Ş. (moderasyon yetkisi) talebi bir firma kaydıyla eşleştirip yetkiliye davet gönderir (ekip davet servisi)
 *   ya da gerekçesiyle reddeder. Firmanın yetkili bilgisi boşsa talepten doldurulur.
 */
import type { Payload } from 'payload'
import { moderasyonYapabilirMi } from '@/erisim'
import { surum } from '@/metinler'
import { talepHatalari, type TalepGirdisi } from '@/alan/hesapTalebi'
import { hesapTalebiAlindiEpostasi, hesapTalebiRedEpostasi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { davetGonder } from './ekip'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export async function hesapTalebiOlustur(payload: Payload, g: TalepGirdisi & { aydinlatma: boolean }) {
  const temiz = {
    firmaAdi: g.firmaAdi.replace(/\s+/g, ' ').trim().slice(0, 200),
    konum: g.konum.replace(/\s+/g, ' ').trim().slice(0, 60),
    yetkiliAd: g.yetkiliAd.replace(/\s+/g, ' ').trim().slice(0, 120),
    unvan: g.unvan.replace(/\s+/g, ' ').trim().slice(0, 120),
    eposta: g.eposta.trim().toLocaleLowerCase('en'),
    telefon: g.telefon.trim().slice(0, 30),
    not: g.not.trim(),
  }
  const h = talepHatalari(temiz)
  if (!g.aydinlatma) h.aydinlatma = 'Göndermek için aydınlatma metnini okuduğunuzu onaylayın.'
  if (Object.keys(h).length) throw new FormHatasi(h)
  const acik = await payload.count({ collection: 'hesap-talepleri', where: { and: [{ eposta: { equals: temiz.eposta } }, { durum: { equals: 'yeni' } }] }, overrideAccess: true })
  if (acik.totalDocs) return null
  const t = await payload.create({
    collection: 'hesap-talepleri',
    data: { ...temiz, konum: temiz.konum || null, unvan: temiz.unvan || null, telefon: temiz.telefon || null, not: temiz.not || null, aydinlatmaSurumu: surum('firma-kullanici-aydinlatma'), durum: 'yeni' },
    overrideAccess: true,
  })
  const e = hesapTalebiAlindiEpostasi({ ad: temiz.yetkiliAd, firma: temiz.firmaAdi })
  await payload.sendEmail({ to: temiz.eposta, subject: e.konu, html: e.html, text: e.metin }).catch((): void => undefined)
  await islemKaydet(await istekOlustur(payload, null), { islem: 'Firma hesap talebi alındı', tur: 'kurulum', kayitTuru: 'hesap-talepleri', kayitId: t.id }).catch((): void => undefined)
  return t
}

async function acikTalep(payload: Payload, k: Kullanici, id: number) {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Hesap taleplerini sonuçlandırma yetkiniz yok.', 403)
  const t = await payload.findByID({ collection: 'hesap-talepleri', id, depth: 0, overrideAccess: true, disableErrors: true })
  if (!t) throw new IslemHatasi('Talep bulunamadı.', 404)
  if (t.durum !== 'yeni') throw new IslemHatasi('Bu talep zaten sonuçlandı.', 409)
  return t
}

/** Talebi firma kaydıyla eşleştirip yetkiliye tam yetkili davet gönderir. */
export async function hesapTalebiDavet(payload: Payload, k: Kullanici, id: number, firmaId: number) {
  const t = await acikTalep(payload, k, id)
  if (!firmaId) throw new FormHatasi({ firma: 'Talebin ait olduğu firmayı seçin. Firma listede yoksa önce iskelet kaydını oluşturun.' })
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!firma) throw new FormHatasi({ firma: 'Seçilen firma bulunamadı.' })
  if (firma.asama === 'pasif') throw new FormHatasi({ firma: 'Seçilen firma pasif. Önce firmayı yeniden etkinleştirin.' })
  const req = await istekOlustur(payload, k)
  const davet = await davetGonder(payload, k, { ad: t.yetkiliAd, eposta: t.eposta, firmaYetkisi: 'yonetici', firmaId })
  if (!firma.yetkiliAd && !firma.yetkiliEposta)
    await payload.update({ collection: 'firmalar', id: firmaId, data: { yetkiliAd: t.yetkiliAd, yetkiliEposta: t.eposta, yetkiliTelefon: t.telefon ?? undefined }, overrideAccess: true, req })
  await payload.update({ collection: 'hesap-talepleri', id, data: { durum: 'davet', firma: firmaId, sonuclandiran: k.id, sonuclanmaTarihi: new Date().toISOString() }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Firma hesap talebi: davet gönderildi', tur: 'kurulum', kayitTuru: 'firmalar', kayitId: firmaId, ayrinti: { talep: id } })
  return { davet, firma }
}

export async function hesapTalebiReddet(payload: Payload, k: Kullanici, id: number, gerekce: string) {
  const t = await acikTalep(payload, k, id)
  const g = gerekce.trim()
  if (g.length < 15) throw new FormHatasi({ gerekce: 'Talep edene gidecek gerekçeyi yazın (en az 15 karakter).' })
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'hesap-talepleri', id, data: { durum: 'red', retGerekcesi: g, sonuclandiran: k.id, sonuclanmaTarihi: new Date().toISOString() }, overrideAccess: true, req })
  const e = hesapTalebiRedEpostasi({ ad: t.yetkiliAd, firma: t.firmaAdi, gerekce: g })
  const gitti = await payload.sendEmail({ to: t.eposta, subject: e.konu, html: e.html, text: e.metin }).then(() => true, () => false)
  await islemKaydet(req, { islem: 'Firma hesap talebi reddedildi', tur: 'kurulum', kayitTuru: 'hesap-talepleri', kayitId: id })
  return { eposta: gitti }
}
