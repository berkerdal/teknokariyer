"""TeknoKariyer alt marka kimliği — logo, favicon ve uygulama ikonu üreticisi.

Onaylanan kimlik: A · Küme (13 Kasım 2026). B alternatifi git geçmişinde (e89de93).

Kullanım (depo kökünden):
    pip install fonttools
    python3 tools/kimlik/uret.py

Çıktı: docs/kimlik/logo/*.svg

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
from dataclasses import dataclass

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

KOK = os.path.dirname(os.path.abspath(__file__))
DEPO = os.path.dirname(os.path.dirname(KOK))
CIKTI = os.path.join(DEPO, "docs", "kimlik", "logo")
ANA = json.load(open(os.path.join(KOK, "ana-logo.json"), encoding="utf-8"))

H = ANA["taban"] - ANA["x_ust"]  # 223: "tekno" x-yüksekliği
GOVDE = 67.4  # "n" ve "k" gövde kalınlığı (ana logodan ölçüldü)

# --- Renkler -------------------------------------------------------------------------------------------------------
LACIVERT = "#2155AD"
CAMGOBEGI = "#05A1E6"
GECE = "#13284F"
BEYAZ = "#FFFFFF"
SIYAH = "#1D1D1B"

KIREMIT = "#B04E26"
KIREMIT_KOYU_ZEMIN = "#F7A27C"  # lacivert/gece zeminde kiremit


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


# --- Ana logodaki "tekno" ------------------------------------------------------------------------------------------
ARALIK = {"te": 11, "ek": 26, "kn": 14, "no": 28}


def tekno(x: float, renk: str) -> tuple[str, float]:
    """Ana logodaki "tekno" çizimleri, birebir. Koordinat: x-yüksekliği üstü y=0, taban y=H."""
    T, X = ANA["tekno"], ANA["tekno_x"]
    parcalar, imlec, onceki = [], x, None
    for ch in "tekno":
        if onceki:
            imlec += ARALIK[onceki + ch]
        x0, x1 = X[ch]
        parcalar.append(f'<path transform="translate({imlec - x0:.2f} {-ANA["x_ust"]:.2f})" fill="{renk}" d="{T[ch]}"/>')
        imlec += x1 - x0
        onceki = ch
    return "".join(parcalar), imlec - x


# --- Küme işareti --------------------------------------------------------------------------------------------------
# Ana logoda "t" harfi sol üstte piksellere dağılır. Burada süreç tersine işler: dağınık pikseller büyük bir blokta
# toplanır ve bloğun üstünden tek bir kare yükselir (kiremit). Kümenin düzensiz ritmi ana logodan alınmıştır.
# KURAL (K22): Küme yalnızca logonun parçası olarak kullanılır; tek başına sembol olarak kullanılmaz.
# Birim kutu 84 × 80. Kareler: (x, y, boy).
KUME = {"w": 84.0, "h": 80.0,
        "kareler": [(0, 60, 10), (10, 70, 10), (14, 46, 14), (28, 32, 14), (28, 54, 20), (48, 34, 36)],
        "vurgu": (54, 0, 30)}


def kume(x: float, y: float, boy: float, renk: str, vurgu: str) -> tuple[str, float]:
    """boy: yükseklik. Döndürür: (svg, genişlik)."""
    o = boy / KUME["h"]
    out = [f'<rect x="{x + kx * o:.2f}" y="{y + ky * o:.2f}" width="{kb * o:.2f}" height="{kb * o:.2f}" fill="{renk}"/>'
           for kx, ky, kb in KUME["kareler"]]
    kx, ky, kb = KUME["vurgu"]
    out.append(f'<rect x="{x + kx * o:.2f}" y="{y + ky * o:.2f}" width="{kb * o:.2f}" height="{kb * o:.2f}" fill="{vurgu}"/>')
    return "".join(out), KUME["w"] * o


# --- SVG yardımcıları ----------------------------------------------------------------------------------------------
@dataclass
class Cizim:
    genislik: float
    yukseklik: float
    icerik: str
    zemin: str | None = None
    baslik: str = "Pamukkale Teknokent TeknoKariyer"
    bosluk: float = 0.0  # koruma alanı (birim)

    def svg(self) -> str:
        b = self.bosluk
        vb = f"{-b:.2f} {-b:.2f} {self.genislik + 2 * b:.2f} {self.yukseklik + 2 * b:.2f}"
        zemin = (f'<rect x="{-b:.2f}" y="{-b:.2f}" width="{self.genislik + 2 * b:.2f}" '
                 f'height="{self.yukseklik + 2 * b:.2f}" fill="{self.zemin}"/>') if self.zemin else ""
        return kisalt(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" '
                      f'aria-label="{self.baslik}"><title>{self.baslik}</title>{zemin}{self.icerik}</svg>\n')


def kisalt(svg: str) -> str:
    """Koordinatları 1 ondalığa yuvarlar (logo ölçeğinde görünür fark yok, dosya ~%40 küçülür)."""
    return re.sub(r"-?\d+\.\d{2,}", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), svg)


def renkler(surum: str) -> dict:
    if surum == "renkli":
        return {"ana": LACIVERT, "vurgu": KIREMIT, "zemin": None}
    if surum == "negatif":  # saydam zemin; lacivert veya gece zemine konur
        return {"ana": BEYAZ, "vurgu": KIREMIT_KOYU_ZEMIN, "zemin": None}
    if surum == "tekrenk":
        return {"ana": SIYAH, "vurgu": SIYAH, "zemin": None}
    raise KeyError(surum)


# --- Logolar -------------------------------------------------------------------------------------------------------
def yigin(r: dict, x: float = 0.0) -> tuple[str, float, float]:
    """PAMUKKALE TEKNOKENT / tekno / KARİYER yığını. Ana logonun PAMUKKALE / tekno / KENT kurgusunu izler.
    Döndürür: (svg, genişlik, yükseklik)."""
    imza_h, kariyer_h = 46.0, 138.0
    bosluk1, bosluk2 = 46.0, 52.0
    blok_h = imza_h + bosluk1 + H + bosluk2 + kariyer_h
    tekno_svg, tw = tekno(x, r["ana"])
    imza_d, _ = metin("LexendRegular", "PAMUKKALE TEKNOKENT", imza_h, x, imza_h, genislige=tw)
    kariyer_d, _ = metin("LexendExtraLight", "KARİYER", kariyer_h, x, blok_h, genislige=tw)
    svg = (f'<path fill="{r["ana"]}" d="{imza_d}"/>'
           f'<g transform="translate(0 {imza_h + bosluk1})">{tekno_svg}</g>'
           f'<path fill="{r["vurgu"]}" d="{kariyer_d}"/>')
    return svg, tw, blok_h


def yatay(r: dict) -> Cizim:
    """Ana logo: küme + yığın."""
    _, _, blok_h = yigin(r)
    kume_svg, kw = kume(0, blok_h * 0.28, blok_h * 0.72, r["ana"], r["vurgu"])
    tx = kw + 80.0
    yigin_svg, tw, _ = yigin(r, tx)
    return Cizim(tx + tw, blok_h, kume_svg + yigin_svg, r["zemin"], bosluk=blok_h / 4)


def kompakt(r: dict) -> Cizim:
    """Tek satır: küme + tekno + KARİYER. Site başlığı ve dar alanlar için; imza ayrıca yazılır."""
    kume_svg, kw = kume(0, 0, H, r["ana"], r["vurgu"])
    tx = kw + 56
    tekno_svg, tw = tekno(tx, r["ana"])
    kx = tx + tw + 34
    kariyer_d, kwid = metin("LexendLight", "KARİYER", H, kx, H, izleme=14)
    return Cizim(kx + kwid, H, kume_svg + tekno_svg + f'<path fill="{r["vurgu"]}" d="{kariyer_d}"/>', r["zemin"], bosluk=H / 4)


# --- Küçük boy işaretler (K22: küme tek başına kullanılmadığı için) -----------------------------------------------
def favicon() -> str:
    """16–32 px. Ana logodaki "t" + kiremit kare (kümenin yükselen karesi). Lacivert zemin koyu ve açık sekme çubuğunda
    görünür. 16 px'te harf okunur kalsın diye ızgaraya oturtuldu."""
    T = ANA["tekno"]["t"]
    o = 0.30  # t: 201 × 223 birim → 60 × 67 (100'lük kutuda)
    return kisalt(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>TeknoKariyer</title>'
                  f'<rect width="100" height="100" rx="12" fill="{LACIVERT}"/>'
                  f'<g transform="translate(18 26) scale({o}) translate(-189.5 -605)"><path fill="{BEYAZ}" d="{T}"/></g>'
                  f'<rect x="72" y="12" width="16" height="16" fill="{KIREMIT_KOYU_ZEMIN}"/></svg>\n')


