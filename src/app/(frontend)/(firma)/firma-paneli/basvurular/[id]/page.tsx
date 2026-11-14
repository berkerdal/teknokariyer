import type { Metadata } from 'next'
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
import { IslemHatasi } from '@/servisler/ortak'
import { basvuruAyrintisi, firmaBasvurulari, ilanKosullari, kopyaProfili, type ProfilKopyasi } from '@/veri/basvuruDegerlendirme'
import { firmaOturumu } from '@/veri/firma'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Başvuru · Firma paneli', robots: { index: false } }

const KAYNAK_ADI: Record<string, string> = { portal: 'portal araması', linkedin: 'LinkedIn', google: 'Google', dogrudan: 'doğrudan bağlantı' }
const SEVIYE_ADI: Record<string, string> = { baslangic: 'Başlangıç', orta: 'Orta', iyi: 'İyi', uzman: 'Uzman' }

type Props = { params: Promise<{ id: string }> }

export default async function BasvuruAyrintisi({ params }: Props) {
  const { id } = await params
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
  const p = (b.profilKopyasi ?? {}) as ProfilKopyasi
  const silindi = !b.adayKullanici
  const eslesme = silindi ? null : eslesmeHesapla(ilanKosullari(ilan), kopyaProfili(p), 'firma')
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
          <h1 className="b1">{silindi ? 'Aday hesabını sildi' : p.ad}</h1>
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
              Aday hesabını sildiği için adı, iletişim bilgisi ve CV’si silindi (K27). Başvuru kaydı istatistik için kalır.
            </p>
          )}
          {b.durum === 'geri-cekti' && <p className="uyari-kutu">Aday bu başvuruyu geri çekti. Durumu değiştirilemez.</p>}
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
                {b.cv && (
                  <a className="dugme dugme--ikincil dugme--kucuk" href={`/firma-paneli/basvurular/${b.id}/cv`}>
                    <Ikon ad="indir" kucuk /> CV’yi indir (PDF)
                  </a>
                )}
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

          {!silindi && (
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
              {(p.sertifikalar ?? []).length > 0 && (
                <p>
                  <strong>Sertifikalar:</strong> {(p.sertifikalar ?? []).map((s) => [s.ad, s.kurum, s.yil].filter(Boolean).join(', ')).join(' · ')}
                </p>
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
