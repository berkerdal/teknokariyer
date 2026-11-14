"""
Kurum logolarının web varyantlarını üretir (footer ve e-posta için).

Kaynak: docs/kimlik/kaynak/*.pdf (kurumun verdiği vektör dosyalar, 14.11.2026).
Çıktı:  public/logo/kurum/*.svg  (sınırları içeriğe göre kırpılır: tools/kimlik/kirp.cjs)

Varyantlar:
- teknokent-dikey-renkli: özgün renkler.
- teknokent-dikey-negatif: koyu zemin için. Lacivert öğeler beyaz, camgöbeği kutu kaldırılır
  (kurumun negatif logo örneğindeki gibi). Sloganlı sürüm kullanılmaz (kurum onayı yok, CLAUDE.md 2).
- pamukkale-tto-renkli, pamukkale-tto-beyaz: TTO logosu; beyaz sürümde tüm öğeler beyaz.

Çalıştırma: python3 tools/kimlik/kurum_logolari.py && node tools/kimlik/kirp.cjs
"""
import pathlib
import re
import subprocess
import tempfile

KOK = pathlib.Path(__file__).resolve().parents[2]
KAYNAK = KOK / 'docs/kimlik/kaynak'
CIKTI = KOK / 'public/logo/kurum'
CAMGOBEGI = 'rgb(1.803589%, 62.9776%, 90.081787%)'
LACIVERT = 'rgb(12.808228%, 33.319092%, 67.828369%)'
BEYAZ = 'rgb(100%, 100%, 100%)'


def svg(pdf: pathlib.Path) -> str:
    with tempfile.TemporaryDirectory() as d:
        hedef = pathlib.Path(d) / 'a.svg'
        subprocess.run(['pdftocairo', '-svg', str(pdf), str(hedef)], check=True)
        return hedef.read_text()


def yaz(ad: str, icerik: str, baslik: str) -> None:
    # Koordinatlar bir ondalığa yuvarlanır: görünüm değişmez, dosya küçülür.
    icerik = re.sub(r'(?<=[ ,ML])(-?\d+\.\d{2,})', lambda m: f'{float(m.group(1)):.1f}', icerik)
    icerik = re.sub(r'<svg ([^>]*)>', lambda m: f'<svg {m.group(1)} role="img" aria-label="{baslik}"><title>{baslik}</title>', icerik, count=1)
    (CIKTI / f'{ad}.svg').write_text(icerik)


CIKTI.mkdir(parents=True, exist_ok=True)
tk = svg(KAYNAK / 'teknokent-dikey.pdf')
yaz('teknokent-dikey-renkli', tk, 'Pamukkale Teknokent')
neg = re.sub(r'<path[^>]*fill="' + re.escape(CAMGOBEGI) + r'"[^>]*/>', '', tk)
neg = neg.replace(LACIVERT, BEYAZ)
yaz('teknokent-dikey-negatif', neg, 'Pamukkale Teknokent')

tto = svg(KAYNAK / 'pamukkale-tto.pdf')
yaz('pamukkale-tto-renkli', tto, 'Pamukkale Teknoloji Transfer Ofisi')
yaz('pamukkale-tto-beyaz', re.sub(r'fill="rgb\([^"]*\)"', f'fill="{BEYAZ}"', tto), 'Pamukkale Teknoloji Transfer Ofisi')
print('üretildi:', sorted(p.name for p in CIKTI.glob('*.svg')))
