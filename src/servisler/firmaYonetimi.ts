/**
 * Yönetici A.Ş.'nin firma işleri (talimatlar 0.3; K3): iskelet kayıt, Yönetici A.Ş. alanları, yetkili, pasif yapma,
 * takip notu ve toplu davet. Davetin kendisi ekip servisindedir (`davetGonder`); burada yalnızca çağrılır.
 */
import type { Payload } from 'payload'
import type { Firmalar } from '@/payload-types'
import { moderasyonYapabilirMi, yoneticiMi } from '@/erisim'
import { adresAdi, yetkiliDurumu } from '@/alan/kurulum'
import { normallestir } from '@/alan/metin'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { davetGonder } from './ekip'
import { epostaGecerliMi, epostaNormallestir } from './hesapKurallari'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export interface FirmaKaydiGirdisi {
  unvan: string
  kisaAd: string
  konum: string
  sektor: number | null
  web: string
  yetkiliAd: string
  yetkiliEposta: string
  yetkiliTelefon: string
}

function yonetici(k: Kullanici) {
  if (!yoneticiMi(k)) throw new IslemHatasi('Firma kayıtlarını yalnızca tam yetkili Yönetici A.Ş. kullanıcıları değiştirebilir.', 403)
}

const tek = (s: string) => s.replace(/\s+/g, ' ').trim()

async function dogrula(payload: Payload, g: FirmaKaydiGirdisi, haricId?: number) {
  const hatalar: Record<string, string> = {}
  const v = { ...g, unvan: tek(g.unvan), kisaAd: tek(g.kisaAd), konum: tek(g.konum), yetkiliAd: tek(g.yetkiliAd), yetkiliTelefon: tek(g.yetkiliTelefon), web: g.web.trim() }
  const eposta = g.yetkiliEposta.trim() ? epostaNormallestir(g.yetkiliEposta) : ''
  if (v.unvan.length < 3) hatalar.unvan = 'Firmanın ticaret unvanını yazın. Örnek: Kodpit Teknoloji A.Ş.'
  if (v.kisaAd.length < 2 || v.kisaAd.length > 40) hatalar.kisaAd = 'Listelerde görünecek kısa adı 2 ile 40 karakter arasında yazın. Örnek: Kodpit Teknoloji'
  if (v.konum.length < 2) hatalar.konum = 'Firmanın Teknokent’teki yerini yazın. Örnek: D Blok 208'
  if (eposta && !epostaGecerliMi(eposta)) hatalar.yetkiliEposta = 'E-posta adresini ad.soyad@firma.com.tr biçiminde yazın.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  // Aynı firmanın ikinci kaydı açılmasın (talimatlar 0.3: tekrarlar işaretlenir)
  const { docs } = await payload.find({ collection: 'firmalar', select: { unvan: true, kisaAd: true }, limit: 5000, pagination: false, depth: 0, overrideAccess: true })
  const ayni = docs.find((d) => d.id !== haricId && (normallestir(d.unvan) === normallestir(v.unvan) || normallestir(d.kisaAd) === normallestir(v.kisaAd)))
  if (ayni) throw new FormHatasi({ kisaAd: `Bu firma zaten kayıtlı: ${ayni.kisaAd}. Aynı firmanın ikinci kaydını açmayın; mevcut kaydı düzenleyin.` })
  return { ...v, yetkiliEposta: eposta }
}

/** İskelet firma kaydı: firma henüz portalı kullanmıyor; Yönetici A.Ş. temel bilgileri ve yetkiliyi girer. */
export async function iskeletFirmaOlustur(payload: Payload, k: Kullanici, g: FirmaKaydiGirdisi): Promise<Firmalar> {
  yonetici(k)
  const v = await dogrula(payload, g)
  let slug = adresAdi(v.kisaAd) || `firma-${Date.now().toString(36)}`
  const ayniAdres = await payload.count({ collection: 'firmalar', where: { slug: { like: slug } }, overrideAccess: true })
  if (ayniAdres.totalDocs) slug = `${slug}-${ayniAdres.totalDocs + 1}`
  const req = await istekOlustur(payload, k)
  return payload.create({
    collection: 'firmalar',
    data: {
      unvan: v.unvan,
      kisaAd: v.kisaAd,
      slug,
      konum: v.konum,
      sektor: g.sektor,
      web: v.web || null,
      yetkiliAd: v.yetkiliAd || null,
      yetkiliEposta: v.yetkiliEposta || null,
      yetkiliTelefon: v.yetkiliTelefon || null,
      asama: 'iskelet',
    } as never,
    overrideAccess: true,
    req,
  })
}

