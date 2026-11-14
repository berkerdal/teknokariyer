'use client'
import { useActionState } from 'react'
import { yayinaGonderEylemi } from '@/eylemler/firma'
import { GonderDugmesi, type FormDurumu } from '../form'

/** Önizlemeden yayına gönderme. Hata olursa düğmenin yanında Türkçe açıklama görünür; başarıda ilan listesine gider. */
export function YayinaGonder({ ilanId, metin }: { ilanId: number; metin: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(yayinaGonderEylemi, {})
  const hatalar = Object.values(durum.hatalar ?? {})
  return (
    <form action={eylem} className="yayina-gonder">
      <input type="hidden" name="ilan" value={ilanId} />
      {(durum.genel || hatalar.length > 0) && (
        <p className="hata-metni" role="alert">
          {durum.genel ?? `İlan gönderilemedi: ${hatalar.join(' ')}`}
        </p>
      )}
      <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
        {metin}
      </GonderDugmesi>
    </form>
  )
}
