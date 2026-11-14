# Yönetici özeti ve raporlama sistemi (tasarım önerisi)

**Durum:** Kurumun cevaplarıyla kesinleşti (K31, 14.11.2026). Kullanıcının isteği: Yönetici A.Ş. paneline grafikli, canlı güncellenen bir “Yönetici özeti”
sekmesi (Power BI benzeri). Sistemdeki tüm ilanlar ve başvuru sayıları burada görünmeli. Ayrıca bir raporlama sistemi.

Talimatlarda (Pano bölümü) zaten beş yönetim sorusu ve Excel/PDF dönem raporu var. Bu belge onları genişletir.
**Kurumun cevapları (K31, 14.11.2026):**

- Power BI yalnızca görünüm örneğiydi; kurum Power BI kullanmıyor. Dış veri beslemesi yapılmaz, portalın kendi panosu yapılır.
- Aylık otomatik rapor e-postası istenmiyor. Raporlar panelden elle alınır.
- Firmalar kendi panellerinde kendi ilanlarının raporunu görür (6. bölüm).
- Kurumun rapor şablonu yok; bu belgedeki gösterge seti kullanılır, sonra birlikte düzeltilir.

## 1. İlkeler

- **Kararlara hizmet eder.** Ekranda “4 kutu ve bir alan grafiği” şablonu kullanılmaz. Her bölüm bir yönetim sorusunu cevaplar.
- **Sayılar veriden hesaplanır.** Her ölçünün altında tanımı ve dönemi yazar: “Yeni başvuru: seçilen dönemde gönderilen,
  geri çekilmemiş başvurular.” Geçen dönemle karşılaştırılır.
- **KVKK:**
  - Raporlar toplu sayılardan oluşur; aday adı, e-postası veya CV'si hiçbir raporda yer almaz.
  - Kırılımlarda 5'ten küçük gruplar “5'ten az” diye gösterilir. Örneğin “X bölümünden 1 aday” yazmak adayı tanınır kılar.
  - Firma adları raporda yer alabilir; firmalar kurumsal kişidir.
  - Her rapor indirmesi işlem kaydına yazılır.
- **Yetki:** Rapor ve özetleri bütün Yönetici A.Ş. rolleri görür. Raporlayıcı rolü (talimatlar: üst yönetim) yalnızca bunları
  görür ve karar ekranlarına girmez.
- **Masaüstü önceliklidir** (talimatlar), ama mobilde de okunur. Grafikler tablo karşılığıyla birlikte sunulur
  (erişilebilirlik ve “sayıyı kopyalayabilme”).
- **Dış hizmete bağımlılık yoktur.** Grafikler portalın kendi bileşenleridir; Power BI lisansı gerektirmez.

## 2. Yönetici özeti (canlı pano)

Menüde “Yönetici özeti”. Açık kaldığı sürece her dakika kendiliğinden yenilenir. Ekranda son güncelleme saati yazar.
Bir gerçek zamanlı akış yerine dakikalık yenileme öneriyorum: portalın ölçeğinde fark edilmez, sunucu yükü ve maliyet düşük kalır.

**Üst şerit (bugün ve bu ay, geçen dönemle karşılaştırmalı):** yayındaki ilan, bugün ve bu ay gelen başvuru, yeni aday hesabı,
ilan veren firma sayısı, onay bekleyen ilan.

**Bölümler (talimatlardaki beş soru + istenen ilan tablosu):**

| Bölüm | Gösterim |
| --- | --- |
| Portal kullanılıyor mu? | Günlük/haftalık başvuru ve yeni ilan çizgi grafiği (son 90 gün), önceki dönem gölgeli |
| Bütün ilanlar | Canlı tablo: ilan, firma, durum, yayın tarihi, kalan gün, görüntülenme, başvuru (yeni / toplam), son başvuru zamanı. Firma, durum, tür ve sektöre göre süzülür, her sütuna göre sıralanır, Excel'e aktarılır |
| İlanlar sonuç veriyor mu? | Başvuru hunisi (alındı → inceleniyor → görüşme → teklif → olumlu), ilk başvuruya kadar geçen ortalama süre |
| Hangi firmalar aktif? | Firma tablosu: ilan, başvuru, son giriş, kurulum aşaması; hiç ilan vermeyen firmalar ayrı |
| Bölgenin yetenek ihtiyacı | İlanlarda istenen beceri ile havuzdaki aday sayısı yan yana; açık en büyükten küçüğe |
| Adaylar nereden geliyor? | Üniversite, bölüm ve şehir dağılımı; PAÜ oranı; başvuru kanalı (portal, LinkedIn paylaşımı vb.) |