export interface KurumAlanlari extends FirmaKaydiGirdisi {
  testFirmasi: boolean
  guvenilir: boolean
}

export async function firmaKaydiniGuncelle(payload: Payload, k: Kullanici, firmaId: number, g: KurumAlanlari): Promise<Firmalar> {
  yonetici(k)
  const v = await dogrula(payload, g, firmaId)
  const req = await istekOlustur(payload, k)
  const sonuc = await payload.update({
    collection: 'firmalar',
    id: firmaId,
    data: {
      unvan: v.unvan,
      kisaAd: v.kisaAd,
      konum: v.konum,
      sektor: g.sektor,
      web: v.web || null,
      yetkiliAd: v.yetkiliAd || null,
      yetkiliEposta: v.yetkiliEposta || null,
      yetkiliTelefon: v.yetkiliTelefon || null,
      testFirmasi: g.testFirmasi,
      guvenilir: g.guvenilir,
    } as never,
    overrideAccess: true,
    req,
  })
  await islemKaydet(req, { islem: 'Firma kaydı Yönetici A.Ş. tarafından güncellendi', tur: 'kurulum', kayitTuru: 'firmalar', kayitId: firmaId })
  return sonuc
}

/**
 * Teknokent’ten ayrılan firma pasif olur: herkese açık sayfalardan kalkar, yayındaki ilanları kapanır.
 * Geri alınınca aşama ekibe göre yeniden belirlenir.
 */
export async function firmaPasifligi(payload: Payload, k: Kullanici, firmaId: number, pasif: boolean) {
  yonetici(k)
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true })
  const req = await istekOlustur(payload, k)
  let asama: Firmalar['asama'] = 'pasif'
  let kapanan = 0
  if (pasif) {
    if (firma.asama === 'pasif') throw new IslemHatasi('Firma zaten pasif.', 409)
    const { docs } = await payload.find({ collection: 'ilanlar', where: { and: [{ firma: { equals: firmaId } }, { durum: { in: ['yayinda', 'duraklatildi', 'onayda'] } }] }, limit: 500, depth: 0, overrideAccess: true })
    for (const i of docs) await payload.update({ collection: 'ilanlar', id: i.id, data: { durum: 'kapandi', kapanisNedeni: 'moderasyon' }, overrideAccess: true, req })
    kapanan = docs.length
  } else {
    if (firma.asama !== 'pasif') throw new IslemHatasi('Firma pasif değil.', 409)
    const uye = await payload.count({ collection: 'kullanicilar', where: { and: [{ firma: { equals: firmaId } }, { pasif: { not_equals: true } }] }, overrideAccess: true })
    const davet = await payload.count({ collection: 'davetler', where: { firma: { equals: firmaId } }, overrideAccess: true })
    asama = uye.totalDocs ? (firma.yayinaHazir ? 'profil-tamam' : 'devralindi') : davet.totalDocs ? 'davet' : 'iskelet'
  }
  await payload.update({ collection: 'firmalar', id: firmaId, data: { asama }, overrideAccess: true, req })
  await islemKaydet(req, { islem: pasif ? 'Firma pasif yapıldı' : 'Firma yeniden etkin', tur: 'kurulum', kayitTuru: 'firmalar', kayitId: firmaId, ayrinti: { kapananIlan: kapanan } })
  return { asama, kapanan }
}

/** Takip notu (“Aradım, haftaya dolduracak”). Not işlem kaydına da adla ve saatle yazılır. */
export async function takipNotuEkle(payload: Payload, k: Kullanici, firmaId: number, not: string) {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Takip notunu yalnızca Yönetici A.Ş. yazabilir.', 403)
  const metin = not.trim()
  if (!metin) throw new FormHatasi({ not: 'Notu yazın. Örnek: Aradım, yetkili izinde; 18 Kasım’da dönecek.' })
  if (metin.length > 1000) throw new FormHatasi({ not: 'Not en fazla 1000 karakter olabilir.' })
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true })
  const req = await istekOlustur(payload, k)
  const yazan = k.ad ? `${metin} (${k.ad})` : metin
  await payload.update({
    collection: 'firmalar',
    id: firmaId,
    data: { takipNotlari: [...(firma.takipNotlari ?? []), { not: yazan, tarih: new Date().toISOString() }] },
    overrideAccess: true,
    req,
  })
  await islemKaydet(req, { islem: 'Kurulum takip notu yazıldı', tur: 'kurulum', kayitTuru: 'firmalar', kayitId: firmaId, ayrinti: { not: metin } })
}

