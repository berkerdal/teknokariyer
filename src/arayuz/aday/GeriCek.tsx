'use client'
import { useRef } from 'react'
import { geriCekEylemi } from '@/eylemler/aday'
import { GonderDugmesi } from '../form'

/**
 * Geri çekme onayı: ne olacağı işlemden önce söylenir. Geri çekilen ilana bir kez daha başvurulabilir
 * (src/alan/basvuru.ts → yenidenBasvuruDurumu); bu zaten yeniden başvuruysa (`sonHak`) bir daha başvurulamayacağı yazar.
 */
export function GeriCek({ basvuruId, pozisyon, sonHak = false }: { basvuruId: number; pozisyon: string; sonHak?: boolean }) {
  const pencere = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => pencere.current?.showModal()}>
        Başvuruyu geri çek
      </button>
      <dialog ref={pencere} className="pencere-dialog" aria-labelledby={`gc-${basvuruId}`}>
        <form action={geriCekEylemi} className="form-yigin" onSubmit={() => setTimeout(() => pencere.current?.close(), 0)}>
          <input type="hidden" name="basvuru" value={basvuruId} />
          <h2 className="b3" id={`gc-${basvuruId}`}>
            Başvuruyu geri çekmek istiyor musun?
          </h2>
          <p>
            <strong>{pozisyon}</strong> başvurun firmada “Aday geri çekti” olarak görünür.{' '}
            {sonHak ? 'Bu ilana ikinci başvurundu; geri çekersen aynı ilana bir daha başvuramazsın.' : 'Fikrini değiştirirsen aynı ilana bir kez daha başvurabilirsin.'}
          </p>
          <div className="dugme-grubu">
            <GonderDugmesi className="dugme dugme--tehlike" bekleme="Geri çekiliyor…">
              Geri çek
            </GonderDugmesi>
            <button type="button" className="dugme dugme--ikincil" onClick={() => pencere.current?.close()}>
              Vazgeç
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
