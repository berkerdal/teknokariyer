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
- KVKK: CV havuzu ayrı açık rızayla çalışır. Rıza havuza katılırken alınır; firma profili açınca ad, iletişim ve CV görünür,
  adaya ayrıca sorulmaz (K24). Arama listesinde ad ve iletişim gizlidir.

**Alınan kararlar (13.11.2026):** Ayrıntısı `docs/talimatlar.md` 0. bölümde (K1–K13).

- **K1:** Eski portalda firmalar ilan girmekte zorlanıyordu ve ilanlarını tam yönetemiyordu.
  İlan yönetimi ürünün en özenli kısmı olacak; firma ilan üzerinde tam kontrole sahip olacak.
- **K2:** Geliştirme ve test Cloudflare'da (D1/R2) yapılacak. Kod sağlayıcıdan bağımsız yazılacak.
  Türkiye'de bir sunucuya geçiş kolay olmalı ve `docs/goc-rehberi.md` ile belgelenmeli.
- **K3:** ARGEPORTAL entegrasyonu yok. Yönetici A.Ş. iskelet firma kayıtları oluşturacak, firmalar devralıp profilini dolduracak.
  Bunun için sağlam bir kurulum iş akışı kurulacak: davet, sihirbaz, hatırlatmalar, takip hunisi.
- **K4:** Her firmanın ilk 3 ilanı Yönetici A.Ş. onayından geçer; sonra "güvenilir" firmalar doğrudan yayınlar.
- **K5:** CV havuzunda aday, profilini görüntüleyen firmaların adını değil yalnızca sayısını görür.
- **K6:** İndirilen CV'ye küçük bir filigran eklenir: firma adı ve tarih.
- **K7:** Herkese açık ilan sayfasında sayaç olacak. Biçimi prototipte gösterilip kurumla kesinleştirilecek.
  Sahte baskı ifadeleri kullanılmayacak.
- **K8:** İkinci renk kullanılabilir. TeknoKariyer için bir alt marka kimliği oluşturulacak ve ekran tasarımlarından önce onaya sunulacak.
- **K9:** Adaylara "sen", firmalara ve profesyonellere "siz" denir.
- **K10:** Alan adı kariyer.pauteknokent.com.tr, gönderen e-posta kariyer@pauteknokent.com.tr.
  DNS'i kimin yöneteceği sonra netleşecek.
- **K11:** Başlangıçta Yönetici A.Ş. kullanıcılarının hepsi tam yetkili. Rol sistemi hazır kurulacak; roller paneller somutlaşınca konuşulacak.
- **K12:** Fotoğraflar sonra gelecek; o zamana kadar stok fotoğraf kullanılmayacak. Tasarım fotoğrafsız da düzgün görünmeli.
- **K13:** Önce kurum içi test yapılacak (test ortamı, örnek veri, test senaryoları dokümanı). Ardından yayın ve birkaç firmayla pilot.

**Kullanıcının ek cevapları (13.11.2026, kimlik çalışması öncesi):**

- **K14 — Kurumsal kılavuz yok.** Elde yalnızca logo PDF'i var (`docs/logo-teknokent.pdf`, Illustrator çıktısı, tamamen vektör).
  Yazı tipi adı bilinmiyor. Alt marka kimliği logonun vektör çizimlerinden türetilir.
- **K15 — Logotype serbest.** "TeknoKariyer" yazımı için kısıt yok; estetik gerekçeyle esnek davranılabilir.
- **K16 — İkinci rengi Claude seçer.** Alternatiflerde gerekçesiyle önerilir, kurum seçer.
- **K17 — Prototip içeriği.** Gerçek firma adları, örnek (kurgusal) ilanlar ve uydurma aday adları kullanılabilir.
  Görece büyük firmalar seçilir; kullanıcının örnekleri: Netinternet, Kodpit, Rattel. Prototiplerde "örnek ilan" işareti bulunur.
- **K18 — Teknik seçimler Claude'a bırakıldı.** Kullanıcının teknik deneyimi yok.
  - E-posta servisi: en uygun seçeneği Claude belirler ve kurulumu adım adım anlatır.
  - Cloudflare: hesap yok. Demo kullanıcının açacağı hesapta çalışır. Hesap açma ve yetki verme adımları Claude tarafından
    tıklama düzeyinde anlatılmalı.
  - Payload: işe yaradığı ölçüde kullanılır; gerekirse yönetim tarafı tamamen özel yazılır.
- **K19 — Mesajlaşma Faz 2'de.** Veri modeli ve bildirim altyapısı, mesajlaşma sonradan eklendiğinde mevcut
  iletişim talebi / şablonlu e-posta akışlarıyla çakışmayacak şekilde kurulur.
- **K20 — Yeni sitenin firma rehberi.** Kullanıcı bilmiyor; ARGEPORTAL'a erişim yok (başka bir geliştiricinin sistemi).
  Firma verisinin tek doğru kaynağı portal olur. Yeni site gerekirse portalın sunacağı salt okunur bir firma beslemesini
  (JSON) kullanabilir.