## 3. Rapor merkezi

Menüde “Raporlar”. Hazır rapor türleri. Her raporda dönem seçilir (bu ay, geçen ay, çeyrek, yıl veya özel aralık) ve süzgeç
uygulanır. Rapor önce ekranda görünür, sonra **Excel** veya **PDF** olarak indirilir.

| Rapor | İçerik | Kimin için |
| --- | --- | --- |
| Dönem faaliyet raporu | Bütün ana göstergeler, karşılaştırmalı, grafikli; faaliyet raporu ve üniversite-sanayi iş birliği raporlarına veri | Genel Müdürlük, Yönetim Kurulu |
| İlan raporu | Dönemde yayında olan bütün ilanlar: firma, tür, süre, görüntülenme, başvuru, sonuç | Kurumsal iletişim |
| Firma etkinlik raporu | Firma başına ilan, başvuru, sonuç; ilan vermeyen firmalar; kurulum aşamaları | Teknokent süreç yöneticileri |
| Başvuru ve sonuç raporu | Huni, ilan türüne ve sektöre göre dönüşüm, işe yerleşme (olumlu sonuç) sayısı | Genel Müdürlük |
| Yetenek açığı raporu | Beceri talebi ve havuz arzı, dönemsel değişim | Üniversite iş birliği, PAÜ |
| Aday kaynak raporu | Üniversite, bölüm, şehir, PAÜ oranı, başvuru kanalı (5'ten az grup gizlenir) | Üniversite iş birliği |
| Hizmet raporu | Onay süreleri, düzeltme oranı, liste talepleri, davet ve kurulum hızı | Yönetici A.Ş. iç değerlendirme |
| KVKK raporu | Rıza sayıları, ilgili kişi talepleri ve cevap süreleri, silinen hesaplar, anonimleştirilen başvurular | KVKK sorumlusu |

- **Excel:** Her raporun ham tablosu ayrı sayfa; ilk sayfada tanımlar ve dönem.
- **PDF:** Kurumsal kimlikte, A4, kapak ve özetle. Toplantıya veya resmî rapora eklenebilir.

## 4. Zamanlanmış raporlar

Kurum istemedi (K31). Altyapı (zamanlanmış işler, sunucuda PDF) hazır olduğu için ileride istenirse kolayca eklenir.

## 5. Power BI ve dış araçlar

Yapılmaz (K31): Power BI yalnızca görünüm örneğiydi. Her raporun Excel çıktısı, gerekirse başka araçlarda kullanılabilir.

## 6. Firma raporları (K31: yapılacak)

Firma panelinde firmanın kendi ilanlarına ait rapor: görüntülenme, başvuru, kanal, sonuç; Excel olarak indirme.
Firma yalnızca kendi verisini görür (kiracı ayrımı); diğer firmalarla karşılaştırma gösterilmez.

## 7. Teknik plan

- **Günlük özet tablosu:** Bazı ölçülerin geçmişi kayıtlarda yok. Örneğin görüntülenme yalnızca toplam sayaç olarak tutuluyor,
  geçmiş bir günde kaç ilanın yayında olduğu da bilinmiyor. Gece çalışan zamanlanmış iş her gün bir özet satırı yazar: ilan
  başına görüntülenme ve başvuru, yayındaki ilan, aday, firma. Trend grafikleri bu tablodan çizilir. Tablo kişisel veri içermez.
  - Not: geçmiş günler için veri olmadığından trendler, tablonun kurulduğu günden itibaren dolar. Başvuru ve ilan gibi tarihli
    kayıtların geçmişi ise baştan hesaplanabilir.
- **Grafikler:** Portalın kendi SVG bileşenleri (çizgi, çubuk, huni, kare birimli dağılım). Kütüphane eklenmez; sayfa hafif
  kalır (Lighthouse hedefleri).
- **Excel:** Sunucuda .xlsx üretimi (küçük bir kitaplıkla).
- **PDF:** Ekrandaki rapor A4 baskıya uygun tasarlanır. Zamanlanmış e-posta için sunucuda PDF üretilir (mevcut pdf-lib).
- **Performans:** Hesaplamalar veritabanında toplu sorgularla yapılır; aynı dakikadaki istekler önbellekten karşılanır.

## 8. Sıralama önerisi

1. Günlük özet tablosu ve gece işi (geçmiş biriksin diye önce).
2. Yönetici özeti: üst şerit, bütün ilanlar tablosu, kullanım ve sonuç grafikleri.
3. Rapor merkezi: dönem faaliyet raporu ve ilan raporu (Excel + PDF), sonra diğerleri.
4. Firma raporları (firma paneli).
