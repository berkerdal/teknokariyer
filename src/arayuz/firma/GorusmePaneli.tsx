'use client'
/**
 * Başvuru ayrıntısındaki görüşme bölümü (firma). Durumu gösterir; yetkili kullanıcı davet eder, tarihleri değiştirir
 * veya iptal eder. Kurallar src/alan/gorusme.ts, servis src/servisler/gorusme.ts.
 */
import { useActionState, useRef, useState } from 'react'
import { GORUSME_BICIMI, GORUSME_HALI_ADI, GORUSME_SURELERI, SAAT_SECENEKLERI, gorusmeZamani, saatAraligi, type GorusmeBicimi, type GorusmeHali } from '@/alan/gorusme'
import { gorusmeDavetEylemi, gorusmeIptalEylemi } from '@/eylemler/gorusme'
import { GonderDugmesi, HataOzeti, type FormDurumu } from '../form'

export interface GorusmeGorunumu {
  id: number
  hal: GorusmeHali
  secenekler: string[]
  secilen: string | null
  sure: number
  bicim: GorusmeBicimi
  yer: string | null
  not: string | null
  adayNotu: string | null
  iptalNedeni: string | null
}

type Props = {
  basvuruId: number
  gorusme: GorusmeGorunumu | null
  /** Durum yetkisi var ve başvuru açık */
  yetki: boolean
  kapaliNedeni?: string
  /** Seçilebilir günler (src/alan/gorusme.ts → gunSecenekleri) */
  gunler: Array<{ deger: string; metin: string }>
  varsayilanAdres: string
}

const SUREN: GorusmeHali[] = ['bekliyor', 'onaylandi', 'yeni-tarih']

export function GorusmePaneli(p: Props) {
  const g = p.gorusme
  const suren = g && SUREN.includes(g.hal) ? g : null
  return (
    <section className="panel f-blok" id="gorusme" aria-labelledby="gorusme-baslik">
      <h2 className="b3 kare-bas" id="gorusme-baslik">
        Görüşme
      </h2>
      {g ? <GorusmeOzeti g={g} /> : <p className="kucuk ikincil">Adaya 1–3 tarih seçeneği önerin; aday birini seçince iki tarafa takvim dosyası gider.</p>}
      {p.yetki ? (
        <div className="dugme-grubu gr-dugmeler">
          <DavetPenceresi {...p} suren={suren} />
          {suren && <IptalPenceresi basvuruId={p.basvuruId} gorusmeId={suren.id} />}
        </div>
      ) : (
        p.kapaliNedeni && <p className="kucuk ikincil">{p.kapaliNedeni}</p>
      )}
    </section>
  )
}

function GorusmeOzeti({ g }: { g: GorusmeGorunumu }) {
  const bicim = GORUSME_BICIMI[g.bicim]
  return (
    <div className="gr-ozet">
      <p>
        <span className={`rozet ${g.hal === 'onaylandi' ? 'rozet--yesil' : g.hal === 'yeni-tarih' || g.hal === 'suresi-doldu' ? 'rozet--kiremit' : 'rozet--notr'}`}>
          {GORUSME_HALI_ADI[g.hal].firma}
        </span>
      </p>
      {g.secilen && (g.hal === 'onaylandi' || g.hal === 'tamamlandi') ? (
        <p>
          <strong>{gorusmeZamani(new Date(g.secilen))}</strong>
          <br />
          <span className="kucuk ikincil">
            {saatAraligi(new Date(g.secilen), g.sure)} · {bicim.ad}
          </span>
        </p>
      ) : (
        g.hal !== 'iptal' && (
          <ul className="gr-secenekler kucuk">
            {g.secenekler.map((s) => (
              <li key={s}>{gorusmeZamani(new Date(s))}</li>
            ))}
          </ul>
        )
      )}
      {g.yer && g.hal !== 'iptal' && (
        <p className="kucuk">
          {bicim.yerEtiketi}: <span className="gr-yer">{g.yer}</span>
        </p>
      )}
      {g.hal === 'yeni-tarih' && g.adayNotu && (
        <p className="bilgi kucuk">
          <strong>Adayın notu:</strong> {g.adayNotu}
        </p>
      )}
      {g.hal === 'iptal' && g.iptalNedeni && <p className="kucuk ikincil">İptal nedeni: {g.iptalNedeni}</p>}
      {g.hal === 'onaylandi' && (
        <p className="kucuk">
          <a href={`/firma-paneli/gorusme/${g.id}/takvim`} download>
            Takvim dosyasını indir (.ics)
          </a>
        </p>
      )}
    </div>
  )
}