- **K21 — Hedef tarih:** "En kısa zamanda". Sabit tarih yok.
- **K22 — Kimlik onaylandı: A · Küme (13.11.2026).**
  - Piksel kümesi tek başına kullanılmaz; kurumun ifadesiyle "tek başına çok bir şey ifade etmiyor". Yalnızca logonun parçasıdır.
  - Favicon: ana logodaki "t" harfi ve kiremit kare. Uygulama ikonu: "tekno / KARİYER" yığını.
  - Ayrıntı: `docs/kimlik/README.md`.

**Prototip sonrası kararlar (13.11.2026; `docs/talimatlar.md` 0. bölümde K23–K26):**

- **K23 — Sayaç:** İlan sayfasında başvuru sayısı aralıkla gösterilir ("10–50 başvuru"); görüntülenme herkese açık sayfada yok.
- **K24 — CV havuzu:** Aday havuza katılırken açık rıza verir; rıza metni, firmaların ad, iletişim ve CV'yi ayrıca izin
  istemeden görebileceğini açıkça yazar. Arama listesi anonimdir (ad ve iletişim gizli). Firma profili açınca her şey görünür.
  Her açılış kayda geçer; aday yalnızca sayıyı görür (K5). İletişim talebi akışı kaldırıldı.
- **K25 — Cinsiyet:** İsteğe bağlı profil alanı ("belirtmek istemiyorum" seçeneğiyle). Havuzda görünür ama arama, filtre,
  sıralama ve eşleştirmede kullanılmaz.
- **K26 — Onay:** Prototip (29 ekran), favicon ve teknoloji önerisi onaylandı. Geliştirmeye geçildi.
- **K27 — Hesap silme (14.11.2026):** Aday hesabını silince başvuruları firmada “aday hesabını sildi” olarak kalır;
  ad, iletişim bilgisi ve CV hemen silinir. Hukuk birimine de danışılması önerildi.

**Kullanıcının ilk test geri bildirimi (14.11.2026; talimatlar K28–K30):**

- **K28 — Profil:** Okunur özet + bölüm bazında “Düzenle” → açılır pencere (mobilde tam boy alt panel). Kaydedince kapanır,
  özet güncel bilgiyle görünür. Yeni aday için LinkedIn usulü profil sihirbazı.
  Bildirilen hata: kaydettikten sonra alanlar varsayılana veya başka değere dönüyordu (React form sıfırlaması).
- **K29 — Metin dili:** Tam cümle, yüklemli, devriksiz profesyonel Türkçe. Kılavuz: `docs/tasarim/metin-kilavuzu.md`.
- **K30 — Panellerde açıklama:** Yönetici A.Ş. ve firma panellerinde her modül ve alan için bilgi kutusu. Kullanıcının
  ifadesi: “Kullanım kabus olursa kendilerini kaybederler, kullanmak istemezler.”

**İlerleme (13.11.2026):**

- **Adım 2, alt marka kimliği: tamamlandı.** A · Küme onaylandı (K22).
  - Kılavuz: https://claude.ai/artifact/Nqt3PPkQZxjTZemDeYtjxR
  - Ayrıntı: `docs/kimlik/README.md`
  - Claude B'yi önermişti; kurum A'yı seçti.
- **Adım 3: Referans panosu, tasarım sistemi ve prototip: onaylandı (K26).**
  - Prototip: https://claude.ai/artifact/67TJq45XmkYsvCAfpoitva
  - Ayrıntı ve kurumun kararını bekleyen konular: `docs/tasarim/README.md`
  - Taslak 1'e denetimde eksik kalan 10 ekran eklendi (toplam 29 ekran): giriş/kayıt, profili eksik başvuru, kapanmış ilan,
    hesap ve gizlilik, ilan düzenleme ve sürüm geçmişi, firma ekibi, KVKK talepleri, işlem kayıtları, test posta kutusu.
