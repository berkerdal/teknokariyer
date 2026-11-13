# Pamukkale Teknokent Kariyer Portalı — Proje Bağlamı

Bu dosya, Claude'un oturumlar arasında kurum ve proje bilgisini kaybetmemesi için tutulur.
Her oturumun başında okunur. Önemli bir karar alındığında veya yeni bir bilgi öğrenildiğinde güncellenir.

## 1. Kurum

- **Resmi unvan:** Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş. (kısa ad: Pamukkale Teknokent, PAÜ Teknokent).
  Not: Yeni site taslağının footer'ında yazan "Teknokent Teknoloji Geliştirme Bölgesi A.Ş." yanlıştır.
- **Adres:** Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67 Pamukkale/Denizli
  (firma kayıtlarında "Kınıklı Mah. Hüseyin Yılmaz Cad. No:67 Pamukkale Teknokent" olarak da geçer).
- **Telefon:** +90 258 215 50 01-02
- **E-posta:** info@pauteknokent.com.tr · KVKK başvuruları: kvkk@pauteknokent.com.tr
- **Genel Müdür:** Prof. Dr. İbrahim Aksel.
  Yönetim kurulu ve ekip listesi mevcut sitede yer alır: /yonetim-kurulu, /ekibimiz.
- **Kurucu ortaklar ve paydaşlar:** Pamukkale Üniversitesi, Denizli Büyükşehir Belediyesi, DENİB, Denizli Ticaret Odası,
  Denizli Sanayi Odası, Denizli Ticaret Borsası.
- **Firma sayısı:** Mevcut sitede kayıtlı 121 firma var (Kasım 2026).
  Sektör dağılımı: Yazılım 52, Bilgisayar ve İletişim Teknolojileri 22, Elektronik 11, Makine ve Teçhizat 10, Sağlık 5, İnşaat 3,
  Enerji 2, Telekom 2, Gıda 2; diğerleri birer firma.
  Firma kayıtlarında ofisler blok ve oda koduyla geçer (ör. "B Blok G19", "C Blok 302-03").
- **Doluluk:** Yeni firma kabul başvuruları, bölge 7 Ağustos 2026'da %100 doluluğa ulaştığı için geçici olarak durduruldu.
- **Bağlı sistemler:**
  - ARGEPORTAL: https://argeportal.pauteknokent.com/
  - TEKNOÜSİP: https://teknousip.pauteknokent.org/
  - Pamukkale TTO
- **Doğrulanmamış rakamlar:** Yeni sitedeki "320 firma", "120 milyon $ ihracat", "2004 kuruluş", "2017 Avrupa ağı üyeliği" gibi
  rakamlar şablondan gelir ve doğrulanmamıştır. Kurum onayı olmadan kullanma.

## 2. Kurumsal kimlik (logo: Teknokent_1.pdf)

| Renk | Ekran (HEX) | Baskı (CMYK) | Kullanım |
| --- | --- | --- | --- |
| Lacivert | #2155AD | 100/71/0/0 | Ana renk. Üzerinde beyaz metin 7,1:1 kontrastla okunur. |
| Camgöbeği | #05A1E6 | 100/10/0/0 | Vurgu, ikon, çizgi ve geniş yüzeyler. Üzerine beyaz metin konmaz (kontrast 2,9:1). |
| Beyaz | — | — | Zemin |

- Açık zemin tonu için camgöbeğinin %8–12'lik tonunu (yaklaşık #E6F5FC) kullan.
- Logodaki pikselli kare motifi kimliğin ayırt edici grafik öğesidir; dekoratif öğelerde kullanılabilir.
- Logo SVG olarak kullanılmalı. İki onaylı sürüm var: beyaz zeminde renkli logo, lacivert zeminde beyaz (negatif) logo.
  Minimum genişlik 120 px; alt metin "Pamukkale Teknokent".
- Logonun yanındaki "İnovasyonun Merkezi, Geleceğin Adresi" sloganlı sürüm henüz kurumca onaylanmadı.
- Yazı tipi önerisi: başlıklarda Lexend, gövde metninde Source Sans 3. Bunlar Türkçe karakterleri destekler ve logonun geometrik
  karakterine uyar. Kurumsal bir yazı tipi tanımlıysa onun web karşılığı tercih edilir.

## 3. Web sitesi durumu (13 Kasım 2026 denetimi)

