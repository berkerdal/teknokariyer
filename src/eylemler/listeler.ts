'use server'
/** Yönetici A.Ş. liste eylemleri. Yetki ve kurallar serviste. */
import { revalidatePath } from 'next/cache'
import type { FormDurumu } from '@/arayuz/form'
import { listeOgesiniGuncelle, listeyeEkle, type ListeTuru } from '@/servisler/listeler'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

function hata(e: unknown, degerler?: Record<string, string>): FormDurumu {
  if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler }
  if (e instanceof IslemHatasi) return { genel: e.message, degerler }
  console.error(e)
  return { genel: 'Beklenmeyen bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.', degerler }
}

export async function listeEkleEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  const yineDe = f.get('yineDe') === 'on'
  try {
    const s = await listeyeEkle(await payloadAl(), k, metin(f, 'tur') as ListeTuru, metin(f, 'ogeler'), yineDe)
    revalidatePath('/yonetim/listeler')
    const parcalar = [
      s.eklenen.length ? `Eklendi: ${s.eklenen.join(', ')}.` : '',
      s.zatenVar.length ? `Zaten listede olduğu için eklenmedi: ${s.zatenVar.join(', ')}.` : '',
    ].filter(Boolean)
    if (s.benzer.length)
      return {
        hatalar: { ogeler: `Listede büyük olasılıkla aynı öğe var: ${s.benzer.map((b) => `“${b.ad}” → “${b.listede}”`).join(', ')}. Bunu eş anlamlı olarak ekleyin; yine de ayrı öğe olarak eklemek istiyorsanız aşağıdaki kutuyu işaretleyin.` },
        tamam: parcalar.join(' ') || undefined,
        degerler: { ogeler: s.benzer.map((b) => b.ad).join('\n'), benzer: '1' },
        surum: Date.now(),
      }
    return { tamam: parcalar.join(' ') || 'Eklenecek yeni öğe yok.', surum: Date.now() }
  } catch (e) {
    return hata(e, { ogeler: metin(f, 'ogeler') })
  }
}

export async function listeOgesiEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await yonetimOturumu()
  try {
    await listeOgesiniGuncelle(await payloadAl(), k, Number(metin(f, 'id')), {
      ad: metin(f, 'ad'),
      esAnlamlilar: metin(f, 'esAnlamlilar').split(/[\n,;]+/),
      aktif: f.get('aktif') === 'on',
    })
    revalidatePath('/yonetim/listeler')
    return { tamam: 'Kaydedildi.', surum: Date.now() }
  } catch (e) {
    return hata(e, { ad: metin(f, 'ad'), esAnlamlilar: metin(f, 'esAnlamlilar') })
  }
}