def uygulama_ikonu() -> str:
    """64 px ve üstü: uygulama ikonu, sosyal medya profil görseli. Logonun kendisi (tekno / KARİYER), lacivert zeminde."""
    tek, tw = tekno(0, BEYAZ)
    kh = 120.0
    kar, _ = metin("LexendExtraLight", "KARİYER", kh, 0, H + 60 + kh, genislige=tw)
    o = 76 / tw
    yuk = (H + 60 + kh) * o
    ic = kisalt(f'{tek}<path fill="{KIREMIT_KOYU_ZEMIN}" d="{kar}"/>')  # ölçek değeri yuvarlanmasın diye yalnızca iç
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>TeknoKariyer</title>'
            f'<rect width="100" height="100" rx="12" fill="{LACIVERT}"/>'
            f'<g transform="translate(12 {(100 - yuk) / 2:.1f}) scale({o:.5f})">{ic}</g></svg>\n')


def uret() -> list[str]:
    os.makedirs(CIKTI, exist_ok=True)
    yazilan = []
    for surum in ("renkli", "negatif", "tekrenk"):
        r = renkler(surum)
        for ad, c in {"logo-yatay": yatay(r), "logo-kompakt": kompakt(r)}.items():
            yol = os.path.join(CIKTI, f"{ad}-{surum}.svg")
            open(yol, "w", encoding="utf-8").write(c.svg())
            yazilan.append(yol)
    for ad, icerik in {"favicon.svg": favicon(), "uygulama-ikonu.svg": uygulama_ikonu()}.items():
        yol = os.path.join(CIKTI, ad)
        open(yol, "w", encoding="utf-8").write(icerik)
        yazilan.append(yol)
    return yazilan


if __name__ == "__main__":
    for y in uret():
        print(os.path.relpath(y, DEPO))