- **Yeni site taslağı:** https://pau.mbcmedya.net/tr (geliştirici: MBC Medya).
  - CMS: VisionPanel v4.0 / visionWeb (Next.js + Vercel + Firebase), panel adresi /tr/visionpanel.
  - Taslak bir tema çalışmasıdır; içerikler daha sonra girilecek.
  - Tema/teknik puanı 52/100, CMS puanı 36/100. Yayına hazır değil.
- **Mevcut site:** https://www.pauteknokent.com.tr (WordPress). İngilizce sürümü /en/ adresinde.
- **Denetim raporu:** https://claude.ai/artifact/6FNSdMJai7vUWBghTCRkQ7
  (P0–P3 iyileştirme listesi, rakip analizi ve kurumsal kimlik bölümü bu raporda).
- **Kariyer portalı ve yeni siteyle entegrasyon:**
  - Yeni sitenin menüsündeki "Kariyer Fırsatları" bağlantısı şu an `#careers` adresine gidiyor; portal hazır olunca buraya bağlanacak.
  - CMS'teki Firmalar modülünde 0 kayıt var; firma rehberi henüz ön yüze taşınmadı.
  - Portalın firma verisi için tek doğru kaynağın hangi sistem olacağı netleştirilmeli: CMS, ARGEPORTAL veya portalın kendi
    veritabanı.

## 4. Rakiplerden çıkarılan dersler

- Teknopark İstanbul: menüsü amaca göre kurulmuş (Tanıyın / İnceleyin / Başvurun) ve ayrı bir "Kariyer Fırsatları" sayfası var.
- İTÜ ARI: öğrenci ve akademisyenler için ayrı "avantaj" sayfaları var.
- Bilişim Vadisi: kendi Kariyer Portal ürünü var.
- Yıldız Teknopark: "Kariyer Başvuruları" bir başvuru alanı olarak tanımlı.
- Teknopark İzmir: teknik kalite referansı (tek H1, hreflang, hafif sayfalar, Lighthouse mobil 79/95).

## 5. Denetimden çıkan ve portalda tekrarlanmaması gereken hatalar

- Sessiz doğrulama hatası: her hata görünür ve Türkçe bir mesajla gösterilmeli; "isteğe bağlı" bir alan kaydı engellememeli.
- Arayüzde Türkçe ve İngilizce karışık kullanılmamalı; tarih seçici dahil her şey Türkçe olmalı.
- Kaydedilmemiş değişiklik uyarısı olmalı.
- İçerik bazında sürüm geçmişi olmalı.
- Rol ve onay akışı olmalı.
- Yetkisi olmayan kullanıcıya işlem düğmesi gösterilmemeli.
- Kullanıcının görmediği başka projelere ait veriler arayüzde görünmemeli (kiracı ayrımı); denetimde "PAUTEST" projesi
  firma formunda varsayılan seçili geliyordu.
- Raw.githack gibi üçüncü taraf CDN'lere ve stok medyaya bağımlı olunmamalı; dekoratif bir öğe yüklenemediğinde uygulama
  çökmemeli.
- Görsellerde alt metin zorunlu olmalı.
- Olmayan sayfalar gerçek HTTP 404 kodu döndürmeli; her sayfanın özgün başlığı ve meta açıklaması olmalı; sitemap ve hreflang
  bulunmalı.
- Mobil öncelikli tasarlanmalı. Hedefler: Lighthouse mobil performans ≥ 85, erişilebilirlik ≥ 95, LCP < 2,5 sn; WCAG 2.2 AA.
- KVKK uyumu: açık rıza ve aydınlatma metni, onay sürümünün kaydı, saklama süreleri, ilgili kişi talepleri.
  Özgeçmişler kişisel veri içerdiği için bu konu kariyer portalında kritik.
- Panel, yazılım bilgisi sınırlı kurumsal iletişim personeli tarafından kullanılacak; sade ve görev odaklı olmalı.

## 6. Kariyer portalı — kararlar ve açık sorular

**Arka plan:** Eski kariyer portalı atıl durumdaydı ve kaldırıldı. Yeni portalın tasarımı, tüm süreçleri ve yönetim paneli
Claude tarafından yapılacak.

- Depo: https://github.com/berkerdal/teknokariyer

**Talimatlar:**

- **Ana kaynak:** `docs/talimatlar.md`. Kurumun ham notlarından ve Claude'un eklemelerinden oluşturuldu. Her maddenin kaynağı
  işaretli: [K] kurumdan, [E] Claude ekledi, [?] kurumun kararını bekliyor.
