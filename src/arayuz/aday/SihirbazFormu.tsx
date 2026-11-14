'use client'
/**
 * Profil sihirbazının bir adımı (K28): kaydedince bir sonraki adıma geçer. Aynı profil eylemini kullanır.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'
import { profilKaydetEylemi } from '@/eylemler/aday'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function SihirbazFormu(props: { bolumler: string[]; sonraki: string; onceki?: string; children: React.ReactNode }) {
  const router = useRouter()
  const [durum, eylem] = useActionState<FormDurumu, FormData>(profilKaydetEylemi, {})
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    router.push(props.sonraki)
  }, [durum, props.sonraki, router])
  return (
    <form action={eylem} className="form-yigin" noValidate>
      <HataOzeti durum={durum} />
      {props.bolumler.map((b) => (
        <input key={b} type="hidden" name="profilBolumu" value={b} />
      ))}
      {props.children}
      <div className="sihirbaz-ayak">
        {props.onceki ? (
          <Link className="dugme dugme--ikincil" href={props.onceki}>
            Geri
          </Link>
        ) : (
          <span />
        )}
        <div className="dugme-grubu">
          <Link className="dugme dugme--sade" href={props.sonraki}>
            Bu adımı atla
          </Link>
          <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
            Kaydet ve devam et
          </GonderDugmesi>
        </div>
      </div>
    </form>
  )
}
