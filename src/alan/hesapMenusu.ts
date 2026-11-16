/** Hesap menüsünün role göre içeriği (src/arayuz/HesapMenusu.tsx). Saf veri: istemci bileşenine sunucudan geçer. */
import type { IkonAdi } from '@/arayuz/Ikon'

export interface HesapMenusuOgesi {
  href: string
  ad: string
  ikon?: IkonAdi
  /** Gruplar arasına çizgi */
  ayrac?: boolean
}

const ayrac = (n: number): HesapMenusuOgesi => ({ href: `#ayrac-${n}`, ad: '', ayrac: true })

export function hesapMenusuOgeleri(rol: string, secenek: { yonetici?: boolean } = {}): HesapMenusuOgesi[] {
  if (rol === 'aday')
    return [
      { href: '/hesabim', ad: 'Başvurularım', ikon: 'liste' },
      { href: '/hesabim/kaydedilenler', ad: 'Kaydedilenler ve aramalar', ikon: 'yer-imi' },
      { href: '/hesabim/profil', ad: 'Profil ve CV’ler', ikon: 'kisi' },
      { href: '/hesabim/havuz', ad: 'CV havuzu', ikon: 'ara' },
      ayrac(1),
      { href: '/hesabim/hesap', ad: 'Hesap ve gizlilik', ikon: 'ayar' },
      { href: '/hesap-guvenligi', ad: 'Hesap güvenliği', ikon: 'kilit' },
    ]
  if (rol === 'firma')
    return [
      { href: '/firma-paneli', ad: 'Firma paneli', ikon: 'grafik' },
      { href: '/firma-paneli/ilanlar', ad: 'İlanlar', ikon: 'liste' },
      { href: '/firma-paneli/basvurular', ad: 'Başvurular', ikon: 'dosya' },
      { href: '/firma-paneli/havuz', ad: 'CV havuzu', ikon: 'ara' },
      ayrac(1),
      { href: '/firma-paneli/profil', ad: 'Firma profili', ikon: 'ofis' },
      { href: '/firma-paneli/ekip', ad: 'Ekip ve bilgilerim', ikon: 'kisi' },
      { href: '/hesap-guvenligi', ad: 'Hesap güvenliği', ikon: 'kilit' },
      ayrac(2),
      { href: '/', ad: 'Portalın ana sayfası', ikon: 'ev' },
    ]
  return [
    { href: '/yonetim', ad: 'Bugün', ikon: 'zil' },
    { href: '/yonetim/ozet', ad: 'Yönetici özeti', ikon: 'grafik' },
    { href: '/yonetim/firmalar', ad: 'Firmalar ve kurulum', ikon: 'ofis' },
    ...(secenek.yonetici ? [{ href: '/yonetim/kullanicilar', ad: 'Kullanıcılar', ikon: 'kisi' as const }] : []),
    ayrac(1),
    { href: '/hesap-guvenligi', ad: 'Hesap güvenliği', ikon: 'kilit' },
    { href: '/', ad: 'Portalın ana sayfası', ikon: 'ev' },
  ]
}
