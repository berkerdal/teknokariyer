'use client'
/**
 * Form parçaları. Her hata görünür ve Türkçe (CLAUDE.md 5):
 * - Formun üstünde hata özeti; odak oraya taşınır; her madde ilgili alana götürür (GOV.UK kalıbı).
 * - Her alanın altında ne yapılacağını söyleyen mesaj.
 */
import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

export interface FormDurumu {
  hatalar?: Record<string, string>
  genel?: string
  tamam?: string
  /** Her başarılı kayıtta değişir; pencereler kaydın bittiğini buradan anlar. */
  surum?: number
  /** Hata sonrası formu yeniden doldurmak için (şifreler hiçbir zaman geri gönderilmez). */
  degerler?: Record<string, string>
}

export function HataOzeti({ durum, alanlar }: { durum: FormDurumu; alanlar?: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null)
  const hatalar = Object.entries(durum.hatalar ?? {})
  const var_ = hatalar.length > 0 || Boolean(durum.genel)
  useEffect(() => {
    if (var_) ref.current?.focus()
  }, [durum, var_])
  if (!var_) return null
  return (
    <div className="hata-ozeti" tabIndex={-1} ref={ref} role="alert">
      <h2>{hatalar.length ? 'Devam etmeden önce düzelt' : 'İşlem tamamlanamadı'}</h2>
      {durum.genel && <p>{durum.genel}</p>}
      {hatalar.length > 0 && (
        <ul>
          {hatalar.map(([alan, mesaj]) => (
            <li key={alan}>
              <a href={`#${alanlar?.[alan] ?? alan}`}>{mesaj}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Alan(props: {
  id: string
  etiket: string
  hata?: string
  ipucu?: React.ReactNode
  istegeBagli?: boolean
  children?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { id, etiket, hata, ipucu, istegeBagli, children, ...girdi } = props
  const tanim = [ipucu ? `${id}-ipucu` : '', hata ? `${id}-hata` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={hata ? 'alan alan--hata' : 'alan'}>
      <label htmlFor={id}>
        {etiket} {istegeBagli && <span className="istege-bagli">(isteğe bağlı)</span>}
      </label>
      {ipucu && (
        <div className="ipucu" id={`${id}-ipucu`}>
          {ipucu}
        </div>
      )}
      {hata && (
        <p className="hata-metni" id={`${id}-hata`}>
          {hata}
        </p>
      )}
      <input id={id} name={id} className="girdi" aria-invalid={hata ? true : undefined} aria-describedby={tanim} {...girdi} />
      {children}
    </div>
  )
}

export function GonderDugmesi({ children, bekleme = 'Gönderiliyor…', className = 'dugme dugme--genis' }: { children: React.ReactNode; bekleme?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? bekleme : children}
    </button>
  )
}

/** Dosya seçici: tarayıcının kendi (dili değişebilen) düğmesi yerine Türkçe düğme ve seçilen dosyanın adı. */
export function DosyaSecici({ id, ad, kabul = 'application/pdf,.pdf', etiket = 'PDF seç' }: { id: string; ad: string; kabul?: string; etiket?: string }) {
  const [dosya, setDosya] = useState('')
  return (
    <div className="dosya-secici">
      <input id={id} name={ad} type="file" accept={kabul} className="gizli" onChange={(e) => setDosya(e.target.files?.[0]?.name ?? '')} />
      <label htmlFor={id} className="dugme dugme--ikincil dugme--kucuk">
        {etiket}
      </label>
      <span className="kucuk" aria-live="polite">
        {dosya || 'Dosya seçilmedi'}
      </span>
    </div>
  )
}
