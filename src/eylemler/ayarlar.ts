'use server'
import { revalidatePath } from 'next/cache'
import type { FormDurumu } from '@/arayuz/form'
import { ayarlariGuncelle } from '@/servisler/ayarlar'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const sayi = (f: FormData, k: string) => (String(f.get(k) ?? '').trim() === '' ? NaN : Number(String(f.get(k)).replace(',', '.')))

export async function ayarlarEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const degerler = Object.fromEntries(['onayliIlanSayisi', 'enUzunSureGun', 'hatirlatmaGunleri', 'havuzRizaAy', 'basvuruAnonimlestirmeAy', 'islemKaydiAy'].map((a) => [a, String(f.get(a) ?? '')]))
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
    })
  } catch (e) {
    if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
    if (e instanceof IslemHatasi) return { genel: e.message, degerler }
    console.error(e)
    return { genel: 'Ayarlar kaydedilemedi. Sayfayı yenileyip yeniden deneyin.', degerler }
  }
  revalidatePath('/', 'layout')
  return { tamam: 'Ayarlar kaydedildi. Değişiklik hemen geçerli.', surum: Date.now() }
}
