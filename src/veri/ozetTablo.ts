/** Yönetici özetindeki ilan tablosunun süzme ve sıralaması (sayfa ve CSV aynı kuralı kullanır). */
import { normallestir } from '@/alan/metin'
import type { OzetIlan } from './ozet'

export const SIRALAMALAR: Record<string, { ad: string; anahtar: (i: OzetIlan) => number | string }> = {
  yayin: { ad: 'Yayın tarihi', anahtar: (i) => i.yayinTarihi ?? '' },
  basvuru: { ad: 'Başvuru', anahtar: (i) => i.basvuru },
  donem: { ad: 'Dönemde başvuru', anahtar: (i) => i.donemBasvuru },
  yeni: { ad: 'Yeni', anahtar: (i) => i.yeni },
  goruntulenme: { ad: 'Görüntülenme', anahtar: (i) => i.goruntulenme },
  kalan: { ad: 'Kalan gün', anahtar: (i) => i.kalan ?? 9999 },
  firma: { ad: 'Firma', anahtar: (i) => normallestir(i.firma) },
}

export interface TabloSorgusu {
  durum?: string
  ara?: string
  sirala?: string
  yon?: string
}

export function tabloyuSuz(tablo: OzetIlan[], q: TabloSorgusu): OzetIlan[] {
  const ara = normallestir(q.ara ?? '')
  const s = SIRALAMALAR[q.sirala ?? ''] ?? SIRALAMALAR.yayin!
  const artan = q.yon === 'artan'
  return tablo
    .filter((i) => (!q.durum || (q.durum === 'acik' ? ['yayinda', 'duraklatildi'].includes(i.durum) : i.durum === q.durum)) && (!ara || normallestir(`${i.pozisyonAdi} ${i.firma}`).includes(ara)))
    .sort((a, b) => {
      const x = s.anahtar(a)
      const y = s.anahtar(b)
      const f = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'tr')
      return artan ? f : -f
    })
}
