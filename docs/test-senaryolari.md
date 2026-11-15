# TeknoKariyer — Kurum içi test senaryoları

Bu belge, Pamukkale Teknokent Yönetici A.Ş. personelinin TeknoKariyer'i yayından önce test ortamında denemesi içindir
(talimatlar 0.5, K13). Her senaryo adım adım yazılmıştır ve her adımın altında beklenen sonuç vardır. Beklenen sonuç
görünmezse veya bir şey kafanızı karıştırırsa lütfen bildirin (bölüm 3). Kafa karıştıran bir ekran da bir hatadır.

## 1. Başlamadan önce

### 1.1 Test ortamı

- **Adres:** https://teknokariyer-test.teknokariyer.workers.dev
- Her sayfanın üstünde turuncu **TEST ORTAMI** şeridi görünür. Bu ortamdaki ilanlar ve kişiler örnektir.
- **Test ortamında hiçbir e-posta gerçek alıcıya gitmez.** Davet, doğrulama, giriş kodu, başvuru ve hatırlatma
  e-postalarının hepsi Yönetici A.Ş. panelindeki **Test posta kutusu**na düşer (menüde “Yönetim” altında). Bu yüzden
  senaryolarda gerçek kişilerin e-posta adreslerini kullanmayın. Uydurma adresler yazın, sonu `.test` olsun:
  `ayse.aday@deneme.test`, `ik@deneme-firma.test`.
- Giriş kodu isteyen ekranlarda (yeni cihazdan firma veya Yönetici A.Ş. girişi) kod, test ortamında ekranda da
  gösterilir. Gerçek ortamda kod yalnızca e-postayla gelir.
- Test ortamındaki hiçbir veri yayına taşınmaz. Gönül rahatlığıyla deneyin, silin, bozun.

### 1.2 Hesaplar

- **Yönetici A.Ş.:** Size verilen `…@kariyer.test` hesabıyla giriş yapın. Kendi kurumsal adresiniz için hesap
  istiyorsanız tam yetkili bir kullanıcı **Kullanıcılar** sayfasından açar; şifre belirleme bağlantısı test posta kutusuna
  düşer.
- **Firma ve aday hesaplarını senaryolarda kendiniz oluşturacaksınız.** Böylece kurulum akışı da sınanmış olur.
- Aynı anda hem Yönetici A.Ş. hem firma hem aday olarak çalışacaksanız tarayıcının **gizli pencerelerini** veya farklı
  tarayıcıları kullanın. Aynı pencerede tek oturum açık kalır.

### 1.3 Bilinen sınırlar (hata olarak bildirmeyin)

- Arayüz yalnızca Türkçe. İngilizce sürüm sonraya kaldı (K35).
- E-posta servisi henüz bağlanmadı; test posta kutusu bu yüzden var.
- KVKK metinleri taslaktır ve hukuk biriminin onayını bekliyor. Metinlerde “taslak” ibaresi görünür.
- Güvenlik gereği kısa sürede çok sayıda başarısız giriş, kayıt veya şifre yenileme denemesi geçici olarak engellenir
  (ör. 15 dakikada 10 giriş). Bu ekranda süre yazar. Beklemeniz yeterlidir.

## 2. Senaryolar

Senaryolar bir hikâye gibi birbirine bağlanır: önce firma kurulur, firma ilan verir, Yönetici A.Ş. onaylar, aday başvurur,
firma değerlendirir. Sırayla uygulamanız önerilir. Her senaryonun başındaki kod (S1, S2…) geri bildirimde kullanılır.

---

### S1. Firma kurulumu: iskelet kayıt ve davet

**Kim:** Yönetici A.Ş. (tam yetkili) → firma yetkilisi
**Amaç:** Teknokent firmasının kaydını açmak, yetkilisini davet etmek ve yetkilinin hesabı devralması.

1. Yönetici A.Ş. hesabıyla giriş yapın. Menüden **Firmalar ve kurulum**'a, sonra **Yeni firma kaydı** düğmesine basın.
   - *Beklenen:* “Yeni firma kaydı” sayfası açılır. Üstte “İskelet kayıt nedir?” açıklaması vardır.
