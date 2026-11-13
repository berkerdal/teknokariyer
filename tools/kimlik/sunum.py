"""TeknoKariyer kimlik önerisi sunum sayfasını üretir: docs/kimlik/sunum.html

Kullanım (depo kökünden):
    python3 tools/kimlik/uret.py     # önce logolar
    python3 tools/kimlik/sunum.py

Sayfa iki alternatifi aynı başlıklar altında gösterir. Logolar docs/kimlik/<alternatif>/ altındaki SVG dosyalarından
okunur, kontrast oranları burada hesaplanır; sayfadaki hiçbir değer elle yazılmaz.
Üretilen dosya Artifact olarak yayımlanır; bu yüzden <html>/<head>/<body> etiketi içermez.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uret  # noqa: E402

KIMLIK = uret.CIKTI


# --- Renk ve kontrast ----------------------------------------------------------------------------------------------
def parlaklik(h: str) -> float:
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4  # noqa: E731
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def kontrast(a: str, b: str) -> float:
    la, lb = parlaklik(a), parlaklik(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# Paletler. "rol" kullanım kuralını, "oran" ekrandaki yaklaşık alan payını (%) anlatır.
PALET = {
    "a-kume": [
        ("Zemin", "#F7F6F3", "Sayfa zemini. Hafif sıcak kırık beyaz; krem değil.", 62),
        ("Yüzey", "#FFFFFF", "Liste satırı, form, panel.", 18),
        ("Metin", "#1E1E1C", "Gövde metni ve başlıklar. Mavimsi değil, nötr.", 9),
        ("Lacivert", "#2155AD", "Ana eylem, bağlantı, seçili durum. Geniş yüzeyde kullanılmaz.", 6),
        ("Camgöbeği", "#05A1E6", "Çizgi, grafik, ikon. Metin rengi olarak kullanılmaz.", 2),
        ("Kiremit", "#B04E26", "Alt marka vurgusu: logo, sayfa başına bir öğe. Uyarı veya hata anlamında kullanılmaz.", 2),
        ("Gece", "#13284F", "Yönetim paneli çerçevesi ve koyu zeminler.", 1),
    ],
    "b-yuva": [
        ("Zemin", "#F4F4F1", "Sayfa zemini. Nötre yakın kırık beyaz.", 62),
        ("Yüzey", "#FFFFFF", "Liste satırı, form, panel.", 18),
        ("Metin", "#1C1D1F", "Gövde metni ve başlıklar.", 9),
        ("Lacivert", "#2155AD", "Ana eylem, bağlantı, seçili durum. Geniş yüzeyde kullanılmaz.", 6),
        ("Camgöbeği", "#05A1E6", "Çizgi, grafik, ikon. Metin rengi olarak kullanılmaz.", 2),
        ("Okra", "#F2B230", "Logodaki yuva parçası; koyu zeminde vurgu. Beyaz üstünde metin olarak kullanılmaz.", 1),
        ("Okra açık", "#FCEDC4", "Eşleşme vurgusu: adayın sahip olduğu beceri, fosforlu kalem gibi.", 1),
        ("Gece", "#13284F", "Yönetim paneli çerçevesi ve koyu zeminler.", 1),
    ],
}
DURUM = {
    "a-kume": [("Başarı", "#25734A"), ("Uyarı", "#9A5B00"), ("Hata", "#BF1F2F")],
    "b-yuva": [("Başarı", "#25734A"), ("Uyarı", "#B4540A"), ("Hata", "#BF1F2F")],
}
IKINCIL_METIN = {"a-kume": "#5B5852", "b-yuva": "#585A5E"}


def kontrast_ciftleri(alt: str) -> list[tuple[str, str, str, str, str]]:
    """(ön plan adı, ön hex, zemin adı, zemin hex, kullanım) listesi."""
    p = {ad: hx for ad, hx, _, _ in PALET[alt]}
    d = dict(DURUM[alt])
    m2 = IKINCIL_METIN[alt]
    ciftler = [
        ("Metin", p["Metin"], "Zemin", p["Zemin"], "gövde metni"),
        ("İkincil metin", m2, "Zemin", p["Zemin"], "tarih, firma konumu"),
        ("İkincil metin", m2, "Yüzey", p["Yüzey"], "liste satırında ikincil bilgi"),
        ("Lacivert", p["Lacivert"], "Yüzey", p["Yüzey"], "bağlantı, seçili durum"),
        ("Beyaz", "#FFFFFF", "Lacivert", p["Lacivert"], "ana düğme"),
        ("Camgöbeği", p["Camgöbeği"], "Yüzey", p["Yüzey"], "yalnızca süs çizgisi; odak halkası olamaz"),
        ("Beyaz", "#FFFFFF", "Gece", p["Gece"], "yönetim paneli"),
    ]
    if alt == "a-kume":
        ciftler += [
            ("Kiremit", p["Kiremit"], "Yüzey", p["Yüzey"], "vurgu metni"),
            ("Beyaz", "#FFFFFF", "Kiremit", p["Kiremit"], "vurgu düğmesi"),
            ("Kiremit (koyu zemin)", "#F7A27C", "Gece", p["Gece"], "negatif logo, koyu panel"),
        ]
    else:
        ciftler += [
            ("Metin", p["Metin"], "Okra açık", p["Okra açık"], "eşleşen beceri"),
            ("Okra", p["Okra"], "Gece", p["Gece"], "koyu panelde vurgu"),
            ("Okra", p["Okra"], "Lacivert", p["Lacivert"], "negatif logo"),
            ("Okra", p["Okra"], "Yüzey", p["Yüzey"], "kullanılmaz: metin olamaz"),
        ]
    ciftler += [(ad, hx, "Yüzey", "#FFFFFF", "durum metni ve ikonu") for ad, hx in DURUM[alt]]
    return ciftler


# --- Yardımcılar ---------------------------------------------------------------------------------------------------
def svg_oku(alt: str, ad: str, sinif: str = "", etiket: str | None = None) -> str:
    s = open(os.path.join(KIMLIK, alt, ad), encoding="utf-8").read().strip()
    s = s.replace("<svg ", f'<svg class="{sinif}" ', 1) if sinif else s
    if etiket:
        s = re.sub(r'aria-label="[^"]*"', f'aria-label="{etiket}"', s, count=1)
    return s


def e(t: str) -> str:
    return html.escape(t, quote=True)


def ana_logo_parcasi() -> str:
    """Ana logodan "tekno" ve piksel kümesi (fikir şeması için)."""
    A = uret.ANA
    yollar = "".join(f'<path fill="#2155AD" d="{d}"/>' for d in A["piksel"])
    yollar += "".join(f'<path fill="#2155AD" d="{A["tekno"][h]}"/>' for h in "tekno")
    return uret.kisalt(f'<svg viewBox="70 460 1220 380" class="sema-svg" role="img" '
                       f'aria-label="Ana logodaki piksel kümesi ve tekno yazısı">{yollar}</svg>')


def turetilmis_kelime() -> str:
    """'teknokariyer': ana logodan gelen harfler lacivert, türetilenler camgöbeği; altlarında açıklama."""
    parcalar, imlec, onceki = [], 0.0, None
    etiketler = []
    turetilen = {7: "a = o + düz gövde", 8: "r = n’nin omzu", 9: "i = gövde + kare nokta", 10: "Y = k’nin kol açısı"}
    for i, ch in enumerate("teknokariyer"):
        if onceki:
            imlec += uret.ARALIK.get(onceki + ch, 20)
        renk = "#05A1E6" if i in turetilen else "#2155AD"
        svg, w = uret.harf(ch, imlec, renk, "#F2B230")
        parcalar.append(svg)
        if i in turetilen:
            etiketler.append((imlec + w / 2, turetilen[i]))
        imlec += w
        onceki = ch
    ust = -uret.NOKTA_UST
    g = f'<g transform="translate(0 {ust})">{"".join(parcalar)}</g>'
    return uret.kisalt(f'<svg viewBox="-20 -10 {imlec + 40:.0f} {ust + uret.H + 30:.0f}" class="sema-svg" role="img" '
                       f'aria-label="teknokariyer: ana logodan gelen ve türetilen harfler">{g}</svg>'), etiketler, imlec


# --- Örnek içerik (gerçek firmalar, kurgusal ilanlar) ---------------------------------------------------------------
ILANLAR = [
    ("Gömülü Yazılım Mühendisi", "Pinova Elektronik", "B Blok G12", "Tam zamanlı · Ofiste", "12 Aralık’a kadar", None),
    ("Ağ ve Sistem Stajyeri", "Netinternet", "D Blok B01", "Yaz stajı · Ücretli", "Son 2 gün", "son"),
    ("Flutter Geliştirici", "Kodpit Teknoloji", "D Blok 208", "Hibrit · 1–3 yıl", "20 Aralık’a kadar", None),
    ("Destek Mühendisi", "Ratel Bilişim", "D Blok 102", "Tam zamanlı · Yeni mezun", "5 Ocak’a kadar", None),
    ("Elektronik Tasarım Stajyeri", "Senkron Arge", "B Blok G11", "Zorunlu staj · PAÜ öncelikli", "28 Kasım’a kadar", None),
]
HUNI = [("Alındı", 48), ("İnceleniyor", 21), ("Görüşme", 9), ("Teklif", 3), ("Olumlu", 2)]


def telefon(alt: str) -> str:
    satirlar = []
    for poz, firma, konum, tur, tarih, durum in ILANLAR:
        tarih_sinif = "tarih son" if durum == "son" else "tarih"
        satirlar.append(
            f'<li><a href="#" tabindex="-1"><span class="poz">{e(poz)}</span>'
            f'<span class="firma">{e(firma)} <span class="konum">{e(konum)}</span></span>'
            f'<span class="alt-satir"><span>{e(tur)}</span><span class="{tarih_sinif}">{e(tarih)}</span></span></a></li>')
    eslesme = ""
    if alt == "b-yuva":
        eslesme = ('<p class="eslesme">Senin profilinle: <mark>C</mark> <mark>FreeRTOS</mark> <mark>Git</mark> var · '
                   'eksik: <span class="eksik">CAN bus</span></p>')
    else:
        eslesme = ('<p class="eslesme">Senin profilinle: zorunlu 4 becerinin 3’ü var · eksik: '
                   '<span class="eksik">CAN bus</span></p>')
    ilk = satirlar[0].replace('</a></li>', f'{eslesme}</a></li>')
    satirlar[0] = ilk
    return f'''<div class="telefon k-ekran" role="img" aria-label="Mobil ilan listesi örneği">
  <div class="tel-ust">{svg_oku(alt, "logo-kompakt-renkli.svg", "tel-logo")}<span class="tel-giris">Giriş</span></div>
  <div class="tel-arama"><span>Pozisyon, beceri veya firma</span></div>
  <div class="tel-hizli"><span class="secili">Staj</span><span>İş</span><span>Uzaktan</span><span>Yeni mezun</span></div>
  <p class="tel-sayac"><strong>37</strong> ilan yayında <span class="ornek-not">örnek sayı</span></p>
  <ol class="tel-liste">{"".join(satirlar)}</ol>
  <div class="tel-alt"><span class="tel-dugme">Filtrele</span></div>
</div>'''


def linkedin_karti(alt: str) -> str:
    sembol = svg_oku(alt, "sembol-negatif.svg", "lk-sembol")
    return f'''<div class="lk k-ekran" role="img" aria-label="LinkedIn paylaşım kartı örneği, 1200 × 627">
  <div class="lk-sol">
    <p class="lk-firma">Pinova Elektronik <span>· B Blok G12, Pamukkale Teknokent</span></p>
    <p class="lk-poz">Gömülü Yazılım Mühendisi</p>
    <p class="lk-bilgi">Tam zamanlı · Ofiste · Son başvuru 12 Aralık 2026</p>
  </div>
  <div class="lk-alt">{svg_oku(alt, "logo-kompakt-negatif.svg", "lk-logo")}<span>kariyer.pauteknokent.com.tr</span></div>
  {sembol}
</div>'''


def eposta(alt: str) -> str:
    return f'''<div class="eposta k-ekran">
  <dl class="ep-bas">
    <div><dt>Kimden</dt><dd>TeknoKariyer &lt;kariyer@pauteknokent.com.tr&gt;</dd></div>
    <div><dt>Kime</dt><dd>Selin Aydemir (örnek yetkili)</dd></div>
    <div><dt>Konu</dt><dd>Kodpit Teknoloji için TeknoKariyer hesabınız hazır</dd></div>
  </dl>
  <div class="ep-govde">
    {svg_oku(alt, "logo-kompakt-renkli.svg", "ep-logo")}
    <p>Sayın Selin Aydemir,</p>
    <p>Pamukkale Teknokent’in kariyer portalı TeknoKariyer’de Kodpit Teknoloji A.Ş. için bir firma hesabı açtık.
    Unvanınızı, sektörünüzü ve ofis konumunuzu (D Blok 208) Teknokent firma rehberinden aktardık.</p>
    <p>Sizden istediğimiz, bu bilgileri doğrulamanız ve hesabı devralmanız. Bu yaklaşık 5 dakika sürer:
    bilgileri kontrol eder, şifrenizi belirler ve iki aşamalı doğrulamayı açarsınız.</p>
    <p><span class="ep-dugme">Hesabı devral</span></p>
    <p class="ep-kucuk">Bağlantı yalnızca size özeldir ve 27 Kasım 2026’ya kadar geçerlidir. Bilgilerde bir hata
    görürseniz devralma ekranındaki “Bu bilgilerde hata var” bağlantısıyla bize yazabilirsiniz.</p>
    <p class="ep-kucuk">Sorunuz olursa Pamukkale Teknokent’i arayabilirsiniz: +90 258 215 50 01</p>
  </div>
  <p class="ep-alt">Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş. · Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67
  Pamukkale/Denizli · Bu e-postayı firmanız Teknokent’te kayıtlı olduğu için aldınız.</p>
</div>'''


def sosyal(alt: str) -> str:
    return f'''<div class="sosyal k-ekran" role="img" aria-label="Sosyal medya duyuru görseli örneği, 1080 × 1080">
  <div class="so-kareler" aria-hidden="true"></div>
  <p class="so-ust">Pamukkale Teknokent · 2027 yaz dönemi</p>
  <p class="so-baslik">Teknokent firmalarının yaz stajı ilanları tek adreste</p>
  <p class="so-bilgi">Başvurular TeknoKariyer üzerinden. Profilini bir kez doldur, her ilana aynı profille başvur.</p>
  <div class="so-alt">{svg_oku(alt, "logo-kompakt-negatif.svg", "so-logo")}<span>kariyer.pauteknokent.com.tr/staj</span></div>
</div>'''


def huni(alt: str) -> str:
    satir = []
    for i, (ad, n) in enumerate(HUNI):
        son = " son" if i == len(HUNI) - 1 else ""
        kareler = "".join('<i></i>' for _ in range(n))
        satir.append(f'<div class="huni-satir{son}"><span class="huni-ad">{ad}</span>'
                     f'<span class="huni-n">{n}</span><span class="huni-kareler" aria-hidden="true">{kareler}</span></div>')
    return f'<div class="huni k-ekran" role="img" aria-label="Başvuru hunisi örneği">{"".join(satir)}</div>'


# --- Bölümler ------------------------------------------------------------------------------------------------------
ALT_BILGI = {
    "a-kume": {
        "harf": "A", "ad": "Küme",
        "ozet": "Ana logonun yakın akrabası. “tekno” harfleri aynen kalır, altına ince “KARİYER” gelir; dağılan pikseller "
                "toplanır ve bir kare yükselir. Vurgu rengi kiremit.",
        "baslik_font": "Lexend", "govde_font": "Source Sans 3", "veri_font": "Source Sans 3",
        "font_gerekce": [
            ("Lexend (başlık)", "Geometrik ve açık harfli; ana logodaki “tekno”nun yuvarlak, ağır karakterine en yakın web "
             "yazı tipi. Türkçe glifler tam. Rakamları orantılı olduğu için tablolarda kullanılmaz."),
            ("Source Sans 3 (metin ve tablo)", "Uzun ilan metinlerinde yorulmadan okunur, 1.600’den fazla glif, varsayılan "
             "rakamları eşit genişlikte. Lexend’in yanında sakin kalır."),
        ],
    },
    "b-yuva": {
        "harf": "B", "ad": "Yuva",
        "ozet": "Kendi sesi olan alt marka. “teknokariyer” baştan sona ana logodaki harf çizimlerinden türetilmiş tek bir "
                "logotype; “i”nin noktası ve sembolün yuvaya giren parçası aynı okra kare. Vurgu rengi okra.",
        "baslik_font": "Schibsted Grotesk", "govde_font": "Schibsted Grotesk", "veri_font": "IBM Plex Mono",
        "font_gerekce": [
            ("Schibsted Grotesk (başlık ve metin)", "Bir haber kuruluşu için tasarlanmış, yoğun bilgi taşıyan arayüzlerde "
             "net kalan bir grotesk. Logotype’ın ağır ve sert harfleriyle aynı aileden görünür; tek aile, daha az yük."),
            ("IBM Plex Mono (kod ve veri)", "Ofis kodları (D Blok 208), ilan numaraları ve tablolardaki tarihler için. "
             "Teknokent’in mühendislik tarafını sessizce taşır; yalnızca küçük boyutta ve az kullanılır."),
        ],
    },
}

FIKIR = {
    "a-kume": '''<p>Ana logoda “t” harfi sol üst köşesinden piksellere dağılır. TeknoKariyer’de bu hareket tersine işler:
      dağınık pikseller büyük bir blokta toplanır, bloğun üstünden tek bir kare yükselir. Blok Teknokent’tir, yükselen kare
      oradaki yerini bulan kişi.</p>
      <p>Yazı da ana logonun kurgusunu izler. Orada “PAMUKKALE / tekno / KENT” vardı; burada
      “PAMUKKALE TEKNOKENT / tekno / KARİYER”. “tekno” harfleri ana logodan birebir alınmıştır. Ana markadan gelen her şey
      lacivert, alt markaya ait olan her şey kiremit.</p>''',
    "b-yuva": '''<p>Logotype’ın 12 harfinin 8’i ana logodaki “tekno” çizimlerinin kendisi. Eksik dört harf aynı çizimlerden
      türetildi: “a”, “o”ya düz bir gövde eklenerek; “r”, “n”nin omzundan; “Y”, “k”nin kol açısıyla. “k” harfi ana logoda
      üst uzantısız çizildiği için “Y” de tek kasa kaldı. Böylece logotype başka hiçbir yazı tipine benzemiyor.</p>
      <p>“i” harfinin noktası kare ve okra. Aynı kare sembolde, lacivert bloğun yuvasına yarıya kadar girmiş parçadır.
      Lacivert blok Teknokent’teki bir firma, okra parça aday: ürünün özü olan eşleşme.</p>''',
}

KULLANIM = {
    "a-kume": [
        ("Koruma alanı", "Logonun çevresinde en az kiremit karenin boyu kadar boşluk bırakılır."),
        ("En küçük boy", "Yatay logo 160 px, kompakt logo 120 px genişliğin altına inmez. Daha küçük yerlerde sembol kullanılır."),
        ("Zemin", "Renkli logo beyaz veya kırık beyaz zeminde, negatif logo lacivert veya gece zemininde. Fotoğraf üstüne konmaz."),
        ("Değiştirilmez", "“tekno” harfleri yeniden yazılmaz, renkler yer değiştirmez, logo eğilmez veya gölgelenmez."),
    ],
    "b-yuva": [
        ("Koruma alanı", "Logonun çevresinde en az “i” noktasının boyu kadar boşluk bırakılır."),
        ("En küçük boy", "Yatay logo 180 px, kompakt logo 120 px genişliğin altına inmez. Daha küçük yerlerde sembol kullanılır."),
        ("Zemin", "Renkli logo beyaz veya kırık beyaz zeminde, negatif logo lacivert veya gece zemininde. Fotoğraf üstüne konmaz."),
        ("Değiştirilmez", "Harfler bir yazı tipiyle yeniden yazılmaz; okra nokta kaldırılmaz veya başka renge boyanmaz."),
    ],
}

DENETIM = {
    "a-kume": {
        "logo_testi": "Logo ve renkler kaldırıldığında geriye ana Teknokent logosunun düzeni kalır: üstte aralıklı "
                      "büyük harfli imza, ağır “tekno”, altta ince büyük harfler. Teknokent logosunu tanıyan biri bağı görür; "
                      "tanımayan biri için bu düzen tek başına Pamukkale’ye özgü değildir. Ekranlarda bu bağı blok/oda kodları, "
                      "firma adları ve PAÜ bölümleri taşıyacak.",
        "riskler": [
            "Kırık beyaz zemin + kiremit vurgu, son dönemde yapay zekâ ile üretilmiş sayfalarda sık görülen bir ikili. "
            "Riski azaltmak için zemin kreme kaçmayacak kadar nötr tutuldu ve kiremit sayfa başına tek öğeyle sınırlandı. "
            "Yine de bu alternatifin en zayıf noktası bu.",
            "İnce “KARİYER” küçük boylarda kayboluyor. Kompakt logoda daha kalın kesim kullanıldı; 120 px altına inilmemeli.",
            "Kiremit, hata kırmızısına yakın bir sıcaklıkta. Hata mesajları her zaman ikon ve açıklama metniyle verileceği için "
            "karışma riski düşük, ama kiremit hiçbir zaman uyarı anlamında kullanılmamalı.",
            "Üç satırlı yatay logo yüksek; site başlığında kompakt sürüm kullanılacak.",
        ],
    },
    "b-yuva": {
        "logo_testi": "Logo kaldırılsa bile logotype’ın harfleri Teknokent’e ait: “tekno” ana logonun çizimi, diğer harfler "
                      "ondan türedi. Okra kare sistemin her yerinde aynı işi görüyor: eşleşen beceriyi işaretlemek. Böylece "
                      "renk kaldırıldığında bile kare imleç ve eşleşme dili kalıyor.",
        "riskler": [
            "Logotype uzun (yaklaşık 11’e 1). Dar ekranlarda kompakt sürüm bile 120 px’i doldurur; mobil başlıkta yer sıkışık.",
            "Tek kasa “Y” ilk bakışta yadırganabilir. Ana logodaki üst uzantısız “k” ile aynı mantıkta. Kendi bakışımla "
            "“teknokariyer” olarak okunuyor; ama bunu bir okunurluk testi saymıyorum, kurum içinde birkaç kişiye "
            "logoyu bir saniye gösterip ne okuduklarını sormak gerekir.",
            "Okra beyaz zeminde metin olamaz (kontrast 1,9:1). Yalnızca vurgu zemini, logo öğesi ve koyu zeminde kullanılır; "
            "bu kural bileşenlerde kodla korunacak.",
            "Sembol bazı bakışlarda “U” harfine veya gelen kutusu ikonuna benzetilebilir. Okra parça yuvaya girdiği sürece "
            "bu okuma zayıf kalıyor.",
        ],
    },
}

YASAK_KONTROL = [
    ("Renk geçişi, glow, buzlu cam, bulanık daire", "Yok. Tüm yüzeyler düz renk."),
    ("Soyut teknoloji görseli, stok fotoğraf, yapay insan görseli", "Yok. Fotoğraf alanı yok; kimlik tipografi ve kareyle duruyor."),
    ("Hap biçimli parlak rozetler, “Yeni ✨”, “Sistem aktif”", "Yok. Etiketler düz metin: “Ücretli”, “Son 2 gün”, “PAÜ öncelikli”."),
    ("Yuvarlak zemin içinde ikon", "Yok. Liste imleci ve bölüm işareti kare."),
    ("Inter, Poppins, Montserrat", "Kullanılmadı. Seçimlerin gerekçesi tipografi bölümünde."),
    ("Kaynaksız istatistik", "Örneklerdeki sayılar “örnek” diye işaretli; ekranda yalnızca veritabanından gelecek."),
    ("Klişe slogan, “Daha fazla bilgi”", "Yok. Düğmeler ne yaptığını söylüyor: “Hesabı devral”, “Filtrele”."),
    ("Harf + ikon yan yana logo", "Yok. Her iki sembol de ana logonun karelerinden türedi; logotype’lar ana logonun çizimlerini kullanıyor."),
]

SES_HITAP = [
    ("Aday arayüzü ve aday e-postaları", "sen", "Profilini tamamla. Başvurun Kodpit’e iletildi."),
    ("Firma paneli ve firma e-postaları", "siz", "İlanınız onaya gönderildi. Başvuruları buradan yönetebilirsiniz."),
    ("Yönetim paneli", "siz", "3 ilan onayınızı bekliyor."),
    ("Herkese açık sayfada firmaya seslenen satır", "siz", "Teknokent firmasıysanız: Firma girişi"),
]
SES_ORNEK = [
    ("Düğme (aday)", "Gönder", "Başvurunu gönder"),
    ("Düğme (firma)", "Kaydet", "İlanı onaya gönder"),
    ("Hata (aday)", "Geçersiz dosya.", "CV 5 MB’tan büyük. PDF’i sıkıştırıp tekrar yükle."),
    ("Hata (firma)", "Bir hata oluştu.", "Son başvuru tarihi en fazla 60 gün sonrası olabilir. 12 Ocak 2027 veya önceki bir gün seçin."),
    ("Boş durum (aday)", "Sonuç bulunamadı 😕", "Bu filtrelerle ilan yok. “Uzaktan” filtresini kaldırırsan 8 ilan var."),
    ("Boş durum (firma)", "Henüz başvuru yok.", "Bu ilana henüz başvuru gelmedi. İlan 3 gündür yayında; LinkedIn metnini kopyalayıp paylaşabilirsiniz."),
    ("Onay bekliyor", "İlanınız inceleniyor!", "İlanınız Yönetici A.Ş. onayında. Hedef onay süresi 1 iş günü."),
    ("Olumsuz sonuç (aday e-postası)", "Maalesef başvurunuz olumsuz sonuçlanmıştır.",
     "Ratel Bilişim, Destek Mühendisi ilanı için başka bir adayla ilerlemeye karar verdi. Profilin CV havuzunda kalmaya devam ediyor; benzer ilanlar açıldığında sana haber vereceğiz."),
]
YASAK_IFADE = ["Hayalindeki iş seni bekliyor", "Kariyerinde yeni bir sayfa", "Geleceği birlikte inşa ediyoruz",
               "İnovasyonun kalbi", "Güçlü ekosistem", "Yenilikçi çözümler", "Daha fazla bilgi", "Keşfet", "Hemen başla",
               "Sistem aktif", "Son şans!", "Şu an 12 kişi bakıyor", "Oops!", "Bir şeyler ters gitti"]
TERIMLER = [("ilan", "iş ilanı, pozisyon, açık"), ("başvuru", "müracaat"), ("aday", "kullanıcı, iş arayan"),
            ("firma", "şirket, işveren"), ("CV havuzu", "yetenek havuzu, aday bankası"), ("son başvuru tarihi", "deadline, bitiş")]


def bolum_alternatif(alt: str) -> str:
    b = ALT_BILGI[alt]
    sinif = "alt-a" if alt == "a-kume" else "alt-b"
    harf = b["harf"]

    if alt == "a-kume":
        sema = f'''<div class="sema">
          <figure><div class="numune beyaz">{ana_logo_parcasi()}</div><figcaption>Ana logo: “t” piksellere dağılır</figcaption></figure>
          <span class="sema-ok" aria-hidden="true">→</span>
          <figure><div class="numune beyaz">{svg_oku(alt, "sembol-renkli.svg", "sema-sembol", "TeknoKariyer sembolü, A")}</div>
          <figcaption>TeknoKariyer: pikseller toplanır, bir kare yükselir</figcaption></figure></div>'''
    else:
        kelime_svg, etiketler, genislik = turetilmis_kelime()
        etiket_html = "".join(f"<li><strong>{e(t.split(' = ')[0])}</strong> {e(t.split(' = ')[1])}</li>" for _, t in etiketler)
        sema = f'''<div class="numune beyaz turetme">{kelime_svg}<ul class="turetme-etiket">{etiket_html}</ul></div>
          <p class="aciklama"><span class="renk-ornek" style="background:#2155AD"></span> ana logodan birebir
          <span class="renk-ornek" style="background:#05A1E6"></span> aynı çizimlerden türetildi</p>'''

    palet = "".join(
        f'''<li><span class="renk" style="background:{hx}"></span><span class="renk-ad">{ad}</span>
        <code>{hx}</code><span class="renk-rol">{e(rol)}</span></li>''' for ad, hx, rol, _ in PALET[alt])
    durum = "".join(f'<li><span class="renk" style="background:{hx}"></span><span class="renk-ad">{ad}</span><code>{hx}</code></li>'
                    for ad, hx in DURUM[alt])
    oran = "".join(f'<span style="flex:{o};background:{hx}" title="{ad} %{o}"></span>' for ad, hx, _, o in PALET[alt])

    satirlar = []
    for on_ad, on, zem_ad, zem, kullanim in kontrast_ciftleri(alt):
        k = kontrast(on, zem)
        if k >= 4.5:
            sonuc, s_sinif = "AA metin", "gecer"
        elif k >= 3:
            sonuc, s_sinif = "Yalnızca büyük metin ve çizgi", "sinirda"
        else:
            sonuc, s_sinif = "Metin olamaz", "kalir"
        satirlar.append(f'''<tr><td><span class="kt-ornek" style="background:{zem};color:{on}">Aa</span></td>
          <td>{on_ad} / {zem_ad}</td><td class="sayi">{k:.2f}:1</td><td class="{s_sinif}">{sonuc}</td><td>{e(kullanim)}</td></tr>''')

    fontlar = "".join(f'<div><dt>{e(a)}</dt><dd>{e(g)}</dd></div>' for a, g in b["font_gerekce"])
    kullanim = "".join(f'<div><dt>{e(a)}</dt><dd>{e(g)}</dd></div>' for a, g in KULLANIM[alt])

    return f'''
<section class="alternatif {sinif}" id="{alt}" aria-labelledby="{alt}-baslik">
  <header class="alt-bas">
    <p class="alt-harf">Alternatif {harf}</p>
    <h2 id="{alt}-baslik">{b["ad"]}</h2>
    <p class="alt-ozet">{e(b["ozet"])}</p>
  </header>

  <div class="numune beyaz buyuk">{svg_oku(alt, "logo-yatay-renkli.svg", "logo-ana", f"TeknoKariyer yatay logo, alternatif {harf}")}</div>

  <h3 class="kare-bas">Fikir</h3>
  <div class="iki-kolon"><div class="metin-kolon">{FIKIR[alt]}</div><div>{sema}</div></div>

  <h3 class="kare-bas">Logo sürümleri</h3>
  <div class="surumler">
    <figure><div class="numune lacivert">{svg_oku(alt, "logo-yatay-negatif.svg", "logo-s")}</div><figcaption>Negatif, lacivert zeminde</figcaption></figure>
    <figure><div class="numune beyaz">{svg_oku(alt, "logo-yatay-tekrenk.svg", "logo-s")}</div><figcaption>Tek renk: damga, faks, tek renkli baskı</figcaption></figure>
    <figure><div class="numune beyaz">{svg_oku(alt, "logo-kompakt-renkli.svg", "logo-k")}</div><figcaption>Kompakt: site başlığı, dar alanlar</figcaption></figure>
    <figure><div class="numune gece">{svg_oku(alt, "logo-kompakt-negatif.svg", "logo-k")}</div><figcaption>Kompakt negatif: yönetim paneli</figcaption></figure>
  </div>
  <div class="semboller">
    <figure><div class="numune beyaz kare-n">{svg_oku(alt, "sembol-renkli.svg", "sembol-b")}</div><figcaption>Sembol</figcaption></figure>
    <figure><div class="numune lacivert kare-n">{svg_oku(alt, "sembol-negatif.svg", "sembol-b")}</div><figcaption>Sembol, negatif</figcaption></figure>
    <figure><div class="numune sekme"><span class="sekme-kutu">{svg_oku(alt, "favicon.svg", "fav16")}<span>TeknoKariyer · İlanlar</span></span>
      <span class="fav-boylar">{svg_oku(alt, "favicon.svg", "fav32")}{svg_oku(alt, "favicon.svg", "fav64")}</span></div>
      <figcaption>Favicon: tarayıcı sekmesinde gerçek boyutta (16 px), 32 ve 64 px</figcaption></figure>
  </div>
  <dl class="kurallar">{kullanim}</dl>
  <div class="numune beyaz kucuk-boy"><span>Kompakt logo gerçek boyutta, 120 px:</span>{svg_oku(alt, "logo-kompakt-renkli.svg", "logo-120")}</div>

  <h3 class="kare-bas">Renk</h3>
  <div class="oran" aria-label="Ekrandaki yaklaşık renk payları">{oran}</div>
  <p class="aciklama">Ekrandaki yaklaşık alan payları. Lacivert yüzeyin onda birinden azını kaplar; tasarım mavide boğulmaz.</p>
  <ul class="palet">{palet}</ul>
  <p class="alt-etiket">Durum renkleri: yalnızca işlev için, her zaman ikon ve metinle</p>
  <ul class="palet durum">{durum}</ul>

  <h4>Kontrast (WCAG 2.2)</h4>
  <div class="tablo-kap"><table class="kontrast">
    <thead><tr><th scope="col"><span class="gorunmez">Örnek</span></th><th scope="col">Çift</th><th scope="col">Oran</th><th scope="col">Sonuç</th><th scope="col">Nerede</th></tr></thead>
    <tbody>{"".join(satirlar)}</tbody></table></div>
  <p class="aciklama">AA metin: 4,5:1 ve üstü. Büyük metin ve arayüz çizgileri: 3:1 ve üstü. Odak halkası her iki alternatifte lacivert olur; camgöbeği bu iş için yetmez.</p>

  <h3 class="kare-bas">Tipografi</h3>
  <div class="tipo k-ekran">
    <p class="tp-ust">İlan · D Blok 208</p>
    <p class="tp-h1">Gömülü Yazılım Mühendisi</p>
    <p class="tp-h2">Ne yapacaksın?</p>
    <p class="tp-govde">Pinova’nın endüstriyel sensör kartları için STM32 tabanlı yazılım geliştireceksin. Donanım ekibiyle
    aynı katta, B Blok G12’de çalışıyoruz; prototipler masanın yanında test ediliyor. Elektrik-Elektronik veya Bilgisayar
    Mühendisliği mezunuysan, C ve bir RTOS ile deneyimin varsa başvurunu bekliyoruz.</p>
    <p class="tp-glif">ĞÜŞİÖÇ ğüşıöç · Iı İi · Uşak, Iğdır, Çivril, Buldan</p>
    <div class="tablo-kap"><table class="tp-tablo"><thead><tr><th>İlan</th><th>Görüntülenme</th><th>Başvuru</th><th>Son tarih</th></tr></thead>
      <tbody><tr><td>Gömülü Yazılım Mühendisi</td><td>1.284</td><td>31</td><td class="veri">12.12.2026</td></tr>
      <tr><td>Ağ ve Sistem Stajyeri</td><td>916</td><td>118</td><td class="veri">15.11.2026</td></tr></tbody></table></div>
    <p class="ornek-not">Tablodaki sayılar örnektir. Eşit genişlikli rakamlar sütunları hizalar.</p>
  </div>
  <dl class="kurallar">{fontlar}</dl>
  <table class="olcek"><thead><tr><th>Ad</th><th>Mobil</th><th>Masaüstü</th><th>Kullanım</th></tr></thead><tbody>
    <tr><td>Başlık 1</td><td>28 / 34</td><td>36 / 42</td><td>Sayfa başlığı, ilan adı</td></tr>
    <tr><td>Başlık 2</td><td>22 / 28</td><td>26 / 32</td><td>Bölüm başlığı</td></tr>
    <tr><td>Başlık 3</td><td>18 / 24</td><td>20 / 26</td><td>Kart ve panel başlığı</td></tr>
    <tr><td>Gövde</td><td>16 / 24</td><td>17 / 26</td><td>İlan metni, form</td></tr>
    <tr><td>Küçük</td><td>14 / 20</td><td>14 / 20</td><td>Liste satırında ikincil bilgi</td></tr>
    <tr><td>Etiket</td><td>13 / 16</td><td>13 / 16</td><td>Durum etiketi, tablo başlığı</td></tr>
  </tbody></table>
  <p class="aciklama">Boy / satır yüksekliği, piksel. Mobil boylar 360 px ekrana göre seçildi; gövde metni hiçbir yerde 16 px’in altına inmez.</p>

  <h3 class="kare-bas">Kare ızgara ve grafik dil</h3>
  <div class="iki-kolon">
    <div class="metin-kolon">
      <p>Kare süs olarak serpiştirilmez; bir işi vardır:</p>
      <ul class="kare-liste k-ekran">
        <li>Liste imleci ve bölüm işareti küçük karedir (bu sayfadaki başlıklar gibi).</li>
        <li>Grafiklerde birim karedir: her kare bir başvuru. Sayı küçükken tek tek görülür, büyüdükçe yoğunluk okunur.</li>
        <li>Seçili filtre ve aktif sekme, metnin solunda vurgu renginde bir kareyle işaretlenir.</li>
        <li>Sayfa ızgarası 4 px tabanlıdır; boşluklar 4, 8, 12, 16, 24, 32, 48 px.</li>
        <li>Köşe yarıçapı: kontrol 4 px, panel 6 px, görsel 2 px. Hap biçimi yalnızca filtre seçimlerinde.</li>
      </ul>
    </div>
    <div><p class="alt-etiket">Başvuru hunisi, bir ilan için (örnek veri)</p>{huni(alt)}</div>
  </div>

  <h3 class="kare-bas">Ekranda</h3>
  <div class="ekran-iki">
    <div>{telefon(alt)}<p class="aciklama">Mobil ilan listesi, 360 px. Firmalar gerçek; ilanlar örnek.</p></div>
    <div class="uygulamalar">
      <figure>{linkedin_karti(alt)}<figcaption>LinkedIn paylaşım kartı (1200 × 627). İlan sayfası bu görseli otomatik üretir.</figcaption></figure>
      <figure>{sosyal(alt)}<figcaption>Sosyal medya duyuru şablonu (1080 × 1080)</figcaption></figure>
    </div>
  </div>
  <figure class="ep-fig">{eposta(alt)}<figcaption>Firma davet e-postası. Metin ağırlıklı; görsel yalnızca logo. Gönderici kurumun alan adı.</figcaption></figure>

  <h3 class="kare-bas">Eleştirel denetim</h3>
  <div class="denetim">
    <div><h4>Logo testi</h4><p>{e(DENETIM[alt]["logo_testi"])}</p></div>
    <div><h4>Zayıf noktalar</h4><ul>{"".join(f"<li>{e(r)}</li>" for r in DENETIM[alt]["riskler"])}</ul></div>
  </div>
</section>'''


def karsilastirma() -> str:
    kart = []
    for alt in ("a-kume", "b-yuva"):
        b = ALT_BILGI[alt]
        renkler = "".join(f'<span style="background:{hx}" title="{ad}"></span>' for ad, hx, _, _ in PALET[alt]
                          if ad in ("Lacivert", "Camgöbeği", "Kiremit", "Okra", "Zemin"))
        kart.append(f'''<a class="kars-kart" href="#{alt}">
      <span class="kars-harf">Alternatif {b["harf"]} · {b["ad"]}</span>
      <span class="numune beyaz">{svg_oku(alt, "logo-yatay-renkli.svg", "logo-kars", f"Alternatif {b['harf']} yatay logo")}</span>
      <span class="kars-ozet">{e(b["ozet"])}</span>
      <span class="kars-alt"><span class="kars-renk">{renkler}</span><span>{e(b["baslik_font"])}{"" if b["govde_font"] == b["baslik_font"] else " + " + e(b["govde_font"])}{" + " + e(b["veri_font"]) if b["veri_font"] not in (b["baslik_font"], b["govde_font"]) else ""}</span></span>
    </a>''')
    return f'<div class="kars">{"".join(kart)}</div>'


def ortak() -> str:
    hitap = "".join(f"<tr><td>{e(a)}</td><td><strong>{e(b)}</strong></td><td>{e(c)}</td></tr>" for a, b, c in SES_HITAP)
    ornek = "".join(f'<tr><td>{e(a)}</td><td class="degil">{e(b)}</td><td class="boyle">{e(c)}</td></tr>' for a, b, c in SES_ORNEK)
    yasak = "".join(f"<li>{e(y)}</li>" for y in YASAK_IFADE)
    terim = "".join(f"<tr><td><strong>{e(a)}</strong></td><td>{e(b)}</td></tr>" for a, b in TERIMLER)
    yk = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td></tr>" for a, b in YASAK_KONTROL)
    return f'''
<section class="ortak" id="ses-tonu" aria-labelledby="ses-baslik">
  <header class="alt-bas"><p class="alt-harf">İki alternatifte ortak</p><h2 id="ses-baslik">Ses tonu</h2>
  <p class="alt-ozet">Kısa, somut, nazik. Kurumsal ama resmî yazışma dili değil. Her metin ne olduğunu ve ne yapılacağını söyler.</p></header>
  <h3 class="kare-bas">Hitap (K9)</h3>
  <div class="tablo-kap"><table><thead><tr><th>Nerede</th><th>Hitap</th><th>Örnek</th></tr></thead><tbody>{hitap}</tbody></table></div>
  <h3 class="kare-bas">Böyle değil, böyle</h3>
  <div class="tablo-kap"><table class="ses"><thead><tr><th>Durum</th><th>Böyle değil</th><th>Böyle</th></tr></thead><tbody>{ornek}</tbody></table></div>
  <div class="iki-kolon">
    <div><h3 class="kare-bas">Kullanılmayacak ifadeler</h3><ul class="yasak">{yasak}</ul></div>
    <div><h3 class="kare-bas">Sabit terimler</h3><table class="terim"><thead><tr><th>Kullan</th><th>Kullanma</th></tr></thead><tbody>{terim}</tbody></table></div>
  </div>
  <h3 class="kare-bas">15. bölüm yasak listesi kontrolü</h3>
  <div class="tablo-kap"><table><thead><tr><th>Yasak</th><th>Durum</th></tr></thead><tbody>{yk}</tbody></table></div>
</section>'''


def karar() -> str:
    return '''
<section class="karar" id="karar" aria-labelledby="karar-baslik">
  <header class="alt-bas"><p class="alt-harf">Önerim ve sizden beklenen</p><h2 id="karar-baslik">Karar</h2></header>
  <div class="iki-kolon">
    <div class="metin-kolon">
      <p><strong>Önerim B · Yuva.</strong> Üç gerekçem var:</p>
      <ol>
        <li>Logotype tamamen Teknokent’in kendi çizimlerinden geliyor; hazır bir yazı tipiyle yazılmış bir ad değil.
        Logo testini en güçlü geçen alternatif bu.</li>
        <li>Sembol ürünün işini anlatıyor: eşleşme. Aynı okra kare arayüzde eşleşen becerileri işaretleyecek;
        logo ile ekran aynı dili konuşacak.</li>
        <li>Okra, kiremidin taşıdığı “krem + toprak rengi” klişe riskini taşımıyor ve hata kırmızısıyla karışmıyor.</li>
      </ol>
      <p>A’yı da ciddi bir seçenek olarak hazırladım. Ana markaya en yakın, en az sürpriz içeren yol o.
      Kurumun alt markalarını ana logoya sıkı bağlı tutmak gibi bir tercihi varsa A daha doğru olur.</p>
    </div>
    <div class="metin-kolon">
      <p><strong>Sizden beklediğim cevaplar:</strong></p>
      <ol>
        <li>A mı, B mi? Parçaları birleştirmek de mümkün; örneğin B’nin logotype’ı ile A’nın kiremidi.</li>
        <li>Seçilen alternatifin ikinci rengi (kiremit veya okra) uygun mu?</li>
        <li>Yazı tipleri uygun mu?</li>
        <li>Değişmesini istediğiniz bir şey var mı?</li>
      </ol>
      <p>Onaydan sonra seçilen kimlik <code>docs/kimlik/</code> altında kalıcı hâle gelecek, tasarım değişkenleri koda
      aktarılacak. Ardından referans panosuna ve prototiplere geçeceğim.</p>
    </div>
  </div>
</section>'''


# --- CSS -----------------------------------------------------------------------------------------------------------
CSS = r"""
/* Düzen: tek sütunlu belge; her alternatif aynı başlık sırasıyla. Numuneler (logo, ekran, e-posta) gerçek
   ortamlarını temsil ettiği için kendi sabit zemin ve metin renklerini taşır; sayfa çerçevesi temaya uyar. */
