/**
 * İlan şikâyeti (kurallar src/alan/sikayet.ts).
 * - Aday yayındaki bir ilanı bildirir: aynı ilana açık bildirimi varsa ikincisi alınmaz; günde en fazla 5 bildirim.
 * - Yönetici A.Ş. (moderasyon yetkisi) bir ilanın açık bildirimlerini birlikte sonuçlandırır: yersiz, firma uyarıldı veya
 *   ilan yayından kaldırıldı. Firmaya mesaj, bildirenlere sonuç e-postası gider; karar işlem kaydına geçer.
 */
import type { Payload } from 'payload'
import { adayMi, moderasyonYapabilirMi } from '@/erisim'
import { GUNLUK_SIKAYET_SINIRI, SIKAYET_SONUCU, kararHatasi, sikayetHatasi, type SikayetSonucu } from '@/alan/sikayet'
import { sikayetFirmaEpostasi, sikayetSonucEpostasi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { firmaEkibineGonder } from './bildirim'
import { yayindanKaldir } from './ilanIslemleri'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

export async function sikayetEt(payload: Payload, k: Kullanici | null, g: { ilanId: number; neden: string; aciklama?: string }) {
  if (!k || !adayMi(k)) throw new IslemHatasi('İlanı bildirmek için aday hesabınla giriş yap.', 403)
  const aciklama = String(g.aciklama ?? '').trim()
  const hata = sikayetHatasi(g.neden, aciklama)
  if (hata) throw new FormHatasi({ [hata.startsWith('Bildirim nedenini') ? 'neden' : 'aciklama']: hata })
  const ilan = await payload.findByID({ collection: 'ilanlar', id: g.ilanId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!ilan || ilan.durum !== 'yayinda') throw new IslemHatasi('Bu ilan yayında değil; bildirim alınamıyor.', 409)
  const acik = await payload.count({ collection: 'sikayetler', where: { and: [{ ilan: { equals: ilan.id } }, { gonderen: { equals: k.id } }, { durum: { equals: 'yeni' } }] }, overrideAccess: true })
  if (acik.totalDocs) throw new IslemHatasi('Bu ilanı zaten bildirdin; bildirimin inceleniyor.', 409)
  const gun = await payload.count({ collection: 'sikayetler', where: { and: [{ gonderen: { equals: k.id } }, { createdAt: { greater_than: new Date(Date.now() - 86_400_000).toISOString() } }] }, overrideAccess: true })
  if (gun.totalDocs >= GUNLUK_SIKAYET_SINIRI) throw new IslemHatasi(`Bir günde en fazla ${GUNLUK_SIKAYET_SINIRI} ilan bildirebilirsin. Yarın yeniden deneyebilirsin.`, 429)
  const req = await istekOlustur(payload, k)
  const s = await payload.create({ collection: 'sikayetler', data: { ilan: ilan.id, gonderen: k.id, neden: g.neden as never, aciklama: aciklama || null, durum: 'yeni' }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'İlan bildirildi', tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilan.id, ayrinti: { neden: g.neden } })
  return s
}

/** Bir ilanın açık bildirimlerini sonuçlandırır. Dönen: bildirenlere ve firmaya giden e-posta sayıları. */
export async function sikayetleriSonuclandir(payload: Payload, k: Kullanici, ilanId: number, g: { sonuc: string; firmaMesaji?: string; icNot?: string }) {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Bildirimleri sonuçlandırma yetkiniz yok.', 403)
  const firmaMesaji = String(g.firmaMesaji ?? '').trim()
  const hata = kararHatasi(g.sonuc, firmaMesaji)
  if (hata) throw new FormHatasi({ [g.sonuc in SIKAYET_SONUCU ? 'firmaMesaji' : 'sonuc']: hata })
  const sonuc = g.sonuc as SikayetSonucu
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!ilan) throw new IslemHatasi('İlan bulunamadı.', 404)
  const { docs } = await payload.find({ collection: 'sikayetler', where: { and: [{ ilan: { equals: ilanId } }, { durum: { equals: 'yeni' } }] }, limit: 500, depth: 0, overrideAccess: true })
  if (!docs.length) throw new IslemHatasi('Bu ilan için sonuç bekleyen bildirim yok.', 409)
  const req = await istekOlustur(payload, k)
  if (sonuc === 'ilan-kaldirildi' && ['yayinda', 'duraklatildi'].includes(ilan.durum)) await yayindanKaldir(payload, k, ilanId, firmaMesaji)
  const simdi = new Date().toISOString()
  for (const s of docs)
    await payload.update({
      collection: 'sikayetler',
      id: s.id,
      data: { durum: 'sonuclandi', sonuc, firmaMesaji: firmaMesaji || null, icNot: String(g.icNot ?? '').trim() || null, sonuclandiran: k.id, sonuclanmaTarihi: simdi },
      overrideAccess: true,
      req,
    })
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(ilan.firma), depth: 0, overrideAccess: true, select: { kisaAd: true } })
  let firmaya = 0
  if (sonuc !== 'yersiz')
    firmaya = await firmaEkibineGonder(
      payload,
      kimlik(ilan.firma),
      sikayetFirmaEpostasi({ pozisyonAdi: ilan.pozisyonAdi, kaldirildi: sonuc === 'ilan-kaldirildi', mesaj: firmaMesaji, adres: sonuc === 'ilan-kaldirildi' ? '/firma-paneli/ilanlar' : `/firma-paneli/ilanlar/${ilan.id}` }),
    ).catch((): number => 0)
  // Bildirenlere birer kez (aynı kişi iki kez bildirdiyse tek e-posta)
  const kisiler = [...new Set(docs.map((s) => (s.gonderen ? kimlik(s.gonderen) : 0)).filter(Boolean))]
  let bildirene = 0
  for (const id of kisiler) {
    const u = await payload.findByID({ collection: 'kullanicilar', id, depth: 0, overrideAccess: true, disableErrors: true })
    if (!u?.email) continue
    const e = sikayetSonucEpostasi({ ad: u.ad, pozisyonAdi: ilan.pozisyonAdi, firma: firma.kisaAd, sonuc })
    await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin }).then((): void => void bildirene++).catch((): void => undefined)
  }
  await islemKaydet(req, { islem: 'İlan bildirimleri sonuçlandı', tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { sonuc, bildirim: docs.length } })
  return { bildirim: docs.length, firmaya, bildirene }
}