- **Adım 4: Teknoloji yığını onaylandı (K26), geliştirme başladı.** Yığın: `docs/teknoloji-onerisi.md`.
  - **M1 iskelet:** Next.js 16.4.6 + Payload 3.93 + OpenNext. Uygulama depo kökünde (`src/`).
    `SAGLAYICI=cloudflare` (varsayılan, D1 + R2) veya `SAGLAYICI=node` (PostgreSQL + S3/MinIO).
    Worker paketi yaklaşık 15 MiB (gzip 3,5 MiB).
  - **M2 iş kuralları:** `src/alan/` altında saf TypeScript. Birim testleri `tests/birim/`.
  - **M3 veri modeli:** 12 koleksiyon + ayarlar. Erişim kuralları `src/erisim/` altında.
    Kötüye kullanım denemeli entegrasyon testleri `tests/entegrasyon/` altında.
  - **M4a kural servisleri:** `src/servisler/` (ilan işlemleri ve moderasyon, başvuru, CV havuzu). Arayüz yalnızca bu
    servisleri çağırır; kural mantığı arayüzde tekrarlanmaz. Hatalar `IslemHatasi` ile Türkçe ve durum koduyla döner.
    Uçtan uca senaryolar `tests/entegrasyon/servisler.test.ts` içinde (K4 onay, 60 gün sınırı, kiracı ayrımı, profil kopyası,
    rıza kaydı, cinsiyetle arama reddi, profil açılış kaydı ve K5 sayısı, süresi dolan ilanın kapanması).
  - **Gün sınırları Türkiye saatine göre** hesaplanır (`src/alan/tarih.ts`, UTC+3). Sunucu UTC'de çalışır.
  - **M4b-1 herkese açık sayfalar:** Ana sayfa, ilan listesi (yüzlü filtre, masaüstünde önizleme, mobilde alt panel),
    ilan sayfası (JobPosting verisi, kapanmış ilan görünümü), firma sayfası, firmalar, 404.
    - Stil: prototipin `tokenlar.css`, `bilesenler.css`, `ekranlar.css` dosyaları `src/stil/` altına aynen alındı,
      Tailwind 4 temasına aynı adlarla bağlandı. Uygulamaya özgü uyarlamalar `src/stil/uygulama.css` içinde.
    - Filtre mantığı saf fonksiyon: `src/alan/ilanFiltre.ts` (birim testli). Filtreler adreste tutulur.
    - Örnek veri: `pnpm ornek-veri` (prototip verisinden; firmalar “test firması” işaretli, yayında görünmez).
      Giriş yapılabilen örnek aday hesabı yalnızca `ORNEK_SIFRE` verilirse açılır.
    - Yayın dışı ortamlarda her sayfanın üstünde “TEST ORTAMI” şeridi var (K17 örnek işareti).
  - **M4b-2 aday tarafı:** Kayıt (e-posta doğrulamalı), giriş, şifre sıfırlama, başvuru akışı (yalnızca ilanın gerektirdiği
    eksikler sorulur, CV zorunlu ve yalnızca geçerli PDF), başarı sayfası ve “başvurun alındı” e-postası, aday paneli
    (başvurularım, profil ve CV’ler, CV havuzu ayarları, hesap ve gizlilik, veri indirme). Tarayıcıda uçtan uca denendi.
    - KVKK metinleri `src/metinler/` altında, sürümlü ve **taslak** (`onayli: false`); hukuk birimi onayı bekliyor.
    - Hesap silme şimdilik kvkk@ adresine e-postayla; K27'ye göre panelden silme yazılacak.
    - Kaydedilen ilanlar ve kayıtlı aramalar henüz yok (veri modelinde koleksiyon yok).
  - **Geri bildirim turu 1 (14.11.2026, K28–K29):** Profil okunur özet + düzenleme penceresi (`DuzenlemePenceresi`),
    profil sihirbazı (`/hesabim/profil/sihirbaz`), yeni bölümler (iş deneyimi, sertifikalar, bağlantılar), metin kılavuzu
    ve aday tarafı metinlerinin gözden geçirilmesi (eşleşme gerekçeleri dahil tam cümle).
    - Profil form kuralları `src/alan/profilFormu.ts`: yalnızca formdaki bölümler (`profilBolumu` gizli alanları) güncellenir.
    - Öğrenilen: gizli alan adı `bolum`, okulun “bölüm” seçimiyle çakışıp bölümü kaydettirmiyordu. Form alan adları çakışmamalı.
    - Öğrenilen: React form eylemi sonrası formu sıfırlar; açılır pencerede form kayıttan sonra `key` ile yeniden kurulur.
  - **Kurumsal alt bilgi ve e-posta tasarımı (14.11.2026, kullanıcı isteği):**
    - Alt bilgi (`src/arayuz/Alt.tsx`): gece zemini, solda Teknokent (negatif) ve Pamukkale TTO (beyaz) logoları ile
      iletişim, sağda dört sütunlu site haritası (Adaylar, Firmalar, Pamukkale Teknokent, Kişisel veriler), altta telif şeridi.
      Başvuru akışında yalnızca sade şerit (`<Alt sade />`). Firma ve Yönetici A.Ş. panelleri de aynı bileşeni kullanacak.
    - Kurum bilgileri tek yerde: `src/altyapi/kurum.ts` (alt bilgi, e-posta, KVKK metinleri buradan okur).
    - Kurum logoları kaynak PDF'lerden üretildi: `docs/kimlik/kaynak/`, `tools/kimlik/kurum_logolari.py` + `kirp.cjs`
      → `public/logo/kurum/`. Kullanıcının gönderdiği sloganlı negatif logo (webp) onaysız olduğu için kullanılmadı.
    - E-posta şablonu: tablo tabanlı; lacivert üst bant (TeknoKariyer negatif), beyaz kart ve başlık, gece zeminli
      kurumsal alt bilgi; hitaba göre (sen/siz) alt bilgi metni ve bağlantılar; gizli ön izleme metni.
      E-posta istemcileri SVG göstermediği için logolar PNG (`public/eposta/`, `tools/kimlik/eposta_png.cjs`).
    - TTO'nun web adresi bilinmediği için TTO logosu bağlantısız. Adres öğrenilince eklenecek.
  - **Firma paneli F1–F2 (14.11.2026):** `/firma-paneli` (yan menü masaüstünde, alt menü mobilde, kurumsal alt bilgi).
    - Özet, ilan listesi (durum sekmeleri, mobilde kart/masaüstünde tablo), işlem penceresi (yalnızca o durumda yapılabilen
      işlemler: yayına gönder, duraklat, yeniden başlat, süre uzat, kapat, kopyala/yeniden yayınla, taslağı sil).
    - İlan formu (`src/arayuz/firma/IlanFormu.tsx`, ayrıştırıcı `src/alan/ilanFormu.ts`, servis `src/servisler/ilanFormu.ts`):
      taslak yalnızca pozisyon adıyla kaydedilir; tamlık yayına gönderirken `ilanEksikleri` ile alan alan denetlenir.
      Önizleme sayfası eksikleri listeler, tamamsa yayına/onaya gönderir. Sürüm geçmişi sayfası değişen alanları gösterir.
    - Yayındaki ilanda esaslı alanlar (ad, tür, çalışma şekli, ücret) güvenilir olmayan firmada `bekleyenDegisiklik`
      alanında onay bekler; `bekleyenDegisikligiSonuclandir` (Yönetici A.Ş.) onaylar veya gerekçeyle reddeder.
      Onay arayüzü Yönetici A.Ş. panelinde yazılacak.
    - K30 bilgi kutuları: `ModulBilgisi` (sayfa başı, gizlenebilir) ve `AlanBilgisi` (“?” düğmesi). Türkçe takvim: `TarihSecici`.
    - Örnek veri `ORNEK_SIFRE` ile kurgusal firma kullanıcısı açar (`kodpit@kariyer.test`, Kodpit firma yöneticisi).
  - **Kullanıcı geri bildirimi 2 (14.11.2026):**
    - İlan sayfasında tür, çalışma modeli ve deneyim etiket yerine özet tablosunda adlarıyla (“İlan türü: Tam zamanlı iş”).
    - Yazdıkça öneri: `OneriliGirdi` (erişilebilir combobox; sıralama `src/alan/oneri.ts`). Tarayıcı `datalist` kullanılmaz.
    - Taksonomi talepleri (`talepler` koleksiyonu, `TalepPenceresi`): her liste türüne özel küçük form; talep eden ve firması
      otomatik bağlanır. Yönetici A.Ş. “onaylandı/kısmen” dediğinde kabul edilen öğeler koleksiyon kancasıyla listeye eklenir
      (Payload ekranından da çalışır). Onay ekranı Yönetici A.Ş. panelinde tek yerde toplanacak.
      Öğrenilen: pencere öneri panelinin içinde oluşturulursa panel kapanınca kaybolur; pencere dışarıda, açma isteği içeride.
    - LinkedIn paylaşımı: ilan işlemlerinde adım adım (metni kopyala → LinkedIn paylaşım penceresi → yapıştır). Bağlantıdaki
      `?kaynak=linkedin` başvuruya kadar taşınır ve başvurunun kaynağı olarak kaydedilir.
    - Kullanıcıya “Görevi” (`unvan`) alanı; firma panelinde adın altında görünür. Örnek firma kullanıcısı İK uzmanı.
    - Şema push kapalı (`push: false`): geliştirmede de şema yalnızca göçle değişir. Entegrasyon testleri geçici veritabanını
      göçlerle kurar (`tests/entegrasyon/hazirlik.ts`); her çalıştırmada göçler baştan denenir.
  - **Firma paneli F3 (14.11.2026):** Başvurular (`/firma-paneli/basvurular`: ilan, durum ve “zorunluların hepsi” süzgeci;
    ayrıntıda eşleşme, ön eleme cevapları, başvuru anındaki profil, durum, puan, ekip notu) ve CV havuzu
    (`/firma-paneli/havuz`: anonim liste, beceri araması, profil açma kaydı). Servisler `src/servisler/degerlendirme.ts`
    ve `havuz.ts`. Başvuru ilk açılınca “İnceleniyor” olur; görüşme/teklif/olumlu/olumsuz adaya e-posta gönderir.
    - **CV filigranı (K6):** `src/altyapi/filigran.ts` (pdf-lib + fontkit, Source Sans 3 alt kümesi gömülü:
      `tools/yazi/filigran_yazitipi.py`). Her sayfanın altına firma adı ve tarih; her indirme işlem kaydına geçer.
      Dosya içeriği sağlayıcıdan bağımsız okunur: `src/altyapi/depolama.ts` (R2 veya S3 okuyucusu yapılandırmada kaydedilir).
    - Örnek veriye kurgusal adaylar (`src/ornekVeri/adaylar.ts`): profil, PDF CV, Kodpit ilanlarına başvuru, havuz.
      Gerçek servislerle yüklenir; yarıda kalırsa kaldığı yerden tamamlanır. Hesaplar giriş yapılamaz.
    - Örnek veriyi yönetici oturumuyla yüklemek için test sayfası: `/yonetim-islem-ornek` (yalnızca yayın dışı ortam).
      Canlıya gizli anahtar yazarak yükleme denemesi izin sisteminde reddedildi; yükleme kullanıcının oturumuyla yapılır.
  - **Firma paneli F4 (14.11.2026):** Firma profili (`/firma-paneli/profil`: tanıtım, sektör, teknolojiler, çalışma modeli,
    yan haklar, logo; yayına hazır olma durumu) ve ekip (`/firma-paneli/ekip`: üyeler, yetki değişikliği, ekipten çıkarma,
    davet, kişinin kendi adı ve görevi). Servisler `src/servisler/ekip.ts`, `firmaProfili.ts`.
    - Davet: tek kullanımlık, 14 gün; anahtarın yalnızca SHA-256 özeti saklanır. Kabul sayfası `/davet?anahtar=`.
      İlk davet firmanın kurulum aşamasını “davet”, kabul “devralındı” yapar (K3 hunisi). Yönetici A.Ş. de aynı servisle davet eder.
    - Ekipten çıkarma silme değil, `pasif` işaretidir: giriş açıklamalı mesajla reddedilir, açık oturum `/cikis?pasif=1`
      ile kapatılır. Firmanın son tam yetkilisi çıkarılamaz veya yetkisi düşürülemez.
    - Logo yalnızca PNG/JPEG/WebP (ilk baytlardan denetlenir); SVG betik taşıyabileceği için reddedilir.
    - Öğrenilen: `'use client'` dosyasından dışa aktarılan sabitler sunucu bileşeninde veri olarak kullanılamaz (istemci
      referansına dönüşür). Ortak sabitler saf modülde durur (`src/alan/ekip.ts`).
    - Öğrenilen: işlem sonrası satırı başka listeye taşınan bileşenin bildirimi kaybolur; sonuç sayfa düzeyinde
      (`?sonuc=`) gösterilir.
  - **Yönetici A.Ş. paneli Y1 (14.11.2026):** `/yonetim` (Payload'un `/admin` paneli “Gelişmiş yönetim ekranı” olarak
    duruyor). Kurum rolleri girişte buraya gelir (`rolAnaSayfasi`). Koyu yan menü masaüstünde, sekmeler mobilde.
    - **Bugün:** iş listesi (ilan onayı, ilan değişiklikleri, liste talepleri, başvurusuz bitmek üzere). Henüz modeli
      olmayan kuyruklar (KVKK, şikâyet, firma hesap talebi) sahte veriyle gösterilmez.
    - **İlan onayı:** adayın göreceği gövde (`IlanGovdesi`, firma önizlemesiyle ortak), otomatik tarama
      (`src/alan/moderasyon.ts` → `ilanTara`), kontrol listesi (`KONTROL_LISTESI`, onay için hepsi işaretli olmalı; sunucuda
      da denetlenir), hazır gerekçeyle düzeltme isteği, güvenilir firma işareti (yalnızca rol `yonetici`). Hedef 1 iş günü;
      hafta sonu sayılmaz (`isSaati`). Gönderim anı olarak ilanın son güncellemesi kullanılır.
    - **İlan değişiklikleri** (şu an / istenen tablosu) ve **liste talepleri** (öğe öğe kabul) tek sayfada.
    - Kararlar `src/servisler/moderasyon.ts` üzerinden: işlem kaydı + e-posta. Firma bildirimleri yalnızca firmanın etkin
      `yonetici` ve `ilan-sorumlusu` kullanıcılarına gider (`src/servisler/bildirim.ts`). E-posta gitmezse karar geçerli
      kalır, sayfada uyarı çıkar. Başvurusuz ilan hatırlatması ilan başına bir kez.
    - Raporlayıcı rolü paneli görür ama karar düğmelerini görmez.
  - **Sırada:** Yönetici A.Ş. paneli Y2 (firmalar, iskelet kayıt, davet, kurulum hunisi), ardından kullanıcılar.
    Ayrıca: iki aşamalı doğrulama (firma ve kurum hesaplarında zorunlu), Turnstile ve istek sınırlama, virüs taraması.
  - **İlk göç oluşturuldu (14.11.2026):** `src/migrations/20261114_022255_ilk_sema`. Worker ilk istekte uygular (prodMigrations).
    Bundan sonra şema değişikliği yeni bir göçle yapılır (`pnpm payload migrate:create ad`).
  - **Taksonomi:** Test ortamında temel üniversite/bölüm/dil listesi örnek veriyle geliyor. Yayından önce YÖK üniversite ve
    bölüm listesinin içe aktarılması gerekiyor (aksi hâlde aday okulunu bulamaz).
  - **Test ortamı yayında (14.11.2026):** https://teknokariyer-test.teknokariyer.workers.dev
    - Dağıtım Cloudflare **Workers Builds** ile: `claude/funny-cerf-r7h64q` dalına her gönderim derleyip yayınlar.
      Derleme `pnpm exec opennextjs-cloudflare build`, dağıtım `pnpm exec opennextjs-cloudflare deploy`; ön izleme kapalı.
    - `PAYLOAD_SECRET` Worker gizli değişkeni (API ile yazıldı; değeri hiçbir yerde yok).
    - İlk göç D1 API'si üzerinden elle uygulandı (Worker içinde yarım kalmıştı, aşağıda).
    - Test yöneticisi `yonetici@kariyer.test` (şifre kullanıcıya iletildi; depoda yok). `.test` alan adı bilinçli:
      gerçek bir kişiye ait olamaz.
    - Örnek veri `POST /yonetim-islem/ornek-veri` ile yüklendi (yalnızca yönetici, yayında kapalı). curl ile çağrılırken
      `Origin` başlığı gerekir (serverURL ayarlı olduğu için Payload çerezli istekte kaynak adresini denetler).
    - Aday akışı canlıda tarayıcıyla uçtan uca doğrulandı (14.11.2026). Deneme hesapları, başvuru, CV ve test e-postaları
      sonra silindi; veritabanında yalnızca yönetici ve örnek veri var.
    - Kayıtlar (observability) açık; hatalar Cloudflare telemetri API'siyle okunabiliyor.
    - Yönetim paneli şimdilik Payload'un hazır arayüzü; Yönetici A.Ş. paneli prototipe göre ayrıca yazılacak.

