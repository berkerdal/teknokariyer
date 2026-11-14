'use client'
/**
 * Rehberden içe aktarma: dosya tarayıcıda okunur ve önizlenir; yalnızca seçilen satırlar sunucuya 20'şerli parçalar
 * hâlinde gönderilir. Sunucu her satırı yeniden denetler.
 */
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { onizle, rehberiCoz, type OnizlemeDurumu, type OnizlemeSatiri } from '@/alan/iceAktarma'
import { iceAktarEylemi } from '@/eylemler/firmaYonetimi'
import type { AktarmaSonucu } from '@/servisler/firmaYonetimi'

const DURUM_ADI: Record<OnizlemeDurumu, string> = { yeni: 'Yeni', kayitli: 'Zaten kayıtlı', tekrar: 'Dosyada tekrar', hatali: 'Eksik bilgi' }
const DURUM_SINIFI: Record<OnizlemeDurumu, string> = { yeni: 'durum--yayinda', kayitli: 'durum--kapandi', tekrar: 'durum--duzeltme', hatali: 'durum--reddedildi' }
const PARCA = 20

/** Excel'in Türkçe ayarı CSV'yi Windows-1254 ile kaydeder; UTF-8 değilse o kodlamayla okunur. */
async function metinOku(dosya: File): Promise<string> {
  const baytlar = new Uint8Array(await dosya.arrayBuffer())
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(baytlar)
  } catch {
    return new TextDecoder('windows-1254').decode(baytlar)
  }
}

