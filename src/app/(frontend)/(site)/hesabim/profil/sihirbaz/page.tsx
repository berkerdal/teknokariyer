import type { Metadata } from 'next'
import Link from 'next/link'
import { Ikon } from '@/arayuz/Ikon'
import { BeceriAlanlari, DeneyimAlanlari, DilAlanlari, EgitimAlanlari, HakkindaAlanlari, TercihAlanlari } from '@/arayuz/aday/ProfilAlanlari'
import { CvYukleFormu } from '@/arayuz/aday/ProfilFormlari'
import { SihirbazFormu } from '@/arayuz/aday/SihirbazFormu'
import { EN_FAZLA_CV, kendiAdayKaydi } from '@/servisler/profil'
import { cvOzetleri, taksonomiSecenekleri } from '@/veri/basvuru'
import { adayOturumu } from '@/veri/aday'
import { payloadAl } from '@/veri/payload'
import { SIHIRBAZ_ADIMLARI } from '@/veri/profil'

export const metadata: Metadata = { title: 'Profilini tamamla', robots: { index: false } }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

/** Profil sihirbazı (K28): yeni adaya adım adım yol gösterir. Her adım atlanabilir; bilgiler profil sayfasından da düzenlenir. */
export default async function SihirbazSayfasi({ searchParams }: Props) {
  const k = await adayOturumu('/hesabim/profil/sihirbaz')
  const no = Math.min(Math.max(Number((await searchParams).adim) || 1, 1), SIHIRBAZ_ADIMLARI.length)
  const adim = SIHIRBAZ_ADIMLARI[no - 1]!
  const a = await kendiAdayKaydi(await payloadAl(), k)
  const adres = (n: number) => (n > SIHIRBAZ_ADIMLARI.length ? '/hesabim/profil' : `/hesabim/profil/sihirbaz?adim=${n}`)
  const ortak = { sonraki: adres(no + 1), onceki: no > 1 ? adres(no - 1) : undefined }
  const sec = (t: 'universite' | 'bolum' | 'beceri' | 'dil') => taksonomiSecenekleri(t)

  let govde: React.ReactNode
  if (adim.kimlik === 'egitim') {
    const [okullar, bolumler] = await Promise.all([sec('universite'), sec('bolum')])
    govde = (
      <SihirbazFormu bolumler={['egitim']} {...ortak}>
        <EgitimAlanlari aday={a} okullar={okullar} bolumler={bolumler} />
      </SihirbazFormu>
    )
  } else if (adim.kimlik === 'deneyim') {
    govde = (
      <SihirbazFormu bolumler={['deneyim', 'deneyimler']} {...ortak}>
        <DeneyimAlanlari aday={a} />
      </SihirbazFormu>
    )
  } else if (adim.kimlik === 'beceriler') {
    govde = (
      <SihirbazFormu bolumler={['beceriler']} {...ortak}>
        <BeceriAlanlari aday={a} beceriler={await sec('beceri')} />
      </SihirbazFormu>
    )
  } else if (adim.kimlik === 'diller') {
    govde = (
      <SihirbazFormu bolumler={['diller']} {...ortak}>
        <DilAlanlari aday={a} diller={await sec('dil')} />
      </SihirbazFormu>
    )
  } else if (adim.kimlik === 'tercihler') {
    govde = (
      <SihirbazFormu bolumler={['tercihler', 'hakkinda']} {...ortak}>
        <TercihAlanlari aday={a} />
        <HakkindaAlanlari aday={a} />
      </SihirbazFormu>
    )
  } else {
    const cvler = cvOzetleri(a)
    govde = (
      <div className="form-yigin">
        {cvler.length > 0 && (
          <ul className="profil-liste">
            {cvler.map((c) => (
              <li key={c.id} className="dosya-satiri">
                <Ikon ad="dosya" />
                <span className="ad">{c.ad}</span>
              </li>
            ))}
          </ul>
        )}
        {cvler.length < EN_FAZLA_CV && <CvYukleFormu kalan={EN_FAZLA_CV - cvler.length} />}
        <div className="sihirbaz-ayak">
          <Link className="dugme dugme--ikincil" href={adres(no - 1)}>
            Geri
          </Link>
          <Link className="dugme" href="/hesabim/profil">
            {cvler.length ? 'Profilimi gör' : 'Şimdilik atla ve profilimi gör'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="sihirbaz">
      <p className="ust-etiket">
        Profilini tamamla · Adım {no} / {SIHIRBAZ_ADIMLARI.length}
      </p>
      <div className="cubuk-ilerleme" role="progressbar" aria-valuemin={1} aria-valuemax={SIHIRBAZ_ADIMLARI.length} aria-valuenow={no} aria-label={`Adım ${no} / ${SIHIRBAZ_ADIMLARI.length}`}>
        <span style={{ width: `${(no / SIHIRBAZ_ADIMLARI.length) * 100}%` }} />
      </div>
      <ol className="sihirbaz-adimlar">
        {SIHIRBAZ_ADIMLARI.map((s) => (
          <li key={s.no} aria-current={s.no === no ? 'step' : undefined}>
            <Link href={adres(s.no)}>{s.baslik}</Link>
          </li>
        ))}
      </ol>
      <h1 className="b1">{adim.baslik}</h1>
      <p className="ikincil">{adim.aciklama}</p>
      {govde}
    </div>
  )
}
