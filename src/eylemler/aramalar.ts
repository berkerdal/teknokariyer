'use server'
/** Kayıtlı aramalar: kaydetme, sıklık değiştirme ve silme (servis: src/servisler/kayitliAramalar.ts). */
import { revalidatePath } from 'next/cache'
import type { AramaTuru, Siklik } from '@/alan/kayitliArama'
import { aramaKaydet, aramaSikligi, aramaSil } from '@/servisler/kayitliAramalar'
import { IslemHatasi } from '@/servisler/ortak'
import { oturum, payloadAl } from '@/veri/payload'

const yenile = (tur: AramaTuru) => revalidatePath(tur === 'ilan' ? '/hesabim/kaydedilenler' : '/firma-paneli/havuz')

/** Aramayı kaydeder; hata Türkçe mesajla döner. */
export async function aramaKaydetEylemi(tur: AramaTuru, sorgu: string, siklik: Siklik, ad?: string): Promise<{ hata?: string }> {
  try {
    await aramaKaydet(await payloadAl(), await oturum(), { tur, sorgu: String(sorgu ?? '').slice(0, 600), siklik, ad: ad?.slice(0, 120) })
  } catch (e) {
    if (e instanceof IslemHatasi) return { hata: e.message }
    console.error(e)
    return { hata: 'Arama kaydedilemedi. Sayfayı yenileyip yeniden dene.' }
  }
  yenile(tur)
  return {}
}

/** Kayıtlı arama listesindeki düğmeler: sıklık değiştir veya sil. */
export async function aramaIslemEylemi(f: FormData): Promise<void> {
  const id = Number(f.get('id'))
  const tur: AramaTuru = f.get('tur') === 'havuz' ? 'havuz' : 'ilan'
  const p = await payloadAl()
  const k = await oturum()
  try {
    if (f.get('islem') === 'sil') await aramaSil(p, k, id)
    else await aramaSikligi(p, k, id, f.get('siklik') === 'anlik' ? 'anlik' : 'haftalik')
  } catch (e) {
    if (!(e instanceof IslemHatasi)) console.error(e)
  }
  yenile(tur)
}
