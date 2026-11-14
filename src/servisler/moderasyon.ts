/**
 * Yönetici A.Ş. kararları ve bildirimleri (talimatlar 4, K4). Kural servisleri (onayla, duzeltmeIste,
 * bekleyenDegisikligiSonuclandir, talebiSonuclandir) kararın kendisini uygular; burada karar işlem kaydına yazılır ve
 * ilgili kişiye e-posta gider. Panel yalnızca bu fonksiyonları çağırır.
 */
import type { Payload } from 'payload'
import { moderasyonYapabilirMi, yoneticiMi } from '@/erisim'
import { eksikKontroller } from '@/alan/moderasyon'
import { kalanGun } from '@/alan/ilan'
import { TALEP_TUR_ADI } from '@/alan/talep'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { basvurusuzHatirlatmaEpostasi, degisiklikSonucuEpostasi, ilanDuzeltmeEpostasi, ilanOnaylandiEpostasi, talepSonucuEpostasi } from '@/altyapi/epostaSablonlari'
import { ilanAdresi } from '@/arayuz/bicim'
import { duzeltmeIste, onayla } from './ilanIslemleri'
import { bekleyenDegisikligiSonuclandir } from './ilanFormu'
import { talebiSonuclandir } from './talepler'
import { firmaEkibineGonder } from './bildirim'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

/** E-posta gönderilemese de karar geçerlidir; hata kayda geçer, kullanıcıya ayrıca söylenir. */
async function guvenliGonder(is: () => Promise<unknown>): Promise<boolean> {
  try {
    await is()
    return true
  } catch (e) {
    console.error('Bildirim e-postası gönderilemedi', e)
    return false
  }
}

export interface OnayKarari {
  /** Firmayı “güvenilir” yap: sonraki ilanları onaya gitmeden yayınlanır. Yalnızca tam yetkili Yönetici A.Ş. kullanıcısı. */
  guvenilirYap?: boolean
  /** Kontrol listesinde işaretlenen maddeler (kayıt için) */
  kontroller?: string[]
}

export async function ilanOnayla(payload: Payload, k: Kullanici, ilanId: number, karar: OnayKarari = {}) {
  const eksik = eksikKontroller(karar.kontroller ?? [])
  if (eksik.length) throw new FormHatasi({ kontrol: `Onaylamadan önce kontrol listesindeki her maddeyi gözden geçirip işaretleyin. Eksik: ${eksik.join(' ')}` })
  if (karar.guvenilirYap && !yoneticiMi(k)) throw new IslemHatasi('Firmayı güvenilir olarak yalnızca tam yetkili Yönetici A.Ş. kullanıcısı işaretleyebilir.', 403)
  const ilan = await onayla(payload, k, ilanId)
  const firmaId = kimlik(ilan.firma)
  const req = await istekOlustur(payload, k)
  if (karar.guvenilirYap) {
    await payload.update({ collection: 'firmalar', id: firmaId, data: { guvenilir: true }, overrideAccess: true, req })
    await islemKaydet(req, { islem: 'Firma güvenilir olarak işaretlendi', tur: 'moderasyon', kayitTuru: 'firmalar', kayitId: firmaId })
  }
  await islemKaydet(req, { islem: 'İlan onaylandı ve yayına girdi', tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { kontroller: karar.kontroller } })
  const eposta = await guvenliGonder(() =>
    firmaEkibineGonder(payload, firmaId, ilanOnaylandiEpostasi({ pozisyonAdi: ilan.pozisyonAdi, id: ilan.id, adres: ilanAdresi(ilan) })),
  )
  return { ilan, eposta }
}

export async function ilanDuzeltmeIste(payload: Payload, k: Kullanici, ilanId: number, gerekce: string) {
  if (!gerekce.trim()) throw new FormHatasi({ not: 'Firmaya neyi düzeltmesi gerektiğini yazın.' })
  const ilan = await duzeltmeIste(payload, k, ilanId, gerekce)
  const req = await istekOlustur(payload, k)
  await islemKaydet(req, { islem: 'İlan için düzeltme istendi', tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { gerekce: gerekce.trim() } })
  const eposta = await guvenliGonder(() =>
    firmaEkibineGonder(payload, kimlik(ilan.firma), ilanDuzeltmeEpostasi({ pozisyonAdi: ilan.pozisyonAdi, id: ilan.id, gerekce: gerekce.trim() })),
  )
  return { ilan, eposta }
}

