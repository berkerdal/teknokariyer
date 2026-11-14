# TeknoKariyer — Ürün ve Tasarım Talimatları

Sürüm 1 · 13 Kasım 2026

Bu doküman, kurumun ham notlarından (`docs/ham-notlar.md`) ve Claude'un eklemelerinden oluşturuldu. Her maddenin kaynağı
işaretlidir:

| İşaret | Anlamı |
| --- | --- |
| **[K]** | Kurumun notlarından geliyor |
| **[E]** | Claude ekledi; kurum itiraz etmezse geçerli |
| **[?]** | Kurumun kararını bekliyor; koda geçmeden sorulmalı |

Bu talimatlar `CLAUDE.md`'deki genel önerilerden önce gelir. Bir çelişki görürsen kullanıcıya bildir.

---

## 0. Kurum kararları (13 Kasım 2026)

Kurum 19. bölümdeki soruları cevapladı. Bu bölüm, belgenin geri kalanındaki **[?]** işaretli maddelerden önce gelir. Bir çelişki
olursa bu bölüm geçerlidir.

| No | Konu | Karar |
| --- | --- | --- |
| K1 | Eski portalın sorunu | Firmalar ilan girmekte zorlanıyordu; ilanlarını tam olarak yönetemiyorlardı. → İlan oluşturma ve yönetimi ürünün en özenli kısmı olacak (bkz. 0.1). |
| K2 | KVKK ve verinin yeri | Geliştirme ve iç test aşamasında Cloudflare (D1 + R2) kullanılacak. KVKK gerekçesiyle Türkiye'deki bir sunucuya geçmek gerekirse bu kolay olmalı ve dokümante edilmeli (bkz. 0.2). |
| K3 | Firma verisinin kaynağı | ARGEPORTAL başka bir sağlayıcıya ait olduğu için şimdilik entegrasyon yapılmayacak. Yönetici A.Ş., elindeki bilgilerle firmaların iskelet kayıtlarını oluşturacak; firmalar giriş yapıp ayrıntıları kendileri dolduracak. Bunun için sağlam bir iş akışı kurulacak (bkz. 0.3). ARGEPORTAL entegrasyonu ileriye bırakıldı. |
| K4 | İlan onayı | Öneri kabul edildi: her firmanın ilk 3 ilanı onaydan geçer. Sonra Yönetici A.Ş.'nin "güvenilir" olarak işaretlediği firmalar doğrudan yayınlar. Hedef onay süresi 1 iş günü. |
| K5 | Profil görüntüleme bilgisi | Aday, profilini görüntüleyen firmaların adlarını değil yalnızca sayısını görür: "Son 30 günde 4 firma görüntüledi". |
| K6 | CV filigranı | Kabul edildi. İndirilen CV'nin altına küçük ve göze batmayan bir filigran eklenir: firma adı ve indirme tarihi. |
| K7 | İlan sayaçları | Herkese açık ilan sayfasında sayaç **gösterilecek**. Sayacın biçimi (kesin sayı mı aralık mı, görüntülenme de dahil mi) prototipte gösterilip kurumla kesinleştirilecek. Baskı yaratan sahte ifadeler kullanılmaz: "şu an 12 kişi bakıyor", "son şans!" gibi. Sayılar yalnızca gerçek veriden gelir. |
| K8 | İkinci renk ve kimlik | İkinci renk kullanılabilir. **TeknoKariyer için bir alt marka kimliği oluşturulacak** (bkz. 0.4). |
| K9 | Hitap | Adaylara "sen", firmalara ve profesyonellere "siz" denir. Kural: aday arayüzü ve aday e-postaları "sen"; firma paneli, yönetim paneli ve firma e-postaları "siz". |
| K10 | Alan adı ve e-posta | kariyer.pauteknokent.com.tr ve kariyer@pauteknokent.com.tr. DNS'i kimin yöneteceği sonra netleşecek; kod, alan adından bağımsız yapılandırılır. |
| K11 | Yönetici A.Ş. kullanıcıları | Genel Müdür, Genel Müdür Yardımcısı, kurumsal iletişim ve teknokent süreç yöneticileri kullanacak. **Başlangıçta Yönetici A.Ş. kullanıcılarının hepsi tam yetkili "Yönetici" olur.** Sistem rol tabanlı kurulur; moderatör ve raporlayıcı rolleri hazır tutulur ama varsayılan olarak kullanılmaz. Kullanıcı tipleri ve yetkiler, paneller somutlaşınca kurumla birlikte netleştirilecek. |
| K12 | Fotoğraflar | Teknokent fotoğrafları daha sonra verilecek; firma fotoğrafları yayına hazırlık aşamasında toplanacak. Tasarım ve geliştirme sırasında stok fotoğraf **kullanılmaz**. Fotoğraf alanları, fotoğraf olmadan da düzgün görünecek şekilde tasarlanır: firma logosu, tipografi, kare motifi. |
| K13 | Yayın ve pilot | Önce kurum içi test yapılacak: personel test firmaları kurup test kullanıcılarıyla süreçleri deneyecek. Onaylanırsa uygun sunucu ve alan adında yayına alınacak, birkaç firma pilot olarak dahil edilecek (bkz. 0.5). |
| K23 | Sayaç biçimi (K7'nin kesinleşmesi) | İlan sayfasında başvuru sayısı aralıkla gösterilir: “10’dan az başvuru”, “10–50 başvuru”, “50’den fazla başvuru”. Görüntülenme sayısı herkese açık sayfada gösterilmez. |
| K24 | CV havuzunda görünürlük | Aday havuza katılırken açık rıza verir. Rıza metni, Teknokent firmalarının adını, iletişim bilgisini ve CV’sini ayrıca izin istemeden görebileceğini açıkça yazar. Arama sonuç listesinde ad ve iletişim bilgisi gizlidir (anonim özet). Firma bir profili açtığında ad, iletişim bilgisi ve CV görünür; adaya ayrıca sorulmaz. Her açılış kayda geçer; aday yalnızca sayıyı görür (K5). 7. bölümdeki “iletişim talebi” akışı bu kararla kaldırılır. |
| K25 | Cinsiyet | Aday profilinde isteğe bağlı alan; “belirtmek istemiyorum” seçeneği vardır. Havuzdaki anonim özette ve profilde görünür. Cinsiyete göre arama, filtreleme ve sıralama yapılamaz; eşleştirmede kullanılmaz (İş Kanunu md. 5, eşit davranma ilkesi). |
| K26 | Prototip ve teknoloji önerisi | Prototip (29 ekran), favicon ve `docs/teknoloji-onerisi.md` onaylandı (13 Kasım 2026). Geliştirmeye geçildi. |
| K27 | Hesap silme | Aday hesabını silince başvuruları firmada “aday hesabını sildi” olarak kalır; ad, iletişim bilgisi ve CV hemen silinir (14 Kasım 2026). |

### 0.1 İlan yönetiminde tam kontrol (K1'den)

Eski portalın asıl sorunu bu olduğu için ilan yönetimi en özenli tasarlanacak kısımdır. Firma kendi ilanı üzerinde tam
kontrole sahip olur.

**Firmanın ilan üzerinde yapabildikleri:**

- İlanı oluşturur, taslak olarak kaydeder, önizler, yayına gönderir.
- Yayındaki ilanı düzenler.
  - Ufak düzeltmeler (yazım, tarih, açıklama) doğrudan yayına yansır.
  - Esaslı değişiklikler (pozisyon adı, ilan türü, ücret) onay kuralına tabidir; güvenilir firmalarda bu değişiklikler de doğrudan yayına yansır.
  - Neyin esaslı değişiklik sayılacağı kodda tanımlanır ve firmaya açıkça söylenir.
- Yayını duraklatır ve yeniden başlatır: "Başvuru almayı geçici olarak durdur".
- Son başvuru tarihini uzatır (en fazla 60 güne kadar).
- İlanı erken kapatır. Kapatma nedeni seçilir: "pozisyon doldu", "iptal edildi"…
- Kapanmış ilanı yeniden yayınlar.
- İlanı kopyalar; kopyalama şablon olarak kullanılabilir.

**Görünürlük:**

- Her ilanın durumu tek bakışta anlaşılır: taslak, onayda, yayında, duraklatıldı, süresi doldu, kapandı.
- Onaydaki ilanlarda tahmini onay süresi gösterilir.
- Reddedilen ilanda red gerekçesi ve düzeltme yolu gösterilir.

**İş akışı yardımcıları:**

- Firma birden çok ilanı tek ekrandan yönetir. Toplu işlemler yapılabilir: süre uzatma, kapatma.

**Kullanılabilirlik testi:** Kurum içi testte, ilk kez kullanan bir personelin ilanı yardım almadan 5 dakikadan kısa sürede
yayına göndermesi ölçülecek ve raporlanacak.

### 0.2 Veri taşınabilirliği ve göç dokümantasyonu (K2'den)

- **Kod, veritabanı ve dosya depolama sağlayıcısından bağımsız yazılır:**
  - Payload'un veritabanı adaptörü (D1 ↔ PostgreSQL) ve depolama adaptörü (R2 ↔ S3 uyumlu) değiştirilebilir olmalı.
  - Uygulama kodunda doğrudan D1'e özgü SQL ve R2'ye özgü çağrı kullanılmaz. Bunlar gerekiyorsa tek bir katmanda toplanır.
  - Arama, PostgreSQL'e geçişte de çalışacak bir arayüzün arkasına konur.
- **Cloudflare'a özgü servisler** (Turnstile, kuyruklar, cron) tek bir dosyada sarmalanır. Her birinin yerel karşılığı belgelenir.
- **Docker ile yerel kurulum** her zaman çalışır durumda tutulur: PostgreSQL + S3 uyumlu depolama (MinIO). CI'da bu kurulumla da test edilir.
- **`docs/goc-rehberi.md` yazılır ve güncel tutulur.** İçeriği:
  - Hedef mimari: Türkiye'de bir sunucu veya üniversite altyapısı
  - Gereken sunucu kaynakları
  - Veri dışa aktarma ve içe aktarma adımları: D1 → PostgreSQL, R2 → S3 uyumlu depolama
  - DNS geçişi ve kesinti planı
  - Geri dönüş planı
  - Kontrol listesi
- Göç adımları en az bir kez test ortamında baştan sona denenir; sonuç rehbere yazılır.
- Yedekler sağlayıcıdan bağımsız biçimde de alınır: SQL dökümü ve dosya arşivi.

### 0.3 Firma kurulumu (onboarding) iş akışı (K3'ten)

**Amaç:** Yönetici A.Ş. iskelet firma kayıtlarını oluşturur, firmalar kendi hesaplarını devralıp profillerini tamamlar. Hiçbir
firma ara adımda takılıp unutulmamalı.

**1. İskelet kayıtlar**

- Mevcut sitedeki firma rehberinden (121 firma) veri içe aktarılır: unvan, sektör, e-posta, web sitesi, adres, blok ve oda.
- İçe aktarma ekranında Yönetici A.Ş. kayıtları gözden geçirir ve düzeltir:
  - Eksik veya genel e-posta adresleri ("info@") işaretlenir.
  - Aynı firmanın tekrarları işaretlenir.
- Her kayıt "İskelet" durumunda başlar.

**2. Yetkili kişinin belirlenmesi**

- Davetin doğru kişiye gitmesi için her firmaya bir yetkili adı ve kişisel iş e-postası girilir.
- Yetkili e-postası olmayan firmalar ayrı bir listede görünür. Yönetici A.Ş. bu listeyi telefonla tamamlar; liste dışa aktarılabilir.

**3. Davet**

- Davet tek tek veya toplu gönderilir.
- Davet bağlantısı kişiye özeldir, tek kullanımlıktır ve 14 gün geçerlidir. Süresi dolarsa yeniden gönderilebilir.
- Davet e-postası kurumsaldır. "Siz" hitabıyla, kısa ve net yazılır: neden davet edildikleri, ne kadar süreceği, kimin
  arayabilecekleri.

**4. Devralma (sahiplenme)**

- Yetkili bağlantıya tıklar, firma adını ve bilgilerini doğrular, şifresini oluşturur ve iki aşamalı doğrulamayı açar.
- Bilgilerde hata varsa "Bu bilgilerde hata var" diyerek Yönetici A.Ş.'ye not bırakabilir.

**5. Kurulum sihirbazı**

- Adım adım ilerler, her adım kaydedilir, yarıda bırakılıp sonra devam edilebilir:
  1. Temel bilgiler (iskeletten dolu gelir)
  2. Logo ve kapak görseli
  3. Tanıtım metni
  4. Faaliyet alanları ve teknolojiler
  5. Çalışma modeli ve yan haklar
  6. Ekip üyelerini davet etme (isteğe bağlı)
  7. İlk ilan (isteğe bağlı)
- **Profil "yayına hazır" kriteri:** logo, kısa tanıtım ve sektör. Kriter sağlanınca firma profili portalda görünür hâle gelir.

**6. Hatırlatmalar**

- Daveti kabul etmeyen veya sihirbazı yarıda bırakan firmalara 3., 7. ve 14. günde otomatik hatırlatma gider.
- Sonra Yönetici A.Ş.'nin listesine "kişisel takip gerekiyor" olarak düşer.

**7. Takip ekranı (Yönetici A.Ş.)**

- Firma kurulum hunisi gösterilir: İskelet → Davet gönderildi → Devralındı → Profil tamam → İlk ilan verildi.
- Her aşamada kaç firma olduğu ve kimlerin takıldığı görülür.
- Ekrandan tek tıkla hatırlatma gönderilir veya not düşülür: "Aradım, haftaya dolduracak".

**8. Yetkili değişikliği**

- Firmanın yetkilisi işten ayrılırsa firma içindeki başka bir yönetici yetkiyi devralabilir.
- Firmada başka yönetici yoksa Yönetici A.Ş. yeni yetkiliye davet gönderir. Eski yetkilinin erişimi kapanır.
- Her adım işlem kaydına yazılır.

**9. Gelecek**

- ARGEPORTAL'dan veri alınabilirse içe aktarma adımı onunla değiştirilir.
- İçe aktarmayı tek bir modül olarak tasarla; sonradan değiştirmek kolay olsun.

### 0.4 TeknoKariyer alt marka kimliği (K8'den)

TeknoKariyer, Pamukkale Teknokent'in bir alt markası olarak kendi kimliğini taşır; ama ana kimlikle bağı açıkça görünür.

**Hazırlanacaklar:**

1. **Logotype:**
   - "TeknoKariyer" yazımı. Ana logodaki "tekno" yazısının karakterine bağlı kalınır.
   - Yanında veya altında "Pamukkale Teknokent" imzası.
   - Pikselli kare motifinden türetilmiş bir işaret: örneğin kareler, yukarı doğru ilerleyen bir yol oluşturur.
   - Kare motif içinde tek başına kullanılabilecek bir sembol: favicon ve uygulama ikonu.
   - SVG olarak hazırlanır. Renkli, negatif ve tek renk sürümleri olur.
2. **Renk paleti:**
   - Ana kimlikten gelenler: lacivert #2155AD ve camgöbeği #05A1E6.
   - TeknoKariyer'e özgü ikinci renk (öneri: sıcak kiremit/toprak tonu).
   - Nötrler: sıcak kırık beyaz zemin, nötr koyu gri metin.
   - Durum renkleri: başarı, uyarı, hata. Bunlar yalnızca işlevsel kullanılır.
   - Her renk çifti için WCAG kontrast değerleri tablo hâlinde verilir.
3. **Tipografi:** Başlık ve metin yazı tipleri; ölçek ve satır aralıkları; Türkçe glif kontrolü.
4. **Kare ızgara ve grafik dil:** Kare motifinin düzen, işaret, bölüm ayırıcı ve grafiklerde nasıl kullanılacağı.
5. **Ses tonu:** "Sen/siz" kuralı (K9), yasak ifadeler listesi ve örnek metinler: buton, hata, boş durum, e-posta.
6. **Uygulama örnekleri:** İlan paylaşım kartı (LinkedIn önizlemesi), e-posta şablonu, sosyal medya duyuru görseli şablonu.

**Teslim şekli:**

- Kimlik dokümanı `docs/kimlik/` altında olur.
- Tasarım değişkenleri (token) kodda olur.
- Kimlik, ekran tasarımlarından önce kurumun onayına sunulur. Önerinin 2 alternatifi gösterilir.
- Kimlik, 15. bölümdeki jenerik tasarım yasaklarına tabidir. Hazır şablon logo kullanılmaz; bir harf ve bir ikonun yan yana konmasıyla yetinilmez.

### 0.5 Kurum içi test ortamı (K13'ten)

- **Ortamlar:** Yayın ortamından ayrı bir "test" ortamı kurulur; kurum personeli burada dener.
- **Örnek veri:** Test ortamı için tek komutla kurulabilen bir örnek veri seti hazırlanır.
  - Test firmaları, test adaylar, farklı durumlarda ilanlar ve başvurular bulunur.
  - Örnek veri gerçekçidir ama gerçek kişisel veri içermez.
  - Test firmaları açıkça "TEST" olarak işaretlenir.
- **Test e-postaları:** Test ortamında giden e-postalar gerçek alıcılara gitmez. Bir test posta kutusunda toplanır ve panelden görüntülenir.
- **Test senaryoları dokümanı (`docs/test-senaryolari.md`):**
  - Personelin adım adım uygulayacağı senaryolar: firma kurulumu, ilan verme, başvuru, havuz iletişim talebi, onay, KVKK talepleri.
  - Her senaryoda beklenen sonuç yazılır.
  - Geri bildirimin nasıl iletileceği de yazılır.
- **Yayın hazırlığı:** Test ortamındaki veri yayına taşınmaz. Yayın ortamı temiz başlar; içine yalnızca firma iskeletleri aktarılır.
- **Kurulum ve yayın rehberi (`docs/kurulum.md`):** "Uygun sunucuya ve alan adına yayına alma" adımları. Hem Cloudflare hem yerel sunucu seçeneği için yazılır.

---

## 1. Ürünün tanımı

**[K]** TeknoKariyer, Pamukkale Teknokent'in kariyer portalıdır.

- İlanları **yalnızca Pamukkale Teknokent firmaları** verir.
- **Herkes** başvurabilir: öğrenci, yeni mezun, deneyimli profesyonel, yabancı uyruklu aday.
- Model kariyer.net'e benzer, ama tek bir teknokentin firmalarına özel ve daha küçük ölçekli.

**[E] Ürünün özü:** Bir aday Denizli'de ya da uzaktan çalışabileceği Ar-Ge işini bulsun ve iki dakikada başvursun. Bir firma doğru adayı
ilan açmadan bulabilsin. Teknokent yönetimi de bölgedeki istihdamı ilk kez ölçebilsin.

**[E] Eski portalın neden atıl kaldığı bilinmiyor.** Kurumdan öğrenilmeli. Bu yapılmazsa yeni portalın da aynı şekilde atıl kalma riski var.

**[E] Atıllığa karşı tasarım kararları:**

- Firmanın ilan açması 5 dakikadan kısa sürmeli; önceki ilanı kopyalayıp düzenleme imkânı olmalı.
- Süresi dolan ilanlar otomatik kapanmalı; ölü ilan kalmamalı.
- Firma, yeni başvurulardan e-posta özetiyle haberdar olmalı.
- Ana sayfa gerçek ve güncel ilanlarla açılmalı. Bunu boş bir "hero" alanı değil, ilanlar göstermeli.

## 2. Kullanıcı tipleri ve roller

| Rol | Kim | Ne yapar |
| --- | --- | --- |
| Ziyaretçi | Giriş yapmamış herkes | İlanları ve firma profillerini görür, arar, filtreler. Başvurmak için hesap açması gerekir. |
| Aday **[K]** | Herkes | Profil oluşturur, CV yükler, başvurur, CV havuzuna katılır, başvurularını takip eder. |
| Firma yöneticisi **[K]** | Teknokent firmasının yetkilisi | Firma profilini yönetir, ilan verir, başvuruları yönetir, CV havuzunda arama yapar. |
| Firma ekip üyesi **[E]** | Firmanın İK veya teknik ekibi | Firma yöneticisinin verdiği yetki kadar işlem yapar (ör. yalnızca başvuruları görür). |
| Teknokent yöneticisi **[K]** | Pamukkale Teknokent Yönetici A.Ş. | Her şeyi görür ve yönetir. |
| Teknokent moderatörü **[E]** | Yönetici A.Ş. personeli | İlan onayı ve içerik denetimi yapar; ayarları değiştiremez. |
| Raporlayıcı **[E]** | Üst yönetim | Yalnızca panoları ve raporları görür. |

**[E] Yetki kontrolleri** her zaman sunucu tarafında yapılır. Yetkisi olmayan kullanıcıya işlem düğmesi gösterilmez.

## 3. Firma hesapları

**[E] Firma hesapları davetle açılır.** Teknokent firmalarına özel bir platform olduğu için kimse kendi kendine firma hesabı açamaz.

1. Yönetici A.Ş. firmayı sisteme ekler.
   - İlk kurulumda mevcut sitedeki firma rehberi içe aktarılır: 121 firma; unvan, sektör, iletişim bilgileri, blok ve oda.
2. Firma yetkilisine davet e-postası gider.
3. Yetkili şifresini belirler ve iki aşamalı doğrulamayı açar.

**[E] Kendi kendine kayıt yerine "Firmam listede yok" formu bulunur.** Firma bu formla talepte bulunur; talep Yönetici A.Ş.'nin onayına düşer.

**[E] Firma teknokentten ayrılırsa** Yönetici A.Ş. hesabı pasifleştirir.

- Firmanın açık ilanları kapanır.
- Mevcut başvuruların ne olacağı KVKK saklama kurallarına göre belirlenir.

**[?] Firma verisinin tek doğru kaynağı hangi sistem olacak?** Seçenekler: portal, ARGEPORTAL veya yeni sitenin CMS'i. İleride ARGEPORTAL ile tek oturum açma düşünülüyor mu?

### Firma profili

**[K]** Firma profili estetik ve çekici olmalı.

Profilde şunlar yer alır **[E]**:

- Logo (zorunlu alt metinle)
- Kapak görseli: gerçek ofis veya ekip fotoğrafı
- Kısa tanıtım (en fazla 300 karakter) ve uzun tanıtım
- Faaliyet alanları: sabit sektör listesinden seçilir
- Teknoloji yığını ve uzmanlık etiketleri: beceri taksonomisinden seçilir
- Kuruluş yılı
- Çalışan sayısı aralığı
- Teknokent'teki konumu (ör. "B Blok, G19")
- Web sitesi ve sosyal medya hesapları
- Çalışma modeli: ofiste, hibrit veya uzaktan
- Yan haklar
- Fotoğraf galerisi (en fazla 8)
- Açık ilanlar ve kapanmış ilan sayısı

**[E] Profil sayfası bir firma vitrini olmalı:** "Burada çalışmak nasıl bir şey?" sorusunu cevaplamalı. Tasarımı firmanın gerçek fotoğrafları ve içeriği taşımalı.

Firma profili eksikse yayına girmez. En az şunlar gerekir: logo, kısa tanıtım ve sektör.

## 4. İlanlar

### Türler

**[K]** İki ana tür var: staj ve iş.

**[E] Alt türler:**

- **Staj:**
  - zorunlu staj (okul tarafından istenen)
  - gönüllü staj
  - uzun dönem staj (dönem içi)
  - yaz stajı
- **İş:**
  - tam zamanlı
  - yarı zamanlı
  - proje bazlı / sözleşmeli

### İlan formu

**[K]** Firma beklentilerini ve şartnameyi yazar.

**[E]** Formdaki alanlar:

| Alan | Zorunlu mu | Not |
| --- | --- | --- |
| Pozisyon adı | Evet | |
| İlan türü ve alt tür | Evet | |
| Pozisyon ailesi | Evet | Sabit liste: yazılım geliştirme, gömülü sistemler, donanım/elektronik, makine tasarımı, veri, tasarım/UX, test/QA, satış/pazarlama, idari/mali… |
| Çalışma modeli | Evet | ofiste / hibrit / uzaktan |
| Konum | Evet | Varsayılan: Pamukkale Teknokent |
| Deneyim seviyesi | Evet | öğrenci / yeni mezun / 1–3 yıl / 3–5 yıl / 5+ yıl |
| Eğitim düzeyi | Evet | |
| Tercih edilen bölümler | Hayır | Bölüm listesinden çoklu seçim |
| Aranan beceriler | Evet | Taksonomiden seçilir. "Zorunlu" ve "tercih sebebi" diye ikiye ayrılır. |
| Dil şartları | Hayır | Dil ve seviye |
| Pozisyon sayısı | Hayır | |
| Son başvuru tarihi | Evet | En fazla 60 gün sonrası |
| Başlangıç tarihi | Hayır | |
| Ücret aralığı | Hayır | "Görünsün" ve "gizli" seçenekleriyle. Gizliyse bile eşleştirmede kullanılabilir. |
| Yan haklar | Hayır | Firma profilinden otomatik gelir, değiştirilebilir. |
| İş tanımı | Evet | Ne yapacaksın? |
| Aranan nitelikler | Evet | |
| Şartname / ek belge | Hayır | PDF, en fazla 5 MB **[K]** |
| Ön eleme soruları | Hayır | En fazla 5 soru. Tipler: kısa cevap, evet/hayır, çoktan seçmeli. Bir soru "eleyici" olarak işaretlenebilir. |
| LinkedIn metni | Hayır | Ayrı kısa metin, en fazla 700 karakter **[K]** |
| İlanın dili | Evet | TR, EN veya her ikisi |

**[E] Staja özel alanlar:**

- Staj dönemi
- Ücretli mi?
- SGK'yı kim karşılıyor?
- Zorunlu staj belgesi imzalanıyor mu?
- PAÜ öğrencilerine öncelik var mı?

### Formun çalışma şekli

**[E]**

- Taslak otomatik kaydedilir. Kaydedilmemiş değişiklik varsa sayfadan çıkarken uyarı verilir.
- Yayına göndermeden önce ilan adayın göreceği şekliyle önizlenir.
- Önceki bir ilan kopyalanarak yeni ilan başlatılabilir.

### İlanın yaşam döngüsü

**[E]** Taslak → Onay bekliyor → Yayında → Süresi doldu / Kapatıldı (doldu, iptal) → Arşiv.

- **[?] Onay politikası:** İlanlar yayından önce Yönetici A.Ş. onayından geçecek mi?
  - Öneri: ilk 3 ilan onaydan geçsin. Sonrasında Yönetici A.Ş. firmayı "güvenilir" işaretlerse ilanları doğrudan yayına girsin.
  - Onay için hedef süre 1 iş günü.
- **İlan reddedilirse** ret gerekçesi firmaya yazılı iletilir.
- **[E] Moderasyon kontrol listesi** (yasal ve etik açıdan):
  - İlanda yaş, cinsiyet veya medeni hâl şartı olmamalı.
  - Ücretsiz "deneme çalışması" istenmemeli.
  - İlan gerçekten firmanın kendi pozisyonu olmalı.
- **Kapanmış ilanın adresi 404 vermez.** Sayfa "Bu ilan kapandı" bilgisini ve firmanın açık ilanlarını gösterir; HTTP 410 döner.

### LinkedIn'de paylaşım

**[K]** Firma, ilanı kendi LinkedIn hesabında yayınlayabilmeli.

**[E] Gerçekçi değerlendirme:**

- LinkedIn'in iş ilanı yayınlama API'si yalnızca onaylı iş ortaklarına açık.
- Şirket sayfası adına gönderi paylaşmak için Community Management API onayı gerekiyor; bu onay haftalar sürebilir ve garanti değil.

**Faz 1 — çalışan çözüm:**

- "LinkedIn'de paylaş" düğmesi bulunur.
- Firmanın yazdığı LinkedIn metni ve ilan bağlantısı hazırlanır.
- Metin tek dokunuşla kopyalanır ve LinkedIn paylaşım penceresi açılır.
- İlan sayfası, LinkedIn önizlemesinde düzgün görünmesi için Open Graph görseli üretir. Görsel; pozisyon, firma logosu ve teknokent kimliğini içeren otomatik bir karttır.
- Paylaşılan bağlantıya kaynak etiketi eklenir (`?kaynak=linkedin`). Böylece LinkedIn'den gelen başvurular istatistikte görünür.

**Faz 2:** LinkedIn API onayı alınırsa doğrudan paylaşım yapılır.

**[E] Google for Jobs:**

- Her ilan `JobPosting` yapılandırılmış verisi ile yayınlanır.
- Böylece ilanlar Google'ın iş aramasında ücretsiz görünür.
- Kapanan ilanlardaki yapılandırılmış veri güncellenir.

## 5. Aday profili ve başvuru

### Profil

**[K]** Profil bir kez doldurulur, her başvuruda otomatik kullanılır.

**[E]** Profildeki bölümler:

- Kimlik ve iletişim bilgileri
- Kısa tanıtım (en fazla 500 karakter)
- Eğitim: okul ve bölüm listeden seçilir; mezuniyet tarihi, GANO isteğe bağlı
- Deneyim
- Beceriler: taksonomiden seçilir, seviyeli
- Diller: CEFR seviyesiyle
- Sertifikalar
- Projeler ve portfolyo bağlantıları: GitHub, Behance, LinkedIn, kişisel site
- Tercihler: ilan türleri, çalışma modeli, başlayabileceği tarih, şehir ve taşınmaya açıklık, ücret beklentisi (isteğe bağlı, yalnızca CV havuzunda kullanılır)
- Askerlik durumu: isteğe bağlı, yalnızca adayın kendisi girerse
- Engellilik durumu ve uyarlama ihtiyacı: isteğe bağlı, adayın kendisi girerse; özel nitelikli kişisel veri olduğu için ayrı açık rıza alınır

### CV dosyaları

**[K]** Aday CV yükleyebilir.

**[E]**

- En fazla 3 CV saklanabilir (ör. "TR genel", "EN"). Başvururken hangisinin gönderileceği seçilir.
- Yalnızca PDF, en fazla 5 MB. Yüklemede virüs taraması yapılır.

**[E] CV'den otomatik profil doldurma Faz 2'de.**

- CV'nin otomatik okunmasıyla profil alanları önerilir; aday her alanı onaylar.
- KVKK değerlendirmesi gerekir: bir yapay zekâ servisine veri gönderilecekse ayrı aydınlatma yapılmalı.

**[E] Profil tamamlanma göstergesi:** Puan veya rozet yerine sade bir liste kullanılır: "Eksik: beceriler, dil". Her eksik maddenin yanında doğrudan o alana giden bağlantı bulunur.

### Başvuru akışı

**[K] [E]**

1. Aday ilanda "Başvur" düğmesine basar.
2. Profili eksikse yalnızca ilanın gerektirdiği eksik alanlar sorulur.
3. Aday hangi CV'nin gönderileceğini seçer.
4. Ön yazı isteğe bağlıdır.
5. Ön eleme soruları cevaplanır.
6. Aydınlatma metni onaylanır.
7. Ayrı ve **varsayılan olarak işaretsiz** bir kutu bulunur: "Bilgilerimi CV havuzuna ekle" **[K]**.
8. Gönder.

- **Hedef:** Profili tamam olan aday mobilde **en fazla 3 ekranda** başvurabilmeli.
- **Başvuru anında profilin kopyası dondurulur.** Aday profilini sonradan değiştirse de firma, başvuru anındaki bilgiyi görür.
- **Aynı ilana iki kez başvurulamaz.** Aday başvurusunu geri çekebilir.

**[E] Başvuru durumları:** Alındı → İnceleniyor → Görüşme → Teklif → Olumlu / Olumsuz / Aday geri çekti.

- Aday kendi panelinde durumu görür.
- "Olumsuz" kararı nazik bir şablonla bildirilir. Firma bu bildirimi kapatamaz.
- **Amaç:** Adayın başvurusunun yanıtsız kalmasını önlemek. Kariyer portallarına duyulan güvensizliğin en büyük nedeni başvuruların karanlıkta kalmasıdır.

**[E] Kaydetme ve hatırlatma:** Aday ilanları kaydedebilir. Kaydedilen ilanın son başvuru tarihine 2 gün kala hatırlatma e-postası gider.

## 6. Firmanın başvuru yönetimi

**[K]** Firmalar CV'leri indirebilmeli ve başvuru bilgilerini temiz bir şekilde görebilmeli.

### Başvuru listesi

**[E]**

- İlan bazında ve tüm ilanlar için ayrı ayrı görüntülenebilir.
- Filtreler: durum, beceri eşleşmesi, ön eleme cevabı, eğitim, başvuru tarihi.
- Sıralama yapılabilir.
- Toplu işlem: durum değiştirme ve şablonlu e-posta gönderme.

### Başvuru detayı

**[E]**

- Tek ekranda okunabilir bir aday özeti: üstte ilanın şartlarıyla eşleşme özeti (bkz. 8. bölüm), ardından profil, ön eleme cevapları ve CV önizlemesi.
- Bu özet "Başvuru PDF'i" olarak da indirilebilir.

### İndirme

**[E]**

- CV tek tek veya seçilenler toplu ZIP olarak indirilebilir.
- Her indirme kayıt altına alınır: kim, ne zaman.
- **[?] İndirilen CV'ye filigran eklensin mi?** Filigranda firma adı ve tarih yer alır; CV'nin kontrolsüz paylaşımını caydırır.

### Ekip içi değerlendirme

**[E]**

- Adaya not, etiket ve 1–5 arası puan verilebilir.
- Bunları yalnızca firma ekibi görür; aday görmez.

### Görüşme daveti

**[E]**

- Firma tarih seçenekleri önerir, aday birini seçer.
- Takvim dosyası (.ics) gönderilir.
- Bu özellik Faz 1'de basit tutulabilir.

### İletişim

**[E] Faz 1'de** platform üzerinden şablonlu e-posta gönderilir.

**[?] Platform içi mesajlaşma Faz 2'de mi?**

## 7. CV havuzu

> **Güncelleme (K24, K25):** İletişim talebi akışı kaldırıldı. Firma, rıza veren adayın profilini açtığında ad, iletişim bilgisi ve CV’yi görür; arama listesinde ad ve iletişim gizlidir. Cinsiyet isteğe bağlıdır, görünür ama filtrelenemez. Aşağıdaki maddelerden bunlarla çelişenler geçersizdir.

**[K]**

- Adaylar başvururken ya da başvurmadan doğrudan CV havuzuna katılabilir.
- Firmalar ilan açmadan havuzda filtreyle arama yapıp aday bulabilir.

**[E] Mahremiyet ve KVKK:**

- Havuza katılım ayrı bir açık rızayla olur. Bu rıza 12 ayda bir yenilenir; yenilenmezse aday havuzdan otomatik çıkar.
- Aday görünürlüğünü seçer:
  - "Aktif iş arıyorum"
  - "Fırsatlara açığım"
  - "Gizle"
- Aday mevcut işvereninden gizlenmeyi seçebilir. Örneğin teknokentte bir firmada çalışan aday, o firmanın kendisini görmesini engelleyebilir.
- Havuzda firmalar önce **iletişim bilgisi ve CV dosyası olmadan** bir profil özeti görür: beceriler, eğitim, deneyim, tercihler.
- Firma "iletişim talebi" gönderir. Talep, kısa bir mesaj ve varsa ilgili pozisyonu içerir.
- Aday kabul ederse iletişim bilgileri ve CV o firmaya açılır. **İletişim, adayın onayıyla başlar.**
- Her profil görüntülemesi kayıt altına alınır. Aday "Profilimi son 30 günde 4 firma görüntüledi" bilgisini görebilir; firma adlarının görünüp görünmeyeceği **[?]** kurumun kararıdır.

**[E] Kayıtlı arama ve uyarı:** Firma bir aramayı kaydeder. Yeni eşleşen adaylar için haftalık e-posta alır.

**[E] Havuz durumu firma panelinde de yönetici panelinde de görünür:** Yönetici A.Ş., havuzun büyüklüğünü ve bölüm/beceri dağılımını görür. Bu bilgi bölgenin yetenek arzını gösterir; yönetim için değerli bir veridir.

## 8. Arama, filtre ve eşleştirme (kritik)

**[K]** Filtre sistemi çok iyi tasarlanmalı. Doğru eşleşmeyi sağlayan şey bu.

**[E] İyi bir filtrenin temeli serbest metin değil, yapılandırılmış veridir.** Bu nedenle aşağıdaki listeler Yönetici A.Ş. tarafından yönetilen **taksonomiler** olarak tutulur:

- Beceriler (eş anlamlılarla: "JS" = "JavaScript", "React.js" = "React")
- Pozisyon aileleri
- Sektörler
- Üniversiteler ve bölümler (YÖK listesinden)
- Diller

İlan da aday profili de aynı taksonomiyi kullanır. Eşleştirme ancak böyle doğru çalışır.

### Aday tarafında ilan arama

**[E]**

- **Anahtar kelime araması:** Türkçe karakterlere duyarsız olmalı ("yazilim" = "yazılım"). Pozisyon adında, becerilerde ve firma adında aranır.
- **Filtreler:**
  - ilan türü ve alt tür
  - çalışma modeli
  - pozisyon ailesi
  - beceri
  - deneyim seviyesi
  - eğitim düzeyi ve bölüm
  - firma ve firma sektörü
  - yayın tarihi
  - son başvuruya kalan süre
  - ücretli staj
  - ücret bilgisi olan ilanlar
- **Her seçeneğin yanında sonuç sayısı** görünür. Sonuç vermeyecek seçenek pasif görünür.
- **Filtre durumu adreste (URL) tutulur.** Böylece bir arama paylaşılabilir, sayfa yenilendiğinde kaybolmaz.
- **Mobilde filtre alt panel olarak açılır.** Sonuç sayısı canlı güncellenir: "42 ilanı göster".
- **Kayıtlı arama ve yeni ilan bildirimi:** Aday, e-posta bildiriminin anlık mı haftalık mı geleceğini seçer.

### Firma tarafında CV havuzu araması

**[E]**

- Filtreler:
  - beceri (zorunlu becerilerin hepsi / herhangi biri)
  - deneyim yılı
  - eğitim ve bölüm
  - mezuniyet yılı aralığı
  - dil ve seviye
  - çalışma tercihleri
  - başlayabileceği tarih
  - şehir / taşınmaya açıklık
  - havuzdaki görünürlük durumu
- Anahtar kelime araması profilde ve CV metninde yapılır.

### Eşleşme göstergesi

**[E]**

- **Kara kutu bir "%87 uyum" puanı kullanılmaz.** Bunun yerine **açıklanabilir bir özet** gösterilir: "Zorunlu 5 becerinin 4'ü var · Hibrit tercih ediyor · Bölüm uyuyor · Eksik: Docker".
- Sıralama bu kurallara dayalı skorla yapılır. Kuralların ağırlıkları yönetici panelinden ayarlanabilir.
- Aday tarafında aynı mantık ters yönde çalışır: "Bu ilan için profilinde eksik: İngilizce B2."
- **[E] Gerekçe:** Firmanın ve adayın kararı kendisinin vermesi gerekir. Açıklanmayan bir yapay zekâ puanı hem güven sorunu hem de ayrımcılık riski yaratır.

## 9. İstatistikler

**[K]** İlanlar için sayaç ve istatistik olmalı.

### Firma panelinde, ilan bazında

**[E]**

- Görüntülenme ve tekil ziyaretçi
- Başvuru sayısı ve görüntülenmeden başvuruya dönüşüm oranı
- Trafik kaynakları: portal araması, LinkedIn, doğrudan bağlantı, Google
- Durumlara göre başvuru hunisi
- İlk başvurunun gelme süresi

### Herkese açık ilan sayfasında

**[E]**

- Yalnızca bilgi veren göstergeler bulunur: yayın tarihi, son başvuru tarihi.
- "250 kişi baktı!" gibi baskı yaratan sayaçlar kullanılmaz.
- **[?] "Başvuru sayısı: 10'dan az / 10–50 / 50+" aralığı gösterilsin mi?**

### Kişisel veri olmadan ölçüm

**[E]**

- Ziyaretçi istatistikleri çerez kullanmadan ve kişisel veri tutmadan ölçülür.
- Pazarlama çerezi kullanılmaz.

## 10. Teknokent Yönetici A.Ş. paneli (yönetim merkezi)

**[K]** Bu panel tamamen ayrı bir yönetim merkezi olmalı. Firma panelinden farklı tasarlanmalı ve kendi amacına hizmet etmeli.

### Açılış ekranı

**[E] Açılış ekranı bir "iş listesi" olmalıdır:** Yöneticinin bugün ne yapması gerektiğini gösterir.

- Onay bekleyen ilanlar (bekleme süresiyle)
- Firma hesap talepleri
- KVKK başvuruları
- Şikâyet edilen ilanlar
- Hiç başvuru almadan süresi dolmak üzere olan ilanlar (firmaya hatırlatma gönderme düğmesiyle)

### Pano

**[E]** Panoyu kararlara göre kur. Hazır "4 KPI kartı ve bir alan grafiği" şablonu kullanma. Sorular ve gösterilecek veriler:

| Soru | Veri |
| --- | --- |
| Portal kullanılıyor mu? | Aktif ilan, yeni başvuru, yeni aday sayısı; geçen dönemle karşılaştırmalı |
| Hangi firmalar aktif, hangileri hiç ilan vermiyor? | Hiç ilan vermeyen firmaların listesi, iletişim düğmesiyle |
| Bölgenin yetenek ihtiyacı ne? | En çok aranan beceriler; aday arzı ile firma talebi arasındaki fark |
| Adaylar nereden geliyor? | Üniversite, bölüm ve şehir dağılımı; PAÜ oranı |
| İlanlar sonuç veriyor mu? | Başvuru hunisi; teklif ve olumlu sonuç oranı |

**[E] Dönem raporu:** Excel ve PDF olarak alınabilir. Faaliyet raporlarına ve üniversite-sanayi iş birliği raporlarına veri sağlar.

### Yönetim işleri

**[E]**

- Firma yönetimi: davet, pasifleştirme, kullanıcı ekleme ve çıkarma, "güvenilir firma" işareti.
- İlan moderasyonu: onay, ret gerekçesi, yayından kaldırma.
- Aday hesapları: askıya alma, KVKK talepleri (veri dökümü, silme).
- Taksonomi yönetimi: beceri, bölüm, sektör; eş anlamlıları birleştirme.
- E-posta şablonları; Türkçe ve İngilizce.
- Duyurular: portal ana sayfasında görünen kariyer günü veya staj dönemi gibi kısa duyurular.
- Site metinleri: KVKK aydınlatma metni, sıkça sorulan sorular, kullanım koşulları.
- **İşlem kayıtları:** Kim neyi ne zaman değiştirdi. Değiştirilemez ve aranabilir olmalı.
- Sistem ayarları: ilan süresi üst sınırı, onay politikası, eşleşme ağırlıkları, saklama süreleri.

## 11. Bildirimler

**[E]** E-posta ve panel içi bildirim. Her kullanıcı tercihlerini ayarlayabilir; zorunlu işlem e-postaları hariç.

| Kime | Ne zaman |
| --- | --- |
| Aday | Başvuru alındı · durum değişti · kayıtlı aramaya yeni ilan · havuzdan iletişim talebi · kaydedilen ilanın süresi doluyor · havuz rızasının yenilenmesi |
| Firma | Yeni başvuru (anlık veya günlük özet) · ilan onaylandı/reddedildi · ilanın süresi 3 gün içinde doluyor · havuz iletişim talebi kabul/ret · kayıtlı havuz aramasına yeni aday |
| Yönetici | Onay kuyruğu günlük özeti · yeni firma talebi · KVKK başvurusu · şikâyet |

**[E] E-posta tasarımı:**

- Sade, metin ağırlıklı ve kurumsal.
- Gönderen adresi kurumun alan adından olmalı.
- **[?]** Gönderen adresi, ör. kariyer@pauteknokent.com.tr
- **[?]** E-posta servisi

## 12. KVKK, güvenlik ve kötüye kullanım

### KVKK

**[E]**

- **Veri sorumluluğu:** Yönetici A.Ş. veri sorumlusudur.
  - **[?]** Firma, başvuru verisini aldıktan sonra ayrıca veri sorumlusu olur mu? Bu ilişki hukuk biriminin onayıyla tanımlanmalı ve aydınlatma metnine yazılmalı.
- **Rızalar ayrı ayrı alınır:**
  - başvuru aydınlatması
  - CV havuzu açık rızası
  - özel nitelikli veri rızası
  - ticari ileti onayı (varsayılan kapalı)
- Her onay, metnin sürümüyle birlikte kaydedilir.
- **Saklama süreleri** ayarlanabilir. Öneri: ilan kapandıktan 12 ay sonra başvurular anonimleştirilir, CV dosyaları silinir.
- **Adayın hakları:**
  - Tek tuşla tüm verisini indirebilir.
  - Hesabını silebilir. Silinen hesabın aktif başvuruları firmalarda "aday hesabını sildi" olarak görünür.
- **[?] Verinin nerede tutulacağı:** Cloudflare (yurt dışı) mı, Türkiye'deki bir sunucu mu? Kurumun KVKK sorumlusu ve hukuk birimi karar vermeli. Bkz. CLAUDE.md 7. bölüm.

### Güvenlik

**[E]**

- OWASP ASVS seviye 2 hedeflenir.
- **İki aşamalı doğrulama** firma ve yönetici hesaplarında zorunlu, adaylarda isteğe bağlıdır.
- **Oturumlar:** kısa ömürlü; HttpOnly, Secure ve SameSite çerezleriyle.
- **Bot ve kötüye kullanım koruması:**
  - Kayıt, giriş ve başvuru formlarında bot koruması (Turnstile) bulunur.
  - Giriş denemeleri ve başvurular için istek sınırlaması yapılır.
- **CV'lerin korunması:**
  - CV'ler açık bir adresten indirilemez. Yalnızca yetkili kullanıcıya, kısa süreli imzalı bağlantıyla verilir.
  - Yüklemede virüs taraması yapılır.
- Güvenlik başlıkları (CSP, HSTS, frame-ancestors) ayarlanır.
- Bağımlılık açıkları otomatik taranır.
- Yayın öncesinde bağımsız bir sızma testi yaptırılması önerilir.

### Kötüye kullanım

**[E]**

- Aday bir ilanı şikâyet edebilir: sahte ilan, ayrımcı ilan, ücret talep eden ilan.
- Şikâyetler moderasyon kuyruğuna düşer.

## 13. Mobil

**[K]** Mobil tasarım uçtan uca ele alınmalı. Gerekirse sıfırdan düşünülmeli.

**[E] Mobil, masaüstünün küçültülmüş hâli değildir.** Aday tarafı mobil için ayrı tasarlanır, masaüstüne sonra genişletilir.

**[E] Mobil ilkeleri:**

- **Başparmak erişimi:**
  - Asıl işlem düğmesi ("Başvur", "Filtrele") ekranın alt kısmında sabit durur.
  - Dokunma alanları en az 44×44 px olur.
- **İlan listesi:** Yoğun ve taranabilir satırlar kullanılır; büyük kartlar kullanılmaz. Ekranda en az 4 ilan görünmelidir.
- **İlan detayı:**
  - Önce özet gelir: firma, tür, model, son tarih, eşleşme özeti.
  - Ardından açılır-kapanır bölümler gelir.
  - "Başvur" düğmesi her zaman görünür kalır.
- **CV yükleme:** Telefonun dosyalarından, Google Drive'dan ve iCloud'dan yüklemeyi destekler. Formlar mobil klavye türlerini doğru kullanır: e-posta, telefon, sayı.
- **Firmanın mobil kullanımı:** Firma yöneticisi telefondan yeni başvuruları görebilmeli, durum değiştirebilmeli ve CV açabilmelidir.
  - **İlan oluşturmak** mobilde mümkün olmalı, ama masaüstü öncelikli kabul edilebilir.
- **Yönetim paneli:** Onay kuyruğu mobilde çalışmalıdır; pano ve raporlar masaüstü önceliklidir.
- **[E] PWA (ana ekrana ekleme, anlık bildirim) Faz 2'de.**
- **Test cihazları:** 360 px Android, 390 px iPhone, 768 px tablet. Gerçek cihazda ve yavaş 4G hızında test edilir.

## 14. Dil

**[K]** Türkçe ve İngilizce.

**[E]**

- Arayüzün tamamı iki dilde olur: tarih seçici, hata mesajları, e-postalar dahil.
- İlan içeriği firmanın seçtiği dilde yazılır. İngilizce arayüzde Türkçe ilan "Bu ilan Türkçe yayınlanmıştır" notuyla gösterilir.
- Adresler: `/tr/...` ve `/en/...`. hreflang etiketleri ve iki dilli sitemap bulunur.
- Arayüz metinlerinde Türkçe ve İngilizce asla karışmaz.

## 15. Tasarım ilkeleri ve "jenerik/AI tasarımı" yasakları

**[K]** "AI kokan" jenerik tasarım kesinlikle istenmiyor.

Kurumun ilettiği listeye eleştirel yaklaşıldı. Liste çoğunlukla doğru tespitler içeriyor, ama sorun tek tek öğelerde değil. Sorun, bu öğelerin **içerikten ve görevden bağımsız, varsayılan olarak** kullanılması. Yuvarlak köşe, ikon veya beyaz alan tek başına kötü değildir; amaçsız kullanıldığında kötüdür. Bu yüzden aşağıda yasakların yanında bir **karar ilkesi** de var: **her görsel öğe, kullanıcının bir işini kolaylaştırdığını ya da Pamukkale Teknokent'e ait gerçek bir bilgiyi taşıdığını kanıtlamalıdır.**

### 15.1 Kimlik ve renk

- **Renk sistemi:**
  - Ana renk: lacivert #2155AD
  - Vurgu: camgöbeği #05A1E6
  - Zeminler: soğuk mavi-gri değil, hafif sıcak kırık beyaz ve kâğıt tonları
  - Metin: mavimsi değil, nötr koyu gri
- **Maviyi azaltan ikinci bir kimlik rengi:** Pamukkale'nin traverten beyazı ve termal suyun turkuazı zaten camgöbeğine karşılık geliyor. Buna ek olarak az kullanılan, sıcak bir **kiremit/toprak** tonu önerilir; sınırlı vurgularda ve önemli seçili durumlarda kullanılır.
  - **[?]** Bu ikinci rengin kurumca onaylanması gerekir.
- **Mavi yalnızca anlam taşıdığı yerde kullanılır:** ana eylem, bağlantı, seçili durum. Geniş yüzeyler nötr kalır. Böylece tasarım "mavide boğulmaz" **[K]**.
- **Logodaki pikselli kare motifi tasarımın yapısal öğesidir, süs olarak serpiştirilmez:**
  - Sayfa ızgarası bu kare modülüne dayanır.
  - Bölüm işaretleri ve liste imleçleri küçük kareler olur.
  - Grafiklerde (ör. başvuru hunisi) kare birimler kullanılabilir.
- **Logo testi:** Logoyu ve renkleri kaldırdığımızda tasarım hâlâ Pamukkale Teknokent'e ait görünmeli. Bunu sağlayacak unsurlar:
  - gerçek firma adları ve logoları
  - "B Blok G19" gibi konum bilgisi
  - PAÜ bölümleri
  - Denizli bağlamı
  - kare motifi

### 15.2 Yasak listesi

- **Görsel efektler:**
  - Mor, mavi veya herhangi bir renk geçişli (gradient) zeminler ve butonlar
  - Mesh gradient, glow, parlama, bulanık daireler
  - Glassmorphism, buzlu cam paneller
  - Soyut "teknoloji" illüstrasyonları, devre ve nöron desenleri, 3D blob'lar
- **Görseller:**
  - Stok fotoğraf
  - Yapay zekâyla üretilmiş insan görseli
  - Gerçek ekip ve ofis fotoğrafı yoksa yer tutucu insan fotoğrafı yerine firma logosu ve tipografi kullanılır.
- **Rozetler ve göstergeler:**
  - Anlamsız rozetler: "Yeni ✨", "🔥 Popüler", "AI destekli", "Beta", "Sistem aktif", "Canlı" yeşil nokta gibi süs durum göstergeleri.
  - Rozet yalnızca gerçek ve faydalı bir durumu ifade ediyorsa kullanılır: "Ücretli staj", "Uzaktan", "PAÜ öğrencisine öncelik", "Son 2 gün".
  - **Nasıl olacağı:** Rozetler düz metin etiketi gibi tasarlanır; hap şeklinde parlak zeminler kullanılmaz.
- **İkonlar:**
  - Her başlığın veya kartın üstünde yuvarlak zemin içinde bir ikon kullanılmaz.
  - İkon yalnızca taramayı hızlandırdığı yerde kullanılır: konum, çalışma modeli, dosya türü, tarih.
  - **Nasıl olacağı:** Tek bir ikon seti seçilir, çizgi kalınlığı ve boyutu tipografiye göre ayarlanır. Lucide kullanılacaksa varsayılan görünümüyle değil, kalınlık ve köşe ayarı yapılarak kullanılır. Gerekirse kare motifinden türetilmiş birkaç özel ikon çizilir.
- **Sayfa kalıpları:**
  - "Dev slogan + iki buton" hero yapılmaz.
  - "Hero → istatistik → 3'lü kart → referans → CTA" sayfa kalıbı kullanılmaz.
  - Ana sayfa bir **arama ve ilan sayfasıdır** (bkz. 15.4).
- **İstatistikler:** Kaynaksız veya tarihsiz sayı yazılmaz ("+500 aday", "%98 memnuniyet"). Bir sayı gösteriliyorsa veritabanından canlı gelir ve tanımı yazılır: "Şu an yayında 37 ilan".
- **Metinler:**
  - Klişe ve boş pazarlama dili yasaktır: "Geleceği birlikte inşa ediyoruz", "kariyerinde yeni bir sayfa", "hayalindeki iş seni bekliyor", "inovasyonun kalbi", "güçlü ekosistem", "yenilikçi çözümler".
  - Genel buton metinleri kullanılmaz: "Daha fazla bilgi", "Keşfet", "Hemen başla". Butonlar ne yapacağını söyler: "Başvur", "İlanı yayına gönder", "12 ilanı göster", "CV'yi indir".
- **Hareket ve animasyon:**
  - Scroll'da beliren kartlar, kayan metinler ve paralaks kullanılmaz.
  - Hareket yalnızca bir durum değişikliğini anlatmak için kullanılır: panelin açılması, kaydedildi onayı, sıralama değişimi. Süre 120–200 ms olur ve `prefers-reduced-motion` desteklenir.
  - **[E] Bu nedenle GSAP ve Canvas animasyonu yığından çıkarılması önerilir;** CSS geçişleri yeterlidir.
- **Bileşenler:**
  - Her şeyin büyük köşe yarıçapıyla yuvarlatılması yerine tek bir sistem kullanılır: kontroller 4 px, paneller 6 px, görseller 2 px. Hap şeklindeki butonlar yalnızca filtre seçimlerinde kullanılır.
  - Bento grid kullanılmaz. İçerik türüne uygun düzen kurulur: ilanlar liste, firma vitrinleri editoryal düzen, panolar veri tablosu ve grafik.
- **Yazı tipleri:**
  - Inter, Poppins ve Montserrat varsayılan olarak kullanılmaz.
  - Yazı tipi seçimi gerekçelendirilir. Başlık için Lexend logonun geometrik karakterine uyar. Ancak alternatifler de denenmeli: daha karakterli bir grotesk veya editoryal bir serif ile karşılaştırma yapılır, Türkçe glif kalitesi (ğ, ş, İ, ı) ve rakam tasarımı kontrol edilir.
  - Sayısal tablolarda eşit genişlikli rakamlar (tabular numerals) kullanılır.
- **Boşluk:** Gereğinden fazla beyaz alan bırakılmaz. Kariyer portalı bilgi yoğun bir üründür: liste ve tablolar sıkı, okunabilir ve taranabilir olmalı. Beyaz alan hiyerarşi kurmak için kullanılır, sayfayı uzatmak için değil.

### 15.3 Metin ve dil

- **Hitap:** Adaya "sen" diye hitap edilir.
  - **[?]** Kurumun tercihi "siz" olabilir; dile tutarlı biçimde uygulanmalı.
- **Ton:** Kısa, somut, nazik. Kurumsal ama resmî yazışma dili değil.
- **Hata mesajları:** Ne olduğunu ve ne yapılacağını söyler. Örnek: "CV 5 MB'tan büyük. PDF'i sıkıştırıp tekrar yükle."
- **Boş durumlar:** İllüstrasyon yerine yapılacak işi gösterir. Örnek: "Bu filtrelerle ilan yok. 'Uzaktan' filtresini kaldırırsan 8 ilan var."
- **Metinlerin yazımı:** Tüm arayüz metinleri tek bir metin dosyasında (i18n) toplanır. Bir yazım rehberi oluşturulur ve terimler sabitlenir: "ilan", "başvuru", "aday", "firma", "CV havuzu". "İş ilanı / pozisyon / açık" gibi eş anlamlılar karıştırılmaz.

### 15.4 Bilgi mimarisi ve kritik sayfalar

**Ana sayfa:**

- İlk ekranda kısa ve somut bir başlık, arama kutusu, hızlı filtreler (Staj / İş / Uzaktan / Yeni mezun) ve **gerçek son ilanlar** yer alır.
- Ardından gelenler: ilan veren firmalar (gerçek logolar), staj dönemleri ve önemli tarihler, firmalar için tek satırlık bir bölüm ("Teknokent firmasıysanız: Firma girişi").

**Diğer sayfalar:**

- **İlan listesi:** Masaüstünde solda filtre paneli, ortada liste. Bir ilana tıklandığında ilan sağda açılır. Liste kaybolmaz, filtreler ve kaydırma konumu korunur.
- **İlan detayı, firma profili, firmalar dizini:** İlgili bölümlere bakın.
- **Aday paneli:** Başvurularım, kaydedilenler, profil, CV'ler, havuz ayarları, kayıtlı aramalar, hesap ve gizlilik.
- **Firma paneli ve yönetim paneli:** Ayrı tasarım dilleri kullanır, ama aynı temel bileşen sistemini paylaşır.
  - **Firma paneli:** Görev odaklıdır. Açılışta "yeni başvurular" ve "süresi dolan ilanlar" görünür.
  - **Yönetim paneli:** Veri yoğundur. Kuyruklar, tablolar ve raporlar bulunur; daha koyu ve daha sıkı bir düzen kullanır.

### 15.5 Tasarım süreci

- **Referans panosu:** Koda geçmeden önce hazırlanır. İçinde iyi iş ilanı ürünlerinden, kamu tasarım sistemlerinden (GOV.UK, NL Design System gibi netlik örnekleri) ve editoryal tasarımdan örnekler bulunur. Her referansın neden seçildiği yazılır.
- **Tasarım sistemi:** Renk, tipografi, boşluk ve kare ızgarası için tasarım değişkenleri (token) tanımlanır, ardından bileşenler kurulur.
- **Prototipler:** Ana ekranlar önce tıklanabilir prototip olarak hazırlanır ve onaya sunulur. Mobil ve masaüstü ayrı ayrı hazırlanır.
  - Aday tarafı: ana sayfa, ilan listesi, ilan detayı, başvuru akışı, aday paneli.
  - Firma paneli ve yönetim paneli de prototipe dahildir.
- **Gerçek veri:** Prototiplerde gerçek firma adları ve gerçekçi ilan metinleri kullanılır; lorem ipsum ve "Firma A" kullanılmaz.
- **Tasarım incelemesi:** Her ekran bu bölümdeki yasak listesi ve logo testiyle kontrol edilir. Kontrol bir alt ajan tarafından ya da "eleştirel dış göz" rolüyle yapılır.

## 16. Kalite hedefleri

**[E]**

| Alan | Hedef |
| --- | --- |
| Performans (mobil, Lighthouse) | ≥ 90; LCP < 2,0 sn; CLS < 0,05; INP < 200 ms; ana sayfa JS < 150 KB (gzip) |
| Erişilebilirlik | WCAG 2.2 AA; Lighthouse ≥ 95; klavye ile tam kullanım; ekran okuyucu testi (NVDA, VoiceOver) |
| SEO | Her sayfada özgün başlık ve açıklama; gerçek 404/410 kodları; sitemap; hreflang; JobPosting şeması |
| Test | Kritik akışlarda Playwright uçtan uca testleri (kayıt, profil, başvuru, ilan oluşturma, onay, CV indirme, havuz iletişim talebi); iş kurallarında birim testleri; testler CI'da zorunlu |
| Hata yönetimi | Sessiz hata yok. Her hata görünür, Türkçe ve çözüm önerir. Sunucu hataları izlenir. |
| İşlem kaydı | Kişisel veriye her erişim ve yönetici işlemi kayıt altına alınır. |
| Yedekleme | Günlük yedek; aylık geri yükleme provası |

## 17. Teknoloji (öneri; kurum onayı bekliyor)

**[E]** Kurumun ilettiği yığın temel alındı. Değişiklik önerileri gerekçeleriyle CLAUDE.md 7. bölümde. Özet:

| Katman | Öneri |
| --- | --- |
| Dil | TypeScript |
| Uygulama | Tek bir Next.js uygulaması. Payload CMS 3 aynı uygulamada çalışır. Astro kullanılmaz; çünkü portal bir uygulama, içerik sitesi değil. |
| Stil | Tailwind CSS 4. Tasarım değişkenleri kurumsal kimlikten türetilir. |
| Yönetim | Payload veri modeli, yetki ve sürüm geçmişi için kullanılır. Firma paneli ve Yönetici A.Ş. panosu **özel tasarlanmış ekranlar** olarak yapılır. Payload'un varsayılan yönetim arayüzü yalnızca alt düzey veri işlerinde (taksonomi, şablon) temalandırılarak kullanılır. **[?]** |
| Veri ve dosya | **[?]** Cloudflare D1 + R2 ya da Türkiye'de PostgreSQL + S3 uyumlu depolama. Karar KVKK değerlendirmesine bağlı. Kod her iki seçeneğe de taşınabilir yazılır. |
| Arama | SQLite FTS5 veya PostgreSQL tam metin araması. Türkçe karakter normalizasyonuyla kullanılır. Yetmezse Meilisearch veya Typesense değerlendirilir. |
| Barındırma | **[?]** Cloudflare Workers ya da Türkiye'de Docker |
| E-posta | **[?]** İşlemsel e-posta servisi |
| Güvenlik | Turnstile, iki aşamalı doğrulama, imzalı dosya bağlantıları, virüs tarama servisi |
| Animasyon | GSAP ve Canvas kullanılmaz; CSS geçişleri kullanılır. |
| CI/CD | GitHub Actions: lint, tip kontrolü, testler, Lighthouse CI, önizleme ortamı |

## 18. Aşamalar

**[E]**

| Faz | Kapsam |
| --- | --- |
| 0. Netleştirme | [?] işaretli soruların cevaplanması, KVKK ve veri yeri kararı, eski portal dersleri |
| 1. Kimlik ve tasarım | TeknoKariyer alt marka kimliği (0.4) ve onayı → referans panosu → tasarım sistemi → prototipler (sayaç biçimi dahil, K7) → kurum onayı |
| 2. MVP | Firma daveti ve profili; ilan oluşturma, onay ve yayın; aday profili ve başvuru; firmanın başvuru yönetimi ve CV indirme; CV havuzu (rıza, arama, iletişim talebi); filtreler ve kayıtlı aramalar; Yönetici A.Ş. kuyrukları ve temel pano; e-posta bildirimleri; TR/EN; KVKK araçları |
| 3. Kurum içi test ve yayın hazırlığı | Test ortamı ve örnek veri (0.5), personel testleri, düzeltmeler, göç rehberinin denenmesi (0.2), 121 firma iskeletinin aktarılması ve davetler (0.3), sızma testi, ardından birkaç firmayla pilot |
| 4. Faz 2 | LinkedIn API, CV'den otomatik profil doldurma, platform içi mesajlaşma, PWA ve anlık bildirim, görüşme planlama, ARGEPORTAL ile tek oturum açma |

## 19. Kurumun cevaplaması gereken sorular

**Bu sorular 13 Kasım 2026'da cevaplandı; kararlar 0. bölümde.** Liste kayıt amacıyla duruyor.

1. Eski portal neden atıl kaldı? Kimler kullanıyordu, ne eksikti?
2. KVKK ve veri yeri: Kurumun KVKK sorumlusu kim? Yurt dışında barındırma (Cloudflare) kabul edilebilir mi?
3. Firma verisinin tek doğru kaynağı hangi sistem: portal, ARGEPORTAL veya yeni sitenin CMS'i? ARGEPORTAL ile tek oturum açma isteniyor mu?
4. İlan onay politikası: Önerilen "ilk 3 ilan onaylı, sonra güvenilir firma" modeli uygun mu?
5. CV havuzunda aday, profilini görüntüleyen firmaların adlarını görsün mü?
6. İndirilen CV'lere filigran eklensin mi?
7. Herkese açık ilan sayfasında başvuru sayısı aralığı gösterilsin mi?
8. İkinci renk olarak sıcak bir kiremit/toprak vurgusu kabul edilir mi?
9. Adaya "sen" mi "siz" mi denecek?
10. Alan adı (ör. kariyer.pauteknokent.com.tr) ve gönderen e-posta adresi ne olacak?
11. Yönetici A.Ş. tarafında paneli kimler kullanacak, hangi rollerde?
12. Gerçek fotoğraf: Teknokent binaları ve kampüs için fotoğraf çekimi yapılabilir mi? Firmalardan ekip ve ofis fotoğrafı istenecek mi?
13. Yayın hedef tarihi ve pilot firmalar.
