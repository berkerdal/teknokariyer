# TeknoKariyer alt marka kimliği

**Durum:** Taslak 1 · kurum onayı bekliyor (13 Kasım 2026)

- **Sunum:** https://claude.ai/artifact/Nqt3PPkQZxjTZemDeYtjxR (kaynağı: `sunum.html`)
- **Konu:** İki alternatif aynı başlıklar altında gösteriliyor: fikir, logo sürümleri, kullanım kuralları, renk ve kontrast,
  tipografi, kare dili, uygulama örnekleri ve eleştirel denetim.

## Alternatifler

| | A · Küme | B · Yuva |
| --- | --- | --- |
| Fikir | Ana logoda "t" harfinden dağılan pikseller toplanır, bir kare yükselir. | Lacivert blokta bir yuva, okra parça o yuvaya girer: eşleşme. |
| Logotype | Ana logodaki "tekno" + ince "KARİYER" (Lexend ExtraLight) + "PAMUKKALE TEKNOKENT" imzası | "teknokariyer": 8 harf ana logodan birebir, 4 harf aynı çizimlerden türetildi. |
| İkinci renk | Kiremit #B04E26 | Okra #F2B230 |
| Yazı tipleri | Lexend (başlık), Source Sans 3 (metin ve tablo) | Schibsted Grotesk (başlık ve metin), IBM Plex Mono (kod ve veri) |
| Klasör | `a-kume/` | `b-yuva/` |

Claude'un önerisi B'dir; gerekçesi sunumun "Karar" bölümünde.

## Dosyalar

Her alternatif klasöründe:

| Dosya | Kullanım |
| --- | --- |
| `logo-yatay-{renkli,negatif,tekrenk}.svg` | Ana logo |
| `logo-kompakt-{renkli,negatif,tekrenk}.svg` | Site başlığı ve dar alanlar |
| `sembol-{renkli,negatif,tekrenk}.svg` | Sembol (profil görseli, uygulama ikonu) |
| `favicon.svg` | 16 px ızgaraya oturan favicon |
| `tokenlar.json` | Renk, yazı tipi, köşe ve boşluk değişkenleri (onaydan sonra koda aktarılacak) |

- Negatif dosyalar saydam zeminlidir; lacivert (#2155AD) veya gece (#13284F) zemin üzerine konur.
- Tüm yazılar eğriye çevrilmiştir; dosyalar yazı tipi kurulu olmayan bilgisayarda da aynı görünür.

## Yeniden üretme

Dosyaların hepsi betikle üretilir; SVG'ler elle düzenlenmez.

```bash
pip install fonttools
python3 tools/kimlik/uret.py
python3 tools/kimlik/sunum.py
```

- `tools/kimlik/ana-logo.json`: Ana logodan alınan "tekno" ve piksel çizimleri. Kaynağı `docs/logo-teknokent.pdf`,
  `pdftocairo -svg` ile çıkarıldı.
- `tools/kimlik/fontlar/`: Logoda kullanılan yazı tipleri ve OFL lisansları.

## Onaydan sonra

1. Seçilmeyen alternatifin klasörü silinir; seçilen klasördeki dosyalar `docs/kimlik/` köküne taşınır.
2. `tokenlar.json` uygulamanın tasarım değişkenlerine (CSS değişkenleri / Tailwind teması) aktarılır.
3. Baskı için CMYK değerleri matbaa provasıyla belirlenir. Ana renklerin CMYK karşılıkları CLAUDE.md 2. bölümde.
