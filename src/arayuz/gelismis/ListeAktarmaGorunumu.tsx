/**
 * Gelişmiş yönetim ekranı (Payload, `/admin/liste-aktar`): üniversite ve bölüm listelerine toplu aktarma.
 * Kullanıcı kararı (15.11.2026): bu listelerin güncelleme aralığı uzun olduğu için Yönetici A.Ş. panelinde yer
 * tutmaz; yalnızca teknik sorumluya açık bu ekrandadır. Yetki serviste de denetlenir.
 */
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { teknikSorumluMu, type OturumKullanicisi } from '@/erisim'
import { RESMI_LISTE_KAYNAGI, resmiListeAdlari } from '@/alan/resmiListeler'
import { ListeAktarma } from './ListeAktarma'
import './gelismis.css'

export async function ListeAktarmaGorunumu({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  const izinli = teknikSorumluMu(req.user as OturumKullanicisi | null)
  const sayilar = izinli
    ? await Promise.all(
        (['universite', 'bolum'] as const).map(async (tur) => (await req.payload.count({ collection: 'taksonomiler', where: { tur: { equals: tur } }, overrideAccess: true })).totalDocs),
      )
    : [0, 0]
  const etiket = `${RESMI_LISTE_KAYNAGI.ad} (${new Date(`${RESMI_LISTE_KAYNAGI.alinma}T12:00:00+03:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })})`
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="gelismis">
          <h1>Liste aktarma</h1>
          {!izinli ? (
            <p className="la-hata">Bu ekranı yalnızca teknik sorumlu kullanabilir.</p>
          ) : (
            <>
              <p className="gelismis-giris">
                Adayların okulunu ve bölümünü bulabilmesi için üniversite ve bölüm listeleri resmî kaynaktan doldurulur. Pakette {etiket} listesi hazır gelir. Yeni yıl
                listesi yayımlandığında ÖSYM tercih kılavuzu tablosunu veya YÖK listesini Excel ya da CSV olarak buradan aktarabilirsiniz. Listede zaten olan veya aynı
                kökte yazımı bulunan adlar eklenmez; hiçbir ad silinmez. Tek tek ekleme ve düzeltme Yönetici A.Ş. panelindeki Listeler sayfasındadır.
              </p>
              <section className="gelismis-kart">
                <h2>Üniversiteler</h2>
                <p className="la-kucuk">Listede şu an {sayilar[0]!.toLocaleString('tr-TR')} üniversite var. Adların sonundaki şehir “(DENİZLİ)” atılır, büyük harfli adlar düzeltilir.</p>
                <ListeAktarma tur="universite" turAdi="üniversite" hazir={{ etiket, adlar: resmiListeAdlari('universite') }} />
              </section>
              <section className="gelismis-kart">
                <h2>Bölümler</h2>
                <p className="la-kucuk">
                  Listede şu an {sayilar[1]!.toLocaleString('tr-TR')} bölüm var. Lisans ve önlisans programları birlikte gelir. “(İngilizce)”, “(Burslu)”, “(İÖ)” gibi ekler
                  atılır; aynı bölüm bir kez eklenir.
                </p>
                <ListeAktarma tur="bolum" turAdi="bölüm" hazir={{ etiket, adlar: resmiListeAdlari('bolum') }} />
              </section>
            </>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
