'use client'
/**
 * Listeye dosyadan toplu aktarma (YÖK/ÖSYM üniversite ve bölüm listeleri). Dosya tarayıcıda okunur; adlar temizlenip
 * önizlenir; seçilen adlar 200'erli parçalarla sunucuya gider ve sunucu her parçayı yeniden denetler. Hitap: siz.
 */
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { AKTARMA_EN_FAZLA, AKTARMA_PARCA, aktarmaAdlari, sutunOner, xlsxOku, type AktarmaTuru } from '@/alan/listeAktarma'
import { csvOku } from '@/alan/iceAktarma'
import { aktarmaOnizleEylemi, aktarmaParcaEylemi } from '@/eylemler/listeler'
import type { AktarmaSiniflamasi } from '@/servisler/listeler'

async function dosyayiOku(dosya: File): Promise<string[][]> {
  const baytlar = new Uint8Array(await dosya.arrayBuffer())
  if (/\.xlsx$/i.test(dosya.name) || (baytlar[0] === 0x50 && baytlar[1] === 0x4b)) return xlsxOku(baytlar)
  let metin: string
  try {
    metin = new TextDecoder('utf-8', { fatal: true }).decode(baytlar)
  } catch {
    metin = new TextDecoder('windows-1254').decode(baytlar) // Türkçe Excel'in varsayılan CSV kodlaması
  }
  return csvOku(metin.replace(/^﻿/, ''))
}

