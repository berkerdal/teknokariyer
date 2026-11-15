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

- **K31 — Yönetici özeti ve raporlama (14.11.2026):** Yönetici A.Ş. paneline grafikli, canlı güncellenen “Yönetici özeti”
  (bütün ilanlar ve başvuru sayıları dahil) ve rapor merkezi (Excel + PDF). Tasarım: `docs/raporlama.md`.
  Power BI yalnızca görünüm örneğiydi (dış besleme yok); aylık otomatik rapor e-postası yok; firma panelinde firma raporu var;
  kurum şablonu yok, önerilen gösterge seti kullanılır. Raporlar kişisel veri içermez; 5'ten küçük gruplar gizlenir.

- **K32 — KVKK araçları (15.11.2026):** Önerilen uygulama kabul edildi: hesap silmede ön yazı ve bağlantılar da silinir,
  eğitim/beceri/cevaplar saklama süresine kadar firmada kalır; KVKK başvuruları ve işlem kayıtları yalnızca tam yetkiliye
  açık. Hukuk birimi görüşü yine alınacak.

- **K33 — İki aşamalı doğrulama (15.11.2026):** Doğrulayıcı uygulama zorunlu değil; “Önerilen” olarak Hesap güvenliği
  sayfasında. Firma ve kurum hesaplarında tanınmayan cihazdan girişte e-posta kodu zorunlu; cihaz 90 gün hatırlanır.
  Kullanıcının gerekçesi: zorunlu harici uygulama insanları yıldırır.

- **K35 — İngilizce (15.11.2026):** İngilizce sürüm bekleyebilir; pilot ve ilk yayın yalnızca Türkçe. Türkçe adresler
  ön eksiz kalır; İngilizce eklendiğinde `/en/...` olur (`src/alan/dil.ts` → `DILLER`).

- **K36 — Görsel yenileme (15.11.2026):** “TeknoKariyer Görsel Yenileme” tuvali (https://claude.ai/artifact/Ao1EwZ9itiV4inSUa1BjVv)
  onaylandı ve bütün uygulamaya uygulanır. **Alt bilgi bugünkü hâliyle kalır.** Firma karosu blok rengini taşır (B lacivert,
  C petrol, D kiremit); logo varsa logo. Talimatlar 15'teki hareket ve rozet kuralları güncellendi (basınca 0,97, güçlü
  ease-out, açık tonlu küçük etiketler). Kaynaklar: Emil Kowalski'nin skill'leri ve Impeccable'ın kuralları okunup
  uygulandı (kurulmadı); taste-skill ve magicui/reactbits türü efekt kitaplıkları uygun görülmedi.
- **K37 — Firma logosu (15.11.2026):** Yönetici A.Ş. firma kaydına logo yükleyebilir; depoda firma kimliğiyle adlandırılır;
  herkese açık logolar uzun süre önbelleklenen adresten sunulur.
- **K38 — Çerez politikası (15.11.2026):** Kullanıcı politikayı Claude'un oluşturmasını istedi (“Hukuk birimine soralım
  deme”). Üç tür: zorunlu (oturum, ikinci adım, izin kaydı, Cloudflare bot çerezleri), tercih (`tk-bilgi-gizli` yerel
  depolama), istatistik (`tk-ist`). İzin olmadan yalnızca zorunlular; reddet ve kabul aynı görünür; kutular işaretsiz;
  izin 365 gün, alt bilgideki “Çerez tercihleri”yle geri alınır. Metin `src/metinler` → `cerez-politikasi` (onaylı).

