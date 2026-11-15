/** Gelişmiş yönetim ekranının (Payload) menüsüne eklenen bağlantılar. */
import Link from 'next/link'

export function GelismisBaglantilar() {
  return (
    <Link className="nav__link" href="/admin/liste-aktar" prefetch={false}>
      <span className="nav__link-label">Liste aktarma (YÖK)</span>
    </Link>
  )
}
