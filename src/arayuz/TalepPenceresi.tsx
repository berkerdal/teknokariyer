'use client'
/**
 * “Listede yok mu? Eklenmesini isteyin” (14.11.2026 geri bildirimi). Her liste türü için kendi başlığı ve sorusu olan
 * küçük bir pencere: kullanıcı yalnızca istediği öğeleri yazar; adı, e-postası ve firması talebe otomatik eklenir.
 * Pencere `document.body`'ye taşınır: ilan formunun içinde açıldığında iç içe form oluşmaz.
 */
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { talepEylemi } from '@/eylemler/talep'
import { TALEP_EN_FAZLA_OGE, TALEP_TUR_ADI } from '@/alan/talep'
import { GonderDugmesi, type FormDurumu } from './form'
import { Ikon } from './Ikon'

const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1)

export function TalepPenceresi(p: {
  tur: keyof typeof TALEP_TUR_ADI
  kaynak: string
  hitap?: 'sen' | 'siz'
  /** Penceredeki alana önceden yazılacak metin (ör. öneri kutusuna yazılan) */
  baslangic?: string
  dugme?: string
  /** Dışarıdan açma: değer her değiştiğinde pencere açılır (ör. öneri listesindeki “listede yok” bağlantısı). */
  disAcma?: number
  /** Kendi açma düğmesini gösterme (dışarıdan açılıyorsa) */
  tetikYok?: boolean
}) {
  const siz = p.hitap !== 'sen'
  const ad = TALEP_TUR_ADI[p.tur]!
  const pencere = useRef<HTMLDialogElement>(null)
  const [anahtar, setAnahtar] = useState(0)
  const [hazir, setHazir] = useState(false)
  const baslikId = useId()
  useEffect(() => setHazir(true), []) // eslint-disable-line react-hooks/set-state-in-effect -- portal yalnızca istemcide
  const ac = () => {
    setAnahtar((a) => a + 1)
    pencere.current?.showModal()
  }
  // Dışarıdan açma: form, istek sayısıyla anahtarlandığı için yeni metinle yeniden kurulur; burada yalnızca pencere açılır.
  useEffect(() => {
    if (p.disAcma) pencere.current?.showModal()
  }, [p.disAcma])
  const kapat = () => pencere.current?.close()
  const metin = {
    baslik: `Yeni ${ad.tekil} eklenmesini ${siz ? 'isteyin' : 'iste'}`,
    giris: siz
      ? `Aradığınız ${ad.tekil} listede yoksa Yönetici A.Ş.’den eklenmesini isteyebilirsiniz. Adınız ve firmanız talebe otomatik eklenir; ayrıca bilgi vermenize gerek yoktur.`
      : `Aradığın ${ad.tekil} listede yoksa Yönetici A.Ş.’den eklenmesini isteyebilirsin. Adın ve e-posta adresin talebe otomatik eklenir.`,
    alan: `Eklenmesini ${siz ? 'istediğiniz' : 'istediğin'} ${ad.cogul}`,
    ipucu: siz
      ? `Tek talepte en fazla ${TALEP_EN_FAZLA_OGE} ${ad.tekil} isteyebilirsiniz; her satıra bir tane yazın. Yazımı resmî ve açık olsun: “Gömülü Linux”, “Yapay Zekâ Mühendisliği”. Yönetici A.Ş. her birini ayrı değerlendirir.`
      : `Tek talepte en fazla ${TALEP_EN_FAZLA_OGE} ${ad.tekil} isteyebilirsin; her satıra bir tane yaz. Yazımı resmî ve açık olsun: “Gömülü Linux”, “Yapay Zekâ Mühendisliği”. Yönetici A.Ş. her birini ayrı değerlendirir.`,
  }

  return (
    <>
      {!p.tetikYok && (
        <button type="button" className="talep-baglanti" onClick={ac}>
          {p.dugme ?? `Listede yok mu? Eklenmesini ${siz ? 'isteyin' : 'iste'}`}
        </button>
      )}
      {hazir &&
        createPortal(
          <dialog ref={pencere} className="alt-panel talep-pencere" aria-labelledby={baslikId}>
            <div className="tutamak" aria-hidden="true" />
            <div className="bas">
              <h2 className="b3" id={baslikId}>
                {metin.baslik}
              </h2>
              <button type="button" className="ikon-dugme" aria-label="Pencereyi kapat" onClick={kapat}>
                <Ikon ad="kapat" />
              </button>
            </div>
            <div className="govde">
              <TalepFormu key={`${anahtar}-${p.disAcma ?? 0}`} {...p} siz={siz} metin={metin} baslikId={baslikId} kapat={kapat} />
            </div>
          </dialog>,
          document.body,
        )}
    </>
  )
}

