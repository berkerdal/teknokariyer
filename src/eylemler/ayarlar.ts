'use server'
import { revalidatePath } from 'next/cache'
import type { FormDurumu } from '@/arayuz/form'
import { ayarlariGuncelle } from '@/servisler/ayarlar'
import { GUVENLIK_AYARLARI, type GuvenlikAyarlari } from '@/alan/ikiAdim'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const sayi = (f: FormData, k: string) => (String(f.get(k) ?? '').trim() === '' ? NaN : Number(String(f.get(k)).replace(',', '.')))

export async function ayarlarEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const alanlar = ['onayliIlanSayisi', 'enUzunSureGun', 'hatirlatmaGunleri', 'havuzRizaAy', 'basvuruAnonimlestirmeAy', 'islemKaydiAy', ...GUVENLIK_AYARLARI.map((a) => a.ad)]
  const degerler = Object.fromEntries(alanlar.map((a) => [a, String(f.get(a) ?? '')]))
  try {
    await ayarlariGuncelle(await payloadAl(), k, {
      onayliIlanSayisi: sayi(f, 'onayliIlanSayisi'),
      enUzunSureGun: sayi(f, 'enUzunSureGun'),
      hatirlatmaGunleri: String(f.get('hatirlatmaGunleri') ?? '')
        .split(/[\s,;.]+/)
        .filter(Boolean)
        .map(Number),
      havuzRizaAy: sayi(f, 'havuzRizaAy'),
      basvuruAnonimlestirmeAy: sayi(f, 'basvuruAnonimlestirmeAy'),
      islemKaydiAy: sayi(f, 'islemKaydiAy'),
      guvenlik: Object.fromEntries(GUVENLIK_AYARLARI.map((a) => [a.ad, sayi(f, a.ad)])) as GuvenlikAyarlari,
    })
  } catch (e) {
    if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler, surum: Date.now() }
    if (e instanceof IslemHatasi) return { genel: e.message, degerler, surum: Date.now() }
    console.error(e)
    return { genel: 'Ayarlar kaydedilemedi. Sayfayı yenileyip yeniden deneyin.', degerler, surum: Date.now() }
  }
  revalidatePath('/', 'layout')
  return { tamam: 'Ayarlar kaydedildi. Değişiklik hemen geçerli.', surum: Date.now() }
}