- **K34 — CV güvenliği (15.11.2026):** Ayrı virüs tarayıcı (ClamAV) ve dış hizmet yok. Yüklenen PDF etkisizleştirilir;
  firmalar CV'yi portal içindeki betik çalıştırmayan görüntüleyicide (pdf.js, kendi dosyalarımızdan) açar, indirme ve
  yazdırma oradan.

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
    - Hesap silme panelden yapılır (K27; aşağıda “KVKK başvuruları, işlem kayıtları ve hesap silme”).
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
    - **Geri bildirim (14.11.2026):** Liste talebinde her öğe ayrı karar alır (ekle, yazımı düzeltilebilir / ekleme,
      neden zorunlu); her öğenin altında listede benzer adlar gösterilir (`benzerAdlar`: aynı kök “React.js”~“React”, yazım
      hatası, önek). Aynı kök varsa karar “Ekleme” ve hazır neden metniyle gelir. Panelde “esaslı alan” yerine
      “onay gerektiren alan” denir (zorunlu alanla karıştırılmasın). Yan menü sütunu alt bilgiye kesintisiz bağlanır.
  - **Yönetici A.Ş. paneli Y2 (14.11.2026):** `/yonetim/firmalar` (kare birimli kurulum hunisi, kişisel takip, yetkilisi eksik
    firmalar ve CSV dışa aktarma, aranabilir ve aşamaya göre süzülen liste), `/yonetim/firmalar/yeni` (iskelet kayıt),
    `/yonetim/firmalar/[id]` (Yönetici A.Ş. alanları, yetkiliye davet, davetleri yeniden gönderme ve iptal, takip notları,
    ilanlar, son işlemler, pasif yapma), `/yonetim/firmalar/toplu-davet`.
    - Kurallar `src/alan/kurulum.ts` (huni, genel e-posta `info@` gibi, adres adı), servis `src/servisler/firmaYonetimi.ts`,
      veri `src/veri/firmaYonetimi.ts`. Huninin son basamağı (“İlk ilan verildi”) yayın tarihi olan ilandan hesaplanır.
    - Kişisel takip: davetten veya devralmadan sonra 14 gün ilerleme yok (`TAKIP_GUN`). “Bugün”de ayrı kuyruk.
    - Devralan firma profili tamamlayınca (logo, kısa tanıtım, sektör) aşama kendiliğinden “Profil tamam” olur (Firmalar kancası).
    - Pasif firma: yayındaki, duraklatılmış ve onaydaki ilanları kapanır; geri alınınca aşama ekibe göre belirlenir.
    - CSV dışa aktarma kişisel veri içermez (yetkili adı ve e-postası yazılmaz); indirme işlem kaydına geçer.
  - **Payload ekranı kararı (14.11.2026, kullanıcı onayı):** Payload altyapı olarak kalır. `/admin` ekranı, kendi ekranlarımız
    (kullanıcılar, listeler, ayarlar) tamamlanınca Kurumsal İletişim menüsünden kaldırılır ve yalnızca teknik sorumluya açık
    ayrı bir yetkiye bağlanır.
  - **Zamanlanmış işler (14.11.2026):** `wrangler.jsonc` → `triggers.crons` (UTC 21:05 = TR 00:05; UTC 07:00 = TR 10:00).
    `worker.ts` `scheduled` işleyicisi isteği ağa çıkarmadan `/yonetim-islem/zamanli` adresine iletir; kimlik doğrulama
    `globalThis` üzerinde tek kullanımlık rastgele anahtarla (aynı çalışma alanı). Dışarıdan gelen istek bu adreste 404 alır
    (worker.ts önce keser). İşler `src/servisler/zamanli.ts`: süresi dolan ilanların kapanması, davet hatırlatmaları
    (3./7./14. gün; her hatırlatma yeni anahtar üretir, eski bağlantı geçersiz olur; 14. günde süresi biten davet 7 gün
    uzar), profil tamamlama hatırlatmaları (devralındıktan sonra 3./7./14. gün, tam yetkililere, eksiklerle).
    Hatırlatmalar yalnızca TR 09.00–19.00 arasında gider. Kaçırılan günlerde yalnızca son eşik gönderilir
    (`src/alan/hatirlatma.ts`). Her çalışma işlem kaydına yazılır; “Bugün” sayfası son çalışmayı gösterir.
    Yerelde denemek için: `opennextjs-cloudflare build`, ardından uzak D1 bağlantısı çıkarılmış geçici bir yapılandırmayla
    `wrangler dev --test-scheduled` ve `/__scheduled?cron=...`.
  - **Rehberden içe aktarma (14.11.2026):** `/yonetim/firmalar/ice-aktar` (yalnızca rol `yonetici`). Excel CSV'si tarayıcıda
    okunur (UTF-8 değilse Windows-1254; Türkçe Excel varsayılanı), `;` veya `,` ayraç, tırnaklı alanlar. Başlıklar Türkçe
    yazım farklarına dayanıklı eşlenir; kısa ad boşsa unvandan şirket ekleri atılarak türetilir (`src/alan/iceAktarma.ts`).
    Önizleme: yeni / zaten kayıtlı / dosyada tekrar / eksik bilgi; uyarılar: genel e-posta, yetkili adı yok, sektör listede
    yok, şirket türü yazmayan unvan (şahıs firması, kişi adı olabilir). Seçilen satırlar 20'şerli parçalarla
    `firmalariIceAktar` servisine gider; sunucu her satırı yeniden denetler. Aktarma e-posta göndermez. Şablon:
    `/yonetim/firmalar/ice-aktar/sablon` (kurgusal örnek satır). Gerçek rehber verisi depoya konmaz.
  - **Yönetici A.Ş. paneli Y3 (14.11.2026):**
    - `/yonetim/listeler`: türe göre sekmeler, arama, sayfalama; çoklu ekleme (zaten olan ve aynı kökteki yazım eklenmez,
      “yine de ekle” ile geçilir); ad, eş anlamlılar ve “seçilebilir” düzenleme (ad ve eş anlamlı başka öğeyle çakışamaz).
      Silme yok. Servis `src/servisler/listeler.ts`.
    - `/yonetim/kullanicilar`: Yönetici A.Ş. hesapları. Hesap açılınca kişiye 7 gün geçerli şifre belirleme bağlantısı gider
      (`forgotPassword` + `kurumHesabiEpostasi`). Roller `src/alan/kurumRolleri.ts`. Kimse kendi rolünü değiştiremez, kendini
      kapatamaz; son etkin tam yetkili korunur.
    - **Kapatılan (pasif) kurum hesabı hiçbir yetki taşımaz:** `yoneticiMi`, `moderasyonYapabilirMi`, `kurumKullanicisiMi`
      artık `pasif` olmayanı arar; açık oturum `/cikis?pasif=kurum` ile kapanır.
    - `/yonetim/ayarlar`: yalnızca etkisi olan ayarlar (onaydan geçecek ilan sayısı, en uzun ilan süresi, hatırlatma
      günleri, havuz rızası süresi). Hatırlatma günleri zamanlanmış işlere ve kişisel takip eşiğine bağlandı (son gün = eşik).
      Onay hedefi (`onayHedefiIsGunu`) kodda kullanılıyor ama ekranda yok: firma panelindeki “1 iş günü” metinleri sabit.
      Eşleşme ağırlıkları, başvuru anonimleştirme ve işlem kaydı saklama süreleri henüz hiçbir yerde uygulanmıyor; bu yüzden
      ekranda yok. **Saklama süreleri (KVKK) için zamanlanmış iş yazılmalı.**
    - **Payload ekranı:** `access.admin` artık yalnızca `teknikSorumlu` işaretli etkin kurum kullanıcısı. İşareti yalnızca
      teknik sorumlu verir. Göç `20261114_174215_teknik_sorumlu` o anki tam yetkilileri teknik sorumlu yaptı (test ortamında
      yalnızca test yöneticisi). Menüdeki bağlantı yalnızca teknik sorumluya görünür.
  - **Günlük özet ve KVKK saklama (14.11.2026):** Göç `20261114_181314_gunluk_ozet_saklama` (tablo `gunluk_ozetler`,
    `ilanlar.kapanis_tarihi`, `basvurular.anonimlestirildi`; yalnızca CREATE/ADD, canlıda uygulandı).
    - `src/servisler/gunlukOzet.ts`: gece işi biten günün satırını bir kez yazar (yayındaki ilan, yeni ilan, başvuru,
      görüntülenme farkı, aday, havuz, ilan veren firma, ilan başına birikimli sayaçlar). Kişisel veri yok.
    - `src/servisler/saklama.ts`: ilan kapanışından N ay sonra (varsayılan 12) başvurulardaki kişisel veri silinir
      (`profilKopyasi` zorunlu alan olduğu için `{ anonim: true }` olur), başka yerde kullanılmayan CV dosyası silinir;
      işlem kayıtları N ay sonra (varsayılan 24, en az 12) silinir. Bir çalışmada en fazla 500 başvuru.
    - Kapanış tarihi Ilanlar kancasında yazılır; göçten önce kapanmışlarda `updated_at` kullanıldı.
    - İki süre de Ayarlar ekranında (hukuk onayı notuyla). Firma panelinde anonimleştirilen başvuru açıklamayla görünür.
  - **Yönetici özeti (14.11.2026, K31):** `/yonetim/ozet` (menüde “Bugün”ün altında). Dönem seçimi (7/30/90 gün, 12 ay
    haftalık) bütün sayfayı kapsar; `CanliYenileme` sayfa görünürken dakikada bir `router.refresh()` yapar (durdurulabilir).
    - Üst şerit (yayındaki ilan, dönem başvurusu ve yeni aday hesabı önceki döneme göre, ilan veren firma, onay bekleyen),
      iki ayrı sütun grafiği (başvuru, yayına giren ilan; tek eksen kuralı), bütün ilanlar tablosu (durum ve metin süzgeci,
      sütuna göre sıralama, ilk 50 + “hepsini göster”, Excel için CSV: `/yonetim/ozet/ilanlar-csv`), sonuç hunisi, aktif
      firmalar, yetenek açığı tablosu, aday kaynakları (üniversite, bölüm, kanal; 5'ten küçük gruplar “Diğer”/“5'ten az”).
    - Kurallar `src/alan/ozet.ts` (dönem, dilimler, gizleme, huni, eksen), veri `src/veri/ozet.ts` (kişisel veri yalnızca
      sunucuda sayılır), tablo `src/veri/ozetTablo.ts`. Grafikler `src/arayuz/grafik/` (dataviz kılavuzu: ≤24 px sütun,
      4 px uç, ince sürekli ızgara, seçici etiket, fare ve ok tuşuyla bilgi kutusu, “Tablo olarak göster”). Huni renkleri tek
      ton sıralı dizi, doğrulayıcıdan geçti.
    - Yayın ortamında test firmaları sayılmaz; test ortamında sayılır (örnek veri test firmalarından).
    - Not: huni, başvurunun yalnızca bugünkü durumunu bildiği için “ulaşılan aşama”yı durumdan çıkarır.
  - **Rapor merkezi ve firma raporu (14.11.2026, K31):** `/yonetim/raporlar` (8 rapor: dönem faaliyet, ilan, firma
    etkinlik, başvuru ve sonuç, yetenek açığı, aday kaynak, hizmet, KVKK). Dönem: bu/geçen ay, çeyrek, yıl veya özel aralık
    (`src/alan/raporDonemi.ts`). Hesaplar `src/veri/raporlar.ts` (`raporHazirla`, `raporSayfalari`); ekran gövdesi ortak
    (`src/arayuz/RaporGovdesi.tsx`).
    - **Excel:** `src/altyapi/excel.ts`, kitaplıksız .xlsx (fflate ile zip; ilk sayfa özet ve notlar, her tablo ayrı sayfa,
      kalın ve sabit başlık). openpyxl ile doğrulandı. İndirme işlem kaydına geçer.
    - **PDF:** tarayıcının yazdırma penceresi (“PDF olarak kaydet”); A4 baskı stili panel menülerini gizler, logo gösterir.
    - **Firma raporu:** `/firma-paneli/rapor` (+ `/excel`), `src/veri/firmaRaporu.ts`; yalnızca kendi firmasının ilanları,
      başka firmayla karşılaştırma yok. Firma başvuruları zaten tek tek gördüğü için kanal sayıları gizlenmez.
    - KVKK raporundaki ilgili kişi talepleri, talepler ekranı yazılınca dolacak.
  - **KVKK başvuruları, işlem kayıtları ve hesap silme (14.11.2026, K27):** Göç `20261114_194152_kvkk_talepleri`
    (yalnızca CREATE/ADD). Kurallar `src/alan/kvkk.ts` (9 tür m. 11, kanal, kimlik yöntemi, 30 gün TR saatiyle, cevap
    taslakları ve `[… yazın]` yer tutucu denetimi), servis `src/servisler/kvkk.ts`, veri `src/veri/kvkk.ts`.
    - Aday `/hesabim/hesap#kvkk` formundan başvurur (kimlik doğrulanmış sayılır, en fazla 3 açık başvuru). E-postayla ve
      yazılı gelenleri tam yetkili `/yonetim/kvkk` sayfasında kaydeder; adres kayıtlı aday hesabıysa bağlanır, “kayıtlı
      e-posta” yöntemi yalnızca o durumda seçilebilir. Akış: alındı → kimlik doğrulanıp incelemeye alındı → (silmede hesabı
      sil) → cevap e-postası. Kimlik doğrulanmadan cevap verilemez; cevap gerekçeli, boş veya yer tutuculu olamaz.
    - Herkese açık bilgi sayfası `/kvkk-basvurusu` (alt bilgideki bağlantı). Veri dökümü ortak: `src/veri/adayDokumu.ts`
      (aday `/hesabim/verilerim`, Yönetici A.Ş. `/yonetim/kvkk/[id]/dokum`; firma iç notları, puan ve etiketler yok).
    - **Hesap silme** `src/servisler/hesapSilme.ts` (`adayHesabiniSil`): aday şifresiyle kendisi veya tam yetkili KVKK silme
      başvurusu üzerine. Başvurular firmada kalır; profil kopyasından ad, e-posta, telefon, bağlantılar, ayrıca ön yazı ve
      CV silinir (`hesapSilindi: true`). Profil, bütün dosyalar, havuz görüntülenmeleri, rızalar ve hesap silinir.
      Firma sayfası “Aday hesabını sildi” gösterir, profil ve eşleşme yalnızca anonimleştirmede gizlenir.
      Silme sonrası `/hesap-silindi`. Aday aydınlatma metni 1.1 (silme cümlesi K27’ye göre).
    - **İşlem kayıtları** `/yonetim/kayitlar`: arama (işlem, kişi adı/e-postası, kayıt no), tür, Türkçe takvimle tarih
      aralığı, 50’lik sayfa, Excel çıktısı (kayda geçer). Veri `src/veri/islemKayitlari.ts`.
    - KVKK başvuruları ve işlem kayıtları **yalnızca rol `yonetici`** (kişisel veri); moderatör ve raporlayıcı menüde
      görmez, adresle gelirse açıklama görür (`YetkiYok`). “Bugün”de KVKK kuyruğu ve menü sayacı yalnızca tam yetkiliye.
    - KVKK raporu artık başvuruları (konu, sonuç, ortalama cevap süresi, süre aşımı) ve silinen hesapları sayar; KVKK
      başvurusu iş adımları “kişisel veri erişimi” sayılmaz.
    - Hukuk birimine sorulacaklar talimatlar 19. bölümün sonunda (saklama süreleri, silmede kalan alanlar, rıza kayıtları,
      KVKK başvuru kayıtlarının saklanması, taslak metinler, kimlik doğrulama yolları).
    - Öğrenilen: React eylem sonrası formu sıfırlarken **state ile kontrol edilen radyo düğmesinin DOM seçimi de silinir**;
      React bunu fark etmez ve ikinci gönderimde değer boş gider. Hata sonucunda `surum` döndürülür ve form `key={surum}`
      ile yeniden kurulur. Next’in sayfa duyurucusu da `role=alert` taşır; testlerde hata kutusu kapsamla seçilmeli.
    - Öğrenilen: Hesap silmede veri değişiklikleri sistem isteğiyle yapılır (aday rolüne özgü kanca kuralları uygulanmasın);
      kişi kendini sildiyse işlem kaydının `kim` alanı silinen hesaba bağlanamaz (yabancı anahtar), sistem adına yazılır.
  - **İki aşamalı doğrulama (15.11.2026, K33):** Göçler `20261115_081840_iki_adim`, `20261115_083416_yeni_cihaz`
    (yalnızca ADD COLUMN). Kurallar `src/alan/ikiAdim.ts`, servis `src/servisler/ikiAdim.ts`, eylemler `src/eylemler/ikiAdim.ts`.
    - **Yöntem seçimi** (`girisDogrulamaYontemi`): tanınan cihaz → sorulmaz (90 gün, her girişte uzar; en fazla 10 cihaz);
      doğrulayıcı uygulama kuruluysa (her rol) → uygulama kodu veya kurtarma kodu; firma ve kurum rolünde → e-posta kodu
      (6 hane, 10 dakika, 60 saniyede bir ve saatte en fazla 5); aday → sorulmaz.
    - Cihaz: tarayıcıya özgü rastgele `tk-cihaz` çerezi (400 gün); hesapta yalnızca SHA-256 özeti, cihaz adı (“Chrome ·
      Windows”) ve tarihleri (`taninanCihazlar`). “Bu cihazı hatırla” varsayılan işaretli. Şifre yenilenince ve sıfırlamada
      cihazlar unutulur.
    - Giriş akışı (`src/eylemler/hesap.ts` → `girisiSurdur`): ikinci adım gerekiyorsa oturum çerezi yazılmaz; oturum anahtarı
      şifreli, 10 dakikalık `tk-ikinci-adim` çerezinde bekler; `/giris/ikinci-adim`. Davet kabulü ve şifre yenileme de aynı yol.
    - **Test ortamında e-posta kodu ekranda gösterilir** (yalnızca `ortam() !== 'yayin'`; kod şifreli pakette taşınır).
    - Doğrulayıcı uygulama (TOTP, RFC 6238, birim testli) `/hesap-guvenligi/kur`; kurulumdan sonra kurtarma kodları
      `/giris/kurtarma-kodlari`'nda bir kez. Gizli anahtar AES-GCM (`src/altyapi/sifreleme.ts`, PAYLOAD_SECRET'tan HKDF).
      **PAYLOAD_SECRET değişirse uygulama kuranlar yeniden kurar** (göç rehberine yazılacak). Aynı kod iki kez geçmez,
      5 hatada 15 dakika kilit (e-posta kodu için de).
    - **REST/GraphQL üzerinden giriş, şifre sıfırlama ve kilit açma kapalı** (Kullanicilar `beforeOperation`; yalnızca yerel
      API). Payload ekranının giriş sayfası `/giris?donus=/admin`'e yönlenir (`src/app/(payload)/admin/login/page.tsx`).
    - `/hesap-guvenligi`: önerilen uygulama, tanınan cihazlar (tek tek veya hepsini unutma), şifre. Bağlantılar: aday hesap
      sayfası, firma ekip sayfası (Bilgilerim), yönetim yan menüsü.
    - Sıfırlama (uygulamayı kaldırır, cihazları unutur): tam yetkili kurum herkesi, firmanın tam yetkilisi kendi ekibini;
      kimse kendini sıfırlayamaz; kişiye bilgi e-postası. Düğmeler kullanıcı listelerinde.
    - **Süreler ve sınırlar ayarlanabilir** (kullanıcı isteği, 15.11.2026; göç `20261115_090859_guvenlik_ayarlari`):
      e-posta kodu süresi, cihaz hatırlama günü, yeniden gönderme beklemesi, saatlik kod sınırı, hatalı deneme sınırı, kilit
      süresi. Tek kaynak `GUVENLIK_AYARLARI` (`src/alan/ikiAdim.ts`: etiket, birim, varsayılan, güvenli alt/üst sınır,
      açıklama); hem `/yonetim/ayarlar` “Giriş güvenliği” bölümü hem Payload `ayarlar.guvenlik` grubu aynı açıklamaları
      gösterir. Sunucu sınır dışını reddeder; okurken sınır dışı değer yerine varsayılan kullanılır (`guvenlikAyarlari`).
  - **Üst bilgideki kişi bağlantısı** kurum kullanıcısında `/yonetim`'e gider (önceden `/admin`'e gidiyordu).
  - **Bot koruması ve istek sınırlama (15.11.2026):** Göç `20261115_092436_istek_sinirlari` (yalnızca CREATE/ADD).
    - **Turnstile** (`src/altyapi/insanDogrulama.ts`, bileşen `src/arayuz/hesap/InsanDogrulama.tsx`): kayıt, giriş, şifremi
      unuttum formlarında. Görünmez kip (`appearance: interaction-only`), Türkçe; anahtar `insan` adıyla gönderilir, her
      gönderimden sonra araç yenilenir. Sunucu denetimi `src/veri/koruma.ts` → `insanDenetle`.
      Ortama göre: geliştirmede kapalı; test ortamında Cloudflare'in herkese açık test anahtarları; **yayında
      `TURNSTILE_SITE_ANAHTARI` ve `TURNSTILE_GIZLI_ANAHTAR` zorunlu** (yoksa formlar reddedilir, sessizce kapanmaz).
      Yayına geçişte Cloudflare panelinde Turnstile aracı oluşturulup anahtarlar Worker'a eklenmeli (göç rehberine yazılacak).
      Doğrulama adresi `TURNSTILE_DOGRULAMA_ADRESI` ile değiştirilebilir (yalnızca deneme için).
    - Bu çalışma ortamından challenges.cloudflare.com erişilemiyor: tarayıcı denemesi sahte betik (Playwright `route`) ve
      yerel sahte doğrulama sunucusuyla yapıldı.
    - **İstek sınırları** (`src/alan/istekSiniri.ts`): giriş 10/15 dk, kayıt 5/saat, şifre yenileme 5/saat (IP ve e-posta
      adresi ayrı ayrı), ikinci adım 20/15 dk, davet kabulü 10/saat (IP); başvuru 30/saat (hesap). Sayaçlar `istek-sinirlari`
      koleksiyonunda; kaynak HMAC özeti (`anahtarliOzet`), IP adresi saklanmaz; süresi biten sayaçlar gece silinir.
      Hata 429, Türkçe ve kalan süreyle.
    - IP: `cf-connecting-ip`, yoksa `x-forwarded-for` ilk adres (`istemciAdresi`).
  - **CV güvenliği (15.11.2026, K34):** Ayrı virüs tarayıcı yok (kullanıcı kararı; dış hizmet istenmiyor).
    - **Etkisizleştirme** `src/altyapi/pdfTemizle.ts` (pdf-lib, alt düzey nesne gezinme): JavaScript ve tehlikeli eylemler
      (Launch, GoToR, SubmitForm, ImportData, ortam), /OpenAction, /AA, gömülü dosyalar ve dosya eki notları, /AF, XFA
      çıkarılır; bağlantılar (URI) ve belge içi gezinme kalır. Yüklemede (`cvYukle`) uygulanır, saklanan dosya temizdir,
      `taramaDurumu: 'temiz'` (etiket “Etkisizleştirildi”); şifreli PDF anlaşılır hatayla reddedilir. Filigran adımı da
      (`pdfFiligranla`) temizler: daha önce yüklenmiş CV'ler de firmaya temiz gider. Temizlik işlem kaydına (sayılarla) geçer.
    - **Portal içi görüntüleyici** `src/arayuz/firma/CvGoruntuleyici.tsx`: pdf.js (`pdfjs-dist` 6.5) yalnızca tuvale çizer,
      betik çalıştırmaz, XFA kapalı; işçi dosyası kendi statik dosyalarımızdan (`new URL(..., import.meta.url)`, webpack
      `static/media/pdf.worker…mjs`). Masaüstünde ortalı büyük pencere, mobilde tam ekran; yakınlaştırma, indirme (ayrı
      istek), yazdırma (sayfalar resim olarak, yalnızca CV basılır). Başvuru ayrıntısı ve havuz profilinde. `?goruntule=1`
      ile açılış “CV görüntülendi” olarak, indirme “CV indirildi” olarak kayda geçer.
    - Öğrenilen: pdf.js 5+ `isEvalSupported` seçeneğini kaldırdı (kod üretmiyor); belge kapatma `loadingTask.destroy()`.
    - Öğrenilen: Bir cihazda e-posta kodu kullanıldıktan hemen sonra başka cihazdan girişte 60 saniyelik bekleme girişi
      engelliyordu. Girişte bekleme uygulanmaz (yalnızca “Yeni kod gönder”); geçerli kod varsa o kullanılır (`girisSirasinda`).
      Test ortamında açık kod `epostaKodu.test` alanında tutulur (yalnızca yayın dışı) ki ekranda yeniden gösterilebilsin.
  - **Üniversite ve bölüm listeleri (15.11.2026, kullanıcı kararı):** Toplu aktarma Yönetici A.Ş. panelinde yer tutmaz
    (güncelleme aralığı uzun); gelişmiş yönetim ekranında `/admin/liste-aktar` (menüde “Liste aktarma (YÖK)”), yalnızca
    teknik sorumlu (`aktarmaYetkisi` → `teknikSorumluMu`). Payload özel görünümü: `src/arayuz/gelismis/` (Payload tema
    değişkenleriyle `gelismis.css`), `admin.components.views` + `afterNavLinks` (`src/payload.ortak.ts`; değişince
    `pnpm payload generate:importmap`).
    - **Kaynak:** YÖK Atlas tercih kılavuzu API'si (`https://yokatlas.yok.gov.tr/api/tercih-kilavuz/universiteler` ve
      `/universite-programlar`; site tek sayfalık uygulama, uçlar betik dosyasından bulundu). Ham adlar
      `src/kaynakVeri/yokAtlas.json` (228 kurum KKTC dahil, 596 program adı lisans + önlisans; alınma 15.11.2026).
      Kullanıcı indirmeye açıkça izin verdi. ÖSYM tercih kılavuzu tabloları PDF; dokuman.osym.gov.tr 403 veriyor.
    - Temizlik `src/alan/listeAktarma.ts` (büyük harf düzeltme, kısaltmalar TOBB/MEF/KTO/OSTİM/SANKO/TED, “(ŞEHİR)” ve
      program ekleri, `OZEL_YAZIMLAR`: Bezmiâlem). Karşılaştırma `aktarmaSiniflandir` (zaten var / eş anlamlı / aynı kök).
      Paketteki liste `src/alan/resmiListeler.ts`. Ekranda: paketteki listeyle karşılaştır veya Excel/CSV seç → önizleme →
      200'erli parçalarla ekle. Hiçbir şey silinmez; işlem kaydına kaynağıyla geçer.
    - **Betik:** `scripts/liste-yukle.ts` (aynı kural, D1 API; kuru çalıştırma, sonra `--uygula`). D1 API yardımcısı
      `scripts/d1.ts` (göç betiği de kullanır). Test ortamına 15.11.2026'da yüklendi: 229 üniversite, 596 bölüm.
      Önce örnek verideki “Bilkent Üniversitesi” ve “Grafik Tasarım” resmî adlarına çevrildi, eski yazım eş anlamlı oldu.
    - Öğrenilen: kısa ad resmî adın sonu olabilir (“Bilkent” ⊂ “İhsan Doğramacı Bilkent”), ama sondan eşleme kuralı
      yanlış birleştirir (“Akdeniz” ⊂ “Doğu Akdeniz”). Kaynakta karşılığı olmayan mevcut adlar yüklemeden önce elle bakılır.
  - **Site haritası, robots ve hreflang (15.11.2026):** `src/app/sitemap.ts` (ana sayfa, ilan listesi ve staj sekmesi, açık
    ilanlar, açık ilanı olan firmalar, KVKK başvurusu, metinler; ilan listesiyle aynı görünürlük kuralı, `src/veri/siteHaritasi.ts`,
    girdiler saf fonksiyon `src/alan/siteHaritasi.ts`). `src/app/robots.ts`: yayında hesap, panel, akış ve yönetim yolları
    (`TARANMAYAN_YOLLAR`) taranmaz ve site haritası bildirilir; **yayın dışında her şey kapalı**. Cloudflare'de `worker.ts`
    yayın dışı ortamda her yanıta `X-Robots-Tag: noindex, nofollow` ekler (öncesinde test ortamı dizinlenebilirdi).
    - hreflang: `src/alan/dil.ts` → `DILLER` (şimdilik yalnızca `tr`) ve `dilAdresleri(yol)` (kanonik + dil karşılıkları +
      `x-default`). Next'te alt sayfanın `alternates` alanı üsttekini tamamen ezer; her dizinlenebilir sayfa kendisi verir.
    - `metadataBase` artık `siteAdresi()` (SITE_ADRESI): site haritası, sayfa başlıkları ve e-postalar aynı kökü kullanır.
    - **K35:** İngilizce sonraya kaldı; Türkçe adresler ön eksiz. İngilizce eklenince `DILLER`e `{ kod: 'en', onEk: '/en' }` girer.
  - **Türkiye'deki sunucuya göç (15.11.2026, K2):** Rehber `docs/goc-rehberi.md` (hedef mimari, kaynaklar, adımlar,
    yedekleme, geri dönüş, denetim listesi, prova sonucu).
    - **PostgreSQL göçleri ayrı:** `src/migrations-pg` (node yapılandırması `migrationDir` + `prodMigrations`). **Şema
      değişince iki göç üretilir:** D1 için `pnpm payload migrate:create ad`, PostgreSQL için
      `PAYLOAD_CONFIG_PATH=src/payload.config.node.ts DATABASE_URL=… pnpm payload migrate:create ad`.
    - Göç betikleri `scripts/goc/`: `dokumu-ac.ts` (wrangler d1 export → SQLite; Node yerleşik `node:sqlite`),
      `sqlite-postgres.ts` (tablo tablo, tek işlem, 0/1 → boolean, satır sayısı ve yabancı anahtar denetimi, sayaçlar),
      `r2-s3.ts` (Cloudflare API'siyle okur, `cf-r2-jurisdiction: eu`; boyut ve dosya kaydı denetimi).
    - Docker: `Dockerfile`, `compose.yaml` (uygulama, zamanlayici, PostgreSQL 16, SeaweedFS 4.53), `sunucu.env.ornek`.
      MinIO topluluk imajı artık yok; SeaweedFS seçildi. Node'da zamanlanmış işler `scripts/zamanlayici.ts` (saatler
      `src/alan/zamanlama.ts`; wrangler.jsonc ile aynı olduğunu birim testi denetler). Boş kurulumda dosya kovası açılışta
      oluşturulur (`onInit`).
    - Prova (yerel PostgreSQL + SeaweedFS, test ortamı verisi): 1.603 satır, 102 yabancı anahtar, 6 dosya; node kipinde
      giriş, e-posta kodu, CV görüntüleme ve filigranlı indirme, zamanlayıcı çalıştı.
    - Öğrenilen: `payload run` betiklerinde `@payload-config` Cloudflare yapılandırmasına çözülür (tsconfig). PostgreSQL'e
      yazacak betik `../src/payload.config.node.js` içe aktarır (`.node` soneki yüzünden uzantı `.js` yazılır). Düz `tsx`
      `.env` okumaz.
    - **Docker provası geçti** (rehber 10. bölüm): boş kurulum, göç, giriş, CV, zamanlayıcı. Bulunan iki hata düzeltildi:
      webpack üretim derlemesinde tsconfig yolu `@payload-config` takma adından önce çözülüyordu (node derlemesi Cloudflare
      yapılandırmasıyla çıkıyordu; `next.config.ts` → `NormalModuleReplacementPlugin`); `pnpm start` açılışta corepack ile
      pnpm indirmeye çalışıyordu (kapsayıcılar `node_modules/.bin/next` ve `tsx` çalıştırır).
    - Üretimde oturum çerezi Secure: HTTPS'siz (`http://ip:3000`) giriş yapılamaz; Playwright'ın `request` aracı da http
      üzerinden göndermez (tarayıcı `fetch` ile denenir).
  - **Test posta kutusu (15.11.2026):** `/yonetim/test-postalari` (prototip “Yönetim: Test posta kutusu”; yalnızca yayın dışı
    ortam ve rol `yonetici`, yayında 404). Liste + korumalı çerçevede (sandbox, betik yok, bağlantılar yeni sekmede) gövde,
    arama, kutuyu boşaltma. Önceden e-postalar yalnızca Payload ekranındaydı ve o ekran teknik sorumluya kapanınca personel
    davet/doğrulama e-postalarını göremez olmuştu.
  - **E-posta doğrulama POST ile (15.11.2026):** `/dogrula?anahtar=` yalnızca sayfayı açar; “E-posta adresimi doğrula”
    düğmesi (`epostaDogrulaEylemi`) doğrular. Kurumsal e-posta güvenlik tarayıcıları bağlantıları önceden açtığı için GET'te
    doğrulama anahtarı adaydan önce tüketiyordu. (Bu çalışma ortamındaki Chromium da belge isteğini iç 307 ile iki kez
    gönderiyor; hatayı o ortaya çıkardı.)
  - **Test senaryoları (15.11.2026):** `docs/test-senaryolari.md` (S1–S11: firma kurulumu, profil ve ekip, ilan ve onay,
    aday kaydı, başvuru, havuz, hesap güvenliği, liste talepleri, KVKK ve hesap silme, raporlar, mobil; geri bildirim
    şablonu). Ekran ve düğme adları yerelde tarayıcıyla adım adım uygulanarak alındı (S1, S3'ün başı, S4 doğrulandı).
    Geri bildirim kanalı kurumca belirlenmedi: belge “test koordinatörüne” diyor.
  - **Görsel yenileme uygulandı (15.11.2026, K36/K37):** Katman `src/stil/yenileme.css` (öteki stil dosyalarından sonra
    yüklenir, yalnızca token kullanır). Kenarlık yerine gölge, açık tonlu bilgi kutuları (sol şerit yok), basınca 0,97,
    rozet (`.rozet--yesil/--lacivert/--kiremit/--notr`), olgu kutuları (`IlanOlgulari`), başvuru süreci (`BasvuruSureci`),
    blok renkli `FirmaKaro` (`src/alan/firmaKonumu.ts`). Ana sayfa gece bandı + “Bu hafta yayına girenler” (telefonda gizli,
    altındaki liste aynı ilanları gösterir). İlan sayfasında bölümler açılır kutu değil, düz başlıklı; telefonda alt çubukta
    son başvuru + Başvur. Alt bilgi değişmedi. Bütün panellerde telefonda yatay taşma denetlendi (`ozet-dl` uzun değerleri kırar).
    - **Firma logosu (K37):** `firmaLogosuYukle(payload, k, dosya, hedefFirmaId?)`; hedef verilirse yalnızca kurum rolü
      `yonetici`. Ad `firma-<id>-logo-YYYYMMDD-HHMMSS.<uzantı>` (`src/alan/firmaLogosu.ts`), eski logo başka firmada yoksa
      silinir. Herkese açık adres `/firma-logosu/<dosyaId>` (yalnızca `tur: logo` ve PNG/JPEG/WebP; `Cache-Control: public,
      max-age=31536000, immutable`, nosniff). Adres her yüklemede değiştiği için uzun önbellek güvenli; Cloudflare kenar
      sunucuları CDN işlevi görür, ayrı `cdn.` alt alanı gerekmez. CV'ler bu adresten asla sunulmaz.
    - Öğrenilen: Yerelde Turnstile test anahtarlarıyla tarayıcı denemesi için geliştirme sunucusu
      `TURNSTILE_DOGRULAMA_ADRESI=http://localhost:4010/` ile ve sahte doğrulama sunucusuyla açılmalı; çok sayıda girişte
      yerel istek sınırı (10/15 dk) dolar, `istek-sinirlari` koleksiyonu temizlenir.
  - **Kullanıcı geri bildirimi 3 (15.11.2026):**
    - **Sayfa geçiş göstergesi** `src/arayuz/GezinmeGostergesi.tsx` (kök düzende): iç bağlantı veya GET formunda üstte
      ince çubuk; 450 ms'yi aşarsa soluk örtü ve TeknoKariyer işareti (favicon “t”) çevresinde dönen halka. `Link`
      `preventDefault` çağırdığı için tıklama yakalama aşamasında dinlenir; `download`, yeni sekme, `data-gostergesiz`
      açmaz. Adres değişince React'in “önceki değere göre durum” kalıbıyla kapanır (efektte setState yok).
    - **Firmalar** sayfası kart ızgarası + blok süzgeci (`?blok=B`). **İlan filtreleri** `FiltreGrubu`: açılır gruplar,
      onay kutulu satırlar, ilk 5 + “Tümünü göster”, başlıkta seçili sayısı (kariyer.net usulü).
    - **Kaydedilen ilanlar** (talimatlar 5): koleksiyon `kaydedilen-ilanlar` (kullanıcı+ilan benzersiz), servis
      `src/servisler/kaydedilenler.ts`, düğme `KaydetDugmesi` (ilan satırı, ilan sayfası, önizleme, mobil alt çubuk;
      ziyaretçide giriş bağlantısı, firma/kurumda yok), bağlam `src/veri/kaydedilenler.ts`, panel `/hesabim/kaydedilenler`.
      2 gün kala bir kez hatırlatma (zamanlı iş, mesai saati; başvurulan ilana gitmez). Döküme girer, hesap silmede silinir.
      En fazla 200 kayıt.
    - **Site trafiği** (talimatlar 9: çerezsiz, kişisel verisiz; GA kullanılmadı: çerez izni ve yurt dışı aktarım
      gerektirir, K2 taşınabilirliğine uymaz). Kurallar `src/alan/trafik.ts`, servis `src/servisler/trafik.ts`, uç
      `POST /olcum` (`sec-fetch-site` başka siteyse sayılmaz; firma/kurum oturumu sayılmaz), istemci `SayfaOlcumu`
      ((site) düzeninde; DNT/GPC'de ölçmez; yalnızca yol değişiminde, aynı yol iki kez gitmez). Ziyaret = dışarıdan
      gelinen sayfa açılışı; tekil ziyaretçi yok (kimlik tutulmuyor). Ham olaylar `trafik-olaylari`, gece
      `trafikOzetle` biten günleri `trafik-ozetleri`ne (gün × boyut × değer) yazar ve ham olayları tek sorguyla siler
      (`payload.db.deleteMany`). Pano `/yonetim/ozet/trafik` (Portal / Site trafiği sekmeleri).
    - Göç `20261115_153138_kaydedilenler_trafik` (D1) ve `20261115_153210_kaydedilenler_trafik` (PostgreSQL): yalnızca
      yeni tablo ve sütun; test D1'ine koddan önce uygulandı.
    - Öğrenilen: Geliştirme kipinde React efektleri iki kez çalıştırır; ölçüm gibi yan etkili efektler modül düzeyinde
      son değerle tekrarı engellemeli.
  - **Kullanıcı geri bildirimi 4 (15.11.2026):**
    - Düzenleme penceresi içeriğe göre boyutlanır (flex sütun; pencere formdan uzun kalıyordu). Pencere içindeki öneri
      listesi (`dialog .oneri-panel`) mutlak değil akışta durur ve görünür kalacak kadar kaydırılır.
    - Geçiş göstergesinde Teknokent dikey renkli logo (120 px, kimlik alt sınırı) ve çevresinde halka.
    - **Hesap menüsü** `src/arayuz/HesapMenusu.tsx`, içerik `src/alan/hesapMenusu.ts` (role göre); site üst çubuğu,
      firma üst çubuğu, yönetim yan menüsü (yukarı açılır) ve mobil yönetim çubuğu. Çıkış menüde.
    - **404** `src/arayuz/BulunamadiGovdesi.tsx` (site `not-found` ve `global-not-found`; Teknokent negatif logo).
      Öğrenilen: `global-not-found.tsx` değişikliği geliştirme sunucusu yeniden başlatılınca görünür.
    - **Sertifikalar (LinkedIn usulü):** alanlar ad, kurum (zorunlu, formda), ay/yıl veriliş, bitiş veya `suresiz`,
      `kimlikNo`, `url`, `beceriler` (taksonomi), `dosya` (dosyalar `tur: sertifika`). Kural `sertifikaSatiri`
      (`src/alan/profilFormu.ts`), servis `src/servisler/sertifika.ts` (yükleme: PDF etkisizleştirilir, görsel ilk
      baytlardan; kayıtta sahiplik ve beceri denetimi; profilde ve başvuruda olmayan belge silinir), düzenleyici
      `SertifikaDuzenleyici` (belge seçilince hemen yüklenir), görünüm `SertifikaListesi` (aday, firma başvurusu, havuz).
      Başvuruda belge bağlantısı `basvurular.belgeler` (JSON içinde değil; saklama ve silme bulabilsin). Firma erişimi
      `/firma-paneli/basvurular/[id]/belge/[dosya]` ve `/firma-paneli/havuz/[id]/belge/[dosya]` (PDF filigranlı, açılış
      kayda geçer), aday `/hesabim/belge/[dosya]`. Hesap silmede kopyadan kimlik no, bağlantı ve belge düşer.
      Göç `20261115_161035_sertifika_ayrintilari` (D1) ve PostgreSQL karşılığı: yalnızca ekleme (PG'de `ALTER TYPE … ADD VALUE`).
    - Öğrenilen: Yeni sunucu eylemi eklendikten sonra Turbopack geliştirme sunucusu “reading 'apply'” hatası verebilir
      (eski eylem kaydı); sunucu yeniden başlatılınca düzelir.
  - **Kullanıcı geri bildirimi 5 (15.11.2026):**
    - Modal pencereler `height: fit-content` (tarayıcı varsayılanı). `height: auto`, `inset: 0` olan modal pencereyi en
      yüksek boya geriyordu; kısa formlarda yarısı boş pencere çıkıyordu.
    - Üst çubukta yalnızca “Giriş yap” (firma girişi giriş sayfasındaki sekmede). Liste talebi örnekleri türe göre
      (`TALEP_TUR_ADI[tur].ornek`).
    - Firmalar: blok süzgeci ve blok açıklaması kaldırıldı (bloklar tek binanın koridorları); sektör düğmeleri (iki ve
      daha çok sektörde), alfabetik. Ana sayfadaki firma listesi alfabetik, ilk 8 + “Bütün firmaları gör”.
    - Yönetim yan menüsündeki hesap menüsü sütun genişliğinde açılır (yan sütun `overflow-y: auto` olduğu için taşan kesiliyordu).
    - **Birden çok eğitim:** `adaylar.egitimler` (düzey, okul veya `okulAdi` (lise), bölüm, başlangıç yılı, mezuniyet
      ay/yıl, `devam`, sınıf, GANO). Kurallar `src/alan/egitim.ts`; “ana eğitim” = devam eden, yoksa en son biten; üst
      alanlar (okul, bölüm, sınıf, mezuniyet, GANO) kayıtta ondan türetilir, eşleştirme ve başvuru kuralları değişmedi.
      Eşleşmede `ekBolumler` (bütün bölümler) de bakılır. Okul ve bölüm `TekSecimGirdisi` ile yazdıkça önerili.
      Eski profillerde liste boşsa düzenleyici üst alanlardan tek satır kurar. Görünüm `EgitimListesi` (aday, başvuru
      kopyası, havuz). Göçler `…_egitimler` (D1 ve PG; yalnızca ekleme).
    - **Aday kodu** artık rastgele (`adayKoduUret`, “A-7K3M9P”, 0/O/1/I yok) ve adaylarda da başvurulardaki
      `adayKodu`'nda da kullanılmamış olmalı. Eski kural (aday sayısı + 1000) hesap silindikten sonra var olan kodu
      üretiyordu: yeni adayın profili açılamıyordu ve silinen adayın başvurularda kalan kodu yeni adaya geçebilirdi.
      Entegrasyon testleri birlikte koşunca yakalandı.
  - **Çerez izni ve izinli istatistik (15.11.2026, K38):** Kurallar `src/alan/cerez.ts` (izin çerezi `tk-cerez` =
    `sürüm.t0|1.i0|1.YYYY-MM-DD`; politika sürümü değişince izin yeniden sorulur), istemci `src/arayuz/cerezIstemci.ts`
    (`izinKaydet` izin geri alınınca `tk-ist`'i ve `tk-` yerel depolama anahtarlarını siler; `tercihDeposu` izin yoksa
    `sessionStorage`), bant ve pencere `src/arayuz/CerezBandi.tsx` (kök düzen sunucuda çerezi okur, bant ilk çizimde doğru).
    - `tk-ist` yalnızca `ilk ziyaret ayı.son ziyaret günü` tutar (kimlik yok). Ölçüm isteği bundan günün/ayın ilk ziyareti
      ve yeni ziyaretçi işaretlerini gönderir; özetler `tekilGun`, `tekilAy`, `yeni`, `izinli` sayılarını tutar.
      Trafik panosunda “Tekil ziyaretçiler” şeridi yalnızca izin verenleri sayar (izin oranı da gösterilir).
    - Çerezsiz sayım (sayfa görüntüleme, ziyaret) izinden bağımsız sürer; kişisel veri ve tanımlayıcı içermez.
    - Göç `20261115_200410_istatistik_izni` (D1) ve `20261115_200413_istatistik_izni` (PG): yalnızca ADD.
  - **Kullanıcı geri bildirimi 6 (15.11.2026):**
    - **Turnstile:** Kayıtlı şifreyle hemen gönderilen form anahtar gelmeden sunucuya gidip “Güvenlik doğrulaması
      tamamlanmadı” alıyordu. `InsanDogrulama` artık gönderimi yakalama aşamasında bekletir (`preventDefault` +
      `stopPropagation`; React'in form eylemi kökte kabarcıklanmada çalışır), anahtar gelince `requestSubmit(düğme)` ile
      kendisi gönderir (en fazla 20 sn). Korumanın durumu formda görünür (“yapılıyor / tamamlandı / kutuyu işaretle”).
    - **Girişten sonra:** aday ana sayfaya (`rolAnaSayfasi` → `/`), firma ve kurum kendi paneline. Profili eksik adaya
      ana sayfada ince “Profilini tamamla” şeridi (`.as-gorev`). Hesap güvenliğindeki geri bağlantısı adayda `/hesabim/hesap`.
    - **Eğitim:** sınıf yalnızca önlisans (Hazırlık–2) ve lisansta (Hazırlık–5+) sorulur (`sinifSecenekleri`); yüksek
      lisans ve doktorada başvuru kurallarına düzeyin adı gider (`egitimSinifi`). Simgeler `EGITIM_DUZEYI_SIMGE`
      (DR, YL, ÖL, L). Eski kayıtlarda düzeye uymayan sınıf gösterilmez. Birim testi `tests/birim/egitim.test.ts`.
    - **Belge erişimi (IDOR):** `/hesabim/belge/[dosya]` → `adayBelgesi` (yalnızca sahibine; başkasınınki 404, var olduğu
      belli edilmez). Firma uçları başvuru/havuz kaydından denetliyordu. **Dosyalar koleksiyonunun okuma kuralı daraltıldı:**
      CV ve sertifikayı kurumdan yalnızca rol `yonetici` okur (önceden moderatör ve raporlayıcı da Payload API'sinden
      okuyabiliyordu). Testler `sertifika.test.ts` → “adresteki numarayı değiştirerek erişim”.
    - **Başvuru akışı görünümü:** masaüstünde solda ilan kartı (karo, son başvuru) + bağlantılı adım listesi + güven notu,
      sağda beyaz form kartı (düğmeler kartın içinde); mobilde ilerleme çubuğu, “Adım 2 / 3” etiketi, yapışık düğmeler.
      Başvuru sonrası sayfası: başarı işareti, ilan kartı, süreç (ilk adım tamam), aynı alandaki başka açık ilanlar.
      Öğrenilen: `uygulama.css`'te genel `.adimlar` kuralı (LinkedIn yönergesi için) başvuru adımlarını dikey listeye
      çeviriyordu; yönerge `.sirali-adimlar` oldu.
    - **Firmalar:** sektör düğmeleri yerine ilan listesindeki gibi solda “Sektör” filtre grubu (çoklu seçim, mobilde alttan
      panel, `FiltrePaneli birim="firma"`) ve firma/sektör/pozisyon araması.
  - **Kullanıcı geri bildirimi 7 (15.11.2026):**
    - **Yeniden başvuru (kullanıcı kararı):** geri çekilen başvurudan sonra aynı ilana bir kez daha başvurulur
      (`yenidenBasvuruDurumu`, `EN_FAZLA_BASVURU = 2`; Basvurular kancası ve başvuru sayfası aynı kuralı kullanır). Yeni
      başvuru ayrı kayıttır; geri çekilen firmada iz olarak kalır. Firma başvuru ekranı öbür başvuruya bağlantı verir
      (aynı `adayKodu` + ilan). Geri çekme penceresi ve başvuru akışı kalan hakkı yazar. Talimatlar 5'teki kural buna göre.
    - Onay pencereleri (`dialog.pencere-dialog`) ortalanır: Tailwind sıfırlaması (`margin: 0`) modal pencereyi sol üste
      yapıştırıyordu (çerez penceresi de etkileniyordu).
    - İlan kartlarında deneyim `DENEYIM_ETIKETI` (“1–3 yıl deneyim”, “Öğrenciye uygun”); ilan sayfası “Aranan deneyim”.
    - **Firma logoları:** Bu çalışma ortamının ağı firma sitelerine ve Teknokent rehberine (bot doğrulaması) erişemiyor;
      çoğu firmanın resmî sitesi aramayla doğrulanamadı. Yanlış logo yüklenmemesi için yüklenmedi; kullanıcıdan site
      adresi veya logo dosyası istendi.
  - **Sırada:** `docs/kurulum.md` (talimatlar 0.5: Cloudflare ve yerel sunucu için yayına alma adımları; göç rehberine
    ve teknoloji önerisinin 9. bölümüne dayanır), yayın öncesi kalanlar (e-posta servisi, TTO adresi, kaydedilen ilanlar).
  - **İlk göç oluşturuldu (14.11.2026):** `src/migrations/20261114_022255_ilk_sema`. Worker ilk istekte uygular (prodMigrations).
    Bundan sonra şema değişikliği yeni bir göçle yapılır (`pnpm payload migrate:create ad`).
  - **Taksonomi:** Test ortamında temel üniversite/bölüm/dil listesi örnek veriyle geliyor. Yayın veritabanına YÖK listesi `scripts/liste-yukle.ts` veya
    gelişmiş ekrandaki “Liste aktarma” ile yüklenir (aksi hâlde aday okulunu bulamaz).
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
  - **D1 sorgu sınırı:** Bir sorguda en fazla 100 bağlı parametre olabilir. Uzun `in` listeleri ve Payload'un toplu
    silmesi (100'den fazla kayıt) “too many SQL variables” verir. Kimlik listeleri `src/altyapi/parcali.ts`
    (`parcaliBul`, `parcalara`, 80'lik parça) ile sorgulanır; toplu silme sayfalı bulup kimlikle parça parça yapılır.
    SQLite testleri bunu yakalamaz; saklama testi yakaladı.
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
