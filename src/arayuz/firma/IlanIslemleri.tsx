'use client'
/**
 * Bir ilanın işlemleri (K1: firma ilan üzerinde tam kontrole sahip).
 * - Yalnızca ilanın şu anki durumunda yapılabilen işlemler gösterilir (yetkisiz işlem düğmesi yok; CLAUDE.md 5).
 *   Liste sunucuda `yapilabilecekIslemler` ile hesaplanır; servis aynı kuralı yeniden denetler.
 * - Her işlemin altında ne olacağını anlatan bir cümle vardır (K30).
 * - Mobilde alttan açılan panel, masaüstünde ortada pencere.
 */
import Link from 'next/link'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { ilanIslemiEylemi } from '@/eylemler/firma'
import type { FirmaIslemi } from '@/alan/ilan'
import { KAPATMA_NEDENLERI } from '@/alan/ilan'
import { trGunMetni } from '@/alan/tarih'
import { Ikon, type IkonAdi } from '../Ikon'
import { GonderDugmesi, type FormDurumu } from '../form'
import { TarihSecici } from '../TarihSecici'

export interface IslemIlani {
  id: number
  pozisyonAdi: string
  durum: string
  sonBasvuru: string
  basvuru: number
  /** Herkese açık sayfa adresi (yayında, duraklatılmış veya kapanmışsa) */
  adres?: string
}

export interface TarihSiniri {
  bugun: string
  enErken: string
  enGec: string
  gun: number
}

type Gorunum = 'liste' | 'uzat' | 'kapat' | 'sil'

/** İşlem sonrası kısa bildirim; birkaç saniye sonra kaybolur. */
function useBildirim(durum: FormDurumu) {
  const [metin, setMetin] = useState('')
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    setMetin(durum.tamam ?? '') // eslint-disable-line react-hooks/set-state-in-effect -- işlem bitti
  }, [durum])
  useEffect(() => {
    if (!metin) return
    const z = setTimeout(() => setMetin(''), 5000)
    return () => clearTimeout(z)
  }, [metin])
  return metin
}

function Bildirim({ metin }: { metin: string }) {
  return metin ? (
    <div className="bildirim" role="status">
      {metin}
    </div>
  ) : null
}

/** Tek bir işlem düğmesi (ör. özet sayfasında “Yeniden başlat”, “Onaya gönder”). */
export function HizliIslem({ ilanId, islem, children, ikincil = false }: { ilanId: number; islem: FirmaIslemi; children: React.ReactNode; ikincil?: boolean }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ilanIslemiEylemi, {})
  const bildirim = useBildirim(durum)
  return (
    <form action={eylem}>
      <input type="hidden" name="ilan" value={ilanId} />
      <input type="hidden" name="islem" value={islem} />
      <GonderDugmesi className={`dugme dugme--kucuk${ikincil ? ' dugme--ikincil' : ''}`} bekleme="Bekleyin…">
        {children}
      </GonderDugmesi>
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <Bildirim metin={bildirim} />
    </form>
  )
}

const ACIKLAMA: Partial<Record<FirmaIslemi, { ad: string; ikon: IkonAdi; ipucu: string }>> = {
  'yayina-gonder': {
    ad: 'Yayına gönder',
    ikon: 'gonder',
    ipucu: 'İlk ilanlarınız Yönetici A.Ş. onayından geçer; güvenilir firmaların ilanları doğrudan yayına girer.',
  },
  duraklat: { ad: 'Başvuru almayı geçici olarak durdur', ikon: 'duraklat', ipucu: 'İlan sayfası açık kalır, ancak yeni başvuru alınmaz.' },
  'yeniden-baslat': { ad: 'Başvuru almaya yeniden başla', ikon: 'ileri', ipucu: 'İlan aynı son başvuru tarihiyle yeniden başvuru alır.' },
  'sure-uzat': { ad: 'Son başvuru tarihini uzat', ikon: 'takvim', ipucu: 'Yeni tarihi takvimden seçersiniz.' },
  kopyala: { ad: 'Kopyala ve yeni ilan başlat', ikon: 'kopya', ipucu: 'Bütün alanlar dolu gelir; yalnızca son başvuru tarihini seçmeniz gerekir.' },
  'yeniden-yayinla': {
    ad: 'Yeniden yayınla',
    ikon: 'kopya',
    ipucu: 'Kapanan ilanın kopyası taslak olarak açılır; tarihi seçip yayına gönderirsiniz.',
  },
  kapat: { ad: 'İlanı kapat', ikon: 'kapat', ipucu: 'İlan başvuru almaz ve listelerden kalkar. Başvurular silinmez.' },
  sil: { ad: 'Taslağı sil', ikon: 'cop', ipucu: 'Hiç yayınlanmamış taslak kalıcı olarak silinir.' },
}

