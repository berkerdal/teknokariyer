import { Alt } from '@/arayuz/Alt'

/** Odaklı akışlar (başvuru): dikkat dağıtmamak için yalnızca sade alt şerit. */
export default function AkisDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Alt sade />
    </>
  )
}