**Öğrenilenler:**

- **Mevcut sitedeki firma rehberi:** https://www.pauteknokent.com.tr/teknoloji-firmalari
  - 13 sayfa, sayfa başına 10 firma. Sayfa adresi: `?e-page-a2c4f28=N` (sondaki `/` 301 yönlendirmesi verir).
  - 121 kayıt doğrulandı. Kayıt alanları: unvan, sektör, e-posta, web, adres, blok/oda.
- **Rehberdeki e-postalar:** Birçoğu kişisel (gmail, pau.edu.tr). Bu yüzden davet için "yetkili kişisel iş e-postası" adımı (0.3)
  gerçekten gerekli. E-postalar depoya yazılmaz.
- **Bazı unvanlar kişi adıdır** (şahıs firmaları). İçe aktarma verisi depoya konmadan önce bu açıdan değerlendirilmeli.
- **Firma adları:** Kullanıcının "Rattel" dediği firmanın rehberdeki unvanı "Ratel Bilişim Hizmetleri Ltd. Şti." (D Blok 102–103).
  Netinternet'in iki kaydı var (D Blok B01/1 ve B01/2). Kodpit D Blok 208.
- **Ana logo:** "tekno" tek kasa çizilmiş ("k" üst uzantısız). Piksel kümesi düzensiz boyutlu dikdörtgenlerden oluşuyor ve
  "t"nin sol üstünden dağılıyor.