2. **Ticaret unvanı**, **Kısa ad** ve **Teknokent’teki yeri** alanlarını doldurun (ör. “Deneme Yazılım A.Ş.”, “Deneme
   Yazılım”, “D Blok 999”). **Yetkili kişi** bölümüne bir ad ve uydurma bir **İş e-postası** yazın
   (ör. `yetkili@deneme-firma.test`). **Firma kaydını oluştur** düğmesine basın.
   - *Beklenen:* Firmanın ayrıntı sayfası açılır. “Davet ve ekip”, “Firma kaydı”, “Takip notları”, “İlanlar” ve
     “Son işlemler” bölümleri görünür.
   - *Ayrıca deneyin:* Zorunlu bir alanı boş bırakıp kaydedin. Hata, alanın yanında Türkçe görünmeli.
3. “Davet ve ekip” bölümünde ad ve e-posta yetkili bilgileriyle dolu gelir. **Daveti gönder** düğmesine basın.
   - *Beklenen:* Bölümde “1 bekleyen davet” yazar; davetin geçerlilik tarihi (14 gün) görünür. **Yeniden gönder** ve
     **İptal et** düğmeleri çıkar.
4. Menüden **Test posta kutusu**'na gidin. Yetkilinin adresini arayın.
   - *Beklenen:* “TeknoKariyer’de … ekibine davet edildiniz” konulu e-posta görünür. E-postada daveti kabul etme
     düğmesi vardır.
5. **Yeni bir gizli pencere açın.** E-postadaki düğmenin bağlantısını kopyalayıp bu pencereye yapıştırın.
   - *Beklenen:* “… ekibine katılın” sayfası açılır: Ad soyad, Göreviniz (isteğe bağlı), Şifre.
6. Görevinizi (ör. “İnsan kaynakları uzmanı”) ve bir şifre yazın. **Daveti kabul et ve giriş yap** düğmesine basın.
   - *Beklenen:* “E-postanızı kontrol edin” ekranı gelir (yeni cihazdan giriş için kod). Test ortamında kod ekranda da
     yazar. Kodu girin, **Doğrula ve giriş yap**'a basın.
   - *Beklenen:* Firma paneli “Özet” sayfası açılır ve “İlk ilanınızı oluşturun” çağrısı görünür.
7. Yönetici A.Ş. penceresine dönün ve firmanın ayrıntı sayfasını yenileyin.
   - *Beklenen:* “1 etkin kullanıcı” yazar; kurulum aşaması ilerlemiştir. **Firmalar ve kurulum** sayfasındaki huni
     bu firmayı “devralındı” basamağında gösterir.
8. Aynı daveti ikinci kez açmayı deneyin (bağlantıyı yeniden yapıştırın).
   - *Beklenen:* Bağlantının geçersiz olduğunu söyleyen açıklayıcı bir Türkçe mesaj.

### S2. Firma profili ve ekip

