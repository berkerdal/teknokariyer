# TeknoKariyer alt marka kimliği

**Durum:** Onaylandı · A · Küme · 13 Kasım 2026

- **Kılavuz sayfası:** https://claude.ai/artifact/Nqt3PPkQZxjTZemDeYtjxR (kaynağı: `sunum.html`)
- **İlk sürüm:** İki alternatifin (A · Küme, B · Yuva) karşılaştırıldığı sürüm git geçmişindedir: `e89de93`.

## Kimlik özeti

| Öğe | Değer |
| --- | --- |
| Logo | Piksel kümesi + "PAMUKKALE TEKNOKENT / tekno / KARİYER" yığını. "tekno" ana logodan birebir. |
| Renkler | Lacivert #2155AD, camgöbeği #05A1E6, kiremit #B04E26, gece #13284F, zemin #F7F6F3, metin #1E1E1C |
| Yazı tipleri | Lexend (başlık), Source Sans 3 (metin ve tablo) |
| Değişkenler | `tokenlar.json` |

## Kurallar

- **Küme tek başına kullanılmaz (K22).** Piksel kümesi yalnızca logonun parçası olarak görünür.
  Ayrı bir sembol, profil görseli veya süs olarak kullanılmaz.
- **Küçük boylar:**
  - 16–32 px: `favicon.svg`. Ana logodaki "t" harfi ve kiremit kare.
  - 64 px ve üstü: `uygulama-ikonu.svg`. "tekno / KARİYER" yığını, lacivert zeminde.
- **En küçük boy:** Yatay logo 160 px, kompakt logo 120 px genişliğin altına inmez.
- **Koruma alanı:** Logonun çevresinde en az kiremit karenin boyu kadar boşluk bırakılır.
- **Kiremit uyarı anlamında kullanılmaz.** Hata ve uyarı her zaman ikon ve açıklama metniyle verilir.

## Dosyalar (`logo/`)

| Dosya | Kullanım |
| --- | --- |
| `logo-yatay-{renkli,negatif,tekrenk}.svg` | Ana logo |
| `logo-kompakt-{renkli,negatif,tekrenk}.svg` | Site başlığı ve dar alanlar |
| `favicon.svg` | Tarayıcı sekmesi (16–32 px) |
| `uygulama-ikonu.svg` | Uygulama ikonu, sosyal medya profil görseli (64 px ve üstü) |

- Negatif dosyalar saydam zeminlidir; lacivert (#2155AD) veya gece (#13284F) zemin üzerine konur.
- Yazılar eğriye çevrilmiştir.

## Yeniden üretme

Dosyalar betikle üretilir; SVG'ler elle düzenlenmez.

```bash
pip install fonttools
python3 tools/kimlik/uret.py
python3 tools/kimlik/sunum.py
```

## Açık işler

- Baskı için CMYK değerleri matbaa provasıyla belirlenecek. Ana renklerin CMYK karşılıkları CLAUDE.md 2. bölümde.