export interface TopluDavetSonucu {
  gonderilen: string[]
  atlanan: Array<{ firma: string; neden: string }>
}

/** Seçilen iskelet firmaların yetkililerine tam yetkili davet gönderir. Uygun olmayan firma atlanır, nedeni söylenir. */
export async function topluDavet(payload: Payload, k: Kullanici, firmaIdler: number[]): Promise<TopluDavetSonucu> {
  if (!moderasyonYapabilirMi(k)) throw new IslemHatasi('Toplu daveti yalnızca Yönetici A.Ş. gönderebilir.', 403)
  if (!firmaIdler.length) throw new FormHatasi({ firma: 'Davet göndereceğiniz en az bir firma seçin.' })
  const { docs } = await payload.find({ collection: 'firmalar', where: { id: { in: firmaIdler.slice(0, 200) } }, limit: 200, depth: 0, overrideAccess: true })
  const sonuc: TopluDavetSonucu = { gonderilen: [], atlanan: [] }
  for (const f of docs) {
    const durum = yetkiliDurumu(f)
    if (f.asama !== 'iskelet') sonuc.atlanan.push({ firma: f.kisaAd, neden: 'Firma iskelet aşamasında değil; davet daha önce gönderilmiş.' })
    else if (durum === 'eksik') sonuc.atlanan.push({ firma: f.kisaAd, neden: 'Yetkili adı veya e-postası eksik.' })
    else if (durum === 'genel') sonuc.atlanan.push({ firma: f.kisaAd, neden: 'Yetkili e-postası genel bir kutu (info@ gibi); kişisel iş e-postası gerekir.' })
    else {
      try {
        await davetGonder(payload, k, { ad: f.yetkiliAd!, eposta: f.yetkiliEposta!, firmaYetkisi: 'yonetici', firmaId: f.id })
        sonuc.gonderilen.push(f.kisaAd)
      } catch (e) {
        sonuc.atlanan.push({ firma: f.kisaAd, neden: e instanceof IslemHatasi ? e.message : 'Davet gönderilemedi.' })
      }
    }
  }
  return sonuc
}

export interface AktarmaSonucu {
  satir: number
  kisaAd: string
  eklendi: boolean
  mesaj: string
  firmaId?: number
}

/**
 * Rehberden içe aktarma (talimatlar 0.3, 1): her satır iskelet kayıt olur. Sunucu denetimleri (tekrar, e-posta) yeniden
 * yapılır; önizlemedeki karar yalnızca yardımcıdır. Bir satırın hatası diğerlerini durdurmaz.
 */
export async function firmalariIceAktar(
  payload: Payload,
  k: Kullanici,
  satirlar: Array<{ satir: number; unvan: string; kisaAd: string; konum: string; sektor: string; web: string; yetkiliAd: string; yetkiliEposta: string; yetkiliTelefon: string }>,
): Promise<AktarmaSonucu[]> {
  yonetici(k)
  if (satirlar.length > 50) throw new IslemHatasi('Tek seferde en fazla 50 satır aktarılabilir.')
  const { docs: sektorler } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: 'sektor' } }, select: { ad: true }, limit: 500, pagination: false, depth: 0, overrideAccess: true })
  const sonuc: AktarmaSonucu[] = []
  for (const s of satirlar) {
    const sektor = sektorler.find((x) => normallestir(x.ad) === normallestir(s.sektor ?? ''))?.id ?? null
    try {
      const f = await iskeletFirmaOlustur(payload, k, { ...s, sektor })
      sonuc.push({ satir: s.satir, kisaAd: f.kisaAd, eklendi: true, mesaj: 'İskelet kayıt oluşturuldu.', firmaId: f.id })
    } catch (e) {
      const mesaj = e instanceof FormHatasi ? Object.values(e.alanlar).join(' ') : e instanceof IslemHatasi ? e.message : 'Kayıt oluşturulamadı.'
      if (!(e instanceof IslemHatasi)) console.error(e)
      sonuc.push({ satir: s.satir, kisaAd: s.kisaAd, eklendi: false, mesaj })
    }
  }
  const req = await istekOlustur(payload, k)
  await islemKaydet(req, { islem: 'Firma rehberinden içe aktarma', tur: 'kurulum', ayrinti: { eklenen: sonuc.filter((x) => x.eklendi).length, atlanan: sonuc.filter((x) => !x.eklendi).length } })
  return sonuc
}