**Kim:** Firma yetkilisi (S1'de devralan)

1. Firma panelinde **Firma profili**'ne gidin. **Kısa tanıtım** yazın, **Sektör** seçin, bir **Logo** yükleyin
   (PNG veya JPEG) ve **Profili kaydet**'e basın.
   - *Beklenen:* Kayıt başarılı mesajı. Logo, kısa tanıtım ve sektör tamamlanınca Yönetici A.Ş. tarafındaki kurulum
     aşaması kendiliğinden “Profil tamam” olur.
   - *Ayrıca deneyin:* Logo olarak bir SVG veya PDF yükleyin. Anlaşılır bir hata mesajı görünmeli.
   - *Ayrıca deneyin (Yönetici A.Ş.):* **Firmalar ve kurulum** → firmanın adı → **Logo** bölümünden başka bir logo
     yükleyin. Yeni logo ilan listesinde, ilan sayfasında ve firma sayfasında eskisinin yerine görünmeli.
2. **Ekip** sayfasında bir iş arkadaşınızı davet edin: ad, uydurma bir **İş e-posta adresi** ve yetki (**İlan sorumlusu**
   veya **Değerlendirici**) seçip **Davet gönder**'e basın.
   - *Beklenen:* Davet bekleyenler arasında görünür; e-posta test posta kutusuna düşer.
3. “Bilgilerim” bölümünde görevinizi değiştirip **Bilgilerimi kaydet**'e basın.
   - *Beklenen:* Yeni görev, firma panelinde adınızın altında görünür.

### S3. İlan verme ve ilan onayı

**Kim:** Firma yetkilisi → Yönetici A.Ş.
**Amaç:** Firmanın ilk ilanları Yönetici A.Ş. onayından geçer (K4). Formun eksikleri açıkça göstermesi ve onay akışı.

1. Firma panelinde **Yeni ilan** düğmesine basın.
   - *Beklenen:* Dört bölümlü form: 1 Pozisyon, 2 Beceriler ve nitelikler, 3 Tarih ve başvuru, 4 Paylaşım ve dil.
     Her alanın yanındaki “?” düğmesi alanı açıklar.
2. Yalnızca **Pozisyon adı**'nı yazıp **Kaydet ve önizle**'ye basın.
   - *Beklenen:* İlan taslak olarak kaydedilir. Önizleme “İlanı yayına göndermeden önce şunları tamamlayın” başlığıyla
     eksikleri tam cümleyle listeler: ilan türü, çalışma şekli, pozisyon ailesi, çalışma modeli, aranan deneyim, eğitim
     düzeyi, en az bir zorunlu beceri, son başvuru tarihi, iş tanımı, aranan nitelikler.
3. **Düzenlemeye dön**'e basın ve eksikleri doldurun. Becerileri yazmaya başlayınca öneriler çıkar; listeden seçin.
   Son başvuru tarihini takvimden seçin (en fazla 60 gün sonrası seçilebilir).
   - *Ayrıca deneyin:* Listede olmayan bir beceri için **Listede yok mu? Eklenmesini isteyin** bağlantısını kullanın
     (bu talep S8'de Yönetici A.Ş.'ye gelir).
   - *Ayrıca deneyin:* Formu doldururken sayfadan çıkmaya çalışın. Kaydedilmemiş değişiklik uyarısı çıkmalı.
4. **Kaydet ve önizle**'ye basın.
   - *Beklenen:* İlan, adayların göreceği hâliyle görünür. Firmanın ilk ilanları onaya gittiği için düğme
     **İlanı onaya gönder** yazar. Basın.
   - *Beklenen:* İlanlar listesinde ilan “Onay bekliyor” durumunda görünür.
5. Yönetici A.Ş. olarak **Bugün** sayfasına bakın.
   - *Beklenen:* “İlan onayı” kuyruğunda 1 ilan vardır; menüdeki **İlan onayı** yanında sayı görünür.
6. **İlan onayı**'ndan ilanı açın.
   - *Beklenen:* Solda adayın göreceği ilan, sağda otomatik tarama sonuçları ve kontrol listesi. Kontrol listesinin
     bütün maddeleri işaretlenmeden **Onayla ve yayınla** çalışmaz.
7. Önce **Düzeltme iste**'yi deneyin: hazır gerekçelerden birini seçip gönderin.
   - *Beklenen:* İlan firmaya geri döner. Firmaya e-posta gider (test posta kutusu). Firma panelinde ilanın üstünde
     düzeltme gerekçesi görünür.
8. Firma ilanı düzeltip yeniden onaya göndersin. Yönetici A.Ş. kontrol listesini işaretleyip **Onayla ve yayınla**'ya
   bassın.
   - *Beklenen:* İlan yayına girer, firmaya bilgi e-postası gider. İlan herkese açık **İlanlar** sayfasında görünür.
9. Yayındaki ilanda firma, onay gerektiren bir alanı (ör. ücret veya pozisyon adı) değiştirsin.
   - *Beklenen:* Değişiklik hemen yayına girmez; Yönetici A.Ş.'nin **İlan değişiklikleri** sayfasında “şu an / istenen”
     tablosuyla görünür. **Değişikliği onayla** veya gerekçeyle **Onaylama**.
10. Firma panelinde ilanın **Sürüm geçmişi**'ne bakın.
    - *Beklenen:* Hangi alanın ne zaman değiştiği görünür.

### S4. Aday kaydı ve profil

**Kim:** Aday (gizli pencerede)

1. Sağ üstteki **Giriş yap**'a, sonra giriş sayfasındaki “Hesabın yok mu? **Hesap aç**” bağlantısına basın. Ad soyad, uydurma bir e-posta ve şifre yazın, aydınlatma metnini onaylayıp
   **Hesabı aç**'a basın.
   - *Beklenen:* “E-postanı kontrol et” ekranı. Adaya “sen” diye hitap edilir (K9).
   - *Ayrıca deneyin:* Kısa bir şifre yazın. Şifre kurallarının hangisinin karşılanmadığı anında görünmeli.
2. Yönetici A.Ş. penceresinde **Test posta kutusu**'ndan doğrulama e-postasını açın, bağlantısını adayın penceresine
   yapıştırın.
   - *Beklenen:* “E-posta adresini doğrula” sayfası. **E-posta adresimi doğrula**'ya basınca giriş sayfası “E-posta
     adresin doğrulandı” mesajıyla açılır.
   - *Ayrıca deneyin:* Aynı bağlantıyı ikinci kez kullanın. “Bağlantı geçersiz” sayfası görünmeli.
3. Giriş yapın.
   - *Beklenen:* “Başvurularım” sayfası. Profil boş olduğu için **Adım adım tamamla** önerilir.
4. **Adım adım tamamla** ile profil sihirbazını tamamlayın: eğitim (okul ve bölüm listeden seçilir), deneyim,
   beceriler, diller.
   - *Beklenen:* Okul listesinde Türkiye'deki üniversitelerin hepsi vardır (ör. “Pamukkale Üniversitesi”); bölüm
     listesinde lisans ve önlisans programları vardır.
5. **Profil ve CV’ler** sayfasında bir bölümün **Düzenle** düğmesiyle bilgi değiştirip kaydedin.
   - *Beklenen:* Pencere kapanır, özet yeni bilgiyle görünür. Kaydedilen değer başka bir değere dönmez (K28).
6. Bir PDF CV yükleyin.
   - *Ayrıca deneyin:* PDF olmayan bir dosya veya şifreli bir PDF yükleyin. Anlaşılır bir hata görünmeli.

### S5. Başvuru

**Kim:** Aday → firma

1. **İlanlar** sayfasında filtreleri deneyin (iş/staj, çalışma modeli, deneyim, pozisyon ailesi) ve S3'te yayınlanan
   ilanı açın.
   - *Beklenen:* Filtreler adres çubuğunda tutulur; sayfayı yenileyince kaybolmaz. İlan sayfasında başvuru sayısı
     aralıkla gösterilir (“10’dan az başvuru”; K23).
2. **Başvur**'a basın.
   - *Beklenen:* Yalnızca bu ilanın istediği ve profilde eksik olan bilgiler sorulur (“Bu ilan için … bilgi eksik”).
     CV seçimi zorunludur. Son adım “Kontrol et ve gönder”.
3. **Başvurunu gönder**'e basın.
   - *Beklenen:* Başvuru tamam sayfası; test posta kutusunda “Başvurun … iletildi” e-postası. **Başvurularım**'da
     başvuru görünür.
4. Firma olarak **Başvurular**'ı açın ve başvuruyu açın.
   - *Beklenen:* Başvuru ilk açılışta “İnceleniyor” olur. Eşleşme gerekçeleri, ön eleme cevapları, başvuru anındaki
     profil görünür.
5. **CV’yi görüntüle**'ye basın.
   - *Beklenen:* CV portalın içinde, büyük bir pencerede açılır (mobilde tam ekran). Yakınlaştırma, **İndir** ve
     **Yazdır** vardır. İndirilen PDF'in altında firma adı ve tarih filigranı bulunur (K6).
6. Puan verin, ekip notu yazın ve durumu “Görüşme” yapıp **Durumu kaydet**'e basın.
   - *Beklenen:* Adaya durum e-postası gider; aday **Başvurularım**'da yeni durumu görür. Ekip notu ve puan adaya
     görünmez.

### S6. CV havuzu

**Kim:** Aday → firma

1. Aday olarak **CV havuzu** sayfasında görünürlüğü seçin (“Aktif iş arıyorum” veya “Fırsatlara açığım”), açık rıza
   metnini onaylayıp **Havuza katıl**'a basın.
   - *Beklenen:* Havuzda olduğun ve rızanın tarihi görünür. Rıza metni, firmaların ad, iletişim ve CV'yi ayrıca izin
     istemeden görebileceğini açıkça yazar (K24).
2. Firma olarak **CV havuzu**'nda bir beceriyle arama yapın.
   - *Beklenen:* Sonuç listesi anonimdir: ad ve iletişim bilgisi görünmez, aday kodla gösterilir (ör. “A-1018”).
     Cinsiyete göre süzme veya sıralama yoktur (K25).
3. **Profili aç**'a basın.
   - *Beklenen:* Ad, iletişim ve CV görünür. Açılış kayda geçer.
4. Aday olarak **CV havuzu** sayfasını yenileyin.
   - *Beklenen:* Profilini görüntüleyen firma sayısı görünür; firmanın adı görünmez (K5).
5. Aday havuzdan çıksın.
   - *Beklenen:* Profil firmanın aramasında artık çıkmaz.

### S7. Hesap güvenliği

**Kim:** Firma yetkilisi veya Yönetici A.Ş.

1. Çıkış yapıp başka bir tarayıcıdan (veya gizli pencereden) giriş yapın.
   - *Beklenen:* Tanınmayan cihaz olduğu için e-posta kodu istenir. “Bu cihazı 90 gün hatırla” işaretliyse aynı
     tarayıcıda bir dahaki girişte kod istenmez (K33).
2. **Hesap güvenliği** sayfasında tanınan cihazları görün ve birini unutun.
   - *Beklenen:* O cihazdan bir sonraki girişte yeniden kod istenir.
3. (İsteğe bağlı) **Doğrulayıcı uygulama** kurun (Google Authenticator, Microsoft Authenticator vb.).
   - *Beklenen:* Kurulumdan sonra kurtarma kodları bir kez gösterilir. Sonraki girişlerde uygulama kodu istenir.

### S8. Liste talepleri ve listeler

**Kim:** Yönetici A.Ş.

1. S3'te firmanın gönderdiği liste talebini **Liste talepleri** sayfasında açın.
   - *Beklenen:* Her öğe ayrı karar alır (**Listeye ekle** / **Ekleme**). Benzer adlar varsa öğenin altında gösterilir.
     “Ekleme” seçilirse talep edene neden yazmak zorunludur.
2. Kararları verip **Kararları kaydet**'e basın.
   - *Beklenen:* Kabul edilen öğe listeye hemen girer; talep edene tek e-posta gider.
3. **Listeler** sayfasında bir beceriye eş anlamlı ekleyin (ör. “JavaScript” için “JS”).
   - *Beklenen:* Aday ve firma formlarında “JS” yazınca “JavaScript” önerilir.

### S9. KVKK başvurusu ve hesap silme

**Kim:** Aday → Yönetici A.Ş. (tam yetkili)

1. Aday olarak **Hesap ve gizlilik** sayfasında **Verilerimi indir**'e basın.
   - *Beklenen:* Hesap, profil, başvurular ve rızalar dosya olarak iner. Firma iç notları, puanlar ve etiketler
     dosyada yoktur.
2. Aynı sayfada “Kişisel verilerinle ilgili başvurular” bölümünden bir başvuru yapın (ör. bilgi talebi) ve
   **Başvuruyu gönder**'e basın.
   - *Beklenen:* Başvuru listede “alındı” olarak görünür.
3. Yönetici A.Ş. olarak **KVKK başvuruları** sayfasında başvuruyu açın.
   - *Beklenen:* Yasal süre (30 gün) ve kalan gün görünür. Kimlik doğrulanmadan cevap verilemez.
4. Kimlik doğrulama yöntemini seçip **İncelemeye al**'a basın. Cevap taslağındaki `[… yazın]` yer tutucularını
   doldurup **Sonuçlandır ve cevabı gönder**'e basın.
   - *Ayrıca deneyin:* Yer tutucuyu silmeden göndermeyi deneyin. Engellenmeli.
   - *Beklenen:* Cevap e-postası test posta kutusuna düşer; başvuru “sonuçlandı” olur.
5. **E-postayla veya yazılı gelen başvuruyu kaydet** formuyla portal dışından gelmiş bir başvuruyu kaydedin.
6. Aday olarak **Hesabı sil** bölümünde şifrenizi yazıp **Hesabımı kalıcı olarak sil**'e basın.
   - *Beklenen:* “Hesabın silindi” sayfası. Giriş artık yapılamaz.
   - *Beklenen (firma tarafı):* Firmanın başvurular listesinde başvuru “Aday hesabını sildi” olarak kalır; ad,
     iletişim bilgisi, ön yazı ve CV görünmez (K27, K32).

### S10. Raporlar, özet ve işlem kayıtları

**Kim:** Yönetici A.Ş.

1. **Yönetici özeti**'nde dönemi değiştirin (7, 30, 90 gün, 12 ay).
   - *Beklenen:* Bütün sayfa seçilen döneme göre değişir. Grafiklerin altında “Tablo olarak göster” vardır.
2. **Raporlar**'da bir rapor seçip **Raporu aç**, sonra **Excel olarak indir**'e basın. Ekrandaki raporu tarayıcının
   yazdırma penceresinden PDF olarak kaydedin.
   - *Beklenen:* Excel açılır; ilk sayfada özet ve notlar vardır. Raporlarda kişi adı yoktur; 5'ten küçük gruplar
     “5'ten az” olarak gizlenir (K31).
3. **İşlem kayıtları**'nda S1–S9'da yaptığınız işlemleri arayın.
   - *Beklenen:* Kim, neyi, ne zaman yaptı görünür. CV görüntüleme ve indirme de kayıtlıdır.
4. Firma olarak **Rapor** sayfasını açın.
   - *Beklenen:* Yalnızca kendi firmanın ilanları; başka firmayla karşılaştırma yok.

### S11. Mobil

Senaryo S4, S5 ve S3'ün 7. adımını (ilan onayı) bir telefondan tekrarlayın.

- *Beklenen:* Sayfalar yatay kaydırma olmadan sığar. Filtreler alttan açılan panelde, düzenleme pencereleri tam boy
  açılır. Düğmeler parmakla rahatça basılabilecek büyüklüktedir.

## 3. Geri bildirim

Her bulgu için aşağıdaki bilgileri bu belgeyi size iletmiş olan test koordinatörüne gönderin. Tek bulgu, tek ileti
olsun; ekran görüntüsü ekleyin.

```
Senaryo ve adım: S3 / 6
Ne yaptım:       Kontrol listesini işaretleyip “Onayla ve yayınla”ya bastım.
Ne bekliyordum:  İlanın yayına girmesini.
Ne oldu:         “Beklenmeyen bir sorun oluştu” yazdı.
Cihaz ve tarayıcı: Windows dizüstü, Chrome  /  iPhone, Safari
Saat:            15.11.2026 14:20 (işlem kayıtlarında bulmamız için)
Önem:            Engelliyor / Zorlaştırıyor / Küçük / Öneri
```

“Önem” için ölçü: **Engelliyor** = işi bitiremedim; **Zorlaştırıyor** = bitirdim ama zorlandım veya yanlış anladım;
**Küçük** = yazım, hizalama, renk; **Öneri** = böyle olsa daha iyi olurdu.

Metinlerle ilgili bildirimlerde (anlaşılmayan cümle, yanlış hitap, yazım) ekrandaki cümleyi aynen yazın.