export async function degisiklikKarari(payload: Payload, k: Kullanici, ilanId: number, onay: boolean, gerekce = '') {
  if (!onay && !gerekce.trim()) throw new FormHatasi({ not: 'Firmaya değişikliği neden onaylamadığınızı yazın.' })
  const ilan = await bekleyenDegisikligiSonuclandir(payload, k, ilanId, onay, gerekce)
  const eposta = await guvenliGonder(() =>
    firmaEkibineGonder(payload, kimlik(ilan.firma), degisiklikSonucuEpostasi({ pozisyonAdi: ilan.pozisyonAdi, id: ilan.id, onay, gerekce: gerekce.trim() })),
  )
  return { ilan, eposta }
}

export async function talepKarari(payload: Payload, k: Kullanici, talepId: number, karar: { onay: boolean; kabulEdilenler?: string[]; not?: string }) {
  if (karar.onay && karar.kabulEdilenler && karar.kabulEdilenler.length === 0)
    throw new FormHatasi({ kabul: 'Eklenecek en az bir öğe seçin. Hiçbirini eklemeyecekseniz talebi reddedin.' })
  const t = await talebiSonuclandir(payload, k, talepId, karar)
  const eklenenler = (t.oneriler ?? []).filter((o) => o.kabul).map((o) => o.ad)
  const reddedilenler = (t.oneriler ?? []).filter((o) => !o.kabul).map((o) => o.ad)
  // Sonuç işlem kaydına koleksiyon kancasında yazılır (Talepler.ts)
  const eden = await payload.findByID({ collection: 'kullanicilar', id: kimlik(t.talepEden), depth: 0, overrideAccess: true }).catch((): null => null)
  let eposta = false
  if (eden && !eden.pasif) {
    const liste = TALEP_TUR_ADI[String(t.taksonomiTuru)]?.cogul ?? 'liste'
    const e = talepSonucuEpostasi({ ad: eden.ad, rol: eden.rol }, { liste: liste.charAt(0).toLocaleUpperCase('tr') + liste.slice(1), eklenenler, reddedilenler, not: karar.not })
    eposta = await guvenliGonder(() => payload.sendEmail({ to: eden.email, subject: e.konu, html: e.html, text: e.metin }))
  }
  return { talep: t, eklenenler, reddedilenler, eposta }
}

export const HATIRLATMA_ISLEMI = 'Başvurusuz ilan için firmaya hatırlatma gönderildi'

/** Son başvuruya az kalmış, hiç başvuru almamış ilan için firmaya hatırlatma (ilan başına bir kez). */
export async function basvurusuzHatirlat(payload: Payload, k: Kullanici, ilanId: number) {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Hatırlatmayı yalnızca Yönetici A.Ş. gönderebilir.', 403)
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!ilan || ilan.durum !== 'yayinda') throw new IslemHatasi('Bu ilan artık yayında değil; hatırlatma gerekmiyor.', 409)
  const once = await payload.count({ collection: 'islem-kayitlari', where: { and: [{ islem: { equals: HATIRLATMA_ISLEMI } }, { kayitId: { equals: String(ilanId) } }] }, overrideAccess: true })
  if (once.totalDocs) throw new IslemHatasi('Bu ilan için firmaya daha önce hatırlatma gönderildi.', 409)
  const req = await istekOlustur(payload, k)
  const kalan = Math.max(0, kalanGun(new Date(ilan.sonBasvuru), new Date()))
  const kisi = await firmaEkibineGonder(payload, kimlik(ilan.firma), basvurusuzHatirlatmaEpostasi({ pozisyonAdi: ilan.pozisyonAdi, id: ilan.id, kalan }))
  await islemKaydet(req, { islem: HATIRLATMA_ISLEMI, tur: 'moderasyon', kayitTuru: 'ilanlar', kayitId: ilanId, ayrinti: { alici: kisi } })
  return kisi
}
