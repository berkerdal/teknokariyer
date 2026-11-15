/**
 * Aday hesabının silinmesi (K27; KVKK m. 7 ve m. 11/e).
 *
 * - Başvurular firmada “aday hesabını sildi” olarak kalır. Başvurudaki ad, iletişim bilgileri (e-posta, telefon,
 *   bağlantılar), ön yazı ve CV hemen silinir. Eğitim, beceri ve ön eleme cevapları kalır; bunlar kişiyi tek başına
 *   tanıtmaz ve firmanın değerlendirme kaydının parçasıdır. İlan kapandıktan sonra saklama süresi dolunca başvuru
 *   tamamen anonimleşir (saklama.ts).
 * - Profil, bütün CV dosyaları, havuz kaydı ve görüntülenme kayıtları, onay (rıza) kayıtları ve hesap silinir.
 * - İşlem kaydına kişisel veri yazılmaz; yalnızca sayılar ve kimin başlattığı.
 *
 * İki yol: aday kendi hesabını şifresiyle siler, ya da tam yetkili Yönetici A.Ş. kullanıcısı bir KVKK silme talebi
 * üzerine siler.
 */
import type { Payload } from 'payload'
import { adayMi, yoneticiMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { PARCA } from '@/altyapi/parcali'
import { ortam } from '@/altyapi/eposta'
import { IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

export interface SilmeSonucu {
  basvuru: number
  cv: number
}

/** Başvurudaki profil kopyasından kişiyi doğrudan tanıtan alanları çıkarır. */
export function kopyadanKimligiCikar(p: unknown): Record<string, unknown> {
  const k = { ...((p && typeof p === 'object' ? p : {}) as Record<string, unknown>) }
  k.ad = null
  k.eposta = null
  k.telefon = null
  k.baglantilar = []
  k.hesapSilindi = true
  return k
}

/** Sorgu sonucunu 80'lik parçalar hâlinde siler (D1 en fazla 100 parametre kabul eder). */
async function hepsiniSil(payload: Payload, collection: 'havuz-goruntulemeleri' | 'rizalar' | 'test-postalar' | 'kaydedilen-ilanlar', where: Record<string, unknown>): Promise<number> {
  let toplam = 0
  for (let i = 0; i < 1000; i++) {
    const { docs } = await payload.find({ collection, where: where as never, limit: PARCA, depth: 0, overrideAccess: true })
    if (!docs.length) break
    await payload.delete({ collection, where: { id: { in: docs.map((d) => (d as { id: number }).id) } }, overrideAccess: true })
    toplam += docs.length
  }
  return toplam
}

export async function adayHesabiniSil(payload: Payload, yapan: Kullanici, adayKullaniciId: number, baglam: { kvkkTalebi?: number } = {}): Promise<SilmeSonucu> {
  const kendisi = adayMi(yapan) && Number(yapan.id) === adayKullaniciId
  if (!kendisi && !yoneticiMi(yapan)) throw new IslemHatasi('Bu hesabı silme yetkiniz yok.', 403)
  const hedef = await payload.findByID({ collection: 'kullanicilar', id: adayKullaniciId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!hedef) throw new IslemHatasi('Hesap bulunamadı; daha önce silinmiş olabilir.', 404)
  if (hedef.rol !== 'aday') throw new IslemHatasi('Bu işlemle yalnızca aday hesapları silinir. Firma ve kurum hesapları kapatılarak (pasif) yönetilir.', 400)

  // Veri değişiklikleri sunucunun kendi işlemi olarak yapılır (aday rolüne özgü kanca kuralları burada uygulanmaz);
  // işlem kaydı başlatanı yazar.
  const req = await istekOlustur(payload, null)
  const dosyalar = new Set<number>()

  // 1. Profil: CV'ler ve havuz görüntülenmeleri
  const { docs: profiller } = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: adayKullaniciId } }, depth: 0, limit: 1, overrideAccess: true })
  const profil = profiller[0]
  for (const c of profil?.cvler ?? []) if (c.dosya) dosyalar.add(kimlik(c.dosya))

  // 2. Başvurular firmada kalır; kimlik bilgileri, ön yazı ve CV çıkarılır
  let basvuru = 0
  for (let i = 0; i < 1000; i++) {
    const { docs } = await payload.find({
      collection: 'basvurular',
      where: { adayKullanici: { equals: adayKullaniciId } },
      select: { cv: true, profilKopyasi: true },
      limit: PARCA,
      depth: 0,
      overrideAccess: true,
    })
    if (!docs.length) break
    for (const b of docs) {
      if (b.cv) dosyalar.add(kimlik(b.cv))
      await payload.update({
        collection: 'basvurular',
        id: b.id,
        data: { profilKopyasi: kopyadanKimligiCikar(b.profilKopyasi), cv: null, onYazi: null, adayKullanici: null } as never,
        overrideAccess: true,
        req,
      })
      basvuru++
    }
  }

  // 3. Profil ve ona bağlı kayıtlar (profil bağlantısı zorunlu alan olduğu için önce görüntülenmeler)
  if (profil) {
    await hepsiniSil(payload, 'havuz-goruntulemeleri', { aday: { equals: profil.id } })
    await payload.delete({ collection: 'adaylar', id: profil.id, overrideAccess: true, req })
  }

  // 4. Kişinin yüklediği bütün dosyalar (profilden kaldırılmış eski CV'ler dahil)
  const { docs: sahipOlunan } = await payload.find({ collection: 'dosyalar', where: { sahip: { equals: adayKullaniciId } }, select: { tur: true }, limit: 500, depth: 0, overrideAccess: true })
  for (const d of sahipOlunan) dosyalar.add(d.id)
  let cv = 0
  for (const id of dosyalar) {
    try {
      await payload.delete({ collection: 'dosyalar', id, overrideAccess: true, req })
      cv++
    } catch (e) {
      // Dosya kaydı zaten yoksa sorun değil; başka bir hata işlemi durdurmaz, kayda geçer.
      console.error('Dosya silinemedi', id, e)
    }
  }

  // 5. Onay kayıtları (kullanıcı bağlantısı zorunlu alan) ve test ortamındaki e-posta kopyaları
  const riza = await hepsiniSil(payload, 'rizalar', { kullanici: { equals: adayKullaniciId } })
  await hepsiniSil(payload, 'kaydedilen-ilanlar', { kullanici: { equals: adayKullaniciId } })
  if (ortam() !== 'yayin') await hepsiniSil(payload, 'test-postalar', { kime: { equals: hedef.email } })

  // 6. Hesap
  await payload.delete({ collection: 'kullanicilar', id: adayKullaniciId, overrideAccess: true, req })

  // Kişi kendini sildiyse kaydı “kim” alanı silinmiş hesaba bağlanamaz; sistem adına yazılır, başlatan ayrıntıda kalır.
  await islemKaydet(kendisi ? req : await istekOlustur(payload, yapan), {
    islem: 'Aday hesabı silindi',
    tur: 'hesap',
    kayitTuru: 'kullanicilar',
    kayitId: adayKullaniciId,
    ayrinti: { baslatan: kendisi ? 'aday' : 'yonetici-as', basvuru, dosya: cv, riza, kvkkTalebi: baglam.kvkkTalebi ?? null },
  })
  return { basvuru, cv }
}
