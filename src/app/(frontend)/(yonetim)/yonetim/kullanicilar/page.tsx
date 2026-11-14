import type { Metadata } from 'next'
import { KURUM_ROLLERI, KURUM_ROL_ADI, type KurumRolu } from '@/alan/kurumRolleri'
import { teknikSorumluMu, yoneticiMi } from '@/erisim'
import { ModulBilgisi } from '@/arayuz/BilgiKutusu'
import { tarihYaz } from '@/arayuz/bicim'
import { KullaniciIslemi, KurumKullanicisiFormu, RolSecimi } from '@/arayuz/yonetim/Kullanicilar'
import { payloadAl } from '@/veri/payload'
import { yonetimOturumu } from '@/veri/yonetim'

export const metadata: Metadata = { title: 'Kullanıcılar · Yönetim' }

type Props = { searchParams: Promise<{ sonuc?: string }> }

const SONUC: Record<string, string> = {
  eklendi: 'Hesap açıldı. Kişiye şifre belirleme bağlantısı gönderildi; bağlantı 7 gün geçerlidir.',
  rol: 'Yetki değiştirildi.',
  kapat: 'Hesap kapatıldı. Kişi artık giriş yapamaz; açık oturumu da sonlanır.',
  ac: 'Hesap yeniden açıldı.',
  'teknik-ver': 'Teknik sorumlu yetkisi verildi.',
  'teknik-al': 'Teknik sorumlu yetkisi kaldırıldı.',
}

export default async function Kullanicilar({ searchParams }: Props) {
  const k = await yonetimOturumu('/yonetim/kullanicilar')
  const sp = await searchParams
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'kullanicilar',
    where: { rol: { in: ['yonetici', 'moderator', 'raporlayici'] } },
    select: { ad: true, email: true, unvan: true, rol: true, pasif: true, teknikSorumlu: true, createdAt: true },
    sort: 'ad',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const yonetici = yoneticiMi(k)
  const teknik = teknikSorumluMu(k)
  return (
    <>
      <div className="y-bas">
        <div>
          <h1 className="b1">Kullanıcılar</h1>
          <p className="ikincil">Yönetici A.Ş. personelinin portal hesapları. Firma kullanıcıları ilgili firmanın sayfasında listelenir.</p>
        </div>
      </div>
      {sp.sonuc && SONUC[sp.sonuc] && (
        <p className="basari-kutu" role="status">
          {SONUC[sp.sonuc]}
        </p>
      )}
      <ModulBilgisi kimlik="yonetim-kullanicilar" baslik="Yetkiler">
        <ul>
          {KURUM_ROLLERI.map(([r, a, aciklama]) => (
            <li key={r}>
              <strong>{a}:</strong> {aciklama}
            </li>
          ))}
          <li>
            <strong>Teknik sorumlu:</strong> Ek olarak gelişmiş yönetim ekranına (Payload) girebilir. Yalnızca teknik bilgisi olan kişiye verin; bu işareti
            yalnızca bir teknik sorumlu verebilir.
          </li>
        </ul>
        <p>Kimse kendi yetkisini değiştiremez veya kendi hesabını kapatamaz. En az bir etkin tam yetkili kullanıcı her zaman kalır.</p>
      </ModulBilgisi>
      <div className="y-iki">
        <section className="panel">
          <header className="panel-ic y-panel-bas">
            <h2 className="b3">Yönetici A.Ş. kullanıcıları</h2>
            <span className="kucuk ikincil">{docs.filter((u) => !u.pasif).length} etkin</span>
          </header>
          <ul className="y-satirlar panel-ic">
            {docs.map((u) => {
              const kendisi = Number(u.id) === Number(k.id)
              return (
                <li key={u.id}>
                  <span>
                    <strong>{u.ad}</strong>
                    {kendisi && <span className="kucuk ikincil"> (siz)</span>}
                    {u.unvan && <span className="kucuk ikincil"> · {u.unvan}</span>}
                    <br />
                    <span className="kucuk">{u.email}</span>
                    <br />
                    <span className="kucuk ikincil">
                      {u.pasif ? 'Hesap kapalı' : KURUM_ROL_ADI[u.rol as KurumRolu]}
                      {u.teknikSorumlu ? ' · Teknik sorumlu' : ''} · {tarihYaz(u.createdAt, true)} tarihinde açıldı
                    </span>
                  </span>
                  {yonetici && !kendisi && (
                    <span className="y-davet-durum">
                      {!u.pasif && <RolSecimi kullaniciId={u.id} rol={String(u.rol)} />}
                      <span className="satir-ici">
                        {teknik && !u.pasif && (
                          <KullaniciIslemi kullaniciId={u.id} islem={u.teknikSorumlu ? 'teknik-al' : 'teknik-ver'} metin={u.teknikSorumlu ? 'Teknik sorumluluğu kaldır' : 'Teknik sorumlu yap'} />
                        )}
                        {u.pasif ? (
                          <KullaniciIslemi kullaniciId={u.id} islem="ac" metin="Hesabı yeniden aç" />
                        ) : (
                          <KullaniciIslemi kullaniciId={u.id} islem="kapat" metin="Hesabı kapat" tehlike />
                        )}
                      </span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
        {yonetici && (
          <section className="panel panel-ic">
            <h2 className="b3">Yeni kullanıcı</h2>
            <KurumKullanicisiFormu />
          </section>
        )}
      </div>
    </>
  )
}