function DavetPenceresi(p: Props & { suren: GorusmeGorunumu | null }) {
  const pencere = useRef<HTMLDialogElement>(null)
  const [durum, eylem] = useActionState<FormDurumu, FormData>(gorusmeDavetEylemi, {})
  const etiket = !p.suren ? 'Görüşmeye davet et' : p.suren.hal === 'yeni-tarih' ? 'Yeni tarih öner' : 'Tarihleri değiştir'
  return (
    <>
      <button type="button" className={p.suren?.hal === 'yeni-tarih' || !p.suren ? 'dugme dugme--kucuk' : 'dugme dugme--ikincil dugme--kucuk'} onClick={() => pencere.current?.showModal()}>
        {etiket}
      </button>
      <dialog ref={pencere} className="pencere-dialog gr-pencere" aria-labelledby="gr-davet-baslik">
        <DavetFormu key={durum.surum ?? 0} {...p} durum={durum} eylem={eylem} kapat={() => pencere.current?.close()} baslik={etiket} />
      </dialog>
    </>
  )
}

function DavetFormu(p: Props & { suren: GorusmeGorunumu | null; durum: FormDurumu; eylem: (f: FormData) => void; kapat: () => void; baslik: string }) {
  const d = p.durum.degerler ?? {}
  const h = p.durum.hatalar ?? {}
  const [bicim, setBicim] = useState<GorusmeBicimi>((d.bicim as GorusmeBicimi) || p.suren?.bicim || 'yuz-yuze')
  const yerVarsayilan = d.yer ?? (p.suren ? (p.suren.yer ?? '') : '')
  const [yer, setYer] = useState(yerVarsayilan || (bicim === 'yuz-yuze' ? p.varsayilanAdres : ''))
  const bicimDegisti = (b: GorusmeBicimi) => {
    setBicim(b)
    if (b === 'yuz-yuze' && !yer) setYer(p.varsayilanAdres)
    if (b !== 'yuz-yuze' && yer === p.varsayilanAdres) setYer('')
  }
  const b = GORUSME_BICIMI[bicim]
  return (
    <form action={p.eylem} className="form-yigin" noValidate>
      <h2 className="b3" id="gr-davet-baslik">
        {p.baslik}
      </h2>
      <p className="kucuk ikincil">
        {p.suren
          ? 'Yeni seçenekler eski tarihlerin yerine geçer; adaya yeniden e-posta gider. Kesinleşmiş saat varsa adayın takviminden kaldırılır.'
          : 'En fazla 3 seçenek önerin. Aday birini seçer veya hiçbiri uymuyorsa başka tarih ister. Saatler Türkiye saatidir.'}
      </p>
      <HataOzeti durum={p.durum} siz alanlar={{ secenek0: 'gr-gun0', secenek1: 'gr-gun1', secenek2: 'gr-gun2', sure: 'gr-sure', bicim: 'gr-bicim-0', yer: 'gr-yer', not: 'gr-not' }} />
      <input type="hidden" name="basvuru" value={p.basvuruId} />
      {p.suren && <input type="hidden" name="degisiklik" value="1" />}
      {[0, 1, 2].map((i) => (
        <fieldset key={i} className={h[`secenek${i}`] ? 'alan alan--hata gr-secenek' : 'alan gr-secenek'}>
          <legend>
            {i + 1}. seçenek{i > 0 && <span className="istege-bagli"> (isteğe bağlı)</span>}
          </legend>
          {h[`secenek${i}`] && <p className="hata-metni">{h[`secenek${i}`]}</p>}
          <div className="gr-satir">
            <label className="gizli" htmlFor={`gr-gun${i}`}>
              {i + 1}. seçeneğin günü
            </label>
            <select id={`gr-gun${i}`} name={`gun${i}`} className="secim" defaultValue={d[`gun${i}`] ?? ''}>
              <option value="">Gün seçin</option>
              {p.gunler.map((x) => (
                <option key={x.deger} value={x.deger}>
                  {x.metin}
                </option>
              ))}
            </select>
            <label className="gizli" htmlFor={`gr-saat${i}`}>
              {i + 1}. seçeneğin saati
            </label>
            <select id={`gr-saat${i}`} name={`saat${i}`} className="secim" defaultValue={d[`saat${i}`] ?? ''}>
              <option value="">Saat</option>
              {SAAT_SECENEKLERI.map((s) => (
                <option key={s} value={s}>
                  {s.replace(':', '.')}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      ))}
      <div className={h.sure ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="gr-sure">Süre</label>
        {h.sure && <p className="hata-metni">{h.sure}</p>}
        <select id="gr-sure" name="sure" className="secim" defaultValue={d.sure ?? String(p.suren?.sure ?? 45)}>
          {GORUSME_SURELERI.map((s) => (
            <option key={s} value={s}>
              {s} dakika
            </option>
          ))}
        </select>
      </div>
      <fieldset className={h.bicim ? 'alan alan--hata' : 'alan'}>
        <legend>Biçim</legend>
        {h.bicim && <p className="hata-metni">{h.bicim}</p>}
        <div className="yan-yana">
          {(Object.keys(GORUSME_BICIMI) as GorusmeBicimi[]).map((x, i) => (
            <label key={x} className="secenek secenek-kutu">
              <input type="radio" id={`gr-bicim-${i}`} name="bicim" value={x} checked={bicim === x} onChange={() => bicimDegisti(x)} /> <span>{GORUSME_BICIMI[x].ad}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={h.yer ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="gr-yer">
          {b.yerEtiketi}
          {bicim === 'telefon' && <span className="istege-bagli"> (isteğe bağlı)</span>}
        </label>
        <span className="ipucu">{b.yerIpucu}</span>
        {h.yer && <p className="hata-metni">{h.yer}</p>}
        <input id="gr-yer" name="yer" className="girdi" value={yer} onChange={(e) => setYer(e.target.value)} maxLength={300} inputMode={bicim === 'cevrim-ici' ? 'url' : undefined} />
      </div>
      <div className={h.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="gr-not">
          Adaya not <span className="istege-bagli">(isteğe bağlı)</span>
        </label>
        <span className="ipucu">Örneğin görüşmede kimlerin olacağı veya yanında getirmesi gerekenler.</span>
        {h.not && <p className="hata-metni">{h.not}</p>}
        <textarea id="gr-not" name="not" className="metin-alani" rows={3} maxLength={1000} defaultValue={d.not ?? p.suren?.not ?? ''} />
      </div>
      <div className="dugme-grubu">
        <GonderDugmesi className="dugme" bekleme="Gönderiliyor…">
          {p.suren ? 'Yeni tarihleri gönder' : 'Daveti gönder'}
        </GonderDugmesi>
        <button type="button" className="dugme dugme--ikincil" onClick={p.kapat}>
          Vazgeç
        </button>
      </div>
    </form>
  )
}

function IptalPenceresi({ basvuruId, gorusmeId }: { basvuruId: number; gorusmeId: number }) {
  const pencere = useRef<HTMLDialogElement>(null)
  const [durum, eylem] = useActionState<FormDurumu, FormData>(gorusmeIptalEylemi, {})
  const h = durum.hatalar ?? {}
  return (
    <>
      <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => pencere.current?.showModal()}>
        Görüşmeyi iptal et
      </button>
      <dialog ref={pencere} className="pencere-dialog" aria-labelledby="gr-iptal-baslik">
        <form key={durum.surum ?? 0} action={eylem} className="form-yigin" noValidate>
          <h2 className="b3" id="gr-iptal-baslik">
            Görüşmeyi iptal etmek istiyor musunuz?
          </h2>
          <p>Adaya açıklamanızla birlikte e-posta gider. Tarih kesinleşmişse görüşme adayın takviminden kaldırılır.</p>
          <HataOzeti durum={durum} siz alanlar={{ neden: 'gr-neden' }} />
          <input type="hidden" name="basvuru" value={basvuruId} />
          <input type="hidden" name="gorusme" value={gorusmeId} />
          <div className={h.neden ? 'alan alan--hata' : 'alan'}>
            <label htmlFor="gr-neden">Adaya açıklama</label>
            {h.neden && <p className="hata-metni">{h.neden}</p>}
            <textarea id="gr-neden" name="neden" className="metin-alani" rows={3} maxLength={500} defaultValue={durum.degerler?.neden} />
          </div>
          <div className="dugme-grubu">
            <GonderDugmesi className="dugme dugme--tehlike" bekleme="İptal ediliyor…">
              İptal et
            </GonderDugmesi>
            <button type="button" className="dugme dugme--ikincil" onClick={() => pencere.current?.close()}>
              Vazgeç
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