- **Kurumun kendi ifadesi:** `docs/ham-notlar.md`. Kurumun ilettiği "AI kokan tasarım" listesi de bu dosyada.
- **Öncelik sırası:** Talimatlar bu dosyadaki genel önerilerden önce gelir. Ham notlar talimatlarla çelişirse kullanıcıya sor.
- **[?] işaretli konular:** Bu konularda kendi tahmininle karar verme. Açık soruların listesi talimatların 19. bölümünde.
  Koda geçmeden bu soruları kullanıcıya sor.

**En kritik beklentiler (özet):**

- Tasarım: jenerik/"AI kokan" tasarım kesinlikle istenmiyor (talimatlar 15. bölüm). Mobil sıfırdan düşünülmeli.
- Paneller: Aday, firma ve Yönetici A.Ş. panelleri ayrı amaçlara hizmet etmeli ve ayrı tasarlanmalı.
- Filtre ve eşleştirme: ürünün kalbi. Taksonomiye dayalı olmalı ve sonucun nedenini açıklamalı.
- KVKK: CV havuzu ayrı açık rızayla çalışır; firma, adayın iletişim bilgisini adayın onayıyla görür.

**Alınan kararlar:**

- (henüz yok; 19. bölümdeki sorular cevaplandıkça buraya tarihiyle eklenecek)

## 7. Teknoloji yığını — değerlendirme (karar değil)

Kullanıcının bir arkadaşının önerdiği yığın:

| Katman | Teknoloji |
| --- | --- |
| Dil | TypeScript |
| Ön yüz | Astro 7 |
| Stil | Tailwind CSS 4 |
| Animasyon | GSAP + Canvas 2D |
| Yönetim paneli | Payload CMS 3 (Next.js 16 + React 19) |
| Veritabanı | Cloudflare D1 |
| Dosyalar | Cloudflare R2 |
| Barındırma | Cloudflare Workers |
| CI/CD | GitHub Actions |
| Dil desteği | TR/EN |

Claude'un değerlendirmesi (13.11.2026):

- **Genel:** Modern ve düşük maliyetli bir yığın; profesyonel kalitede bir ürün çıkarılabilir.
- **Payload CMS:** Yönetim paneli için güçlü bir seçim. Rol bazlı erişim, taslak/sürüm, TR/EN yerelleştirme ve dosya yükleme hazır geliyor.
- **Astro + Next.js birlikte:** Kariyer portalı içerik sitesi değil, bir uygulama (giriş, başvuru, firma paneli). Astro ile Next.js'i birlikte kullanmak iki ayrı çatı demek. Öneri: tek Next.js uygulaması, Payload aynı uygulamanın içinde. Astro'da kalınacaksa gerekçesi netleşmeli.
- **KVKK ve veri yeri (açık kritik soru):**
  - D1 ve R2 verisi Türkiye dışında tutulur. CV'ler kişisel veri olduğu için yurt dışına aktarım şartları uygulanır: standart sözleşme ve Kurul'a bildirim ya da açık rıza.
  - Kamu bağlantılı kurum olarak Cumhurbaşkanlığı Bilgi ve İletişim Güvenliği Rehberi'nin kapsamı da kontrol edilmeli.
  - Kurumun KVKK sorumlusu ve hukuk birimi onaylamadan veri yeri seçilmemeli.
  - Alternatif: kişisel veriyi Türkiye'deki bir sunucuda tutmak (PostgreSQL ve S3 uyumlu depolama, Docker ile).
- **Eksik kalemler:**
  - E-posta gönderim servisi
  - Yönetici ve firma hesapları için iki aşamalı doğrulama
  - Bot ve kötüye kullanım koruması (Turnstile, istek sınırlama)
  - Yüklenen CV'lerde virüs taraması (Workers üzerinde doğrudan yapılamıyor, harici servis gerekir)
  - D1 Time Travel'a ek olarak düzenli yedek dışa aktarımı
  - Hata izleme
  - Otomatik testler (Vitest ve Playwright)
- **Animasyon (GSAP + Canvas):** Ölçülü kullanılmalı. Performans hedefleri (Lighthouse mobil ≥ 85) ve `prefers-reduced-motion` desteği şart.
- **Limitler:** Workers, D1 ve R2 limitleri ve fiyatları değişebilir; karar vermeden önce güncel değerleri resmi sayfalardan doğrula.