export function ListeAktarma({ tur, turAdi }: { tur: string; turAdi: string }) {
  const aktarmaTuru: AktarmaTuru = tur === 'universite' ? 'universite' : tur === 'bolum' ? 'bolum' : 'diger'
  const router = useRouter()
  const girdi = useRef<HTMLInputElement>(null)
  const [dosyaAdi, setDosyaAdi] = useState('')
  const [satirlar, setSatirlar] = useState<string[][]>([])
  const [sutun, setSutun] = useState(-1)
  const [hata, setHata] = useState('')
  const [onizleme, setOnizleme] = useState<AktarmaSiniflamasi | null>(null)
  const [mesgul, setMesgul] = useState('')
  const [sonuc, setSonuc] = useState('')

  const sec = async (dosya: File | undefined) => {
    setHata('')
    setOnizleme(null)
    setSonuc('')
    if (!dosya) return
    if (dosya.size > 20 * 1024 * 1024) return setHata('Dosya 20 MB’tan büyük. Yalnızca gerekli sütunları içeren bir dosya hazırlayın.')
    try {
      const s = await dosyayiOku(dosya)
      if (!s.length) return setHata('Dosyada satır bulunamadı.')
      setDosyaAdi(dosya.name)
      setSatirlar(s)
      const baslikSatiri = s.slice(0, 5).find((r) => sutunOner(r, aktarmaTuru) >= 0)
      setSutun(baslikSatiri ? sutunOner(baslikSatiri, aktarmaTuru) : s[0]!.length === 1 ? 0 : -1)
    } catch {
      setHata('Dosya okunamadı. Excel (.xlsx) veya CSV dosyası seçin; Excel’de “Farklı kaydet → CSV UTF-8” ile de kaydedebilirsiniz.')
    }
  }

  const adlar = sutun >= 0 ? aktarmaAdlari(satirlar, sutun, aktarmaTuru) : []
  const sutunSayisi = Math.min(12, Math.max(0, ...satirlar.slice(0, 6).map((r) => r.length)))

  const onizle = async () => {
    setHata('')
    if (!adlar.length) return setHata('Seçtiğiniz sütunda aktarılacak ad bulunamadı. Başka bir sütun seçin.')
    if (adlar.length > AKTARMA_EN_FAZLA) return setHata(`Bir dosyada en fazla ${AKTARMA_EN_FAZLA} ad aktarılabilir. Dosyayı bölün.`)
    setMesgul('Listeyle karşılaştırılıyor…')
    const r = await aktarmaOnizleEylemi(tur, adlar)
    setMesgul('')
    if (r.hata) return setHata(r.hata)
    setOnizleme(r.sonuc!)
  }

  const aktar = async () => {
    if (!onizleme) return
    const yeni = onizleme.yeni
    let eklenen = 0
    for (let i = 0; i < yeni.length; i += AKTARMA_PARCA) {
      setMesgul(`Aktarılıyor: ${Math.min(i + AKTARMA_PARCA, yeni.length)} / ${yeni.length}`)
      const r = await aktarmaParcaEylemi(tur, yeni.slice(i, i + AKTARMA_PARCA), dosyaAdi)
      if (r.hata) {
        setMesgul('')
        setHata(`${r.hata} Bu ana kadar ${eklenen} ad eklendi.`)
        router.refresh()
        return
      }
      eklenen += r.eklenen ?? 0
    }
    setMesgul('')
    setOnizleme(null)
    setSatirlar([])
    setSonuc(`${eklenen} ad ${turAdi} listesine eklendi.`)
    if (girdi.current) girdi.current.value = ''
    router.refresh()
  }

  return (
    <div className="y-sutun liste-aktarma">
      <p className="kucuk">
        {aktarmaTuru === 'universite'
          ? 'Resmî üniversite listesini (ÖSYM tercih kılavuzu tabloları veya YÖK’ün üniversite listesi) Excel ya da CSV olarak yükleyin. Adların sonundaki şehir “(DENİZLİ)” atılır, tamamı büyük harfli adlar düzeltilir.'
          : aktarmaTuru === 'bolum'
            ? 'ÖSYM tercih kılavuzunun lisans ve önlisans program tablolarını Excel ya da CSV olarak yükleyin. “(İngilizce)”, “(Burslu)”, “(İÖ)” gibi ekler atılır; aynı bölüm bir kez eklenir.'
            : 'Her satırda bir ad olan Excel ya da CSV dosyası yükleyin.'}{' '}
        Listede zaten olan veya aynı kökte yazımı bulunan adlar eklenmez. Hiçbir şey silinmez.
      </p>
      <div className="dosya-secici">
        <input
          ref={girdi}
          id={`aktar-${tur}`}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="gizli"
          onChange={(e) => void sec(e.target.files?.[0])}
        />
        <label htmlFor={`aktar-${tur}`} className="dugme dugme--ikincil dugme--kucuk">
          Dosya seç
        </label>
        <span className="kucuk" aria-live="polite">
          {dosyaAdi || 'Dosya seçilmedi'}
        </span>
      </div>

      {satirlar.length > 0 && !onizleme && (
        <>
          <p className="kucuk">
            <strong>{turAdi.charAt(0).toLocaleUpperCase('tr') + turAdi.slice(1)}</strong> adlarının bulunduğu sütunu seçin. İlk satırlar aşağıda.
          </p>
          <div className="tablo-kap">
            <table className="tablo y-tablo aktarma-tablo">
              <thead>
                <tr>
                  {Array.from({ length: sutunSayisi }, (_, i) => (
                    <th key={i}>
                      <label className="secenek">
                        <input type="radio" name={`aktar-sutun-${tur}`} checked={sutun === i} onChange={() => setSutun(i)} /> <span>{String.fromCharCode(65 + i)}. sütun</span>
                      </label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.slice(0, 6).map((r, i) => (
                  <tr key={i}>
                    {Array.from({ length: sutunSayisi }, (_, j) => (
                      <td key={j} className={j === sutun ? 'secili-sutun kucuk' : 'kucuk'}>
                        {r[j] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sutun >= 0 && (
            <p className="kucuk ikincil">
              Bu sütundan temizlendikten sonra {adlar.length.toLocaleString('tr-TR')} farklı ad çıkıyor. Örnek: {adlar.slice(0, 4).join(', ')}
              {adlar.length > 4 ? '…' : ''}
            </p>
          )}
          <button type="button" className="dugme dugme--kucuk" onClick={() => void onizle()} disabled={sutun < 0 || Boolean(mesgul)}>
            Listeyle karşılaştır
          </button>
        </>
      )}

      {onizleme && (
        <div className="y-sutun">
          {onizleme.yeni.length === 0 && <p className="basari-kutu">Dosyadaki adların hepsi listede zaten var. Eklenecek yeni ad yok.</p>}
          <p>
            <strong>{onizleme.yeni.length.toLocaleString('tr-TR')}</strong> yeni ad eklenecek. {onizleme.zatenVar.toLocaleString('tr-TR')} ad listede zaten var
            {onizleme.benzer.length ? `; ${onizleme.benzer.length} ad listede başka bir yazımla bulunduğu için eklenmeyecek` : ''}.
          </p>
          {onizleme.yeni.length > 0 && (
            <details>
              <summary className="kucuk">Eklenecek adları göster</summary>
              <p className="kucuk aktarma-adlar">
                {onizleme.yeni.slice(0, 300).join(' · ')}
                {onizleme.yeni.length > 300 ? ` … ve ${onizleme.yeni.length - 300} ad daha` : ''}
              </p>
            </details>
          )}
          {onizleme.benzer.length > 0 && (
            <details>
              <summary className="kucuk">Başka yazımla bulunanları göster</summary>
              <ul className="kucuk">
                {onizleme.benzer.slice(0, 100).map((b) => (
                  <li key={b.ad}>
                    “{b.ad}” → listede “{b.listede}”
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="dugme-grubu">
            {onizleme.yeni.length > 0 && (
              <button type="button" className="dugme dugme--kucuk" onClick={() => void aktar()} disabled={Boolean(mesgul)}>
                {onizleme.yeni.length.toLocaleString('tr-TR')} adı listeye ekle
              </button>
            )}
            <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setOnizleme(null)} disabled={Boolean(mesgul)}>
              Geri dön
            </button>
          </div>
        </div>
      )}

      {mesgul && (
        <p className="kucuk" role="status">
          {mesgul}
        </p>
      )}
      {hata && (
        <p className="hata-metni" role="alert">
          {hata}
        </p>
      )}
      {sonuc && (
        <p className="basari-kutu" role="status">
          {sonuc}
        </p>
      )}
    </div>
  )
}
