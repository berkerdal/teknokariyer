'use client'
/**
 * Portal içi CV görüntüleyici (K34). PDF, pdf.js ile yalnızca resim olarak çizilir: PDF içindeki betikler çalışmaz,
 * gömülü ekler açılmaz, form işlenmez. pdf.js ve yardımcı işçisi portalın kendi dosyalarından yüklenir (dış CDN yok).
 * Gösterilen kopya filigranlıdır ve sunucuda ayrıca etkisizleştirilmiştir; her görüntüleme işlem kaydına geçer.
 *
 * Masaüstünde büyük pencere, mobilde tam ekran. Yakınlaştırma, indirme (ayrı istek, kayda geçer) ve yazdırma.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Ikon } from '../Ikon'

type Durum = { tur: 'kapali' } | { tur: 'yukleniyor' } | { tur: 'hazir'; sayfa: number } | { tur: 'hata'; mesaj: string }

const OLCEKLER = [0.75, 1, 1.25, 1.5, 2]
const EN_FAZLA_SAYFA = 30

export function CvGoruntuleyici({ adres, indirAdres, baslik }: { adres: string; indirAdres: string; baslik: string }) {
  const pencere = useRef<HTMLDialogElement>(null)
  const kap = useRef<HTMLDivElement>(null)
  const belge = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(null)
  const gorev = useRef<{ destroy: () => Promise<void> } | null>(null)
  const [durum, setDurum] = useState<Durum>({ tur: 'kapali' })
  const [olcek, setOlcek] = useState(1)

  /** Sayfaları kapsayıcı genişliğine sığacak biçimde (× yakınlaştırma) tuvale çizer. */
  const ciz = useCallback(async () => {
    const b = belge.current
    const k = kap.current
    if (!b || !k) return
    k.replaceChildren()
    const genislik = Math.max(280, k.clientWidth - 32)
    const oran = window.devicePixelRatio || 1
    for (let n = 1; n <= Math.min(b.numPages, EN_FAZLA_SAYFA); n++) {
      const sayfa = (await b.getPage(n)) as {
        getViewport: (o: { scale: number }) => { width: number; height: number }
        render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; transform?: number[] }) => { promise: Promise<void> }
      }
      const temel = sayfa.getViewport({ scale: 1 })
      const gorunum = sayfa.getViewport({ scale: (genislik / temel.width) * olcek })
      const tuval = document.createElement('canvas')
      tuval.width = Math.floor(gorunum.width * oran)
      tuval.height = Math.floor(gorunum.height * oran)
      tuval.style.width = `${Math.floor(gorunum.width)}px`
      tuval.style.height = `${Math.floor(gorunum.height)}px`
      tuval.setAttribute('role', 'img')
      tuval.setAttribute('aria-label', `CV, sayfa ${n} / ${b.numPages}`)
      tuval.className = 'cv-sayfa'
      k.appendChild(tuval)
      const ctx = tuval.getContext('2d')
      if (!ctx) continue
      await sayfa.render({ canvasContext: ctx, viewport: gorunum, transform: oran !== 1 ? [oran, 0, 0, oran, 0, 0] : undefined }).promise
    }
  }, [olcek])

  const ac = async () => {
    pencere.current?.showModal()
    setDurum({ tur: 'yukleniyor' })
    try {
      const yanit = await fetch(adres, { cache: 'no-store' })
      if (!yanit.ok) throw new Error((await yanit.text()) || 'CV açılamadı.')
      const veri = new Uint8Array(await yanit.arrayBuffer())
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      // XFA kapalı. pdf.js kitaplığı PDF betiklerini çalıştırmaz (betik desteği yalnızca ayrı görüntüleyici paketinde vardır).
      const yukleme = pdfjs.getDocument({ data: veri, enableXfa: false, stopAtErrors: false })
      gorev.current = yukleme
      belge.current = (await yukleme.promise) as never
      setDurum({ tur: 'hazir', sayfa: belge.current!.numPages })
    } catch (e) {
      setDurum({ tur: 'hata', mesaj: e instanceof Error && e.message.length < 300 ? e.message : 'CV açılamadı. Biraz sonra yeniden deneyin.' })
    }
  }

  const kapat = () => {
    pencere.current?.close()
  }

  useEffect(() => {
    if (durum.tur === 'hazir') void ciz()
  }, [durum, ciz])

  // Pencere kapanınca belleği bırak
  useEffect(() => {
    const p = pencere.current
    if (!p) return
    const kapandi = () => {
      void gorev.current?.destroy()
      gorev.current = null
      belge.current = null
      kap.current?.replaceChildren()
      setDurum({ tur: 'kapali' })
      setOlcek(1)
    }
    p.addEventListener('close', kapandi)
    return () => p.removeEventListener('close', kapandi)
  }, [])

  const yazdir = () => {
    const k = kap.current
    if (!k) return
    const tuvaller = Array.from(k.querySelectorAll('canvas'))
    const yazdirma = document.createElement('div')
    yazdirma.className = 'cv-yazdir-kap'
    for (const t of tuvaller) {
      const img = document.createElement('img')
      img.src = t.toDataURL('image/png')
      img.alt = t.getAttribute('aria-label') ?? 'CV sayfası'
      yazdirma.appendChild(img)
    }
    document.body.appendChild(yazdirma)
    document.documentElement.classList.add('cv-yazdiriliyor')
    const bitir = () => {
      document.documentElement.classList.remove('cv-yazdiriliyor')
      yazdirma.remove()
      window.removeEventListener('afterprint', bitir)
    }
    window.addEventListener('afterprint', bitir)
    window.print()
  }

  const olcekIndeks = OLCEKLER.indexOf(olcek)
  return (
    <>
      <button type="button" className="dugme dugme--ikincil dugme--kucuk" onClick={ac}>
        <Ikon ad="goz" /> CV’yi görüntüle
      </button>
      <dialog ref={pencere} className="cv-pencere" aria-labelledby="cv-pencere-baslik">
        <header className="cv-arac">
          <h2 className="b4" id="cv-pencere-baslik">
            {baslik}
            {durum.tur === 'hazir' && <span className="kucuk ikincil"> · {durum.sayfa} sayfa</span>}
          </h2>
          <div className="cv-arac-dugmeler">
            <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setOlcek(OLCEKLER[Math.max(0, olcekIndeks - 1)]!)} disabled={durum.tur !== 'hazir' || olcekIndeks <= 0} aria-label="Uzaklaştır">
              −
            </button>
            <span className="kucuk cv-olcek" aria-live="polite">
              %{Math.round(olcek * 100)}
            </span>
            <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={() => setOlcek(OLCEKLER[Math.min(OLCEKLER.length - 1, olcekIndeks + 1)]!)} disabled={durum.tur !== 'hazir' || olcekIndeks >= OLCEKLER.length - 1} aria-label="Yakınlaştır">
              +
            </button>
            <a className="dugme dugme--sade dugme--kucuk" href={indirAdres} download>
              <Ikon ad="indir" /> İndir
            </a>
            <button type="button" className="dugme dugme--sade dugme--kucuk" onClick={yazdir} disabled={durum.tur !== 'hazir'}>
              Yazdır
            </button>
            <button type="button" className="dugme dugme--ikincil dugme--kucuk" onClick={kapat}>
              <Ikon ad="kapat" /> Kapat
            </button>
          </div>
        </header>
        <div className="cv-govde">
          {durum.tur === 'yukleniyor' && <p className="cv-bilgi">CV hazırlanıyor…</p>}
          {durum.tur === 'hata' && (
            <p className="cv-bilgi hata-metni" role="alert">
              {durum.mesaj}
            </p>
          )}
          {durum.tur === 'hazir' && durum.sayfa > EN_FAZLA_SAYFA && (
            <p className="cv-bilgi kucuk">İlk {EN_FAZLA_SAYFA} sayfa gösteriliyor. Tamamı için CV’yi indirin.</p>
          )}
          <div ref={kap} className="cv-sayfalar" />
        </div>
        <p className="cv-not kucuk ikincil">
          CV güvenli görüntüleyicide açıldı: dosyadaki betikler çalıştırılmaz ve ekler açılmaz. Her görüntüleme ve indirme kayda geçer.
        </p>
      </dialog>
    </>
  )
}
