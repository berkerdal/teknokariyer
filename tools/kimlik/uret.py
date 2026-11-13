"""TeknoKariyer alt marka kimliği — logo, sembol ve favicon üreticisi.

Kullanım (depo kökünden):
    pip install fonttools
    python3 tools/kimlik/uret.py

Çıktı: docs/kimlik/<alternatif>/*.svg

Neden bir betik?
- Logo, ana Teknokent logosunun gerçek vektör çizimlerinden türetilir (tools/kimlik/ana-logo.json).
  Elle çizilmiş bir kopya değil, ölçüleri aynı olan bir türev elde edilir.
- Yazılar fontTools ile eğriye çevrilir; SVG'ler yazı tipi kurulu olmayan bir bilgisayarda da aynı görünür.
- Renk veya oran değiştiğinde tüm sürümler (renkli, negatif, tek renk, favicon) tutarlı biçimde yeniden üretilir.

Birim: ana logonun PDF birimi. "tekno" yazısının x-yüksekliği H = 223 birimdir; tüm ölçüler buna göre verilir.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

KOK = os.path.dirname(os.path.abspath(__file__))
DEPO = os.path.dirname(os.path.dirname(KOK))
CIKTI = os.path.join(DEPO, "docs", "kimlik")
ANA = json.load(open(os.path.join(KOK, "ana-logo.json"), encoding="utf-8"))

H = ANA["taban"] - ANA["x_ust"]  # 223: "tekno" x-yüksekliği
GOVDE = 67.4  # "n" ve "k" gövde kalınlığı (ana logodan ölçüldü)

# --- Renkler -------------------------------------------------------------------------------------------------------
LACIVERT = "#2155AD"
CAMGOBEGI = "#05A1E6"
GECE = "#13284F"
BEYAZ = "#FFFFFF"
SIYAH = "#1D1D1B"

ALTERNATIFLER = {
    "a-kume": {"vurgu": "#B04E26", "vurgu_koyu_zemin": "#F7A27C"},  # kiremit
    "b-yuva": {"vurgu": "#F2B230", "vurgu_koyu_zemin": "#F2B230"},  # okra
}


# --- Yazı tipini eğriye çevirme ------------------------------------------------------------------------------------
_fontlar: dict[str, TTFont] = {}


def font(ad: str) -> TTFont:
    if ad not in _fontlar:
        _fontlar[ad] = TTFont(os.path.join(KOK, "fontlar", ad + ".ttf"))
    return _fontlar[ad]


def buyuk_harf_yuksekligi(ad: str) -> float:
    f = font(ad)
    os2 = f["OS/2"]
    return getattr(os2, "sCapHeight", 0) or 0.7 * f["head"].unitsPerEm


def metin(ad: str, yazi: str, buyuk_h: float, x: float, taban: float, izleme: float = 0.0,
          genislige: float | None = None) -> tuple[str, float]:
    """Metni SVG yol verisine çevirir.

    buyuk_h: büyük harf yüksekliği (birim). izleme: harfler arası ek boşluk (birim).
    genislige: verilirse izleme, metin bu genişliği tam dolduracak şekilde hesaplanır.
    Döndürür: (d, genişlik)
    """
    f = font(ad)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    olcek = buyuk_h / buyuk_harf_yuksekligi(ad)
    hmtx = f["hmtx"]
    adlar = [cmap[ord(c)] for c in yazi]
    ham = sum(hmtx[g][0] for g in adlar) * olcek
    # son harfin sağ yan boşluğunu genişlikten düş (optik hizalama)
    son_rsb = (hmtx[adlar[-1]][0] - _glif_xmax(f, adlar[-1])) * olcek
    ilk_lsb = hmtx[adlar[0]][1] * olcek
    ham -= son_rsb + ilk_lsb
    if genislige is not None and len(yazi) > 1:
        izleme = (genislige - ham) / (len(yazi) - 1)
    pen = SVGPathPen(gs)
    imlec = x - ilk_lsb
    for g in adlar:
        tp = TransformPen(pen, (olcek, 0, 0, -olcek, imlec, taban))
        gs[g].draw(tp)
        imlec += hmtx[g][0] * olcek + izleme
    return pen.getCommands(), ham + izleme * (len(yazi) - 1)


def _glif_xmax(f: TTFont, g: str) -> float:
    glyf = f["glyf"][g]
    return getattr(glyf, "xMax", f["hmtx"][g][0])


# --- Ana logodan türetilen harfler ---------------------------------------------------------------------------------
def _tasi(d: str, dx: float, dy: float, renk: str) -> str:
    return f'<path transform="translate({dx:.2f} {dy:.2f})" fill="{renk}" d="{d}"/>'


R_YOLU = ("M 849.22 605.02 L 916.11 605.02 L 916.11 633.87 C 916.11 633.87 927.91 605.02 977.10 605.02 "
          "L 1004 605.02 L 1004 672 L 976 672 C 936 672 917.43 680 917.43 704 L 917.43 827.98 L 849.22 827.98 Z")

ARALIK = {"te": 11, "ek": 26, "kn": 14, "no": 28, "ok": 24, "ka": 10, "ar": 24, "ri": 24, "iy": 10, "ye": 6, "er": 26}
NOKTA_BOSLUK = 22  # i noktası ile gövde arası


def harf(ch: str, x: float, renk: str, nokta_renk: str) -> tuple[str, float]:
    """Koordinat: x-yüksekliği üstü y=0, taban y=H."""
    T, X = ANA["tekno"], ANA["tekno_x"]
    ust = ANA["x_ust"]
    if ch in "tekno":
        x0, x1 = X[ch]
        return _tasi(T[ch], x - x0, -ust, renk), x1 - x0
    if ch == "a":  # tek katlı a: "o" + sağda düz gövde
        x0, x1 = X["o"]
        g = x1 - x0
        return (_tasi(T["o"], x - x0, -ust, renk)
                + f'<rect x="{x + g - GOVDE:.2f}" y="0" width="{GOVDE}" height="{H}" fill="{renk}"/>'), g
    if ch == "r":  # "n"nin omzundan türetilmiş r
        x0 = X["n"][0]
        return _tasi(R_YOLU, x - x0, -ust, renk), 1004 - x0
    if ch == "i":  # nokta kare: kimliğin taşıyıcı öğesi
        return (f'<rect x="{x:.2f}" y="0" width="{GOVDE}" height="{H}" fill="{renk}"/>'
                f'<rect x="{x:.2f}" y="{-GOVDE - NOKTA_BOSLUK:.2f}" width="{GOVDE}" height="{GOVDE}" fill="{nokta_renk}"/>'), GOVDE
    if ch == "y":  # tek kasa Y ("k" gibi üst uzantısız)
        w, kol, kv = 226.0, 90.0, 122.0
        cx = x + w / 2
        s = GOVDE / 2
        sol = f"{x},0 {x + kol},0 {cx + s},{kv} {cx - s},{kv}"
        sag = f"{x + w - kol},0 {x + w},0 {cx + s},{kv} {cx - s},{kv}"
        gov = f"{cx - s},{kv - 40} {cx + s},{kv - 40} {cx + s},{H} {cx - s},{H}"
        return "".join(f'<polygon fill="{renk}" points="{p}"/>' for p in (sol, sag, gov)), w
    raise KeyError(ch)


def kelime(yazi: str, x: float, renk: str, nokta_renk: str) -> tuple[str, float]:
    parcalar, imlec, onceki = [], x, None
    for ch in yazi:
        if onceki:
            imlec += ARALIK.get(onceki + ch, 20)
        svg, w = harf(ch, imlec, renk, nokta_renk)
        parcalar.append(svg)
        imlec += w
        onceki = ch
    return "".join(parcalar), imlec - x


# --- Semboller -----------------------------------------------------------------------------------------------------
# A · Küme: ana logoda "t" harfi sol üstte piksellere dağılır. Burada süreç tersine işler: dağınık pikseller büyük bir
# blokta toplanır ve bloğun üstünden tek bir kare yükselir (vurgu rengi). Kümenin düzensiz ritmi ana logodan alınmıştır.
# Birim kutu 84 × 80. Kareler: (x, y, boy).
BASAMAK = {"w": 84.0, "h": 80.0,
           "kareler": [(0, 60, 10), (10, 70, 10), (14, 46, 14), (28, 32, 14), (28, 54, 20), (48, 34, 36)],
           "vurgu": (54, 0, 30)}


def sembol_basamak(x: float, y: float, boy: float, renk: str, vurgu: str) -> tuple[str, float]:
    """boy: yükseklik. Döndürür: (svg, genişlik)."""
    o = boy / BASAMAK["h"]
    out = [f'<rect x="{x + kx * o:.2f}" y="{y + ky * o:.2f}" width="{kb * o:.2f}" height="{kb * o:.2f}" fill="{renk}"/>'
           for kx, ky, kb in BASAMAK["kareler"]]
    kx, ky, kb = BASAMAK["vurgu"]
    out.append(f'<rect x="{x + kx * o:.2f}" y="{y + ky * o:.2f}" width="{kb * o:.2f}" height="{kb * o:.2f}" fill="{vurgu}"/>')
    return "".join(out), BASAMAK["w"] * o


# B · Yuva: lacivert blok (Teknokent'teki bir firma, bir oda) ve içinde boş bir yuva; okra parça yuvaya yarıya kadar
# girmiş. Eşleştirmeyi anlatır: ürünün kalbi. Okra parça, logotype'taki "i" noktasıyla aynı öğedir.
# Birim kutu: genişlik 3u, yükseklik 3.55u (u = modül).
YUVA = {"w": 3.0, "h": 3.55, "parca_ust": 0.0, "blok_ust": 0.55, "oturma": 0.45}


def sembol_yuva(x: float, y: float, boy: float, renk: str, vurgu: str) -> tuple[str, float]:
    u = boy / YUVA["h"]
    bu = y + YUVA["blok_ust"] * u  # blok üstü
    d = (f"M{x:.2f} {bu:.2f} H{x + u:.2f} V{bu + u:.2f} H{x + 2 * u:.2f} V{bu:.2f} H{x + 3 * u:.2f} "
         f"V{y + boy:.2f} H{x:.2f} Z")
    parca_y = bu - u + YUVA["oturma"] * u
    return (f'<path fill="{renk}" d="{d}"/>'
            f'<rect x="{x + u:.2f}" y="{parca_y:.2f}" width="{u:.2f}" height="{u:.2f}" fill="{vurgu}"/>'), 3 * u


# --- SVG yardımcıları ----------------------------------------------------------------------------------------------
@dataclass
class Cizim:
    genislik: float
    yukseklik: float
    icerik: str
    zemin: str | None = None
    baslik: str = "Pamukkale Teknokent TeknoKariyer"
    bosluk: float = 0.0  # koruma alanı (birim)
    notlar: list[str] = field(default_factory=list)

    def svg(self, piksel_genislik: float | None = None) -> str:
        b = self.bosluk
        vb = f"{-b:.2f} {-b:.2f} {self.genislik + 2 * b:.2f} {self.yukseklik + 2 * b:.2f}"
        boyut = ""
        if piksel_genislik:
            oran = (self.yukseklik + 2 * b) / (self.genislik + 2 * b)
            boyut = f' width="{piksel_genislik:.0f}" height="{piksel_genislik * oran:.0f}"'
        zemin = (f'<rect x="{-b:.2f}" y="{-b:.2f}" width="{self.genislik + 2 * b:.2f}" '
                 f'height="{self.yukseklik + 2 * b:.2f}" fill="{self.zemin}"/>') if self.zemin else ""
        return kisalt(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{boyut} role="img" '
                      f'aria-label="{self.baslik}"><title>{self.baslik}</title>{zemin}{self.icerik}</svg>\n')


def kisalt(svg: str) -> str:
    """Koordinatları 1 ondalığa yuvarlar (logo ölçeğinde görünür fark yok, dosya ~%40 küçülür)."""
    return re.sub(r"-?\d+\.\d{2,}", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), svg)


def renkler(alt: str, surum: str) -> dict:
    v = ALTERNATIFLER[alt]
    if surum == "renkli":
        return {"ana": LACIVERT, "vurgu": v["vurgu"], "imza": LACIVERT, "zemin": None}
    if surum == "negatif":
        # Negatif dosyalar saydam zeminlidir; lacivert veya gece zemine konulmak üzere hazırlanır.
        return {"ana": BEYAZ, "vurgu": v["vurgu_koyu_zemin"], "imza": BEYAZ, "zemin": None}
    if surum == "tekrenk":
        return {"ana": SIYAH, "vurgu": SIYAH, "imza": SIYAH, "zemin": None}
    raise KeyError(surum)


# --- A · Basamak logoları ------------------------------------------------------------------------------------------
def a_yatay(r: dict) -> Cizim:
    """İmza / tekno / KARİYER yığını + basamak sembolü. Ana logonun PAMUKKALE / tekno / KENT kurgusunu izler."""
    tekno_w = ANA["tekno_x"]["o"][1] - ANA["tekno_x"]["t"][0]
    imza_h, kariyer_h = 46.0, 138.0
    bosluk1, bosluk2 = 46.0, 52.0
    blok_h = imza_h + bosluk1 + H + bosluk2 + kariyer_h
    sembol_svg, sw = sembol_basamak(0, blok_h * 0.28, blok_h * 0.72, r["ana"], r["vurgu"])
    tx = sw + 80.0
    imza_d, _ = metin("LexendRegular", "PAMUKKALE TEKNOKENT", imza_h, tx, imza_h, genislige=tekno_w)
    tekno_svg, _ = kelime("tekno", tx, r["ana"], r["vurgu"])
    tekno_y = imza_h + bosluk1
    kariyer_d, _ = metin("LexendExtraLight", "KARİYER", kariyer_h, tx, blok_h, genislige=tekno_w)
    kariyer_renk = r["vurgu"] if r["ana"] != SIYAH else SIYAH
    icerik = (sembol_svg
              + f'<path fill="{r["imza"]}" d="{imza_d}"/>'
              + f'<g transform="translate(0 {tekno_y})">{tekno_svg}</g>'
              + f'<path fill="{kariyer_renk}" d="{kariyer_d}"/>')
    return Cizim(tx + tekno_w, blok_h, icerik, r["zemin"], bosluk=blok_h / 4)


def a_kompakt(r: dict) -> Cizim:
    """Tek satır: sembol + tekno + KARİYER. Site başlığı ve dar alanlar için. İmza ayrıca yazılır."""
    sembol_svg, sw = sembol_basamak(0, 0, H, r["ana"], r["vurgu"])
    tx = sw + 56
    tekno_svg, tw = kelime("tekno", tx, r["ana"], r["vurgu"])
    kx = tx + tw + 34
    kariyer_d, kw = metin("LexendLight", "KARİYER", H, kx, H, izleme=14)
    kariyer_renk = r["vurgu"] if r["ana"] != SIYAH else SIYAH
    icerik = (sembol_svg + tekno_svg
              + f'<path fill="{kariyer_renk}" d="{kariyer_d}"/>')
    return Cizim(kx + kw, H, icerik, r["zemin"], bosluk=H / 4)


# --- B · Izgara logoları -------------------------------------------------------------------------------------------
NOKTA_UST = -(GOVDE + NOKTA_BOSLUK)  # i noktasının üstü


def b_yatay(r: dict) -> Cizim:
    """Sembol + tek kelime özel logotype; imza logotype'ın altında. Sembol yalnızca logotype boyundadır (nokta üstü →
    taban), böylece logotype ile yarışmaz."""
    imza_h = 62.0
    imza_bosluk = 64.0
    ust = -NOKTA_UST
    yazi_svg, yw = kelime("teknokariyer", 0, r["ana"], r["vurgu"])
    sembol_svg, sw = sembol_yuva(0, 0, ust + H, r["ana"], r["vurgu"])
    tx = sw + 90
    toplam_h = ust + H + imza_bosluk + imza_h
    imza_d, _ = metin("SchibstedGroteskMedium", "Pamukkale Teknokent", imza_h, tx, toplam_h, izleme=3)
    icerik = (sembol_svg
              + f'<g transform="translate({tx} {ust})">{yazi_svg}</g>'
              + f'<path fill="{r["imza"]}" d="{imza_d}"/>')
    return Cizim(tx + yw, toplam_h, icerik, r["zemin"], bosluk=(ust + H) / 4)


def b_kompakt(r: dict) -> Cizim:
    """Yalnızca logotype. Site başlığı ve dar alanlar için."""
    ust = -NOKTA_UST
    yazi_svg, yw = kelime("teknokariyer", 0, r["ana"], r["vurgu"])
    return Cizim(yw, ust + H, f'<g transform="translate(0 {ust})">{yazi_svg}</g>', r["zemin"], bosluk=H / 3)


# --- Sembol ve favicon ---------------------------------------------------------------------------------------------
def sembol(alt: str, r: dict) -> Cizim:
    boy = 400.0
    f = sembol_basamak if alt == "a-kume" else sembol_yuva
    svg, w = f(0, 0, boy, r["ana"], r["vurgu"])
    return Cizim(w, boy, svg, r["zemin"], bosluk=boy / 6)


def favicon(alt: str) -> str:
    """16 px ızgarasına oturan favicon: lacivert kare zemin, açık renkli sembol. Koyu ve açık sekme çubuğunda görünür."""
    v = ALTERNATIFLER[alt]
    if alt == "a-kume":
        # 16 px'te en küçük kare okunmaz; favicon sadeleştirilmiş sürümdür: iki yükselen kare + basamak sütunu.
        parcalar = [(2, 11, 2, BEYAZ), (4, 9, 2, BEYAZ), (5, 12, 2, BEYAZ), (8, 8, 6, BEYAZ), (9, 2, 5, v["vurgu_koyu_zemin"])]
    else:
        # blok 12×7, yuva 4×3, parça 4×4 (alt kenarı yuvanın içinde)
        parcalar = [(6, 3, 4, v["vurgu_koyu_zemin"])]
    rects = "".join(f'<rect x="{x}" y="{y}" width="{b}" height="{b}" fill="{c}"/>' for x, y, b, c in parcalar)
    if alt != "a-kume":
        rects = f'<path fill="{BEYAZ}" d="M2 7 H6 V10 H10 V7 H14 V14 H2 Z"/>' + rects
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">'
            f'<title>TeknoKariyer</title><rect width="16" height="16" rx="2" fill="{LACIVERT}"/>{rects}</svg>\n')


def uret() -> list[str]:
    yazilan = []
    for alt in ALTERNATIFLER:
        klasor = os.path.join(CIKTI, alt)
        os.makedirs(klasor, exist_ok=True)
        for surum in ("renkli", "negatif", "tekrenk"):
            r = renkler(alt, surum)
            cizimler = {
                "logo-yatay": a_yatay(r) if alt == "a-kume" else b_yatay(r),
                "logo-kompakt": a_kompakt(r) if alt == "a-kume" else b_kompakt(r),
                "sembol": sembol(alt, r),
            }
            for ad, c in cizimler.items():
                yol = os.path.join(klasor, f"{ad}-{surum}.svg")
                open(yol, "w", encoding="utf-8").write(c.svg())
                yazilan.append(yol)
        yol = os.path.join(klasor, "favicon.svg")
        open(yol, "w", encoding="utf-8").write(favicon(alt))
        yazilan.append(yol)
    return yazilan


if __name__ == "__main__":
    for y in uret():
        print(os.path.relpath(y, DEPO))
