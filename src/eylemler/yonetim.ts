'use server'
/** Yönetici A.Ş. test araçları. Yalnızca yönetici oturumu ve yayın dışı ortam. */
import type { FormDurumu } from '@/arayuz/form'
import { yoneticiMi } from '@/erisim'
import { ortam } from '@/altyapi/eposta'
import { ornekVeriYukle } from '@/ornekVeri/yukle'
import { oturum, payloadAl } from '@/veri/payload'

export async function ornekVeriEylemi(): Promise<FormDurumu> {
  if (ortam() === 'yayin') return { genel: 'Yayın ortamında örnek veri yüklenmez.' }
  const k = await oturum()
  if (!k || !yoneticiMi(k)) return { genel: 'Bu işlem yalnızca Yönetici A.Ş. yöneticisine açık.' }
  try {
    const s = await ornekVeriYukle(await payloadAl())
    return { tamam: `Örnek veri yüklendi: ${s.firma} firma, ${s.ilan} ilan, ${s.taksonomi} liste öğesi ve ${s.kullanici} kullanıcı eklendi. Var olan kayıtlar yeniden oluşturulmadı.`, surum: Date.now() }
  } catch (e) {
    console.error(e)
    return { genel: 'Örnek veri yüklenirken bir sorun oluştu. Sayfayı yenileyip yeniden deneyin.' }
  }
}
