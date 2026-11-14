'use client'
/**
 * Yönetici A.Ş. karar formları. Ret yerine “düzeltme iste”: firmaya ne yapacağı söylenir (prototip “İlan onayı”).
 * Hazır gerekçe seçilince not alanı dolar; not düzenlenebilir. Onay için kontrol listesinin tamamı işaretlenmeli.
 */
import { useActionState, useEffect, useRef, useState } from 'react'
import { degisiklikKarariEylemi, hatirlatEylemi, ilanKarariEylemi, talepKarariEylemi } from '@/eylemler/moderasyon'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export function OnayKarari(p: {
  ilanId: number
  kontroller: Array<[string, string]>
  gerekceler: Array<[string, string]>
  /** Taramada uyarı çıktıysa ilgili hazır gerekçe önden seçilir */
  onerilenGerekce?: string
  guvenilirOner: { firma: string; onayli: number; kural: number } | null
  yetkili: boolean
}) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(ilanKarariEylemi, {})
  const [isaretli, setIsaretli] = useState<string[]>([])
  const [gerekce, setGerekce] = useState(p.onerilenGerekce ?? '')
  const [not, setNot] = useState(p.gerekceler.find(([k]) => k === p.onerilenGerekce)?.[1] ?? '')
  const hepsi = isaretli.length === p.kontroller.length
  const sec = (k: string) => {
    setGerekce(k)
    const m = p.gerekceler.find(([a]) => a === k)?.[1]
    if (m) setNot(m)
  }
  return (
    <form action={eylem} className="y-karar-formu">
      <input type="hidden" name="ilan" value={p.ilanId} />
      <HataOzeti durum={durum} siz alanlar={{ kontrol: 'y-kontrol', not: 'y-not' }} />
      <section className="panel panel-ic y-karar">
        <h2 className="b3" id="y-kontrol">
          Kontrol listesi
        </h2>
        <p className="kucuk ikincil">Onaylamadan önce her maddeyi ilan metninde kendiniz denetleyin. Otomatik tarama yalnızca yardımcıdır.</p>
        {p.kontroller.map(([k, m]) => (
          <label key={k} className="secenek">
            <input
              type="checkbox"
              name="kontrol"
              value={k}
              checked={isaretli.includes(k)}
              onChange={(e) => setIsaretli((x) => (e.target.checked ? [...x, k] : x.filter((y) => y !== k)))}
            />{' '}
            <span>{m}</span>
          </label>
        ))}
      </section>

      <section className="panel panel-ic y-karar">
        <h2 className="b3">Karar</h2>
        <div className="alan">
          <label htmlFor="y-gerekce">Düzeltme isterseniz gerekçe</label>
          <select id="y-gerekce" className="secim" value={gerekce} onChange={(e) => sec(e.target.value)}>
            <option value="">Hazır gerekçe seçin veya notu kendiniz yazın</option>
            {p.gerekceler.map(([k, m]) => (
              <option key={k} value={k}>
                {m.split('.')[0]}
              </option>
            ))}
          </select>
        </div>
        <div className={durum.hatalar?.not ? 'alan alan--hata' : 'alan'}>
          <label htmlFor="y-not">Firmaya not</label>
          <span className="ipucu">Yalnızca düzeltme isterken gönderilir. Firmaya neyi, nasıl düzelteceğini yazın.</span>
          {durum.hatalar?.not && <p className="hata-metni">{durum.hatalar.not}</p>}
          <textarea id="y-not" name="not" className="metin-alani" rows={4} maxLength={1000} value={not} onChange={(e) => setNot(e.target.value)} />
        </div>
        {p.guvenilirOner && p.yetkili && (
          <label className="secenek kucuk">
            <input type="checkbox" name="guvenilir" />{' '}
            <span>
              {p.guvenilirOner.firma} firmasını “güvenilir firma” olarak işaretle
              <span className="ipucu">
                {p.guvenilirOner.onayli} ilanı onaylandı; bu onayla {p.guvenilirOner.onayli + 1} olacak. Güvenilir firmanın sonraki ilanları onaya gitmeden yayına girer.
                İşaretlemezseniz ilk {p.guvenilirOner.kural} ilandan sonra da aynı sonuç kendiliğinden doğar.
              </span>
            </span>
          </label>
        )}
        <div className="dugme-grubu">
          <button type="submit" name="karar" value="duzelt" className="dugme dugme--ikincil">
            Düzeltme iste
          </button>
          <button type="submit" name="karar" value="onay" className="dugme" aria-describedby={hepsi ? undefined : 'y-onay-ipucu'}>
            Onayla ve yayınla
          </button>
        </div>
        {!hepsi && (
          <p className="kucuk ikincil" id="y-onay-ipucu">
            Onaylamak için kontrol listesindeki {p.kontroller.length} maddenin hepsini işaretleyin.
          </p>
        )}
        <p className="kucuk ikincil">Karar firmanın ilanlarla ilgilenen kullanıcılarına e-postayla bildirilir.</p>
      </section>
    </form>
  )
}