export function IceAktarma({ mevcut, sektorler }: { mevcut: Array<{ unvan: string; kisaAd: string }>; sektorler: string[] }) {
  const [dosyaAdi, setDosyaAdi] = useState('')
  const [hata, setHata] = useState('')
  const [taninmayan, setTaninmayan] = useState<string[]>([])
  const [satirlar, setSatirlar] = useState<OnizlemeSatiri[]>([])
  const [secili, setSecili] = useState<Set<number>>(new Set())
  const [ilerleme, setIlerleme] = useState<{ yapilan: number; toplam: number } | null>(null)
  const [sonuclar, setSonuclar] = useState<Map<number, AktarmaSonucu>>(new Map())

  const say = useMemo(() => {
    const s: Record<OnizlemeDurumu, number> = { yeni: 0, kayitli: 0, tekrar: 0, hatali: 0 }
    for (const r of satirlar) s[r.durum]++
    return s
  }, [satirlar])

  async function yukle(dosya: File | undefined) {
    setHata('')
    setSonuclar(new Map())
    setSatirlar([])
    if (!dosya) return
    setDosyaAdi(dosya.name)
    if (dosya.size > 1024 * 1024) return setHata('Dosya 1 MB’tan büyük. Dosyayı bölerek yükleyin.')
    if (!/\.(csv|txt)$/i.test(dosya.name)) return setHata('Dosyayı Excel’de “Farklı kaydet → CSV UTF-8 (virgülle ayrılmış)” seçeneğiyle kaydedip yükleyin.')
    const c = rehberiCoz(await metinOku(dosya))
    if (c.hata) return setHata(c.hata)
    const o = onizle(c.firmalar, mevcut, sektorler)
    setTaninmayan(c.taninmayan)
    setSatirlar(o)
    setSecili(new Set(o.filter((r) => r.durum === 'yeni').map((r) => r.satir)))
  }

  async function aktar() {
    const giden = satirlar.filter((r) => secili.has(r.satir) && !sonuclar.get(r.satir)?.eklendi)
    if (!giden.length) return
    setHata('')
    setIlerleme({ yapilan: 0, toplam: giden.length })
    const yeni = new Map(sonuclar)
    for (let i = 0; i < giden.length; i += PARCA) {
      const parca = giden.slice(i, i + PARCA).map(({ satir, unvan, kisaAd, konum, sektor, web, yetkiliAd, yetkiliEposta, yetkiliTelefon }) => ({ satir, unvan, kisaAd, konum, sektor, web, yetkiliAd, yetkiliEposta, yetkiliTelefon }))
      const s = await iceAktarEylemi(JSON.stringify(parca))
      if (s.hata) {
        setHata(`${s.hata} Aktarılan satırlar kaydedildi; kalanları yeniden deneyebilirsiniz.`)
        break
      }
      for (const r of s.sonuc ?? []) yeni.set(r.satir, r)
      setSonuclar(new Map(yeni))
      setIlerleme({ yapilan: Math.min(i + PARCA, giden.length), toplam: giden.length })
    }
    setIlerleme(null)
  }

  const eklenen = [...sonuclar.values()].filter((r) => r.eklendi).length
  const atlanan = [...sonuclar.values()].filter((r) => !r.eklendi).length
  const seciliSayi = satirlar.filter((r) => secili.has(r.satir) && !sonuclar.get(r.satir)?.eklendi).length

  return (
    <div className="y-sutun">
      <div className="alan">
        <span className="alan-ad">Rehber dosyası (CSV)</span>
        <div className="dosya-secici">
          <input id="rehber-dosya" type="file" accept=".csv,text/csv,.txt" className="gizli" onChange={(e) => void yukle(e.target.files?.[0])} />
          <label htmlFor="rehber-dosya" className="dugme dugme--ikincil dugme--kucuk">
            Dosya seç
          </label>
          <span className="kucuk" aria-live="polite">
            {dosyaAdi || 'Dosya seçilmedi'}
          </span>
        </div>
      </div>
      {hata && (
        <p className="hata-kutu" role="alert">
          {hata}
        </p>
      )}
      {taninmayan.length > 0 && <p className="kucuk ikincil">Şu sütunlar tanınmadı ve aktarılmayacak: {taninmayan.join(', ')}.</p>}

      {satirlar.length > 0 && (
        <>
          <p role="status">
            Dosyada {satirlar.length} firma var: <strong>{say.yeni} yeni</strong>, {say.kayitli} zaten kayıtlı, {say.tekrar} dosyada tekrar, {say.hatali} eksik
            bilgili. Yeni firmalar seçili geldi. Zaten kayıtlı ve tekrar eden satırları yalnızca emin olduğunuzda seçin; sunucu aynı firmayı ikinci kez açmaz.
          </p>
          {eklenen + atlanan > 0 && (
            <p className={atlanan ? 'uyari-kutu' : 'basari-kutu'} role="status">
              {eklenen} firma iskelet kayıt olarak eklendi{atlanan ? `, ${atlanan} satır eklenmedi (nedenleri tabloda)` : ''}. Eklenen firmalar{' '}
              <Link href="/yonetim/firmalar?asama=iskelet#liste">firma listesinde</Link> “İskelet” aşamasında.
            </p>
          )}
          <div className="tablo-kap">
            <table className="tablo y-tablo y-aktarma">
              <thead>
                <tr>
                  <th>
                    <span className="gizli">Seç</span>
                  </th>
                  <th className="sag">Satır</th>
                  <th>Firma</th>
                  <th>Yer</th>
                  <th>Sektör</th>
                  <th>Durum</th>
                  <th>Kontrol edin</th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((r) => {
                  const s = sonuclar.get(r.satir)
                  return (
                    <tr key={r.satir}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${r.kisaAd || r.unvan} satırını seç`}
                          disabled={r.durum === 'hatali' || Boolean(s?.eklendi)}
                          checked={secili.has(r.satir)}
                          onChange={(e) =>
                            setSecili((x) => {
                              const y = new Set(x)
                              if (e.target.checked) y.add(r.satir)
                              else y.delete(r.satir)
                              return y
                            })
                          }
                        />
                      </td>
                      <td className="sag sayi">{r.satir}</td>
                      <td>
                        <strong>{r.kisaAd || '—'}</strong>
                        <br />
                        <span className="kucuk ikincil">{r.unvan}</span>
                      </td>
                      <td>{r.konum || '—'}</td>
                      <td>{r.sektor || '—'}</td>
                      <td>
                        {s ? (
                          <span className={`durum ${s.eklendi ? 'durum--yayinda' : 'durum--reddedildi'}`}>{s.eklendi ? 'Eklendi' : 'Eklenmedi'}</span>
                        ) : (
                          <span className={`durum ${DURUM_SINIFI[r.durum]}`}>{DURUM_ADI[r.durum]}</span>
                        )}
                      </td>
                      <td className="kucuk">
                        {s && !s.eklendi && <p className="hata-metni">{s.mesaj}</p>}
                        {[...r.hatalar, ...r.uyarilar].map((u, i) => (
                          <p key={i} className={i < r.hatalar.length ? 'hata-metni' : undefined}>
                            {u}
                          </p>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="dugme-grubu">
            <button type="button" className="dugme" disabled={!seciliSayi || Boolean(ilerleme)} onClick={() => void aktar()}>
              {ilerleme ? `Aktarılıyor… ${ilerleme.yapilan} / ${ilerleme.toplam}` : `Seçilen ${seciliSayi} firmayı iskelet kayıt olarak aktar`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
