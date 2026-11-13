/**
 * Tek ikon seti: 1,75 px çizgi, kare uçlar (logodaki kareye uyumlu). Prototipteki setin aynısı.
 * Sayfaya bir kez gömülür (<IkonSeti />), her ikon <use> ile çağrılır.
 */
const SEMBOLLER = `
  <symbol id="i-ara" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></symbol>
  <symbol id="i-filtre" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/><rect x="7" y="5" width="3" height="4" fill="var(--yuzey)"/><rect x="14" y="10" width="3" height="4" fill="var(--yuzey)"/><rect x="9" y="15" width="3" height="4" fill="var(--yuzey)"/></symbol>
  <symbol id="i-konum" viewBox="0 0 24 24"><path d="M12 21s-6-6.1-6-11a6 6 0 0 1 12 0c0 4.9-6 11-6 11z"/><rect x="11" y="9" width="2" height="2"/></symbol>
  <symbol id="i-takvim" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15"/><path d="M4 10h16M8 3v4M16 3v4"/><rect x="8" y="13" width="3" height="3"/></symbol>
  <symbol id="i-ofis" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></symbol>
  <symbol id="i-ev" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><rect x="10" y="14" width="4" height="6"/></symbol>
  <symbol id="i-yer-imi" viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4z"/></symbol>
  <symbol id="i-dosya" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></symbol>
  <symbol id="i-indir" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></symbol>
  <symbol id="i-yukle" viewBox="0 0 24 24"><path d="M12 15V4M7 9l5-5 5 5M5 20h14"/></symbol>
  <symbol id="i-kapat" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-geri" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="i-ileri" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="i-tik" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></symbol>
  <symbol id="i-kisi" viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="7"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/></symbol>
  <symbol id="i-zil" viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/></symbol>
  <symbol id="i-arti" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-kopya" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12"/><path d="M16 4H4v12"/></symbol>
  <symbol id="i-duraklat" viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></symbol>
  <symbol id="i-paylas" viewBox="0 0 24 24"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v8h14v-8"/></symbol>
  <symbol id="i-liste" viewBox="0 0 24 24"><rect x="4" y="5" width="3" height="3"/><rect x="4" y="11" width="3" height="3"/><rect x="4" y="17" width="3" height="3"/><path d="M10 6.5h10M10 12.5h10M10 18.5h10"/></symbol>
  <symbol id="i-mesaj" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol>
  <symbol id="i-kalem" viewBox="0 0 24 24"><path d="M15 5l4 4L9 19H5v-4z"/></symbol>
  <symbol id="i-grafik" viewBox="0 0 24 24"><path d="M4 20h16"/><rect x="6" y="12" width="3" height="6"/><rect x="11" y="8" width="3" height="10"/><rect x="16" y="4" width="3" height="14"/></symbol>
  <symbol id="i-ayar" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><rect x="14" y="5" width="4" height="4"/><rect x="6" y="15" width="4" height="4"/></symbol>
`

export type IkonAdi = "ara" | "filtre" | "konum" | "takvim" | "ofis" | "ev" | "yer-imi" | "dosya" | "indir" | "yukle" | "kapat" | "geri" | "ileri" | "menu" | "tik" | "kisi" | "zil" | "arti" | "kopya" | "duraklat" | "paylas" | "liste" | "mesaj" | "kalem" | "grafik" | "ayar"

export function IkonSeti() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SEMBOLLER }} />
}

export function Ikon({ ad, kucuk = false }: { ad: IkonAdi; kucuk?: boolean }) {
  return (
    <svg className={kucuk ? 'ikon ikon--k' : 'ikon'} aria-hidden="true" focusable="false">
      <use href={`#i-${ad}`} />
    </svg>
  )
}
