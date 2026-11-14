import type { Metadata } from 'next'
import Link from 'next/link'
import { BASVURU_DURUM_ADI } from '@/alan/basvuru'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { tarihYaz } from '@/arayuz/bicim'
import { firmaOturumu } from '@/veri/firma'
import { firmaBasvurulari, type BasvuruSatiri } from '@/veri/basvuruDegerlendirme'

export const metadata: Metadata = { title: 'Başvurular · Firma paneli' }

const DURUM_ADI: Record<string, string> = { ...BASVURU_DURUM_ADI, 'geri-cekti': 'Aday geri çekti' }
const KAYNAK_ADI: Record<string, string> = { portal: 'Portal', linkedin: 'LinkedIn', google: 'Google', dogrudan: 'Doğrudan bağlantı' }
const SEKMELER: Array<[string, string, (b: BasvuruSatiri) => boolean]> = [
  ['tum', 'Tümü', () => true],
  ['yeni', 'Yeni', (b) => b.durum === 'alindi'],
  ['inceleniyor', 'İnceleniyor', (b) => b.durum === 'inceleniyor'],
  ['gorusme', 'Görüşme', (b) => b.durum === 'gorusme'],
  ['teklif', 'Teklif', (b) => b.durum === 'teklif'],
  ['sonuc', 'Sonuçlanan', (b) => ['olumlu', 'olumsuz', 'geri-cekti'].includes(b.durum)],
]

type Props = { searchParams: Promise<{ ilan?: string; durum?: string; tam?: string }> }

/** Başvurular: ilan ve duruma göre süzülür. Eşleşme kısa açıklamayla gösterilir; kara kutu puan yok. */
export default async function FirmaBasvurulari({ searchParams }: Props) {
  await firmaOturumu('/firma-paneli/basvurular')
  const [{ satirlar, ilanlar }, p] = await Promise.all([firmaBasvurulari(), searchParams])
  const ilanId = Number(p.ilan) || null
  const sekme = SEKMELER.find(([s]) => s === p.durum) ?? SEKMELER[0]!
  const tam = p.tam === '1'
  const ilanaGore = satirlar.filter((b) => !ilanId || b.ilanId === ilanId)
  const gorunen = ilanaGore.filter((b) => sekme[2](b) && (!tam || b.zorunlularTamam))
  const adres = (deg: Record<string, string | null>) => {
    const q = new URLSearchParams()
    const v = { ilan: ilanId ? String(ilanId) : null, durum: sekme[0] === 'tum' ? null : sekme[0], tam: tam ? '1' : null, ...deg }
    for (const [a, d] of Object.entries(v)) if (d) q.set(a, d)
    return `/firma-paneli/basvurular${q.size ? `?${q}` : ''}`
  }
  const basvurulanIlanlar = ilanlar.filter((i) => satirlar.some((b) => b.ilanId === i.id))

  return (
    <>
      <div className="f-bas">
        <h1 className="b1">Başvurular</h1>
      </div>
      <ModulBilgisi kimlik="firma-basvurular" baslik="Başvuruları buradan değerlendirirsiniz">
        <ul>
          <li>Bir başvuruyu açtığınızda durumu “İnceleniyor” olur; aday başvurusunun incelendiğini görür.</li>
          <li>Eşleşme satırı, ilanınızdaki zorunlu becerilerden kaçının adayda olduğunu gösterir. Aday hakkında puan veya yüzde üretilmez.</li>
          <li>Durumu “Görüşme”, “Teklif”, “Olumlu” veya “Olumsuz” yaptığınızda adaya e-postayla bilgi gider. Bu bildirim kapatılamaz.</li>
          <li>Notlarınızı ve puanınızı yalnızca firma ekibiniz görür; aday görmez.</li>
        </ul>
      </ModulBilgisi>

      {satirlar.length === 0 ? (
        <p className="ikincil">Henüz başvuru yok. İlanlarınız yayına girdiğinde gelen başvurular burada listelenir.</p>
      ) : (
        <>
          <form className="bsv-suzgec" action="/firma-paneli/basvurular">
            <div className="alan">
              <label htmlFor="bsv-ilan">İlan</label>
              <select id="bsv-ilan" name="ilan" className="secim" defaultValue={ilanId ?? ''}>
                <option value="">Bütün ilanlar ({satirlar.length})</option>
                {basvurulanIlanlar.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.pozisyonAdi} ({satirlar.filter((b) => b.ilanId === i.id).length})
                  </option>
                ))}
              </select>
            </div>
            {sekme[0] !== 'tum' && <input type="hidden" name="durum" value={sekme[0]} />}
            <label className="secenek">
              <input type="checkbox" name="tam" value="1" defaultChecked={tam} /> <span>Yalnızca zorunlu becerilerin hepsi olanlar</span>
            </label>
            <button type="submit" className="dugme dugme--ikincil dugme--kucuk">
              Süz
            </button>
          </form>

          <nav className="sekmeler sekmeler--kaydir" aria-label="Başvuru durumları">
            {SEKMELER.map(([s, ad, uygun]) => (
              <Link key={s} className="sekme" href={adres({ durum: s === 'tum' ? null : s })} aria-current={s === sekme[0] ? 'page' : undefined}>
                {ad} <span className="sayi">{ilanaGore.filter(uygun).length}</span>
              </Link>
            ))}
          </nav>

          {gorunen.length === 0 ? (
            <p className="ikincil">Bu süzgeçle eşleşen başvuru yok.</p>
          ) : (
            <ul className="bsv-liste">
              {gorunen.map((b) => (
                <li key={b.id}>
                  <Link className="bsv-satir" href={`/firma-paneli/basvurular/${b.id}`}>
                    <span className="bsv-ad">
                      {b.durum === 'alindi' && <span className="yeni-isaret" aria-label="Yeni" />}
                      {b.ad}
                    </span>
                    <span className={`durum durum--${b.durum}`}>{DURUM_ADI[b.durum] ?? b.durum}</span>
                    <span className="kucuk ikincil bsv-alt">
                      {[b.egitim, !ilanId ? b.pozisyonAdi : null].filter(Boolean).join(' · ')}
                    </span>
                    {b.eslesme && <span className="kucuk bsv-esl">{b.eslesme.kisa}</span>}
                    <span className="kucuk ikincil bsv-tarih">
                      {tarihYaz(b.tarih)} · {KAYNAK_ADI[b.kaynak] ?? b.kaynak}
                      {b.puan ? ` · Puan ${b.puan}/5` : ''}
                    </span>
                    {b.eleyiciUyari && <span className="etiket etiket--uyari">Eleyici soruya beklenmeyen cevap</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
