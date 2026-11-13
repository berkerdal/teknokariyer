/** Firma logosu gelene kadar blok/oda kodlu karo (“D208”). Baş harf avatarı kullanılmaz. */
export function FirmaKaro({ konum, boy = 48 }: { konum: string; boy?: number }) {
  const kod = konum.replace(/\s*Blok\s*/i, '').replace(/\s+/g, '')
  return (
    <span className="firma-karo" style={{ ['--boy' as string]: `${boy}px` }} aria-hidden="true">
      <span>{kod}</span>
    </span>
  )
}