export function IlanIslemleri({ ilan, islemler, sinir, dugme = 'İşlemler' }: { ilan: IslemIlani; islemler: FirmaIslemi[]; sinir: TarihSiniri; dugme?: string }) {
  const pencere = useRef<HTMLDialogElement>(null)
  const acan = useRef<HTMLButtonElement>(null)
  const [gorunum, setGorunum] = useState<Gorunum>('liste')
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ilanIslemiEylemi, {})
  const [anahtar, setAnahtar] = useState(0)
  const bildirim = useBildirim(durum)
  const baslikId = useId()
  const son = useRef(durum.surum)

  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    pencere.current?.close()
  }, [durum])

  const ac = () => {
    setGorunum('liste')
    setAnahtar((a) => a + 1)
    pencere.current?.showModal()
  }
  const kapat = () => {
    pencere.current?.close()
    acan.current?.focus()
  }
  const gizli = (islem: string) => (
    <>
      <input type="hidden" name="ilan" value={ilan.id} />
      <input type="hidden" name="islem" value={islem} />
    </>
  )
  // Kapanan ilanda “Yeniden yayınla” zaten bir kopya açar; ayrıca “Kopyala” göstermek aynı işi iki kez sunar.
  const anlik = islemler.filter(
    (i) => ['yayina-gonder', 'duraklat', 'yeniden-baslat', 'kopyala', 'yeniden-yayinla'].includes(i) && !(i === 'kopyala' && islemler.includes('yeniden-yayinla')),
  )
  const satir = (i: FirmaIslemi, icerik: React.ReactNode) => <li key={i}>{icerik}</li>
  const etiket = (i: FirmaIslemi) => (
    <>
      <Ikon ad={ACIKLAMA[i]!.ikon} />
      <span>
        {ACIKLAMA[i]!.ad}
        <span className="ipucu">{ACIKLAMA[i]!.ipucu}</span>
      </span>
    </>
  )

  return (
    <>
      <button ref={acan} type="button" className="dugme dugme--ikincil dugme--kucuk" onClick={ac}>
        {dugme}
        <span className="gizli">: {ilan.pozisyonAdi}</span>
      </button>
      <dialog
        ref={pencere}
        className="alt-panel islem-pencere"
        aria-labelledby={baslikId}
        onCancel={(e) => {
          e.preventDefault()
          kapat()
        }}
      >
        <div className="tutamak" aria-hidden="true" />
        <div className="bas">
          <h2 className="b3" id={baslikId}>
            {gorunum === 'liste' ? ilan.pozisyonAdi : gorunum === 'uzat' ? 'Son başvuru tarihini uzat' : gorunum === 'kapat' ? 'İlanı kapat' : 'Taslağı sil'}
          </h2>
          <button type="button" className="ikon-dugme" aria-label="Pencereyi kapat" onClick={kapat}>
            <Ikon ad="kapat" />
          </button>
        </div>
        <div className="govde" key={anahtar}>
          {durum.genel && (
            <div className="hata-ozeti" role="alert">
              <h2>İşlem tamamlanamadı</h2>
              <p>{durum.genel}</p>
            </div>
          )}
          {gorunum === 'liste' && (
            <ul className="islem-listesi">
              {islemler.includes('duzenle') &&
                satir(
                  'duzenle',
                  <Link href={`/firma-paneli/ilanlar/${ilan.id}`}>
                    <Ikon ad="kalem" />
                    <span>
                      Düzenle
                      <span className="ipucu">
                        {ilan.durum === 'yayinda' || ilan.durum === 'duraklatildi'
                          ? 'Yazım ve tarih düzeltmeleri hemen yayına yansır. Pozisyon adı, ilan türü ve ücret değişiklikleri onaydan geçebilir.'
                          : 'İlanın bütün alanlarını değiştirebilirsiniz.'}
                      </span>
                    </span>
                  </Link>,
                )}
              {ilan.adres && (
                <li>
                  <Link href={ilan.adres} target="_blank">
                    <Ikon ad="goz" />
                    <span>
                      İlanı adayların gördüğü gibi aç<span className="ipucu">Yeni sekmede açılır.</span>
                    </span>
                  </Link>
                </li>
              )}
              {ilan.basvuru > 0 && (
                <li>
                  <Link href={`/firma-paneli/basvurular?ilan=${ilan.id}`}>
                    <Ikon ad="kisi" />
                    <span>
                      Başvuruları gör<span className="ipucu">Bu ilana {ilan.basvuru} başvuru geldi.</span>
                    </span>
                  </Link>
                </li>
              )}
              {anlik.map((i) =>
                satir(
                  i,
                  <form action={eylem}>
                    {gizli(i === 'yeniden-yayinla' ? 'kopyala' : i)}
                    <GonderDugmesi className="islem-dugme" bekleme="Bekleyin…">{etiket(i)}</GonderDugmesi>
                  </form>,
                ),
              )}
              {islemler.includes('sure-uzat') &&
                satir(
                  'sure-uzat',
                  ertesiGun(ilan.sonBasvuru) > sinir.enGec ? (
                    <button type="button" disabled aria-disabled="true">
                      <Ikon ad="takvim" />
                      <span>
                        Son başvuru tarihini uzat
                        <span className="ipucu">
                          Son başvuru tarihi zaten izin verilen en geç gün. Bir ilan en fazla {sinir.gun} gün sonrasına kadar açık kalabilir.
                        </span>
                      </span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => setGorunum('uzat')}>
                      {etiket('sure-uzat')}
                    </button>
                  ),
                )}
              {islemler.includes('kapat') &&
                satir(
                  'kapat',
                  <button type="button" className="tehlike" onClick={() => setGorunum('kapat')}>
                    {etiket('kapat')}
                  </button>,
                )}
              {islemler.includes('sil') &&
                satir(
                  'sil',
                  <button type="button" className="tehlike" onClick={() => setGorunum('sil')}>
                    {etiket('sil')}
                  </button>,
                )}
            </ul>
          )}
          {gorunum === 'uzat' && (
            <form action={eylem} className="form-yigin islem-form" id={`uzat-${ilan.id}`}>
              {gizli('sure-uzat')}
              <p>
                <strong>{ilan.pozisyonAdi}</strong> ilanı için yeni son başvuru gününü seçin. İlan seçtiğiniz günün sonuna kadar başvuru alır.
              </p>
              <div className={durum.hatalar?.tarih ? 'alan alan--hata' : 'alan'}>
                {durum.hatalar?.tarih && <p className="hata-metni">{durum.hatalar.tarih}</p>}
                <TarihSecici
                  ad="tarih"
                  id={`uzat-tarih-${ilan.id}`}
                  bugun={sinir.bugun}
                  enErken={[sinir.enErken, ertesiGun(ilan.sonBasvuru)].sort()[1]!}
                  enGec={sinir.enGec}
                  sinirNedeni={`Bir ilan en fazla ${sinir.gun} gün sonrasına kadar açık kalabilir. Yeni tarih, mevcut son başvuru tarihinden sonra olmalıdır.`}
                />
              </div>
              <div className="dugme-grubu">
                <GonderDugmesi className="dugme" bekleme="Kaydediliyor…">
                  Tarihi uzat
                </GonderDugmesi>
                <button type="button" className="dugme dugme--sade" onClick={() => setGorunum('liste')}>
                  Geri dön
                </button>
              </div>
            </form>
          )}
          {gorunum === 'kapat' && (
            <form action={eylem} className="form-yigin islem-form">
              {gizli('kapat')}
              <fieldset className={durum.hatalar?.neden ? 'alan alan--hata' : 'alan'}>
                <legend>İlanı neden kapatıyorsunuz?</legend>
                {durum.hatalar?.neden && <p className="hata-metni">{durum.hatalar.neden}</p>}
                {Object.entries(KAPATMA_NEDENLERI).map(([d, a]) => (
                  <label key={d} className="secenek">
                    <input type="radio" name="neden" value={d} /> <span>{a}</span>
                  </label>
                ))}
              </fieldset>
              <p className="bilgi kucuk">
                Kapanan ilan başvuru almaz ve ilan listelerinden kalkar. Gelen başvurular silinmez; değerlendirmeye devam edebilirsiniz. İsterseniz ilanı
                daha sonra kopyalayıp yeniden yayınlayabilirsiniz.
              </p>
              <div className="dugme-grubu">
                <GonderDugmesi className="dugme dugme--tehlike" bekleme="Kapatılıyor…">
                  İlanı kapat
                </GonderDugmesi>
                <button type="button" className="dugme dugme--sade" onClick={() => setGorunum('liste')}>
                  Vazgeç
                </button>
              </div>
            </form>
          )}
          {gorunum === 'sil' && (
            <form action={eylem} className="form-yigin islem-form">
              {gizli('sil')}
              <p>
                <strong>{ilan.pozisyonAdi}</strong> taslağı kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="dugme-grubu">
                <GonderDugmesi className="dugme dugme--tehlike" bekleme="Siliniyor…">
                  Taslağı sil
                </GonderDugmesi>
                <button type="button" className="dugme dugme--sade" onClick={() => setGorunum('liste')}>
                  Vazgeç
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
      <Bildirim metin={bildirim} />
    </>
  )
}

/** Son başvuru gününden (Türkiye saati) sonraki gün: uzatmada seçilebilecek en erken gün. */
function ertesiGun(iso: string) {
  return trGunMetni(new Date(new Date(iso).getTime() + 86_400_000))
}
