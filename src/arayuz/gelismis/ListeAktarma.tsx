'use client'
/**
 * Listeye toplu aktarma (gelişmiş yönetim ekranı, yalnızca teknik sorumlu). İki kaynak:
 * - Pakette gelen resmî liste (YÖK Atlas; `src/kaynakVeri/yokAtlas.json`)
 * - Excel (.xlsx) veya CSV dosyası: tarayıcıda okunur, sütun seçilir, adlar temizlenir.
 * Önizleme yeni / zaten var / başka yazımla var ayrımını gösterir; adlar 200'erli parçalarla sunucuya gider ve sunucu
 * her parçayı yeniden denetler. Hiçbir şey silinmez. Hitap: siz. Stil: `gelismis.css` (Payload ekranının renkleri).
 */
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { AKTARMA_EN_FAZLA, AKTARMA_PARCA, aktarmaAdlari, sutunOner, xlsxOku, type AktarmaSiniflamasi } from '@/alan/listeAktarma'
import { csvOku } from '@/alan/iceAktarma'
import { aktarmaOnizleEylemi, aktarmaParcaEylemi } from '@/eylemler/listeler'

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

const sayi = (n: number) => n.toLocaleString('tr-TR')

export function ListeAktarma({ tur, turAdi, hazir }: { tur: 'universite' | 'bolum'; turAdi: string; hazir?: { etiket: string; adlar: string[] } }) {
  const router = useRouter()
  const girdi = useRef<HTMLInputElement>(null)
  const [kaynak, setKaynak] = useState('')
  const [satirlar, setSatirlar] = useState<string[][]>([])
  const [sutun, setSutun] = useState(-1)
  const [hazirAdlar, setHazirAdlar] = useState<string[] | null>(null)
  const [hata, setHata] = useState('')
  const [onizleme, setOnizleme] = useState<AktarmaSiniflamasi | null>(null)
  const [mesgul, setMesgul] = useState('')
  const [sonuc, setSonuc] = useState('')

  const temizle = () => {
    setHata('')
    setOnizleme(null)
    setSonuc('')
    setSatirlar([])
    setHazirAdlar(null)
  }

  const adlar = hazirAdlar ?? (sutun >= 0 ? aktarmaAdlari(satirlar, sutun, tur) : [])

  const onizle = async (liste: string[]) => {
    setHata('')
    if (!liste.length) return setHata('Seçtiğiniz sütunda aktarılacak ad bulunamadı. Başka bir sütun seçin.')
    if (liste.length > AKTARMA_EN_FAZLA) return setHata(`Bir seferde en fazla ${sayi(AKTARMA_EN_FAZLA)} ad aktarılabilir. Dosyayı bölün.`)
    setMesgul('Listeyle karşılaştırılıyor…')
    const r = await aktarmaOnizleEylemi(tur, liste)
    setMesgul('')
    if (r.hata) return setHata(r.hata)
    setOnizleme(r.sonuc!)
  }

  const hazirKullan = () => {
    if (!hazir) return
    temizle()
    setKaynak(hazir.etiket)
    setHazirAdlar(hazir.adlar)
    void onizle(hazir.adlar)
  }

  const sec = async (dosya: File | undefined) => {
    temizle()
    if (!dosya) return
    if (dosya.size > 20 * 1024 * 1024) return setHata('Dosya 20 MB’tan büyük. Yalnızca gerekli sütunları içeren bir dosya hazırlayın.')
    try {
      const s = await dosyayiOku(dosya)
      if (!s.length) return setHata('Dosyada satır bulunamadı.')
      setKaynak(dosya.name)
      setSatirlar(s)
      const baslikSatiri = s.slice(0, 5).find((r) => sutunOner(r, tur) >= 0)
      setSutun(baslikSatiri ? sutunOner(baslikSatiri, tur) : s[0]!.length === 1 ? 0 : -1)
    } catch {
      setHata('Dosya okunamadı. Excel (.xlsx) veya CSV dosyası seçin. Excel’de “Farklı kaydet → CSV UTF-8” ile de kaydedebilirsiniz.')
    }
  }

  const aktar = async () => {
    if (!onizleme) return
    const yeni = onizleme.yeni
    let eklenen = 0
    for (let i = 0; i < yeni.length; i += AKTARMA_PARCA) {
      setMesgul(`Aktarılıyor: ${sayi(Math.min(i + AKTARMA_PARCA, yeni.length))} / ${sayi(yeni.length)}`)
      const r = await aktarmaParcaEylemi(tur, yeni.slice(i, i + AKTARMA_PARCA), kaynak)
      if (r.hata) {
        setMesgul('')
        setHata(`${r.hata} Bu ana kadar ${sayi(eklenen)} ad eklendi.`)
        router.refresh()
        return
      }
      eklenen += r.eklenen ?? 0
    }
    temizle()
    setSonuc(`${sayi(eklenen)} ad ${turAdi} listesine eklendi.`)
    if (girdi.current) girdi.current.value = ''
    router.refresh()
  }

  const sutunSayisi = Math.min(12, Math.max(0, ...satirlar.slice(0, 6).map((r) => r.length)))

  return (
    <div className="la">
      <div className="la-kaynaklar">
        {hazir && (
          <button type="button" className="la-dugme la-dugme--ana" onClick={hazirKullan} disabled={Boolean(mesgul)}>
            Paketteki listeyle karşılaştır ({sayi(hazir.adlar.length)} ad)
          </button>
        )}
        <input
          ref={girdi}
          id={`aktar-${tur}`}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="la-gizli"
          onChange={(e) => void sec(e.target.files?.[0])}
        />
        <label htmlFor={`aktar-${tur}`} className="la-dugme">
          Excel veya CSV dosyası seç
        </label>
        {kaynak && <span className="la-kucuk">Kaynak: {kaynak}</span>}
      </div>

      {satirlar.length > 0 && !onizleme && (
        <div className="la-adim">
          <p>
            {turAdi.charAt(0).toLocaleUpperCase('tr') + turAdi.slice(1)} adlarının bulunduğu sütunu seçin. Dosyanın ilk satırları aşağıda.
          </p>
          <div className="la-tablo-kap">
            <table className="la-tablo">
              <thead>
                <tr>
                  {Array.from({ length: sutunSayisi }, (_, i) => (
                    <th key={i}>
                      <label>
                        <input type="radio" name={`aktar-sutun-${tur}`} checked={sutun === i} onChange={() => setSutun(i)} /> {String.fromCharCode(65 + i)}. sütun
                      </label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.slice(0, 6).map((r, i) => (
                  <tr key={i}>
                    {Array.from({ length: sutunSayisi }, (_, j) => (
                      <td key={j} className={j === sutun ? 'la-secili' : undefined}>
                        {r[j] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sutun >= 0 && (
            <p className="la-kucuk">
              Bu sütundan temizlendikten sonra {sayi(adlar.length)} farklı ad çıkıyor. Örnek: {adlar.slice(0, 4).join(', ')}
              {adlar.length > 4 ? '…' : ''}
            </p>
          )}
          <button type="button" className="la-dugme la-dugme--ana" onClick={() => void onizle(adlar)} disabled={sutun < 0 || Boolean(mesgul)}>
            Listeyle karşılaştır
          </button>
        </div>
      )}

      {onizleme && (
        <div className="la-adim">
          {onizleme.yeni.length === 0 ? (
            <p className="la-basari">Bu kaynaktaki adların hepsi listede zaten var. Eklenecek yeni ad yok.</p>
          ) : (
            <p>
              <strong>{sayi(onizleme.yeni.length)}</strong> yeni ad eklenecek.
            </p>
          )}
          <p className="la-kucuk">
            {sayi(onizleme.zatenVar)} ad listede zaten var.
            {onizleme.benzer.length ? ` ${sayi(onizleme.benzer.length)} ad listede başka bir yazımla bulunduğu için eklenmeyecek.` : ''}
          </p>
          {onizleme.yeni.length > 0 && (
            <details>
              <summary>Eklenecek adları göster</summary>
              <p className="la-adlar">
                {onizleme.yeni.slice(0, 400).join(' · ')}
                {onizleme.yeni.length > 400 ? ` … ve ${sayi(onizleme.yeni.length - 400)} ad daha` : ''}
              </p>
            </details>
          )}
          {onizleme.benzer.length > 0 && (
            <details>
              <summary>Başka yazımla bulunanları göster</summary>
              <ul className="la-adlar">
                {onizleme.benzer.slice(0, 200).map((b) => (
                  <li key={b.ad}>
                    “{b.ad}” → listede “{b.listede}”
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="la-kaynaklar">
            {onizleme.yeni.length > 0 && (
              <button type="button" className="la-dugme la-dugme--ana" onClick={() => void aktar()} disabled={Boolean(mesgul)}>
                {sayi(onizleme.yeni.length)} adı listeye ekle
              </button>
            )}
            <button type="button" className="la-dugme" onClick={temizle} disabled={Boolean(mesgul)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {mesgul && (
        <p className="la-kucuk" role="status">
          {mesgul}
        </p>
      )}
      {hata && (
        <p className="la-hata" role="alert">
          {hata}
        </p>
      )}
      {sonuc && (
        <p className="la-basari" role="status">
          {sonuc}
        </p>
      )}
    </div>
  )
}
