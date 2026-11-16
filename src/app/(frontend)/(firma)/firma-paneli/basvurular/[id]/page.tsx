import type { Metadata } from 'next'
import { SertifikaListesi, sertifikaGorunumu } from '@/arayuz/SertifikaListesi'
import { EgitimListesi, egitimGorunumu } from '@/arayuz/EgitimListesi'
import { CvGoruntuleyici } from '@/arayuz/firma/CvGoruntuleyici'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BASVURU_DURUM_ADI } from '@/alan/basvuru'
import { DENEYIM_ADI, MODEL_ADI, eslesmeHesapla, type Deneyim } from '@/alan/eslesme'
import { Ikon } from '@/arayuz/Ikon'
import { Metin } from '@/arayuz/IlanParcalari'
import { tarihYaz } from '@/arayuz/bicim'
import { DurumFormu, NotFormu, PuanFormu } from '@/arayuz/firma/Degerlendirme'
import { firmaYetkisiVarMi } from '@/erisim'
import { basvuruyuAc } from '@/servisler/degerlendirme'
import { GorusmePaneli, type GorusmeGorunumu } from '@/arayuz/firma/GorusmePaneli'
import { gorusmeHali, gunSecenekleri, type GorusmeBicimi } from '@/alan/gorusme'
import { basvurununGorusmesi, gorusmeOzu } from '@/servisler/gorusme'
import { IslemHatasi } from '@/servisler/ortak'
import { basvuruAyrintisi, firmaBasvurulari, ilanKosullari, kopyaProfili, type ProfilKopyasi } from '@/veri/basvuruDegerlendirme'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Başvuru · Firma paneli', robots: { index: false } }

const KAYNAK_ADI: Record<string, string> = { portal: 'portal araması', linkedin: 'LinkedIn', google: 'Google', dogrudan: 'doğrudan bağlantı' }
const SEVIYE_ADI: Record<string, string> = { baslangic: 'Başlangıç', orta: 'Orta', iyi: 'İyi', uzman: 'Uzman' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ gorusme?: string }> }

