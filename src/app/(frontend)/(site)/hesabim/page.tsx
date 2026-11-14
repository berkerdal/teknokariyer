import type { Metadata } from 'next'
import Link from 'next/link'
import { BASVURU_DURUM_ADI, adimKareleri, geriCekilebilirMi } from '@/alan/basvuru'
import { GeriCek } from '@/arayuz/aday/GeriCek'
import { ilanAdresi, tarihYaz } from '@/arayuz/bicim'
import { goruntuleyenFirmaSayisi } from '@/servisler/havuz'
import { basvurularim } from '@/veri/basvuru'
import { adayOturumu, oturumdakiAday } from '@/veri/aday'
import { profilEksikleri } from '@/veri/profil'
import { cvOzetleri } from '@/veri/basvuru'
import { payloadAl } from '@/veri/payload'

export const metadata: Metadata = { title: 'Başvurularım', robots: { index: false } }

const DURUM_SINIFI: Record<string, string> = {
  alindi: 'alindi', inceleniyor: 'inceleniyor', gorusme: 'gorusme', teklif: 'teklif', olumlu: 'olumlu', olumsuz: 'olumsuz', 'geri-cekti': 'kapandi',
}
const ADIM_ADI = ['Alındı', 'İnceleniyor', 'Görüşme', 'Teklif', 'Sonuç']

/** Başvurularım: hiçbir başvuru karanlıkta kalmaz; durum beş kareyle gösterilir. */
export default async function BasvurularimSayfasi() {
  const k = await adayOturumu()
  const [liste, aday] = await Promise.all([basvurularim(k), oturumdakiAday()])
  const eksikler = aday ? profilEksikleri(aday, cvOzetleri(aday).length) : []
  const havuzda = Boolean(aday?.havuz?.rizaTarihi) && aday?.havuz?.gorunurluk !== 'gizli'
  const sayi = havuzda ? await goruntuleyenFirmaSayisi(await payloadAl(), k) : 0
  return (
    <>
      <h1 className="b1">Başvurularım</h1>
      {eksikler.length > 0 && (
        <div className="gorev">
          <p className="ust-etiket">Profilini tamamla</p>
          <p>
            Profilinde {eksikler.length} temel bilgi eksik: {eksikler.map((e) => (e.ad === 'CV' ? e.ad : e.ad.toLocaleLowerCase('tr'))).join(', ')}. Bu bilgiler başvurularında kullanılır ve
            ilanlarla eşleşmeni belirler.
          </p>
          <Link className="dugme dugme--kucuk" href={`/hesabim/profil/sihirbaz?adim=${eksikler[0]!.adim}`}>
            Adım adım tamamla
          </Link>
        </div>
      )}
      <div className="ap-ust-bilgi">
        <div className="goruntulenme">
          <p className="ust-etiket">CV havuzu</p>
          {havuzda ? (
            <p>
              <strong className="buyuk-sayi">{sayi}</strong> firma son 30 günde profilini görüntüledi.
            </p>
          ) : (
            <p>CV havuzunda değilsin. Katılırsan Teknokent firmaları ilan açmadan da seni bulabilir.</p>
          )}
          <Link href="/hesabim/havuz" className="kucuk">
            Havuz ayarları
          </Link>
        </div>
      </div>
      {liste.length ? (
        <ul className="bv-liste">
          {liste.map((b) => (
            <li key={b.id} className="bv-kart">
              <div className="bv-kart-bas">
                <div>
                  <Link href={ilanAdresi({ id: b.ilan.id, pozisyonAdi: b.ilan.pozisyonAdi })} className="poz-baglanti">
                    {b.ilan.pozisyonAdi}
                  </Link>
                  <p className="kucuk">{[b.ilan.firmaAd, b.ilan.firmaKonum].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={`durum durum--${DURUM_SINIFI[b.durum] ?? 'alindi'}`}>{BASVURU_DURUM_ADI[b.durum] ?? b.durum}</span>
              </div>
              <div className="adim-kareler" role="img" aria-label={`Durum: ${BASVURU_DURUM_ADI[b.durum] ?? b.durum}`}>
                {adimKareleri(b.durum).map((s, n) => (
                  <i key={n} className={s || undefined} title={ADIM_ADI[n]} />
                ))}
              </div>
              <p className="kucuk ikincil">Başvuru tarihi: {tarihYaz(b.tarih, true)}</p>
              {b.durum === 'olumsuz' && <p className="kucuk">Firma bu pozisyon için başka bir adayla devam etmeye karar verdi. İlgin için teşekkür ederiz.</p>}
              {geriCekilebilirMi(b.durum) && <GeriCek basvuruId={b.id} pozisyon={b.ilan.pozisyonAdi} />}
            </li>
          ))}
        </ul>
      ) : (
        <div className="bos panel">
          <p className="b3">Henüz bir ilana başvurmadın.</p>
          <p className="ikincil">İlanlara göz atabilirsin; başvurularının durumunu bu sayfadan izleyebilirsin.</p>
          <Link className="dugme" href="/ilanlar">
            İlanlara bak
          </Link>
        </div>
      )}
    </>
  )
}
