/** Rolün göremeyeceği sayfa: menüde bağlantı yoktur, adres elle yazılırsa açıklama gösterilir. */
export function YetkiYok({ baslik, neden }: { baslik: string; neden: string }) {
  return (
    <>
      <h1 className="b1">{baslik}</h1>
      <p className="uyari-kutu" role="note">
        {neden} Erişim gerekiyorsa tam yetkili bir Yönetici A.Ş. kullanıcısına başvurun.
      </p>
    </>
  )
}
