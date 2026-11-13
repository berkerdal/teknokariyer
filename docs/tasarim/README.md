# TeknoKariyer tasarım

**Durum:** Taslak 1 · kurum onayı bekliyor (13 Kasım 2026)

- **Prototip:** https://claude.ai/artifact/67TJq45XmkYsvCAfpoitva
- **İçerik:** Referans panosu, tasarım sistemi, denetim ve 19 ekran. Ekranlar mobil (390 px) ve masaüstü (1280 px) için ayrı düzenlendi.

## Klasör

`prototip/` klasöründeki dosyalar:

| Dosya | İçerik |
| --- | --- |
| `index.html` | Prototip çerçevesi ve ikon seti |
| `tokenlar.css` | Tasarım değişkenleri: renk, yazı, boşluk, köşe, hareket. Uygulamaya aynı adlarla aktarılacak. |
| `bilesenler.css` | Bileşenler: düğme, form, durum, etiket, ilan satırı, eşleşme, tablo, tarih seçici, alt panel… |
| `ekranlar.css` | Ekran düzenleri. Mobil önce yazılır; masaüstü `@container ekran (min-width: 900px)` ile genişler. |
| `cerceve.css` | Yalnızca prototip çerçevesi; ürünün parçası değil |
| `veri.js` | Örnek veri. Firmalar gerçek rehber kayıtları; ilanlar, kişiler ve sayılar örnek. |
| `uygulama.js` | Yönlendirme, cihaz çerçevesi, eşleşme hesabı, ortak parçalar |
| `ekran-aday.js` | Aday ekranları |
| `ekran-firma.js` | Firma ekranları |
| `ekran-yonetim.js` | Yönetim ekranları |
| `ekran-belge.js` | Belge sayfaları (prototip hakkında, referanslar, tasarım sistemi) |
| `ekran-denetim.js` | Denetim sayfası ve menü grupları |
| `logo` | `../../kimlik/logo` klasörüne bağlantı |

## Yerelde açma

Prototip göreli dosya yolları kullanır. Bir web sunucusuyla açılmalı:

```bash
cd docs/tasarim/prototip && python3 -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000/index.html#giris` adresi açılır.

## Kurumun kararını bekleyenler

1. İlan sayfasındaki sayaç biçimi (K7): aralık, kesin sayı, görüntülenme + başvuru veya hiç. Claude'un önerisi aralık.
2. CV havuzunda adayın adının da onay verene kadar gizli kalması. Bu Claude'un önerisi; talimatlarda yalnızca iletişim bilgisi ve CV gizli.
3. İletişim talebine 14 gün içinde cevap gelmezse talebin kapanması.
4. Favicon: ana logodaki "t" harfi ve kiremit kare.
5. Ekranların genel onayı.