/** Öneri listesindeki “listede yok” satırı için: pencereyi dışarıdan açan durum ve bağlantı. */
export function useTalepAcma(siz = true) {
  const [talep, setTalep] = useState({ metin: '', n: 0 })
  const baglanti = (yazilan: string) => (
    <button
      type="button"
      className="talep-baglanti"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setTalep((t) => ({ metin: yazilan, n: t.n + 1 }))}
    >
      {siz ? 'Eklenmesini Yönetici A.Ş.’den isteyin' : 'Eklenmesini Yönetici A.Ş.’den iste'}
    </button>
  )
  return { talep, baglanti }
}

/** Pencerenin içeriği: her açılışta yeniden kurulur, böylece önceki talebin sonucu yeni açılışta görünmez. */
function TalepFormu(
  p: Parameters<typeof TalepPenceresi>[0] & {
    siz: boolean
    metin: { giris: string; alan: string; ipucu: string }
    baslikId: string
    kapat: () => void
  },
) {
  const { siz, metin, baslikId, kapat } = p
  const [durum, eylem] = useActionState<FormDurumu, FormData>(talepEylemi, {})
  const tamam = Boolean(durum.tamam && durum.surum)
  return (
    <>
              {tamam ? (
                <div className="form-yigin islem-form">
                  <p className="basari-kutu" role="status">
                    {durum.tamam}
                  </p>
                  <p>
                    <button type="button" className="dugme" onClick={kapat}>
                      Kapat
                    </button>
                  </p>
                </div>
              ) : (
                <form action={eylem} className="form-yigin islem-form">
                  <input type="hidden" name="tur" value={p.tur} />
                  <input type="hidden" name="kaynak" value={p.kaynak} />
                  <input type="hidden" name="hitap" value={siz ? 'siz' : 'sen'} />
                  <p className="kucuk">{metin.giris}</p>
                  {durum.genel && (
                    <p className="hata-metni" role="alert">
                      {durum.genel}
                    </p>
                  )}
                  <div className={durum.hatalar?.ogeler ? 'alan alan--hata' : 'alan'}>
                    <label htmlFor={`${baslikId}-ogeler`}>{buyukHarf(metin.alan)}</label>
                    <span className="ipucu">{metin.ipucu}</span>
                    {durum.hatalar?.ogeler && <p className="hata-metni">{durum.hatalar.ogeler}</p>}
                    <textarea
                      id={`${baslikId}-ogeler`}
                      name="ogeler"
                      className="metin-alani"
                      rows={3}
                      required
                      defaultValue={durum.degerler?.ogeler ?? p.baslangic ?? ''}
                    />
                  </div>
                  <div className="alan">
                    <label htmlFor={`${baslikId}-aciklama`}>
                      Kısa açıklama <span className="istege-bagli">(isteğe bağlı)</span>
                    </label>
                    <textarea
                      id={`${baslikId}-aciklama`}
                      name="aciklama"
                      className="metin-alani"
                      rows={2}
                      maxLength={500}
                      defaultValue={durum.degerler?.aciklama ?? ''}
                      placeholder={siz ? 'Örnek: İlanımızdaki pozisyon bu beceriyi gerektiriyor.' : 'Örnek: Bu beceriyi stajımda kullandım.'}
                    />
                  </div>
                  <div className="dugme-grubu">
                    <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
                      Talebi gönder
                    </GonderDugmesi>
                    <button type="button" className="dugme dugme--sade" onClick={kapat}>
                      Vazgeç
                    </button>
                  </div>
                </form>
              )}
    </>
  )
}
