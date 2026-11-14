/**
 * Yönetici A.Ş. listeler, kullanıcılar ve ayarlar: yalnızca tam yetkili değiştirir; aynı şeyin ikinci yazımı eklenmez;
 * kurum hesabı şifre belirleme bağlantısıyla açılır; kimse kendi yetkisini değiştiremez; kapatılan hesap yetki taşımaz;
 * Payload ekranı yalnızca teknik sorumluya açık.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { kurumKullanicisiMi, moderasyonYapabilirMi, yoneticiMi } from '@/erisim'
import { listeOgesiniGuncelle, listeyeEkle } from '@/servisler/listeler'
import { kurumKullanicisiEkle, kurumKullanicisiPasifligi, kurumRoluDegistir, teknikSorumluYap } from '@/servisler/kurumKullanicilari'
import { ayarlariGuncelle } from '@/servisler/ayarlar'
import { girisYap, sifreYenile } from '@/servisler/hesap'
import { FormHatasi } from '@/servisler/ortak'

let payload: Payload
const ek = `ya${Date.now().toString(36)}`
let yonetici: any, moderator: any

beforeAll(async () => {
  payload = await getPayload({ config })
  const k = (e: string, v: Record<string, unknown>) =>
    payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `${e}-${ek}@ornek.com`, password: 'Deneme-12345', ad: e, _verified: true, ...v } as any })
  yonetici = await k('yay', { rol: 'yonetici', teknikSorumlu: true })
  moderator = await k('yam', { rol: 'moderator' })
})

describe('listeler', () => {
  it('yalnızca tam yetkili ekler; zaten olan ve aynı kökteki yazım eklenmez; yine de ekle seçeneği çalışır', async () => {
    await expect(listeyeEkle(payload, moderator, 'beceri', `Elm ${ek}`)).rejects.toMatchObject({ durumKodu: 403 })
    const a = await listeyeEkle(payload, yonetici, 'beceri', `Vue ${ek}\nSvelte ${ek}`)
    expect(a.eklenen).toEqual([`Vue ${ek}`, `Svelte ${ek}`])
    const b = await listeyeEkle(payload, yonetici, 'beceri', `vue ${ek}\nVue.js ${ek}`)
    expect(b.zatenVar).toEqual([`vue ${ek}`])
    expect(b.benzer).toEqual([{ ad: `Vue.js ${ek}`, listede: `Vue ${ek}` }])
    expect(b.eklenen).toEqual([])
    expect((await listeyeEkle(payload, yonetici, 'beceri', `Vue.js ${ek}`, true)).eklenen).toEqual([`Vue.js ${ek}`])
  })

  it('ad ve eş anlamlı başka öğeyle çakışamaz; seçilemez yapılabilir', async () => {
    const { docs } = await payload.find({ collection: 'taksonomiler', where: { ad: { equals: `Svelte ${ek}` } }, overrideAccess: true })
    const id = docs[0]!.id
    await expect(listeOgesiniGuncelle(payload, yonetici, id, { ad: `vue ${ek}`, esAnlamlilar: [], aktif: true })).rejects.toBeInstanceOf(FormHatasi)
    await expect(listeOgesiniGuncelle(payload, yonetici, id, { ad: `Svelte ${ek}`, esAnlamlilar: [`Vue.js ${ek}`], aktif: true })).rejects.toBeInstanceOf(FormHatasi)
    const g = await listeOgesiniGuncelle(payload, yonetici, id, { ad: `Svelte ${ek}`, esAnlamlilar: [`SvelteKit ${ek}`, `sveltekit ${ek}`], aktif: false })
    expect(g.aktif).toBe(false)
    expect(g.esAnlamlilar?.map((e) => e.ad)).toEqual([`SvelteKit ${ek}`])
  })
})

describe('Yönetici A.Ş. kullanıcıları', () => {
  it('hesap şifre belirleme bağlantısıyla açılır; bağlantıyla şifre belirlenip giriş yapılır', async () => {
    await expect(kurumKullanicisiEkle(payload, moderator, { ad: 'Yeni Kişi', eposta: `yeni-${ek}@ornek.com`, unvan: '', rol: 'moderator' })).rejects.toMatchObject({ durumKodu: 403 })
    const u = await kurumKullanicisiEkle(payload, yonetici, { ad: 'Yeni Kişi', eposta: `yeni-${ek}@ornek.com`, unvan: 'Uzman', rol: 'moderator' })
    expect(u.rol).toBe('moderator')
    expect(u.teknikSorumlu).toBeFalsy()
    const posta = await payload.find({ collection: 'test-postalar', where: { kime: { contains: `yeni-${ek}` } }, overrideAccess: true, limit: 1 })
    expect((posta.docs[0] as any).konu).toBe('TeknoKariyer yönetim hesabınız açıldı')
    const anahtar = decodeURIComponent(JSON.stringify(posta.docs[0]).match(/anahtar=([A-Za-z0-9_%-]+)/)![1]!)
    await sifreYenile(payload, anahtar, 'Yeni-Sifre-2026!')
    const g = await girisYap(payload, `yeni-${ek}@ornek.com`, 'Yeni-Sifre-2026!')
    expect(g.rol).toBe('moderator')
    await expect(kurumKullanicisiEkle(payload, yonetici, { ad: 'Tekrar', eposta: `yeni-${ek}@ornek.com`, unvan: '', rol: 'moderator' })).rejects.toBeInstanceOf(FormHatasi)
  })

  it('kendi yetkisini değiştiremez, kendini kapatamaz; kapatılan hesap hiçbir kurum yetkisi taşımaz', async () => {
    await expect(kurumRoluDegistir(payload, yonetici, yonetici.id, 'moderator')).rejects.toMatchObject({ durumKodu: 409 })
    await expect(kurumKullanicisiPasifligi(payload, yonetici, yonetici.id, true)).rejects.toMatchObject({ durumKodu: 409 })
    await kurumKullanicisiPasifligi(payload, yonetici, moderator.id, true)
    const kapali = await payload.findByID({ collection: 'kullanicilar', id: moderator.id, overrideAccess: true })
    expect(moderasyonYapabilirMi(kapali as any)).toBe(false)
    expect(kurumKullanicisiMi(kapali as any)).toBe(false)
    await expect(girisYap(payload, `yam-${ek}@ornek.com`, 'Deneme-12345')).rejects.toThrow(/kapatıldı/)
    await kurumKullanicisiPasifligi(payload, yonetici, moderator.id, false)
    expect(yoneticiMi(yonetici)).toBe(true)
  })

  it('Payload ekranı yalnızca teknik sorumluya açık; işareti yalnızca teknik sorumlu verir', async () => {
    const erisim = payload.collections.kullanicilar.config.access.admin!
    expect(await erisim({ req: { user: yonetici } } as any)).toBe(true)
    expect(await erisim({ req: { user: moderator } } as any)).toBe(false)
    await expect(teknikSorumluYap(payload, moderator, moderator.id, true)).rejects.toMatchObject({ durumKodu: 403 })
    await teknikSorumluYap(payload, yonetici, moderator.id, true)
    const m = await payload.findByID({ collection: 'kullanicilar', id: moderator.id, overrideAccess: true })
    expect(await erisim({ req: { user: m } } as any)).toBe(true)
    await expect(teknikSorumluYap(payload, yonetici, yonetici.id, false)).rejects.toMatchObject({ durumKodu: 409 })
  })
})

describe('ayarlar', () => {
  it('geçersiz değerler alan hatasıyla reddedilir; geçerli değerler kaydedilir', async () => {
    await expect(ayarlariGuncelle(payload, moderator, { onayliIlanSayisi: 3, enUzunSureGun: 60, hatirlatmaGunleri: [3, 7, 14], havuzRizaAy: 12 })).rejects.toMatchObject({ durumKodu: 403 })
    const h = await ayarlariGuncelle(payload, yonetici, { onayliIlanSayisi: 11, enUzunSureGun: 2, hatirlatmaGunleri: [], havuzRizaAy: 0 }).catch((e) => e)
    expect(Object.keys((h as FormHatasi).alanlar).sort()).toEqual(['enUzunSureGun', 'hatirlatmaGunleri', 'havuzRizaAy', 'onayliIlanSayisi'])
    const once = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
    await ayarlariGuncelle(payload, yonetici, { onayliIlanSayisi: 2, enUzunSureGun: 45, hatirlatmaGunleri: [7, 2, 7], havuzRizaAy: 18 })
    const a = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
    expect(a.hatirlatmaGunleri?.map((x) => x.gun)).toEqual([2, 7])
    expect(a.saklama?.havuzRizaAy).toBe(18)
    // diğer testler varsayılanlara güvenir: geri al
    await payload.updateGlobal({ slug: 'ayarlar', data: once as any, overrideAccess: true })
  })
})