- **Yazı tipi kontrolleri:**
  - Lexend'de eşit genişlikli rakam yok; tablolarda kullanılmamalı.
  - Atkinson Hyperlegible Next ve Hanken Grotesk'te ₺ glifi yok.
- **Prototipten öğrenilenler:**
  - `.tk a` gibi genel bağlantı kuralları düğme biçimli bağlantıların rengini ezer. Temel kurallar `:where()` ile sıfır özgüllükte yazılmalı.
  - Tablolardaki ve kuyruklardaki sayılar elle yazılmamalı, veriden hesaplanmalı; elle yazılan sayılar prototipte hemen tutarsızlaştı.
  - Farklı büyüklükteki iki ölçü aynı çubukta gösterilmez (pano, yetenek ihtiyacı). Gerekirse tablo kullanılır.
  - Firma logosu gelene kadar firmalar blok/oda kodlu karoyla gösterilir (ör. "D208"). Baş harf avatarı kullanılmaz.
- **Geliştirmeden öğrenilenler:**
  - **Payload kancaları:** Kısmi güncellemede `data` yalnızca değişen alanları taşıyabilir.
    Hesaplanan alanlar `{ ...originalDoc, ...data }` üzerinden hesaplanmalı.
  - **Kullanıcısız yerel API çağrısı** (`req.payloadAPI === 'local'`) sunucunun kendi güvenilir kodudur.
    Rol zorlama gibi kurallar ona uygulanmaz (`sistemIslemiMi`). Uygulanırsa davet akışı firma hesabı açamaz;
    entegrasyon testleri bunu yakaladı.
  - **Derleme ve Cloudflare hesabı:** OpenNext'in `getCloudflareContext` fonksiyonu derleme sırasında "remote" işaretli D1
    bağlantısı için Cloudflare'e bağlanmaya çalışır. Bu yüzden yalnızca Workers içinde
    (`navigator.userAgent === 'Cloudflare-Workers'`) kullanılır; derleme yerel Wrangler simülasyonuyla yapılır.
    Uzak bağlantı yalnızca `CLOUDFLARE_UZAK=1` ile açılır.
  - **Next.js 16:** Geliştirme Turbopack ile çalışır. `@payload-config` takma adı hem webpack (mutlak yol) hem Turbopack
    (göreli yol) için tanımlı. `next dev`, depoya `AGENTS.md` yazar; Next 16 belgeleri `node_modules/next/dist/docs/` altında.
  - **ESLint:** eslint-config-next 16 düz (flat) yapılandırma ister; FlatCompat ile çalışmaz.
  - **Ağ:** codeload.github.com ve api.github.com kapalı; raw.githubusercontent.com açık. Payload şablon dosyaları oradan alındı.
  - **Vekil sunucu ve Cloudflare:** Ortamın vekil sunucusu `api.cloudflare.com` isteklerindeki `Authorization` başlığını
    her zaman kayıtlı API anahtarıyla değiştiriyor (yanlış anahtarla deneyip doğrulandı). Statik dosya yüklemesi ise
    yüklemeye özel kısa ömürlü bir anahtar istediği için 401 alıyor. API çağrıları (D1, R2, gizli değişken, ayar) çalışır;
    tam dağıtım Workers Builds ile yapılır.
  - **Göçü Worker'a bırakma:** `prodMigrations` ilk istekte çalışır. Aynı anda birden çok istek gelince göç yarıda
    kaldı (49/56 tablo, göç kaydı yok) ve her istek 500 verdi. Yeni ortamda veya şema değişikliğinde göç, trafik açılmadan
    önce D1 API'si üzerinden sırayla uygulanmalı ve `payload_migrations` kaydı yazılmalı. Bunun için bir betik yazılacak.
  - **Şifre özeti:** Workers PBKDF2'de en fazla 100.000 tekrar kabul eder; Payload varsayılanı 600.000.
    `auth.passwordHashIterations: 100000`. Özet önekli (`pbkdf2-sha256-100k-v1:`), ileride artırılabilir.
  - **Parantezli rota grupları ve statik dosyalar:** JS parçaları `/_next/static/chunks/app/(frontend)/…` altında.
    Tarayıcı parantezi `%28` olarak ister, Cloudflare statik sunucusu bulamaz, Next aynı adrese 307 verir: sonsuz döngü,
    sayfa etkileşimsiz. Kökteki `worker.ts` sarmalayıcısı kodlanmış adresi çözüp dosyayı doğrudan `ASSETS`'ten verir.
    curl ile denenince görünmez (curl kodlamaz, önbellek kullanmaz); tarayıcıyla denenmeli.
    Köşeli parantezli dinamik rota adları (`[adres]`) sarmalayıcıyla da çözülemedi. **Kalıcı çözüm:** `next.config.ts`
    webpack ayarı, adı `( ) [ ]` içeren istemci parçalarına yalnızca içerik özetinden ad verir (`static/chunks/r/…`).
    Sarmalayıcı ve `run_worker_first` zararsız yedek olarak duruyor (`html_handling`/`not_found_handling: "none"` OpenNext
    şartı; depodan gelen 304 de iletilir).
  - **Derlemede veritabanı yok:** `next build` sayfa bilgisini 3 işlemle paralel toplar; her biri yerel D1 simülasyonunu
    açınca "database is locked" ile derleme rastgele düşüyordu (Cloudflare'deki aralıklı "Failed" derlemelerin sebebi).
    `NEXT_PHASE === 'phase-production-build'` iken bağlantılar boş bırakılır.
  - **Derleme:** Ön yüz `force-dynamic`; derleme veritabanına bağlanmaz ve `.env` olmadan çalışır. Oturum okuyan kod önce
    `headers()` çağırır. Aksi hâlde derleme, sayfaları önceden üretirken Payload'un göç sorusunda takılıyordu.
- **D1 göçlerinden öğrenilenler (14.11.2026, yerelde denenerek):**
  - D1'de yabancı anahtar denetimi kapatılamaz. `PRAGMA foreign_keys=OFF` etkisizdir. `defer_foreign_keys` zincirleme
    silmeyi durdurmaz. `legacy_alter_table` ne tek tek ne toplu işlemde uygulanır.
  - Bu yüzden Drizzle'ın tablo yeniden kurma göçü (`DROP TABLE` + `RENAME`) bağlı satırları siler; bağlantı NOT NULL ise
    silmeyi tamamen reddeder (başvurunun ilanı). Çözüm: `src/altyapi/gocYardimcisi.ts` → `bagliSatirlariKoru` (yedekle,
    NOT NULL bağlı satırları geçici kaldır, kur, geri yükle, sayıları karşılaştır; tutmazsa yedekleri silmeden dur).
  - Drizzle'ın kopyalama komutu (`INSERT … SELECT`) yeni sütunu eski tablodan çift tırnakla seçebilir. SQLite bulamadığı
    tırnaklı adı metin sabiti sayar ve her satıra sütun adını yazar. Üretilen her göçte yeni sütunlar için `NULL` seçildiği
    denetlenmeli. (Bu hata canlıda olmuştu, temizlendi.)
  - Göçler `scripts/goc-uygula.ts` ile D1 API üzerinden sırayla uygulanır (önce kuru çalıştırma, sonra `--uygula`); eski
    kodla uyumlu göç önce, kod sonra gönderilir. Node `fetch` vekil için `NODE_USE_ENV_PROXY=1` ve
    `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` ister. Uygulamadan önce Time Travel yer imi alınır.
  - Yerel veritabanı “dev” (push) modunda kurulduysa `payload migrate` onay sorusunda bekler; `payload_migrations`
    kaydı düzeltilip `< /dev/null` ile çalıştırılır.
- **Dialog içinde tablo:** Tablo hücresindeki `<dialog>` tablonun hizalama ve hücre stillerini devralır (sağa hizalı metin,
  takvim hücre kenarlıkları). `.islem-pencere` içinde sıfırlandı. Kapalı `dialog.alt-panel` için `display: none` gerekli.
- **Arayüz geliştirmesinden öğrenilenler:**
  - Prototipteki `.tk button { color: inherit }` kuralı `.dugme` metin rengini eziyordu (prototipte de “Ara” düğmesi koyu
    metinliydi). Temel kurallar artık `:where(.tk)` ile sıfır özgüllükte.
  - Prototip cihaz çerçevesi için kap sorgusu (`@container ekran`) kullanıyordu. Uygulamada `body` üzerinde kap tanımı
    sabit konumlu katmanları (alt panel) bozabileceği için hepsi medya sorgusuna çevrildi (900 px).
  - İki kök düzen (site ve Payload paneli) olduğu için eşleşmeyen adresler `app/global-not-found.tsx` ile gerçek 404 döner
    (`experimental.globalNotFound`).
  - App Router'da sayfadan HTTP 410 döndürmenin yolu yok. Kapanmış ilan 200 + `noindex` ile gösteriliyor (prototip 410 diyordu).
    Gerekirse ileride bir rota işleyicisiyle çözülür.
  - Workers UTC'de çalışır. Takvim günü hesapları (`gunFarki`, `kalanGun`, `suresiDolduMu`) Türkiye saatine bağlandı;
    birim testleri `TZ=Europe/Istanbul` ile koşar, ayrıca UTC anlarıyla ayrı test var.
  - **Düzen ve sayfa paralel çalışır.** Düzendeki `redirect` sayfa kodunun çalışmasını engellemez; korumalı her sayfa
    oturumu kendisi denetler (`adayOturumu()`). Aksi hâlde oturumsuz istekte sayfa `null` kullanıcıyla çalışıp çöküyordu.
  - Sunucu eylemi sonrası sayfa sunucuda yeniden çizilir; başarı ekranı istemci durumunda tutulursa kaybolur. Başarı
    ekranları ayrı adrese yönlendirilir (`/basvuru-tamam`).
  - Ziyaretçi erişim kuralıyla okunan ilişkilerde, yayına hazır olmayan firmanın bilgisi düşer. Firma adı/konumu için
    `firmalariAl()` (yalnızca herkese açık alanlar) kullanılır.
  - Payload, yüklenen PDF'in başında `%PDF-`, son 1 KB'ında `xref` ve `%%EOF` arar; servis aynı denetimi Türkçe hatayla
    önce yapar. Tarayıcının dosya seçicisi kendi dilinde yazdığı için Türkçe `DosyaSecici` kullanılır.
  - Yazı tipleri depoda, alt kümeye indirilmiş WOFF2 (Türkçe ve ₺ dahil, 4 dosya toplam 55 KB). Dış yazı tipi CDN'i yok.
- **Kontrast:** Camgöbeği beyaz üzerinde 2,9:1 verir; arayüz çizgisi ve odak halkası için de yetmez (3:1 altı).
  Odak halkası lacivert olacak.

## 7. Teknoloji yığını

**Karar (K26):** `docs/teknoloji-onerisi.md` onaylandı. Aşağıdaki ilk değerlendirme kayıt için duruyor.

### İlk değerlendirme

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

**Doğrulanan bilgiler (13.11.2026, ayrıntı `docs/teknoloji-onerisi.md`):**

- **Sürümler (npm):** next 16.4.6, payload 3.93.0, @opennextjs/cloudflare 1.20.17, tailwindcss 4.3.5, react 19.3.1.
  Payload 4 beta. Next 16.4.6 hem Payload'ın hem OpenNext'in sürüm aralığına uyuyor.
- **Cloudflare (resmî belge deposu):**
  - Workers ücretli plan aylık 5 USD; Worker boyutu 64 MiB; CPU 30 sn varsayılan, 5 dk'ya kadar.
  - D1 veritabanı başına 10 GB; zaman yolculuğu 30 gün.
  - R2'de 10 GB ücretsiz; veri çıkışı ücretsiz.
  - D1 ve R2'de "eu" yetki alanı var; Türkiye seçeneği yok.
- **Erişim notu:** Bu çalışma ortamının ağ politikası developers.cloudflare.com'u engelliyor. Belgeler
  raw.githubusercontent.com/cloudflare/cloudflare-docs üzerinden okunabiliyor. Dağıtım için Cloudflare API erişimi gerekecek.
- **Virüs tarama:** ClamAV Worker'da çalışmaz. Cloudflare Containers (genel kullanımda) veya harici bir servis gerekir.
- **E-posta:** Resend'in belgesine göre AB bölgesi yalnızca gönderimi etkiliyor, hesap verisi ABD'de kalıyor.
  Servis seçimi KVKK kararından sonra yapılacak.
