import type { Metadata } from 'next'
import Link from 'next/link'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { BilgilerimFormu, DavetFormu, EkipIslemi, YetkiSecimi } from '@/arayuz/firma/Ekip'
import { YETKILER } from '@/alan/ekip'
import { tarihYaz } from '@/arayuz/bicim'
import { firmaKimligi, firmaYetkisiVarMi } from '@/erisim'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Ekip · Firma paneli' }

const YETKI_ADI = Object.fromEntries(YETKILER.map(([d, a]) => [d, a]))

/** Firma ekibi (talimatlar 2): kim hangi yetkiyle çalışıyor; davet, yetki değişikliği, ekipten çıkarma. */
const SONUC: Record<string, string> = {
  yetki: 'Yetki değiştirildi.',
  cikar: 'Kişi ekipten çıkarıldı; artık giriş yapamaz. Notları ve işlem kayıtları korunur.',
  'geri-al': 'Kişi ekibe geri alındı; yeniden giriş yapabilir.',
  'davet-yeniden': 'Davet yeniden gönderildi. Önceki bağlantı artık geçersiz.',
  'davet-iptal': 'Davet iptal edildi.',
}

export default async function Ekip({ searchParams }: { searchParams: Promise<{ sonuc?: string }> }) {
  const k = await firmaOturumu('/firma-paneli/ekip')
  const { sonuc } = await searchParams
  const yonetir = firmaYetkisiVarMi(k, ['yonetici'])
  const payload = await payloadAl()
  const firmaId = Number(firmaKimligi(k))
  // Kişiler koleksiyonu yalnızca kendini okumaya izin verir; ekip listesi burada yalnızca bu firmanın kullanıcılarıyla
  // ve yalnızca gerekli alanlarla okunur.
  const [{ docs: uyeler }, { docs: davetler }] = await Promise.all([
    payload.find({
      collection: 'kullanicilar',
      where: { and: [{ firma: { equals: firmaId } }, { rol: { equals: 'firma' } }] },
      select: { ad: true, email: true, unvan: true, firmaYetkisi: true, pasif: true, createdAt: true },
      sort: 'ad',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    yonetir
      ? payload.find({
          collection: 'davetler',
          where: { and: [{ firma: { equals: firmaId } }, { kullanildi: { exists: false } }] },
          sort: '-createdAt',
          limit: 50,
          depth: 0,
          overrideAccess: true,
        })
      : Promise.resolve({ docs: [] as never[] }),
  ])
  const simdi = new Date()
  const etkin = uyeler.filter((u) => !u.pasif)
  const pasif = uyeler.filter((u) => u.pasif)

  return (
    <>
      <div className="f-bas">
        <h1 className="b1">Ekip</h1>
      </div>
      {sonuc && SONUC[sonuc] && (
        <p className="basari-kutu" role="status">
          {SONUC[sonuc]}
        </p>
      )}
      <ModulBilgisi kimlik="firma-ekip" baslik="Ekip ve yetkiler">
        <p>Firmanız adına portalı kullanan kişiler burada listelenir. Herkes kendi hesabıyla giriş yapar; yaptığı işlemler kendi adıyla kayda geçer.</p>
        <ul>
          {YETKILER.map(([d, a, ac]) => (
            <li key={d}>
              <strong>{a}:</strong> {ac}
            </li>
          ))}
        </ul>
        <p>Firmadan ayrılan birini ekipten çıkarın: hesabı silinmez, ancak giriş yapamaz. Notları ve işlem kayıtları korunur.</p>
      </ModulBilgisi>

      <section className="panel f-blok">
        <h2 className="b3 kare-bas">Ekip üyeleri ({etkin.length})</h2>
        <ul className="ekip-listesi">
          {etkin.map((u) => (
            <li key={u.id}>
              <div>
                <p>
                  <strong>{u.ad}</strong>
                  {Number(u.id) === Number(k.id) && <span className="etiket">Siz</span>}
                </p>
                <p className="kucuk ikincil">{[u.unvan, u.email].filter(Boolean).join(' · ')}</p>
              </div>
              {yonetir && Number(u.id) !== Number(k.id) ? (
                <div className="ekip-islemleri">
                  <YetkiSecimi id={u.id} yetki={u.firmaYetkisi ?? 'degerlendirici'} ad={u.ad} />
                  <EkipIslemi id={u.id} islem="cikar" metin="Ekipten çıkar" tehlike onay={`${u.ad} ekipten çıkarılsın mı? Bu kişi artık giriş yapamaz.`} />
                </div>
              ) : (
                <span className="kucuk">{YETKI_ADI[u.firmaYetkisi ?? 'degerlendirici']}</span>
              )}
            </li>
          ))}
        </ul>
        {pasif.length > 0 && (
          <details className="acilir">
            <summary>Ekipten çıkarılanlar ({pasif.length})</summary>
            <ul className="ekip-listesi icerik">
              {pasif.map((u) => (
                <li key={u.id}>
                  <div>
                    <p>{u.ad}</p>
                    <p className="kucuk ikincil">{u.email}</p>
                  </div>
                  {yonetir && <EkipIslemi id={u.id} islem="geri-al" metin="Ekibe geri al" />}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {yonetir && (
        <section className="panel f-blok">
          <h2 className="b3 kare-bas">Ekibe kişi davet edin</h2>
          <p className="kucuk ikincil">Davet edilen kişiye bir bağlantı gider. Kişi bağlantıyı açıp şifresini belirlediğinde ekibe katılır.</p>
          <DavetFormu />
          {davetler.length > 0 && (
            <>
              <h3 className="b3">Bekleyen davetler</h3>
              <ul className="ekip-listesi">
                {davetler.map((d) => {
                  const doldu = new Date(d.sonGecerlilik) < simdi
                  return (
                    <li key={d.id}>
                      <div>
                        <p>
                          <strong>{d.ad}</strong> <span className="kucuk">· {YETKI_ADI[d.firmaYetkisi ?? 'degerlendirici']}</span>
                        </p>
                        <p className={doldu ? 'kucuk uyari-metni' : 'kucuk ikincil'}>
                          {d.eposta} · {doldu ? 'Süresi doldu' : `${tarihYaz(d.sonGecerlilik, true)} tarihine kadar geçerli`}
                        </p>
                      </div>
                      <div className="ekip-islemleri">
                        <EkipIslemi id={d.id} islem="davet-yeniden" metin="Yeniden gönder" />
                        <EkipIslemi id={d.id} islem="davet-iptal" metin="İptal et" tehlike onay={`${d.ad} için gönderilen davet iptal edilsin mi?`} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="panel f-blok">
        <h2 className="b3 kare-bas">Bilgilerim</h2>
        <BilgilerimFormu ad={k.ad ?? ''} unvan={k.unvan ?? ''} />
        <p className="kucuk ikincil">
          Şifrenizi değiştirmek için <Link href="/sifremi-unuttum">şifre yenileme</Link> sayfasını kullanın. Yetkinizi yalnızca firmanızın tam yetkili
          kullanıcıları değiştirebilir.
        </p>
      </section>
    </>
  )
}