export default async function BasvuruAyrintisi({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const k = await firmaOturumu(`/firma-paneli/basvurular/${id}`)
  const payload = await payloadAl()
  // Açılış: kiracı denetimi burada; ilk açılışta “Alındı” → “İnceleniyor”.
  const b = await basvuruyuAc(payload, k, Number(id)).catch((e: unknown): null => {
    if (e instanceof IslemHatasi) return null
    throw e
  })
  if (!b) notFound()
  // Not yazanların adları (yalnızca ad; firma ekibi veya Yönetici A.Ş. personeli).
  const yazanIdleri = [...new Set((b.ekipNotlari ?? []).map((n) => Number(typeof n.yazan === 'object' ? n.yazan?.id : n.yazan)).filter(Boolean))]
  const yazanlar = yazanIdleri.length
    ? new Map(
        (await payload.find({ collection: 'kullanicilar', where: { id: { in: yazanIdleri } }, select: { ad: true }, depth: 0, overrideAccess: true })).docs.map((u) => [u.id, u.ad]),
      )
    : new Map<number, string>()
  const [{ ilan }, { satirlar }] = await Promise.all([basvuruAyrintisi(b), firmaBasvurulari()])
  if (!ilan) notFound()
  // Aynı adayın aynı ilana öbür başvurusu (geri çekilip yeniden yapılmış olabilir; kural src/alan/basvuru.ts).
  const ikiz = b.adayKodu
    ? (
        await payload.find({
          collection: 'basvurular',
          where: { and: [{ ilan: { equals: ilan.id } }, { adayKodu: { equals: b.adayKodu } }, { id: { not_equals: b.id } }] },
          select: { durum: true, createdAt: true },
          depth: 0,
          limit: 1,
          overrideAccess: true,
        })
      ).docs[0]
    : undefined
  const [gorusmeKaydi, firmaKaydi] = await Promise.all([
    basvurununGorusmesi(payload, b.id),
    payload.findByID({ collection: 'firmalar', id: Number(typeof b.firma === 'object' ? b.firma.id : b.firma), depth: 0, overrideAccess: true, select: { konum: true } }),
  ])
  const simdi = new Date()
  const gorusme: GorusmeGorunumu | null = gorusmeKaydi
    ? {
        id: gorusmeKaydi.id,
        hal: gorusmeHali(gorusmeOzu(gorusmeKaydi), simdi),
        secenekler: (gorusmeKaydi.secenekler ?? []).map((x) => x.baslangic),
        secilen: gorusmeKaydi.secilen ?? null,
        sure: gorusmeKaydi.sure,
        bicim: gorusmeKaydi.bicim as GorusmeBicimi,
        yer: gorusmeKaydi.yer ?? null,
        not: gorusmeKaydi.not ?? null,
        adayNotu: gorusmeKaydi.adayNotu ?? null,
        iptalNedeni: gorusmeKaydi.iptalNedeni ?? null,
      }
    : null
  const p = (b.profilKopyasi ?? {}) as ProfilKopyasi
  const silindi = !b.adayKullanici
  const eslesme = b.anonimlestirildi ? null : eslesmeHesapla(ilanKosullari(ilan), kopyaProfili(p), 'firma')
  const durumYetkisi = firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])
  const sorular = new Map((ilan.onElemeSorulari ?? []).map((s) => [s.id ?? '', s]))
  const cevaplar = Object.entries((b.cevaplar ?? {}) as Record<string, string>)
  const ayniIlan = satirlar.filter((x) => x.ilanId === ilan.id)
  const sira = ayniIlan.findIndex((x) => x.id === b.id)
  const onceki = sira > 0 ? ayniIlan[sira - 1] : undefined
  const sonraki = sira >= 0 && sira < ayniIlan.length - 1 ? ayniIlan[sira + 1] : undefined

  return (
    <>
      <div className="f-bas">
        <div>
          <Link className="geri kucuk" href={`/firma-paneli/basvurular?ilan=${ilan.id}`}>
            <Ikon ad="geri" kucuk /> {ilan.pozisyonAdi} başvuruları
          </Link>
          <h1 className="b1">{b.anonimlestirildi ? 'Kişisel veriler silindi' : silindi ? 'Aday hesabını sildi' : p.ad}</h1>
          <p className="ikincil">{[p.bolum, p.okul, p.sinif].filter(Boolean).join(', ')}</p>
          <p className="kucuk ikincil">
            “{ilan.pozisyonAdi}” ilanına {tarihYaz(b.createdAt, true)} tarihinde başvurdu · Kaynak: {KAYNAK_ADI[b.kaynak ?? 'portal']}
          </p>
        </div>
        <nav className="dugme-grubu" aria-label="Başvurular arasında geçiş">
          {onceki && (
            <Link className="dugme dugme--sade dugme--kucuk" href={`/firma-paneli/basvurular/${onceki.id}`}>
              <Ikon ad="geri" kucuk /> Önceki
            </Link>
          )}
          {sonraki && (
            <Link className="dugme dugme--sade dugme--kucuk" href={`/firma-paneli/basvurular/${sonraki.id}`}>
              Sonraki <Ikon ad="ileri" kucuk />
            </Link>
          )}
        </nav>
      </div>

      <div className="bsv-duzen-tek">
        <div className="bsv-ayrinti">
          {silindi && (
            <p className="uyari-kutu">
              {b.anonimlestirildi
                ? 'İlanın kapanmasından sonraki saklama süresi dolduğu için bu başvurudaki kişisel veriler (ad, iletişim, CV, cevaplar ve ekip notları) KVKK gereği silindi. Başvuru kaydı istatistik için kalır.'
                : 'Aday hesabını sildiği için adı, iletişim bilgileri, ön yazısı ve CV’si silindi. Eğitim, beceri ve ön eleme cevapları değerlendirmeniz için kalır; ilan kapandıktan sonra saklama süresi dolunca bunlar da silinir.'}
            </p>
          )}
          {b.durum === 'geri-cekti' && <p className="uyari-kutu">Aday bu başvuruyu geri çekti. Durumu değiştirilemez.</p>}
          {ikiz && (
            <p className="bilgi kucuk">
              {new Date(ikiz.createdAt) < new Date(b.createdAt)
                ? `Aday bu ilana ${tarihYaz(ikiz.createdAt, true)} tarihinde de başvurmuş, o başvuruyu geri çekmişti. Bu, yeniden başvurusudur.`
                : `Aday bu başvuruyu geri çektikten sonra ${tarihYaz(ikiz.createdAt, true)} tarihinde aynı ilana yeniden başvurdu.`}{' '}
              <Link href={`/firma-paneli/basvurular/${ikiz.id}`}>Öbür başvuruyu aç</Link>
            </p>
          )}
          {b.eleyiciUyari && <p className="uyari-kutu">Aday, eleyici olarak işaretlediğiniz bir soruya beklediğinizden farklı cevap verdi. Cevapları aşağıda görebilirsiniz.</p>}

          {eslesme && (
            <div className="eslesme-kutu">
              <p className="ust-etiket">İlanınızla eşleşme</p>
              <ul className="eslesme">
                {eslesme.satirlar.map((s) => (
                  <li key={s.metin} className={s.durum}>
                    {s.metin}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!silindi && (
            <section aria-labelledby="bsv-iletisim">
              <h2 className="b3 kare-bas" id="bsv-iletisim">
                CV ve iletişim
              </h2>
              <div className="dugme-grubu">
                {b.cv && <CvGoruntuleyici adres={`/firma-paneli/basvurular/${b.id}/cv?goruntule=1`} indirAdres={`/firma-paneli/basvurular/${b.id}/cv`} baslik={`CV · ${p.ad ?? 'Aday'}`} />}
                {p.eposta && (
                  <a className="dugme dugme--sade dugme--kucuk" href={`mailto:${p.eposta}`}>
                    <Ikon ad="mesaj" kucuk /> {p.eposta}
                  </a>
                )}
                {p.telefon && (
                  <a className="dugme dugme--sade dugme--kucuk" href={`tel:${p.telefon.replace(/\s/g, '')}`}>
                    {p.telefon}
                  </a>
                )}
              </div>
              <p className="kucuk ikincil">
                İndirilen CV’nin her sayfasının altına firmanızın adı ve indirme tarihi yazılır; her indirme kayda geçer. CV’yi yalnızca bu ilanın
                değerlendirmesinde kullanın.
              </p>
            </section>
          )}

          {b.onYazi && (
            <section>
              <h2 className="b3 kare-bas">Ön yazı</h2>
              <Metin metin={b.onYazi} />
            </section>
          )}

          {cevaplar.length > 0 && (
            <section>
              <h2 className="b3 kare-bas">Ön eleme cevapları</h2>
              <dl className="cevaplar">
                {cevaplar.map(([soruId, cevap]) => {
                  const s = sorular.get(soruId)
                  const beklenmedik = s?.eleyici && s.beklenenCevap && cevap.trim().toLocaleLowerCase('tr') !== s.beklenenCevap.trim().toLocaleLowerCase('tr')
                  return (
                    <div key={soruId}>
                      <dt>{s?.soru ?? 'Soru (ilandan kaldırılmış)'}</dt>
                      <dd>
                        {cevap || '—'}
                        {beklenmedik && <span className="etiket etiket--uyari"> Beklenen cevap: {s!.beklenenCevap}</span>}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )}

          {!b.anonimlestirildi && (
            <section>
              <h2 className="b3 kare-bas">Profil</h2>
              <p className="kucuk ikincil">Başvuru anındaki profil. Aday profilini sonradan değiştirse de burada bu hâli görünür.</p>
              {p.tanitim && <p>{p.tanitim}</p>}
              <dl className="ozet-dl">
                {p.deneyimSeviyesi && (
                  <div>
                    <dt>Deneyim</dt>
                    <dd>{DENEYIM_ADI[p.deneyimSeviyesi as Deneyim] ?? p.deneyimSeviyesi}</dd>
                  </div>
                )}
                {p.mezuniyet && (
                  <div>
                    <dt>Mezuniyet</dt>
                    <dd>{tarihYaz(p.mezuniyet, true)}</dd>
                  </div>
                )}
                {(p.beceriler ?? []).length > 0 && (
                  <div>
                    <dt>Beceriler</dt>
                    <dd>{(p.beceriler ?? []).map((x) => `${x.ad}${x.seviye ? ` (${SEVIYE_ADI[x.seviye] ?? x.seviye})` : ''}`).join(', ')}</dd>
                  </div>
                )}
                {(p.diller ?? []).length > 0 && (
                  <div>
                    <dt>Diller</dt>
                    <dd>{(p.diller ?? []).map((x) => `${x.dil} ${x.seviye}`).join(', ')}</dd>
                  </div>
                )}
                {(p.tercihler?.modeller ?? []).length > 0 && (
                  <div>
                    <dt>Çalışma tercihi</dt>
                    <dd>{(p.tercihler?.modeller ?? []).map((m) => MODEL_ADI[m as keyof typeof MODEL_ADI] ?? m).join(', ')}</dd>
                  </div>
                )}
                {p.tercihler?.baslama && (
                  <div>
                    <dt>Başlayabileceği zaman</dt>
                    <dd>{p.tercihler.baslama}</dd>
                  </div>
                )}
              </dl>
              {(p.deneyimler ?? []).length > 0 && (
                <>
                  <h3 className="b3">İş deneyimi</h3>
                  <ul className="madde">
                    {(p.deneyimler ?? []).map((d, n) => (
                      <li key={n}>
                        <strong>{d.pozisyon}</strong>, {d.kurum}
                        {d.baslangic ? ` · ${tarihYaz(d.baslangic, true)} – ${d.bitis ? tarihYaz(d.bitis, true) : 'devam ediyor'}` : ''}
                        {d.aciklama && <span className="kucuk ikincil satir-alt">{d.aciklama}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {(p.egitimler ?? []).length > 0 && (
                <>
                  <h3 className="b4">Eğitim</h3>
                  <EgitimListesi egitimler={(p.egitimler ?? []).map((e) => egitimGorunumu(e))} />
                </>
              )}
              {(p.sertifikalar ?? []).length > 0 && (
                <>
                  <h3 className="b4">Lisans ve sertifikalar</h3>
                  <SertifikaListesi
                    sertifikalar={(p.sertifikalar ?? []).map((s) => sertifikaGorunumu(s as unknown as Record<string, unknown>))}
                    belgeAdresi={(d) => `/firma-paneli/basvurular/${id}/belge/${d}`}
                  />
                </>
              )}
              {(p.baglantilar ?? []).length > 0 && (
                <ul className="madde">
                  {(p.baglantilar ?? []).map((x, n) => (
                    <li key={n}>
                      <a href={x.adres} rel="noopener noreferrer nofollow" target="_blank">
                        {x.ad}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="bsv-yan" aria-label="Değerlendirme">
          <section className="panel f-blok">
            <h2 className="b3 kare-bas">Durum</h2>
            <p>
              Şu an: <span className={`durum durum--${b.durum}`}>{BASVURU_DURUM_ADI[b.durum] === 'Geri çektin' ? 'Aday geri çekti' : BASVURU_DURUM_ADI[b.durum]}</span>
            </p>
            {durumYetkisi && b.durum !== 'geri-cekti' ? (
              <DurumFormu basvuruId={b.id} durum={b.durum} />
            ) : (
              <p className="kucuk ikincil">
                {b.durum === 'geri-cekti' ? 'Geri çekilen başvurunun durumu değiştirilemez.' : 'Durumu değiştirme yetkiniz yok; not ve puan ekleyebilirsiniz.'}
              </p>
            )}
          </section>
          {sp.gorusme && (
            <p className="basari-kutu" role="status">
              {{ davet: 'Görüşme daveti adaya gönderildi.', degisti: 'Yeni tarihler adaya gönderildi.', iptal: 'Görüşme iptal edildi; adaya bildirildi.' }[sp.gorusme] ?? ''}
            </p>
          )}
          <GorusmePaneli
            basvuruId={b.id}
            gorusme={gorusme}
            yetki={durumYetkisi && !silindi && !['geri-cekti', 'olumlu', 'olumsuz'].includes(b.durum)}
            kapaliNedeni={
              silindi
                ? 'Aday hesabını sildiği için görüşmeye davet edilemez.'
                : ['geri-cekti', 'olumlu', 'olumsuz'].includes(b.durum)
                  ? 'Sonuçlanmış veya geri çekilmiş başvuru için görüşme daveti gönderilemez.'
                  : durumYetkisi
                    ? undefined
                    : 'Görüşme davetini firmanın tam yetkili ve ilan sorumlusu kullanıcıları gönderir.'
            }
            gunler={gunSecenekleri(simdi)}
            varsayilanAdres={`Pamukkale Teknokent, ${firmaKaydi.konum}`}
          />
          <section className="panel f-blok ekip-notu">
            <h2 className="b3 kare-bas">Ekip değerlendirmesi</h2>
            <p className="kucuk ikincil">Puanı ve notları yalnızca firma ekibiniz görür; aday görmez.</p>
            <PuanFormu basvuruId={b.id} puan={b.puan ?? null} />
            {(b.ekipNotlari ?? []).length > 0 && (
              <ul className="not-listesi">
                {(b.ekipNotlari ?? []).map((n, i: number) => (
                  <li key={n.id ?? i}>
                    <p>{n.not}</p>
                    <p className="kucuk ikincil">{yazanlar.get(Number(typeof n.yazan === 'object' ? n.yazan?.id : n.yazan)) ?? 'Ekip üyesi'}</p>
                  </li>
                ))}
              </ul>
            )}
            <NotFormu basvuruId={b.id} />
          </section>
        </aside>
      </div>
    </>
  )
}