:root {
  --sayfa: #F5F5F2; --yuzey: #FFFFFF; --cizgi: #DCDBD5; --metin: #1E1E1C; --metin2: #5A5955;
  --bag: #2155AD; --isaret: #2155AD; --gecer: #25734A; --sinirda: #8A5C00; --kalir: #BF1F2F;
  --f-sayfa: "Public Sans", "Segoe UI", system-ui, sans-serif;
  --f-kod: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --sayfa: #15171B; --yuzey: #1D2025; --cizgi: #34373D; --metin: #ECEBE6; --metin2: #A8A7A1;
  --bag: #9BB8EE; --isaret: #9BB8EE; --gecer: #6CC596; --sinirda: #E2B45A; --kalir: #F08A8A; color-scheme: dark; } }
:root[data-theme="dark"] {
  --sayfa: #15171B; --yuzey: #1D2025; --cizgi: #34373D; --metin: #ECEBE6; --metin2: #A8A7A1;
  --bag: #9BB8EE; --isaret: #9BB8EE; --gecer: #6CC596; --sinirda: #E2B45A; --kalir: #F08A8A; color-scheme: dark; }

body { background: var(--sayfa); color: var(--metin); font: 16px/1.55 var(--f-sayfa); }
.sayfa { max-width: 1120px; margin: 0 auto; padding-block: 32px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
a { color: var(--bag); }
a:focus-visible, .kars-kart:focus-visible { outline: 3px solid var(--bag); outline-offset: 3px; }
h1, h2, h3, h4 { text-wrap: balance; margin: 0; }
p { margin: 0; }
code { font-family: var(--f-kod); font-size: 0.86em; }
.gorunmez { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Üst bölüm */
.ust { display: grid; gap: 16px; padding-bottom: 28px; border-bottom: 1px solid var(--cizgi); margin-bottom: 28px; }
.ust-meta { font: 500 13px/1.3 var(--f-kod); color: var(--metin2); letter-spacing: 0.02em; }
.ust h1 { font-size: clamp(28px, 4vw, 40px); line-height: 1.12; font-weight: 700; letter-spacing: -0.01em; max-width: 22ch; }
.ust-metin { max-width: 68ch; color: var(--metin2); display: grid; gap: 10px; }
.ust-metin strong { color: var(--metin); }
nav.icindekiler { display: flex; flex-wrap: wrap; gap: 4px 20px; font-size: 15px; }
nav.icindekiler a { text-decoration: none; border-bottom: 1px solid currentColor; padding-block: 6px 2px; }

/* Karşılaştırma */
.kars { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 16px; margin-bottom: 56px; }
.kars-kart { display: grid; gap: 12px; padding: 16px; background: var(--yuzey); border: 1px solid var(--cizgi);
  border-radius: 6px; text-decoration: none; color: var(--metin); align-content: start; }
.kars-kart:hover { border-color: var(--bag); }
.kars-harf { font: 600 13px/1 var(--f-kod); letter-spacing: 0.04em; text-transform: uppercase; color: var(--metin2); }
.kars-ozet { color: var(--metin2); font-size: 15px; }
.kars-alt { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; font-size: 14px; color: var(--metin2); }
.kars-renk { display: inline-flex; }
.kars-renk span { width: 20px; height: 20px; border: 1px solid rgba(0,0,0,.12); }
.logo-kars { width: 100%; height: 96px; display: block; }

/* Numuneler: sabit renkli, temadan bağımsız */
.numune { display: flex; align-items: center; justify-content: center; padding: 20px; border-radius: 2px;
  border: 1px solid var(--cizgi); min-width: 0; }
.numune.beyaz { background: #FFFFFF; color: #1E1E1C; }
.numune.lacivert { background: #2155AD; color: #FFFFFF; border-color: #2155AD; }
.numune.gece { background: #13284F; color: #FFFFFF; border-color: #13284F; }
.numune.buyuk { padding: 40px 24px; margin-block: 20px 8px; }
.logo-ana { width: 100%; max-width: 760px; height: auto; max-height: 200px; }
.logo-s { width: 100%; height: 90px; }
.logo-k { width: 100%; max-width: 300px; height: 44px; }
.logo-120 { width: 120px; height: auto; }

/* Alternatif bölümleri */
.alternatif, .ortak, .karar { padding-top: 48px; margin-top: 48px; border-top: 3px solid var(--metin); }
.alt-bas { display: grid; gap: 6px; margin-bottom: 8px; }
.karar .iki-kolon { margin-top: 24px; }
.alt-harf { font: 600 13px/1 var(--f-kod); letter-spacing: 0.04em; text-transform: uppercase; color: var(--metin2); }
.alt-bas h2 { font-size: clamp(30px, 4.4vw, 44px); line-height: 1.05; letter-spacing: -0.015em; }
.alt-ozet { max-width: 68ch; color: var(--metin2); font-size: 17px; }
h3.kare-bas { font-size: 21px; line-height: 1.25; margin-block: 44px 16px; display: flex; align-items: center; gap: 10px; }
h3.kare-bas::before { content: ""; width: 10px; height: 10px; background: var(--isaret); flex: none; }
h4 { font-size: 17px; margin-block: 24px 10px; }
.alt-etiket { font: 600 13px/1.3 var(--f-kod); color: var(--metin2); letter-spacing: 0.02em; margin-block: 16px 8px; }
.aciklama { color: var(--metin2); font-size: 14px; margin-top: 8px; max-width: 72ch; }
.iki-kolon { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 24px 40px; align-items: start; }
.iki-kolon > * { min-width: 0; }
.metin-kolon { display: grid; gap: 12px; max-width: 68ch; }
.metin-kolon ol, .metin-kolon ul { margin: 0; padding-left: 22px; display: grid; gap: 8px; }

/* Fikir şeması */
.sema { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; }
.sema figure { margin: 0; display: grid; gap: 6px; }
.sema .numune { height: 150px; }
.sema-svg { width: 100%; height: 100%; max-height: 120px; }
.sema-sembol { height: 100px; width: auto; }
.sema-ok { font-size: 24px; color: var(--metin2); }
figcaption { font-size: 13px; color: var(--metin2); line-height: 1.4; }
.turetme { flex-direction: column; align-items: stretch; padding: 24px 20px 12px; }
.turetme .sema-svg { max-height: none; height: auto; }
.turetme-etiket { list-style: none; margin: 16px 0 4px; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 6px 16px; font-size: 13px; color: #4A4A48; }
.turetme-etiket strong { color: #05A1E6; font-size: 15px; margin-right: 4px; }
.renk-ornek { display: inline-block; width: 10px; height: 10px; vertical-align: baseline; margin-left: 8px; }

/* Sürümler */
.surumler { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 16px; }
.surumler figure, .semboller figure, .uygulamalar figure, .ep-fig { margin: 0; display: grid; gap: 8px; min-width: 0; }
.surumler .numune { height: 150px; }
.semboller { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 16px; margin-top: 16px; }
.kare-n { height: 160px; }
.sembol-b { height: 96px; width: auto; }
.numune.sekme { background: #DFE1E5; color: #1F1F1F; flex-direction: column; gap: 14px; height: 160px; border-color: #DFE1E5; }
.sekme-kutu { display: flex; align-items: center; gap: 8px; background: #FFFFFF; padding: 8px 14px; border-radius: 8px 8px 0 0;
  font: 12px/1 system-ui, sans-serif; }
.fav16 { width: 16px; height: 16px; }
.fav32 { width: 32px; height: 32px; }
.fav64 { width: 64px; height: 64px; }
.fav-boylar { display: flex; gap: 14px; align-items: end; }
.kurallar { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px 24px; margin: 24px 0 0; }
.kurallar dt { font-weight: 700; font-size: 15px; }
.kurallar dd { margin: 4px 0 0; color: var(--metin2); font-size: 15px; }
.kucuk-boy { justify-content: flex-start; gap: 16px; margin-top: 16px; flex-wrap: wrap; font-size: 14px; color: #5A5955; }

/* Renk */
.oran { display: flex; height: 28px; border: 1px solid var(--cizgi); }
.palet { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 0; border-top: 1px solid var(--cizgi); }
.palet li { display: grid; grid-template-columns: 36px 140px 90px 1fr; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--cizgi); }
.palet.durum { display: flex; flex-wrap: wrap; gap: 8px 32px; border-top: 0; margin-top: 0; }
.palet.durum li { display: flex; gap: 10px; align-items: center; border-bottom: 0; padding: 4px 0; }
.renk { width: 36px; height: 36px; border: 1px solid rgba(0,0,0,.14); }
.renk-ad { font-weight: 600; }
.renk-rol { color: var(--metin2); font-size: 15px; }
@media (max-width: 640px) { .palet li { grid-template-columns: 36px 1fr auto; } .palet li .renk-rol { grid-column: 2 / -1; } }

/* Tablolar */
.tablo-kap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 15px; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: 9px 12px 9px 0; border-bottom: 1px solid var(--cizgi); vertical-align: top; }
th { font: 600 13px/1.3 var(--f-kod); color: var(--metin2); letter-spacing: 0.02em; }
.sayi { font-family: var(--f-kod); white-space: nowrap; }
.kt-ornek { display: inline-grid; place-items: center; width: 44px; height: 30px; font-weight: 700; border: 1px solid rgba(0,0,0,.1); }
.gecer { color: var(--gecer); font-weight: 600; }
.sinirda { color: var(--sinirda); font-weight: 600; }
.kalir { color: var(--kalir); font-weight: 600; }
.olcek { margin-top: 20px; }
.ses td.degil { color: var(--metin2); text-decoration: line-through; text-decoration-color: var(--kalir); }
.ses td.boyle { font-weight: 500; }
.yasak { columns: 2 180px; padding-left: 18px; margin: 0; }
.yasak li { margin-bottom: 6px; }

/* Alternatifin kendi kimliği (numune ekranlar) */
.alt-a { --k-baslik: "Lexend", system-ui, sans-serif; --k-govde: "Source Sans 3", system-ui, sans-serif; --k-veri: "Source Sans 3", system-ui, sans-serif;
  --k-vurgu: #B04E26; --k-vurgu-koyu: #F7A27C; --k-zemin: #F7F6F3; --k-metin: #1E1E1C; --k-metin2: #5B5852; --k-cizgi: #E4E1DA; --k-isaret: #B04E26;
  --k-eslesme-zemin: transparent; --k-baslik-agirlik: 600; }
.alt-b { --k-baslik: "Schibsted Grotesk", system-ui, sans-serif; --k-govde: "Schibsted Grotesk", system-ui, sans-serif; --k-veri: "IBM Plex Mono", ui-monospace, monospace;
  --k-vurgu: #F2B230; --k-vurgu-koyu: #F2B230; --k-zemin: #F4F4F1; --k-metin: #1C1D1F; --k-metin2: #585A5E; --k-cizgi: #E2E2DD; --k-isaret: #2155AD;
  --k-eslesme-zemin: #FCEDC4; --k-baslik-agirlik: 700; }
.k-ekran { font-family: var(--k-govde); color: var(--k-metin); }

.tipo { background: var(--k-zemin); border: 1px solid var(--cizgi); padding: 24px; display: grid; gap: 10px; }
.tipo > * { min-width: 0; }
@media (max-width: 560px) { .tipo { padding: 16px; } }
.tp-ust { font: 500 13px/1.3 var(--k-veri); color: var(--k-metin2); letter-spacing: .02em; }
.tp-h1 { font: var(--k-baslik-agirlik) clamp(28px, 4vw, 36px)/1.17 var(--k-baslik); letter-spacing: -0.01em; }
.tp-h2 { font: var(--k-baslik-agirlik) 22px/1.27 var(--k-baslik); margin-top: 6px; }
.tp-govde { font-size: 17px; line-height: 1.53; max-width: 64ch; }
.tp-glif { font: var(--k-baslik-agirlik) 22px/1.3 var(--k-baslik); color: var(--k-metin); border-top: 1px solid var(--k-cizgi); padding-top: 12px; margin-top: 4px; }
.tp-tablo { font-family: var(--k-govde); font-size: 15px; background: #FFFFFF; color: var(--k-metin); }
.tp-tablo th { font-family: var(--k-govde); color: var(--k-metin2); }
.tp-tablo th, .tp-tablo td { border-color: var(--k-cizgi); padding: 8px 10px; }
.tp-tablo td:nth-child(2), .tp-tablo td:nth-child(3), .tp-tablo th:nth-child(2), .tp-tablo th:nth-child(3) { text-align: right; }
.tp-tablo .veri { font-family: var(--k-veri); }
.ornek-not { font: 500 12px/1.3 var(--f-kod); color: #6A6964; }

.kare-liste { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; font-family: var(--f-sayfa); color: var(--metin); }
.kare-liste li { display: grid; grid-template-columns: 8px 1fr; gap: 12px; align-items: baseline; }
.kare-liste li::before { content: ""; width: 8px; height: 8px; background: var(--isaret); transform: translateY(-1px); }

.huni { background: #FFFFFF; border: 1px solid var(--cizgi); padding: 16px; display: grid; gap: 10px; }
.huni-satir { display: grid; grid-template-columns: 92px 32px 1fr; gap: 10px; align-items: center; font-size: 14px; }
.huni-n { font-family: var(--k-veri); font-variant-numeric: tabular-nums; text-align: right; }
.huni-kareler { display: flex; flex-wrap: wrap; gap: 2px; }
.huni-kareler i { width: 8px; height: 8px; background: #2155AD; }
.huni-satir.son .huni-kareler i { background: var(--k-vurgu); }
.alt-a .huni-satir.son .huni-kareler i { background: #B04E26; }

/* Telefon numunesi */
.ekran-iki { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 32px; align-items: start; }
@media (max-width: 860px) { .ekran-iki { grid-template-columns: minmax(0, 1fr); } }
.telefon { width: 100%; max-width: 360px; background: var(--k-zemin); border: 1px solid #C9C8C2; border-radius: 6px; overflow: hidden;
  display: grid; font-size: 15px; }
.tel-ust { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #FFFFFF; border-bottom: 1px solid var(--k-cizgi); }
.tel-logo { height: 20px; width: auto; }
.tel-giris { color: #2155AD; font-weight: 600; font-size: 15px; }
.tel-arama { margin: 12px 16px 0; padding: 12px 14px; background: #FFFFFF; border: 1px solid #8D8C87; border-radius: 4px; color: var(--k-metin2); }
.tel-hizli { display: flex; gap: 8px; padding: 10px 16px; overflow: hidden; }
.tel-hizli span { padding: 6px 12px; border: 1px solid #8D8C87; border-radius: 999px; font-size: 14px; white-space: nowrap; background: #FFFFFF; }
.tel-hizli .secili { background: #2155AD; color: #FFFFFF; border-color: #2155AD; }
.tel-sayac { padding: 0 16px 8px; font-size: 14px; color: var(--k-metin2); display: flex; gap: 8px; align-items: baseline; }
.tel-sayac strong { color: var(--k-metin); font-family: var(--k-veri); }
.tel-liste { list-style: none; margin: 0; padding: 0; background: #FFFFFF; border-top: 1px solid var(--k-cizgi); }
.tel-liste li { border-bottom: 1px solid var(--k-cizgi); }
.tel-liste a { display: grid; gap: 2px; padding: 11px 16px; color: var(--k-metin); text-decoration: none; }
.poz { font: var(--k-baslik-agirlik) 16px/1.3 var(--k-baslik); color: #1A3F85; }
.firma { font-size: 14px; }
.konum { font-family: var(--k-veri); font-size: 12.5px; color: var(--k-metin2); margin-left: 4px; }
.alt-satir { display: flex; justify-content: space-between; gap: 8px; font-size: 13.5px; color: var(--k-metin2); }
.tarih.son { color: #1E1E1C; font-weight: 700; }
.tarih.son::before { content: ""; display: inline-block; width: 7px; height: 7px; background: #2155AD; margin-right: 6px; vertical-align: 1px; }
.eslesme { font-size: 13px; margin-top: 6px; color: var(--k-metin); }
.eslesme mark { background: var(--k-eslesme-zemin); color: var(--k-metin); padding: 0 3px; }
.eksik { color: var(--k-metin); font-weight: 600; text-decoration: underline dotted; text-underline-offset: 3px; }
.tel-alt { position: relative; padding: 10px 16px 14px; background: #FFFFFF; border-top: 1px solid var(--k-cizgi); }
.tel-dugme { display: block; text-align: center; padding: 12px; background: #2155AD; color: #FFFFFF; font-weight: 700; border-radius: 4px; }

/* LinkedIn kartı */
.uygulamalar { display: grid; gap: 24px; }
.lk { position: relative; aspect-ratio: 1200 / 627; max-width: 100%; background: #13284F; color: #FFFFFF; overflow: hidden;
  display: grid; grid-template-rows: 1fr auto; padding: 5.5% 6%; container-type: inline-size; }
.lk-sol { display: grid; align-content: start; gap: 2cqi; max-width: 70%; position: relative; z-index: 1; }
.lk-firma { font-size: 3.2cqi; font-weight: 600; }
.lk-firma span { font-weight: 400; opacity: .85; }
.lk-poz { font: var(--k-baslik-agirlik) 7cqi/1.08 var(--k-baslik); letter-spacing: -0.01em; }
.lk-bilgi { font-size: 3cqi; opacity: .9; }
.lk-alt { display: flex; justify-content: space-between; align-items: center; gap: 4cqi; font: 500 2.6cqi/1 var(--k-veri); position: relative; z-index: 1; }
.lk-logo { height: 4.6cqi; width: auto; }
.lk-sembol { position: absolute; right: 5%; top: 9%; height: 46%; width: auto; }

/* Sosyal medya */
.sosyal { position: relative; aspect-ratio: 1; max-width: 420px; background: #FFFFFF; border: 1px solid var(--cizgi); overflow: hidden;
  display: grid; align-content: space-between; padding: 7%; container-type: inline-size; color: #13284F; }
.so-kareler { position: absolute; right: 0; top: 0; width: 34%; aspect-ratio: 1; background:
  linear-gradient(#2155AD, #2155AD) 100% 0 / 50% 50% no-repeat,
  linear-gradient(#2155AD, #2155AD) 0 50% / 50% 50% no-repeat,
  linear-gradient(var(--k-vurgu), var(--k-vurgu)) 50% 100% / 25% 25% no-repeat; }
.alt-a .so-kareler { background:
  linear-gradient(#2155AD, #2155AD) 100% 0 / 50% 50% no-repeat,
  linear-gradient(#2155AD, #2155AD) 0 50% / 50% 50% no-repeat,
  linear-gradient(#B04E26, #B04E26) 50% 100% / 25% 25% no-repeat; }
.so-ust { font: 500 3.6cqi/1.3 var(--k-veri); color: #2155AD; position: relative; max-width: 60%; }
.so-baslik { font: var(--k-baslik-agirlik) 9.4cqi/1.05 var(--k-baslik); letter-spacing: -0.015em; max-width: 92%; }
.so-bilgi { font-size: 4.2cqi; line-height: 1.35; color: #3B3F48; max-width: 86%; }
.so-alt { display: flex; justify-content: space-between; align-items: center; gap: 4cqi; background: #13284F; color: #FFFFFF;
  margin: 0 -8% -8%; padding: 4.5% 8%; font: 500 3.2cqi/1 var(--k-veri); }
.so-logo { height: 6cqi; width: auto; }

/* E-posta */
.ep-fig { margin-top: 24px; }
.eposta { background: #FFFFFF; border: 1px solid #C9C8C2; max-width: 680px; color: #1E1E1C; }
.ep-bas { margin: 0; padding: 12px 20px; background: #F1F1EE; border-bottom: 1px solid #DCDBD5; display: grid; gap: 4px; font-size: 14px; }
.ep-bas div { display: grid; grid-template-columns: 64px 1fr; gap: 8px; }
.ep-bas dt { color: #5A5955; } .ep-bas dd { margin: 0; overflow-wrap: anywhere; }
.ep-govde { padding: 28px 24px; display: grid; gap: 14px; max-width: 560px; font-size: 16px; line-height: 1.55; }
.ep-logo { height: 24px; width: auto; margin-bottom: 10px; }
.ep-dugme { display: inline-block; background: #2155AD; color: #FFFFFF; padding: 12px 22px; border-radius: 4px; font-weight: 700; }
.ep-kucuk { font-size: 14px; color: #4A4A48; }
.ep-alt { padding: 16px 24px; border-top: 1px solid #E4E3DE; font-size: 12.5px; color: #5A5955; line-height: 1.5; }

/* Denetim */
.denetim { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 24px 40px; }
.denetim h4 { margin-top: 0; }
.denetim ul { padding-left: 20px; margin: 0; display: grid; gap: 10px; color: var(--metin); }
.denetim p { color: var(--metin); }
.denetim > div { min-width: 0; }

@media (max-width: 560px) {
  .sema { grid-template-columns: 1fr; } .sema-ok { transform: rotate(90deg); justify-self: center; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
"""


def sayfa() -> str:
    govde = "".join([
        f'''<div class="sayfa">
<header class="ust">
  <p class="ust-meta">TeknoKariyer · alt marka kimliği · Taslak 1 · 13 Kasım 2026</p>
  <h1>TeknoKariyer için iki kimlik önerisi</h1>
  <div class="ust-metin">
    <p>Pamukkale Teknokent’in kariyer portalı için iki alternatif hazırladım. İkisi de ana logonun vektör çizimlerinden
    türetildi; hazır şablon veya yazı tipiyle yazılmış bir logo yok. Her alternatif aynı başlıklar altında
    gösteriliyor: fikir, logo sürümleri, renk ve kontrast, tipografi, kare dili, ekranda ve basılı örneklerde görünüş,
    son olarak kendi zayıf noktaları.</p>
    <p><strong>Sizden beklenen:</strong> birini seçmeniz veya parçalarını birleştirmemizi istemeniz.
    Örneklerdeki firmalar Teknokent rehberinden gerçek kayıtlar; ilanlar, kişiler ve sayılar örnektir.</p>
  </div>
  <nav class="icindekiler" aria-label="Bölümler"><a href="#a-kume">A · Küme</a><a href="#b-yuva">B · Yuva</a>
  <a href="#ses-tonu">Ses tonu</a><a href="#karar">Karar</a></nav>
</header>
{karsilastirma()}''',
        bolum_alternatif("a-kume"),
        bolum_alternatif("b-yuva"),
        ortak(),
        karar(),
        '</div>',
    ])
    fontlar = ("https://fonts.googleapis.com/css2?family=Lexend:wght@600&family=Source+Sans+3:wght@400;600;700"
               "&family=Schibsted+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600"
               "&family=Public+Sans:wght@400;500;600;700&display=swap")
    return (f'<title>TeknoKariyer Kimlik Önerisi</title>\n'
            f'<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            f'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link rel="stylesheet" href="{fontlar}">\n'
            f'<style>{CSS}</style>\n{govde}\n')


def tokenlar() -> None:
    """Her alternatif için tasarım değişkenlerini JSON olarak yazar (onaydan sonra koda aktarılacak)."""
    for alt in PALET:
        veri = {
            "renk": {ad: hx for ad, hx, _, _ in PALET[alt]} | {"İkincil metin": IKINCIL_METIN[alt]}
                    | {f"Durum: {ad}": hx for ad, hx in DURUM[alt]},
            "yazi": {k: ALT_BILGI[alt][k] for k in ("baslik_font", "govde_font", "veri_font")},
            "kose": {"kontrol": 4, "panel": 6, "gorsel": 2},
            "bosluk": [4, 8, 12, 16, 24, 32, 48],
        }
        with open(os.path.join(KIMLIK, alt, "tokenlar.json"), "w", encoding="utf-8") as f:
            json.dump(veri, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    tokenlar()
    yol = os.path.join(KIMLIK, "sunum.html")
    with open(yol, "w", encoding="utf-8") as f:
        f.write(sayfa())
    print(os.path.relpath(yol, uret.DEPO), f"{os.path.getsize(yol) / 1024:.0f} KB")
