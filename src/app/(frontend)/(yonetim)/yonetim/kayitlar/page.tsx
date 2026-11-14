import type { Metadata } from 'next'
import Link from 'next/link'
import { yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { Ikon } from '@/arayuz/Ikon'
import { YetkiYok } from '@/arayuz/yonetim/YetkiYok'
import { TarihSecici } from '@/arayuz/TarihSecici'
import { trGunMetni, trGunu } from '@/alan/tarih'
import { tarihYaz } from '@/arayuz/bicim'
import { KAYIT_TURLERI, islemKayitlari, type KayitSuzgeci } from '@/veri/islemKayitlari'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'İşlem kayıtları · Yönetim' }

const ZAMAN = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })

type Props = { searchParams: Promise<KayitSuzgeci> }

const tarihMetniKisa = (g: string) => {
  const d = trGunu(g)
  return d ? tarihYaz(d, true) : g
}

const adres = (s: KayitSuzgeci, ek: Partial<KayitSuzgeci>, yol = '/yonetim/kayitlar') => {
  const p = new URLSearchParams()
  for (const [a, d] of Object.entries({ ...s, ...ek })) if (d) p.set(a, String(d))
  const q = p.toString()
  return q ? `${yol}?${q}` : yol
}

/** Kim neyi ne zaman yaptı (prototip “Yönetim: İşlem kayıtları”). Kayıtlar değiştirilemez ve silinemez; aranabilir. */
export default async function IslemKayitlariSayfasi({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/kayitlar')
  if (!yoneticiMi(k)) return <YetkiYok baslik="İşlem kayıtları" neden="İşlem kayıtları kişisel veriye erişim bilgisi içerdiği için yalnızca tam yetkili kullanıcılara açıktır." />
  const sp = await searchParams
  const s: KayitSuzgeci = { q: sp.q ?? '', tur: sp.tur ?? '', bas: sp.bas ?? '', bit: sp.bit ?? '' }
  const r = await islemKayitlari({ ...s, sayfa: sp.sayfa })
  const suzgecli = Boolean(s.q || s.tur || s.bas || s.bit)
  const bugun = trGunMetni(new Date())
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">İşlem kayıtları</h1>
          <p className="ikincil">Portalda kimin neyi ne zaman yaptığının değiştirilemez kaydı.</p>
        </div>
        <a className="dugme dugme--ikincil dugme--kucuk" href={adres(s, {}, '/yonetim/kayitlar/excel')} download>
          <Ikon ad="indir" /> Excel olarak indir
        </a>
      </div>

      <ModulBilgisi kimlik="yonetim-kayitlar" baslik="Bu sayfa ne işe yarar?">
        <p>
          Her önemli işlem buraya yazılır: ilan onayları, firma ve kullanıcı değişiklikleri, ayarlar, CV indirme ve havuzda profil açma gibi kişisel veriye
          erişimler, KVKK başvuruları ve otomatik işler. Kayıtlar hiçbir ekrandan değiştirilemez veya silinemez.
        </p>
        <ul>
          <li>Arama kutusu işlem adında, kişinin adında veya e-posta adresinde ve kayıt numarasında arar.</li>
          <li>“Kişisel veri” türü, kişisel verilere yapılan bütün erişimleri gösterir; KVKK denetiminde bu süzgeç kullanılır.</li>
          <li>Kayıtlar, Ayarlar’daki saklama süresi dolunca otomatik silinir; silme işlemi de kayda geçer.</li>
          <li>Excel çıktısı ekrandaki süzgeci kullanır ve indirme de kayda geçer.</li>
          <li>“Kim” sütununda “Sistem” yazan kayıtlar otomatik işlere veya hesabı sonradan silinmiş bir kişiye aittir.</li>
        </ul>
      </ModulBilgisi>

      <form className="panel panel-ic kayit-suzgec" method="get" role="search">
        <div className="alan">
          <label htmlFor="ks-q">Ara</label>
          <input id="ks-q" name="q" type="search" className="girdi" defaultValue={s.q} placeholder="Kişi, işlem veya kayıt numarası" />
        </div>
        <div className="alan">
          <label htmlFor="ks-tur">Tür</label>
          <select id="ks-tur" name="tur" className="girdi" defaultValue={s.tur}>
            <option value="">Hepsi</option>
            {KAYIT_TURLERI.map(([t, a]) => (
              <option key={t} value={t}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <details className="kayit-tarih" open={Boolean(s.bas || s.bit)}>
          <summary>Tarih aralığı{s.bas || s.bit ? `: ${s.bas ? tarihMetniKisa(s.bas) : '…'} – ${s.bit ? tarihMetniKisa(s.bit) : '…'}` : ''}</summary>
          <div className="rapor-ozel">
            <div className="alan">
              <label htmlFor="ks-bas">Başlangıç günü</label>
              <TarihSecici ad="bas" id="ks-bas" deger={s.bas || undefined} bugun={bugun} enErken="2026-01-01" enGec={bugun} sinirNedeni="Bugünden sonraki kayıt olamaz." />
            </div>
            <div className="alan">
              <label htmlFor="ks-bit">Bitiş günü</label>
              <TarihSecici ad="bit" id="ks-bit" deger={s.bit || undefined} bugun={bugun} enErken="2026-01-01" enGec={bugun} sinirNedeni="Bugünden sonraki kayıt olamaz." />
            </div>
          </div>
        </details>
        <div className="dugme-grubu">
          <button type="submit" className="dugme dugme--kucuk">
            Süz
          </button>
          {suzgecli && (
            <Link className="dugme dugme--sade dugme--kucuk" href="/yonetim/kayitlar">
              Süzgeci temizle
            </Link>
          )}
        </div>
      </form>
      {r.hata && (
        <p className="uyari-kutu" role="status">
          {r.hata}
        </p>
      )}

      <section className="panel">
        <header className="panel-ic y-panel-bas">
          <h2 className="b3">{suzgecli ? 'Süzgece uyan kayıtlar' : 'Bütün kayıtlar'}</h2>
          <span className="kucuk ikincil">{r.toplam.toLocaleString('tr-TR')} kayıt</span>
        </header>
        <div className="tablo-kap">
          <table className="tablo y-tablo kayit-tablo">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kim</th>
                <th>İşlem</th>
                <th>Kayıt</th>
                <th>Tür</th>
              </tr>
            </thead>
            <tbody>
              {r.satirlar.length === 0 && (
                <tr>
                  <td colSpan={5} className="ikincil">
                    Süzgece uyan kayıt yok.
                  </td>
                </tr>
              )}
              {r.satirlar.map((x) => (
                <tr key={x.id}>
                  <td className="kucuk" style={{ whiteSpace: 'nowrap' }}>
                    {ZAMAN.format(new Date(x.zaman))}
                  </td>
                  <td className="kucuk">{x.kim}</td>
                  <td>
                    <strong>{x.islem}</strong>
                    {x.ayrinti && (
                      <details>
                        <summary className="kucuk">Ayrıntı</summary>
                        <p className="kucuk kayit-ayrinti">{x.ayrinti}</p>
                      </details>
                    )}
                  </td>
                  <td className="kucuk">{x.kayitAdresi ? <Link href={x.kayitAdresi}>{x.kayit}</Link> : (x.kayit ?? '—')}</td>
                  <td className="kucuk">{x.turAdi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.sayfaSayisi > 1 && (
          <nav className="panel-ic sayfalama" aria-label="Sayfalar">
            {r.sayfa > 1 && <Link href={adres(s, { sayfa: String(r.sayfa - 1) })}>Önceki sayfa</Link>}
            <span className="kucuk ikincil">
              Sayfa {r.sayfa} / {r.sayfaSayisi}
            </span>
            {r.sayfa < r.sayfaSayisi && <Link href={adres(s, { sayfa: String(r.sayfa + 1) })}>Sonraki sayfa</Link>}
          </nav>
        )}
      </section>
    </>
  )
}
