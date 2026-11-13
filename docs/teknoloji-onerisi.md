# TeknoKariyer — Teknoloji önerisi

**Durum:** Onaylandı (K26, 13 Kasım 2026).

Bu belge talimatların 17. bölümündeki öneriyi güncel sürümler ve limitlerle doğrular. Her sayının kaynağı belgenin sonunda.

- **Birincil kaynak:** npm deposu ve Cloudflare'in resmî belge deposu (`cloudflare/cloudflare-docs`, `production` dalı).
- **İkincil kaynak:** Bu tür kaynaktan alınan bilgiler "doğrulanacak" diye işaretli.

## 1. Özet

| Katman | Öneri | Not |
| --- | --- | --- |
| Dil | TypeScript | |
| Uygulama | Tek Next.js uygulaması; Payload CMS aynı uygulamada | Astro yok; portal bir uygulama, içerik sitesi değil. |
| Yönetim altyapısı | Payload 3: veri modeli, yetki, sürüm geçmişi, dosya yükleme | Aday, firma ve yönetim ekranları prototipteki gibi özel tasarlanır. Payload'ın hazır yönetim arayüzü yalnızca taksonomi ve şablon gibi alt düzey işlerde kullanılır. |
| Stil | Tailwind CSS 4 | Prototipteki `tokenlar.css` değişkenleri temaya aynı adlarla aktarılır. |
| Animasyon | CSS geçişleri | GSAP ve Canvas yok (talimatlar 15.2). |
| Veritabanı | Cloudflare D1 (test) ↔ PostgreSQL (Türkiye'de sunucu seçilirse) | İkisi de Payload'ın resmî adaptörüyle desteklenir. |
| Dosya depolama | Cloudflare R2 (test) ↔ S3 uyumlu depolama, ör. MinIO | Payload'ın resmî R2 ve S3 adaptörleri var. |
| Barındırma | Cloudflare Workers, OpenNext adaptörüyle | Türkiye seçeneği: Docker ile Node.js sunucusu. |
| Arama | Türkçe karaktere duyarsız, normalize edilmiş arama sütunu | 121 firma ve birkaç yüz ilan ölçeğinde yeterli; her iki veritabanında aynı çalışır. Yetmezse tam metin arama eklenir. |
| E-posta | Bir arayüzün arkasında. Test ortamında gönderim yok, test posta kutusu var. | Yayın servisi KVKK kararından sonra seçilir (bkz. 5). |
| Virüs tarama | ClamAV, Worker dışında bir konteynerde; karantina → temiz akışı | Bkz. 6. |
| Bot koruması | Cloudflare Turnstile + istek sınırlama | Türkiye sunucusuna geçişte alternatifi belgelenir. |
| İki aşamalı doğrulama | TOTP (doğrulama uygulaması), firma ve yönetici hesaplarında zorunlu | |
| Testler | Vitest (birim), Playwright (uçtan uca) | |
| CI/CD | GitHub Actions: lint, tip kontrolü, testler, derleme, test ortamına dağıtım | |

## 2. Doğrulanan sürümler (npm, 13 Kasım 2026)

| Paket | Sürüm |
| --- | --- |
| next | 16.4.6 |
| react | 19.3.1 |
| payload, @payloadcms/db-d1-sqlite, @payloadcms/db-postgres, @payloadcms/storage-r2, @payloadcms/storage-s3 | 3.93.0 |
| @opennextjs/cloudflare | 1.20.17 |
| wrangler | 4.161.0 |
| tailwindcss | 4.3.5 |
| vitest | 5.1.0 |
| @playwright/test | 1.65.0 |
| typescript | 7.0.2 (en son) |

**Uyumluluk kontrolü:**

- **Next.js:** `@payloadcms/next@3.93.0` Next.js'te `>=16.3.3 <17.0.0` ister. `@opennextjs/cloudflare@1.20.17` ise `>=16.4.5` ister. Next.js 16.4.6 ikisini de karşılar.
- **Node.js:** Payload 3.93, Node.js'te `^22.23.4 || >=24.22.1` ister.
- **Payload 4:** Şu an beta (`4.0.0-beta.8`). Kararlı 3.x ile başlanır, 4 kararlı olunca geçiş planlanır.
- **TypeScript:** 7 yeni çıktı. Payload ile uyumu kurulumda denenir; sorun çıkarsa Payload'ın desteklediği sürüme sabitlenir.

## 3. Cloudflare limitleri ve fiyatları

Kaynak: Cloudflare resmî belge deposu, 13 Kasım 2026.

**Workers (ücretli plan):**

- Aylık en az 5 USD.
- Ayda 10 milyon istek dahil; sonrası milyon istek başına 0,30 USD.
- Ayda 30 milyon CPU milisaniyesi dahil; sonrası milyon CPU ms başına 0,02 USD.
- İstek başına CPU süresi varsayılan 30 sn, en fazla 5 dk. Bellek 128 MB.
- Worker boyutu 64 MiB; Next.js + Payload paketi için yeterli olmalı, ilk derlemede ölçülecek.
- Veri çıkışı (egress) ücretsiz.

**D1:**

- Veritabanı başına en fazla 10 GB, hesap başına 1 TB.
- Zaman yolculuğu (geçmiş bir ana geri dönüş) 30 gün.
- Worker çağrısı başına 1.000 sorgu. Satır, metin veya BLOB başına en fazla 2 MB.
- CV dosyaları veritabanında değil R2'de tutulur.

**R2:**

- Ayda 10 GB-ay depolama, 1 milyon A sınıfı ve 10 milyon B sınıfı işlem ücretsiz.
- Sonrası GB-ay başına 0,015 USD. Veri çıkışı ücretsiz.

**Veri yeri:**

- D1 ve R2'de veritabanı veya depo oluşturulurken `eu` (Avrupa Birliği) yetki alanı seçilebilir; sonradan değiştirilemez.
- **Türkiye seçeneği yok.** D1 konum ipuçları arasında Batı ve Doğu Avrupa var, ama ipucu garanti vermez.

**Tahmini maliyet:**

- **Test ortamı:** Ayda 5 USD (Workers ücretli plan). D1 ve R2 bu ölçekte büyük olasılıkla dahil kullanım ve ücretsiz katmanda kalır.
- **Yayın:** Kullanım ölçülünce yeniden hesaplanır.

## 4. Sağlayıcıdan bağımsızlık (K2)

Uygulama kodu D1'e veya R2'ye doğrudan bağlanmaz. Sağlayıcıya özgü her şey tek bir klasörde, arayüzlerin arkasında durur:

| Arayüz | Cloudflare | Türkiye'de sunucu |
| --- | --- | --- |
| Veritabanı | Payload D1 adaptörü | Payload PostgreSQL adaptörü |
| Dosya | Payload R2 adaptörü | Payload S3 adaptörü + MinIO |
| E-posta | Seçilen servis (bkz. 5) | Aynı servis veya yerel SMTP |
| Zamanlanmış işler (hatırlatmalar, süre dolumu) | Cron Triggers | Konteyner içinde zamanlayıcı |
| Kuyruk (virüs tarama, toplu e-posta) | Cloudflare Queues | Veritabanı tabanlı iş kuyruğu |
| Bot koruması | Turnstile | Turnstile (sunucudan bağımsız çalışır) veya alternatif |
| Virüs tarama | ClamAV konteyneri | ClamAV konteyneri |

- `docker compose` ile PostgreSQL + MinIO + uygulama yerelde her zaman çalışır tutulur ve CI'da bu kurulumla da test edilir.
- `docs/goc-rehberi.md`, ilk çalışan sürümle birlikte yazılır ve test ortamında bir kez baştan sona denenir.

## 5. E-posta servisi

**Durum:** Talimatınız gereği sistem tam olarak kullanıma alınana kadar hiçbir dış adrese e-posta gitmeyecek. Test ortamında e-postalar yalnızca panelden okunan test posta kutusunda toplanacak. Bu yüzden servis seçimi acil değil ve KVKK kararından sonra yapılmalı.

**Tahmini hacim:** 121 firma, birkaç yüz aday. Davet, hatırlatma ve başvuru bildirimleriyle ayda birkaç bin e-posta.

| Servis | Bilinen | Doğrulanacak |
| --- | --- | --- |
| Cloudflare Email Service | Nisan 2026'dan beri herkese açık beta. Workers ücretli planda ayda 3.000 e-posta dahil, sonrası 1.000 başına 0,35 USD. SPF/DKIM otomatik. | Fiyat ve beta durumu ikincil kaynaktan; resmî sayfadan doğrulanmalı. Beta, yayın için risk. |
| Amazon SES | 1.000 e-posta başına yaklaşık 0,10 USD; Frankfurt bölgesi kullanılabilir. | Şirket ABD merkezli; yurt dışı aktarım değerlendirmesi gerekir. Kurulumu teknik olarak en zor seçenek. |
| Brevo | Fransız şirketi; günde 300 e-posta ücretsiz. | AB'de barındırma ikincil kaynaktan; veri işleme sözleşmesinden doğrulanmalı. |
| Resend | Geliştirici deneyimi iyi; AB'den (İrlanda) gönderim bölgesi var. | Resend'in kendi belgesine göre bölge seçimi yalnızca gönderimi etkiliyor, hesap verisi ABD'de kalıyor. |
| Postmark | Teslim edilebilirliği güçlü. | Veri yeri konusunda kaynaklar çelişiyor. |

**Önerim:**

- **Test ve pilot:** Kod bir e-posta arayüzü üzerinden yazılır. Test ortamında yalnızca test posta kutusu kullanılır.
- **Yayın:** KVKK kararına göre seçim yapılır.
  - Veri AB'de kalabiliyorsa, AB merkezli ve AB'de barındıran bir servis (Brevo, sözleşmesi doğrulanırsa) tercih edilir.
  - Hukuk birimi Türkiye'de kalmasını isterse, Türkiye'de hizmet veren bir işlemsel e-posta sağlayıcısı araştırılır.
  - Her iki durumda kariyer@pauteknokent.com.tr için SPF, DKIM ve DMARC kayıtlarını DNS'i yöneten kişi girecek (K10).

## 6. Virüs tarama

- ClamAV, Worker'ın içinde çalışamaz.
- Cloudflare Containers Nisan 2026'da genel kullanıma açıldı ve ücretli plana dahil kullanım içeriyor. Bu bilgi Cloudflare'in fiyat belgesinden; yalnızca kullanılabilirlik tarihi ikincil kaynaktan.
- **Önerilen akış:**
  1. CV önce karantina alanına yüklenir.
  2. Kuyruktaki bir iş, dosyayı ClamAV konteynerine taratır.
  3. Temizse dosya asıl alana taşınır; değilse silinir ve adaya Türkçe bir mesaj gösterilir.
  4. Tarama bitene kadar firma dosyayı indiremez.
- **Risk:** ClamAV'ın virüs imzaları için gereken bellek ve konteynerin soğuk başlama süresi ilk denemede ölçülecek. Yetmezse harici bir tarama servisi değerlendirilir.

## 7. Diğer kalemler

- **Hata izleme:** Başlangıçta Cloudflare'in kendi Workers günlükleri kullanılır; üçüncü taraf yok, KVKK açısından daha sade. İhtiyaç olursa harici bir servis sonra eklenir.
- **Yedek:**
  - D1 zaman yolculuğu (30 gün) yanında, her gece sağlayıcıdan bağımsız bir SQL dökümü ve dosya arşivi alınır.
  - Ayda bir geri yükleme provası yapılır (talimatlar 16).
- **Oturum ve güvenlik:**
  - Kısa ömürlü oturum, HttpOnly, Secure ve SameSite çerezleri.
  - CSP, HSTS, `frame-ancestors`.
  - CV'ler yalnızca yetkili kullanıcıya, kısa süreli imzalı bağlantıyla verilir.

## 8. Veri yeri ve KVKK

Bu karar kurumun KVKK sorumlusu ve hukuk birimine ait.

| Seçenek | Ne gerekir? |
| --- | --- |
| Cloudflare, AB yetki alanı | Yurt dışı aktarım. İkincil kaynaklara göre standart sözleşme imzalanır ve imzadan sonra 5 iş günü içinde Kurul'a bildirilir. Cloudflare ABD merkezli bir şirkettir. Ayrıntı ve güncel şartlar kvkk.gov.tr'den doğrulanmalı. |
| Türkiye'de sunucu (Docker: PostgreSQL + MinIO) | Yurt dışı aktarım yok, ama sunucunun işletimi, yedeği ve güvenliği kurumun veya barındırma firmasının sorumluluğunda olur. |

Kod iki seçeneğe de hazır yazılacak (bkz. 4).

**Test aşaması:**

- Test ortamında yalnızca örnek veri kullanılır.
- Personelin test hesapları kendi e-posta adresleriyle açılacaksa bu da kişisel veridir. Test için takma adresler kullanmayı öneririm.

## 9. Cloudflare hesabı (K18)

Hesap sizin adınıza açılacak; ben yalnızca sizin vereceğiniz, kapsamı sınırlı bir erişim anahtarıyla çalışacağım. Adımlar onaydan sonra birlikte yapılacak:

1. **Hesap açma:** dash.cloudflare.com adresinde kurumsal bir e-postayla hesap açılır, e-posta doğrulanır.
2. **İki aşamalı doğrulama:** Hesabın kendisinde açılır.
3. **Ücretli plan:** Workers ücretli plana geçilir (aylık 5 USD; kurum kartı gerekir).
4. **Erişim anahtarı:** Yalnızca Workers, D1 ve R2 izinleri olan bir API anahtarı oluşturulur.
5. **Anahtarı iletme:** Anahtar sohbete yazılmaz. Bu oturumun güvenli kimlik bilgisi formundan girilir; bana değeri görünmez.

Bilmeniz gereken iki teknik not:

- **Menü adları:** Cloudflare panelindeki menü adları zaman içinde değişebiliyor. Adım adım anlatımı, işlem sırasında güncel ekrana göre birlikte yapacağız.
- **Ağ izni:** Bu çalışma ortamının ağ ayarları şu an Cloudflare'in belge sitesine erişimi engelliyor. Dağıtım için Cloudflare API'sine erişim izni de gerekecek. Bunu geliştirmeye geçerken size onaylatacağım.

## 10. Sizden beklenenler

1. Prototipin ve bu önerinin onayı.
2. Veri yeri kararı için KVKK sorumlusu ve hukuk birimine bu belgenin 8. bölümünün iletilmesi. Test ortamı için gerekmez; pilottan önce gerekir.
3. Cloudflare hesabını kimin, hangi kurumsal e-postayla ve hangi ödeme aracıyla açacağı.

## Kaynaklar

- **npm deposu** (`npm view`, 13 Kasım 2026): next, payload, @payloadcms/*, @opennextjs/cloudflare, wrangler, tailwindcss, react, typescript, vitest, @playwright/test.
- **Cloudflare belge deposu** (github.com/cloudflare/cloudflare-docs, `production` dalı):
  - `workers/platform/limits.mdx`
  - `workers/platform/pricing.mdx`
  - `d1/platform/limits.mdx`
  - `r2/pricing.mdx`
  - `d1/configuration/data-location.mdx`
  - `r2/reference/data-location.mdx`
- **İkincil kaynaklar:**
  - Payload'ın Cloudflare şablonu ve OpenNext ile derleme notları: [buildwithmatija.com](https://www.buildwithmatija.com/blog/payload-cms-cloudflare-d1-r2-setup), [ubitools.com](https://www.ubitools.com/payload-cloudflare-workers-deployment/), [AIKitLLC/cloudflare-admin-template PR #18](https://github.com/AIKitLLC/cloudflare-admin-template/pull/18).
  - Cloudflare Email Service: [whichdevtool.com](https://whichdevtool.com/tools/cloudflare-email-service/), [sqmagazine.co.uk](https://sqmagazine.co.uk/cloudflare-email-service-developer-launch/).
  - Cloudflare Containers genel kullanım: [Cloudflare değişiklik günlüğü](https://developers.cloudflare.com/changelog/post/2026-04-13-containers-sandbox-ga/), [infoq.com](https://infoq.com/news/2026/04/cloudflare-sandboxes-ga).
  - E-posta servisleri fiyatları: [unspam.email](https://unspam.email/articles/transactional-email-services), [dreamlit.ai](https://dreamlit.ai/blog/best-transactional-email-services).
  - E-posta servisleri veri yeri: [Resend bölgeler belgesi](https://www.resend.com/docs/dashboard/domains/regions.md), [ahasend.com](https://ahasend.com/blog/best-european-email-apis-2026/), [mailtrap.io](https://mailtrap.io/blog/smtp-providers-compliance-comparison/).
  - Virüs tarama kalıpları: [opengovsg/lambda-virus-scanner](https://github.com/opengovsg/lambda-virus-scanner), [dev.to örneği](https://dev.to/rudra_bhairav_634c3d5d52b/how-i-built-a-secure-file-transfer-app-with-django-clamav-and-cloudflare-r2-3non).
  - KVKK yurt dışı aktarım ve standart sözleşme: [kvkk.gov.tr Yurt Dışına Aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim), [kvkk.gov.tr Standart Sözleşmeler](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler), [kvkk.gov.tr 5 Şubat 2025 duyurusu](https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu).
