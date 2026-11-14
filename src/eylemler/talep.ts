'use server'
/** Talep penceresinin eylemi: oturumdaki aday veya firma kullanıcısı adına talep oluşturur. */
import type { FormDurumu } from '@/arayuz/form'
import { TALEP_TUR_ADI } from '@/alan/talep'
import { taksonomiTalebiOlustur, type TalepTuru } from '@/servisler/talepler'
import { FormHatasi, IslemHatasi } from '@/servisler/ortak'
import { oturum, payloadAl } from '@/veri/payload'

const metin = (f: FormData, k: string) => String(f.get(k) ?? '')

export async function talepEylemi(_: FormDurumu, f: FormData): Promise<FormDurumu> {
  const k = await oturum()
  const siz = metin(f, 'hitap') !== 'sen'
  if (!k) return { genel: siz ? 'Oturumunuz sona ermiş. Yeniden giriş yapın.' : 'Oturumun sona ermiş. Yeniden giriş yap.' }
  const tur = metin(f, 'tur') as TalepTuru
  try {
    const s = await taksonomiTalebiOlustur(await payloadAl(), k, { tur, ogeler: metin(f, 'ogeler'), aciklama: metin(f, 'aciklama'), kaynak: metin(f, 'kaynak') })
    const ad = TALEP_TUR_ADI[tur]!
    const not = s.zatenVar.length ? ` ${s.zatenVar.join(', ')} zaten listedeydi; ${siz ? 'önerilerden seçebilirsiniz' : 'önerilerden seçebilirsin'}.` : ''
    return {
      tamam: siz
        ? `Talebiniz Yönetici A.Ş.’ye iletildi (${s.yeni.join(', ')}). Onaylanınca bu ${ad.tekil} listeye eklenir ve hemen seçilebilir.${not}`
        : `Talebin Yönetici A.Ş.’ye iletildi (${s.yeni.join(', ')}). Onaylanınca bu ${ad.tekil} listeye eklenir ve hemen seçebilirsin.${not}`,
      surum: Date.now(),
    }
  } catch (e) {
    if (e instanceof FormHatasi) return { hatalar: e.alanlar, degerler: { ogeler: metin(f, 'ogeler'), aciklama: metin(f, 'aciklama') } }
    if (e instanceof IslemHatasi) return { genel: e.message }
    console.error(e)
    return { genel: 'Talep gönderilemedi. Biraz sonra yeniden deneyin.' }
  }
}
