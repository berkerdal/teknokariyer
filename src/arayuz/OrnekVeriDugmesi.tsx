'use client'
import { useActionState } from 'react'
import { ornekVeriEylemi } from '@/eylemler/yonetim'
import { GonderDugmesi, type FormDurumu } from './form'

export function OrnekVeriDugmesi() {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ornekVeriEylemi, {})
  return (
    <form action={eylem} className="form-yigin">
      {durum.tamam && (
        <p className="basari-kutu" role="status">
          {durum.tamam}
        </p>
      )}
      {durum.genel && (
        <p className="hata-kutu" role="alert">
          {durum.genel}
        </p>
      )}
      <div>
        <GonderDugmesi className="dugme" bekleme="Yükleniyor; bu işlem bir dakika sürebilir…">
          Örnek veriyi yükle
        </GonderDugmesi>
      </div>
    </form>
  )
}
