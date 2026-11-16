'use client'
/**
 * İlan bağlantısı. Mobilde ilan sayfasına gider. Geniş ekranda (≥ 1200 px; önizleme sütunu yalnızca orada görünür) liste kaybolmaz: ilan sağdaki önizlemede açılır,
 * kaydırma konumu korunur. JavaScript yoksa her zaman ilan sayfasına gider.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function IlanBaglantisi(props: { href: string; onizleme?: string; className?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <Link
      href={props.href}
      className={props.className}
      onClick={(e) => {
        if (!props.onizleme || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        if (!window.matchMedia('(min-width: 1200px)').matches) return
        e.preventDefault()
        router.push(props.onizleme, { scroll: false })
      }}
    >
      {props.children}
    </Link>
  )
}
