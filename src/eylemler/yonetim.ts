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

/** Test posta kutusunu boşaltır (yalnızca yayın dışı ortam ve tam yetkili). Silme toplu ve sayfalıdır (D1 parametre sınırı). */
export async function testPostalariniBosaltEylemi(): Promise<void> {
  if (ortam() === 'yayin') return
  const k = await oturum()
  if (!k || !yoneticiMi(k)) return
  const payload = await payloadAl()
  for (;;) {
    const { docs } = await payload.find({ collection: 'test-postalar', limit: 80, depth: 0, select: {}, overrideAccess: true })
    if (!docs.length) break
    await payload.delete({ collection: 'test-postalar', where: { id: { in: docs.map((d) => d.id) } }, overrideAccess: true })
  }
  const { redirect } = await import('next/navigation')
  redirect('/yonetim/test-postalari?bosaltildi=1')
}