export function DegisiklikKarari({ ilanId }: { ilanId: number }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(degisiklikKarariEylemi, {})
  const id = `d-not-${ilanId}`
  return (
    <form action={eylem} className="y-karar">
      <input type="hidden" name="ilan" value={ilanId} />
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <div className={durum.hatalar?.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={id}>
          Firmaya not <span className="istege-bagli">(onaylamazsanız zorunlu)</span>
        </label>
        {durum.hatalar?.not && <p className="hata-metni">{durum.hatalar.not}</p>}
        <textarea id={id} name="not" className="metin-alani" rows={2} maxLength={1000} />
      </div>
      <div className="dugme-grubu">
        <button type="submit" name="karar" value="ret" className="dugme dugme--ikincil">
          Onaylama
        </button>
        <button type="submit" name="karar" value="onay" className="dugme">
          Değişikliği onayla
        </button>
      </div>
    </form>
  )
}

export function TalepKarari({ talepId, ogeler }: { talepId: number; ogeler: string[] }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(talepKarariEylemi, {})
  const id = `t-not-${talepId}`
  return (
    <form action={eylem} className="y-karar">
      <input type="hidden" name="talep" value={talepId} />
      {durum.genel && (
        <p className="hata-metni" role="alert">
          {durum.genel}
        </p>
      )}
      <fieldset className={durum.hatalar?.kabul ? 'alan alan--hata' : 'alan'}>
        <legend>Listeye eklenecekler</legend>
        <span className="ipucu">Eklemek istemediğiniz öğenin işaretini kaldırın. Yazımı düzeltmek gerekirse talebi reddedip notta doğru yazımı belirtin.</span>
        {durum.hatalar?.kabul && <p className="hata-metni">{durum.hatalar.kabul}</p>}
        {ogeler.map((o) => (
          <label key={o} className="secenek">
            <input type="checkbox" name="kabul" value={o} defaultChecked /> <span>{o}</span>
          </label>
        ))}
      </fieldset>
      <div className={durum.hatalar?.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor={id}>
          Talep edene not <span className="istege-bagli">(reddederseniz zorunlu)</span>
        </label>
        {durum.hatalar?.not && <p className="hata-metni">{durum.hatalar.not}</p>}
        <textarea id={id} name="not" className="metin-alani" rows={2} maxLength={500} />
      </div>
      <div className="dugme-grubu">
        <button type="submit" name="karar" value="ret" className="dugme dugme--ikincil">
          Reddet
        </button>
        <button type="submit" name="karar" value="onay" className="dugme">
          Seçilenleri ekle
        </button>
      </div>
    </form>
  )
}

export function HatirlatDugmesi({ ilanId, ad }: { ilanId: number; ad: string }) {
  const [durum, eylem] = useActionState<FormDurumu, FormData>(hatirlatEylemi, {})
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (durum.genel) ref.current?.focus()
  }, [durum])
  return (
    <form action={eylem} className="y-hatirlat">
      <input type="hidden" name="ilan" value={ilanId} />
      <input type="hidden" name="ad" value={ad} />
      <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Gönderiliyor…">
        Firmaya hatırlat
      </GonderDugmesi>
      {durum.genel && (
        <span className="hata-metni kucuk" role="alert" tabIndex={-1} ref={ref}>
          {durum.genel}
        </span>
      )}
    </form>
  )
}
