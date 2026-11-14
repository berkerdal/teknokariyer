import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { FirmaKaro } from '@/arayuz/FirmaKaro'
import { FirmaProfiliFormu, LogoFormu } from '@/arayuz/firma/FirmaProfiliFormu'
import { KURUM } from '@/altyapi/kurum'
import { firmaYetkisiVarMi } from '@/erisim'
import { firmaOturumu, ilanFormuSecenekleri, oturumdakiFirma } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Firma profili · Firma paneli' }

const nesne = <T,>(x: unknown) => (x && typeof x === 'object' ? (x as T) : null)

/** Firma profili (K3): tanıtım alanları firmada, kimlik alanları (unvan, yeri) Yönetici A.Ş.'de. */
export default async function FirmaProfili() {
  const k = await firmaOturumu('/firma-paneli/profil')
  const [firma, { beceriler }] = await Promise.all([oturumdakiFirma(), ilanFormuSecenekleri()])
  if (!firma) return null
  const payload = await payloadAl()
  const { docs: sektorler } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: 'sektor' } }, select: { ad: true }, limit: 500, pagination: false, depth: 0, overrideAccess: true })
  const duzenler = firmaYetkisiVarMi(k, ['yonetici'])
  const logo = nesne<{ url?: string }>(firma.logo)?.url ?? null
  const eksikler = [!firma.logo && 'logo', !firma.kisaTanitim?.trim() && 'kısa tanıtım', !firma.sektor && 'sektör'].filter(Boolean) as string[]
  const secenek = (x: unknown) => nesne<{ id: number; ad: string }>(x)

  return (
    <>
      <div className="f-bas">
        <div>
          <h1 className="b1">Firma profili</h1>
          <p className="ikincil">Adayların firma sayfanızda ve ilanlarınızda gördüğü bilgiler.</p>
        </div>
        {firma.yayinaHazir && !firma.testFirmasi && (
          <Link className="dugme dugme--ikincil dugme--kucuk" href={`/firma/${firma.slug}`} target="_blank">
            Firma sayfasını aç
          </Link>
        )}
      </div>
      <ModulBilgisi kimlik="firma-profili" baslik="Firma profili ne işe yarar?">
        <ul>
          <li>Profiliniz firma sayfanızda, firma listesinde ve her ilanınızda görünür. İyi bir profil, adayların firmanızı tanımasını sağlar.</li>
          <li>Profilin herkese açık görünmesi için üç bilgi gerekir: logo, kısa tanıtım ve sektör.</li>
          <li>Unvan, kısa ad ve Teknokent’teki yeriniz Yönetici A.Ş. kayıtlarından gelir. Hatalıysa Yönetici A.Ş.’ye bildirin.</li>
        </ul>
      </ModulBilgisi>

      <div className={eksikler.length ? 'uyari-kutu' : 'basari-kutu'}>
        {eksikler.length ? (
          <p>
            <strong>Profiliniz henüz herkese açık değil.</strong> Görünmesi için şunları ekleyin: {eksikler.join(', ')}.
          </p>
        ) : (
          <p>
            <strong>Profiliniz yayına hazır.</strong> Firma sayfanız ve ilanlarınız adaylara bu bilgilerle görünür.
          </p>
        )}
      </div>

      <section className="panel f-blok">
        <h2 className="b3 kare-bas">Kayıt bilgileri</h2>
        <div className="firma-kimlik">
          <FirmaKaro konum={firma.konum} boy={48} />
          <dl className="ozet-dl">
            <div>
              <dt>Unvan</dt>
              <dd>{firma.unvan}</dd>
            </div>
            <div>
              <dt>Kısa ad</dt>
              <dd>{firma.kisaAd}</dd>
            </div>
            <div>
              <dt>Teknokent’teki yeri</dt>
              <dd>{firma.konum}</dd>
            </div>
          </dl>
        </div>
        <p className="kucuk ikincil">
          Bu bilgiler Yönetici A.Ş. kayıtlarından gelir. Hatalıysa{' '}
          <a href={`mailto:${KURUM.eposta}?subject=${encodeURIComponent(`TeknoKariyer: ${firma.kisaAd} kayıt bilgisi düzeltmesi`)}`}>Yönetici A.Ş.’ye yazın</a>.
        </p>
      </section>

      {duzenler ? (
        <>
          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Logo</h2>
            <LogoFormu logo={logo} firmaAd={firma.kisaAd} />
          </section>
          <FirmaProfiliFormu
            baslangic={{
              kisaTanitim: firma.kisaTanitim ?? '',
              uzunTanitim: firma.uzunTanitim ?? '',
              web: firma.web ?? '',
              sektor: secenek(firma.sektor)?.id ?? (typeof firma.sektor === 'number' ? firma.sektor : null),
              teknolojiler: (firma.teknolojiler ?? []).map(secenek).filter((x): x is { id: number; ad: string } => Boolean(x)),
              calismaModelleri: firma.calismaModelleri ?? [],
              yanHaklar: (firma.yanHaklar ?? []).map((y) => y.ad),
              kurulusYili: firma.kurulusYili ? String(firma.kurulusYili) : '',
              calisanAraligi: firma.calisanAraligi ?? '',
            }}
            sektorler={sektorler.map((s) => ({ id: s.id, ad: s.ad })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))}
            beceriler={beceriler}
          />
        </>
      ) : (
        <p className="bilgi">Firma profilini yalnızca firmanızın tam yetkili kullanıcıları düzenleyebilir. Değişiklik için onlara başvurun.</p>
      )}
    </>
  )
}
