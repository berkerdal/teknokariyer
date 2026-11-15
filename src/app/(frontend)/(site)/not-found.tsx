import { BulunamadiGovdesi } from '@/arayuz/BulunamadiGovdesi'
import { Ust } from '@/arayuz/Ust'

/** Sitede bulunamayan kayıt (ilan, firma). HTTP 404 döner. */
export default function Bulunamadi() {
  return (
    <>
      <Ust />
      <BulunamadiGovdesi />
    </>
  )
}
