# TeknoKariyer — Türkiye'deki sunucuya göç rehberi

Bu rehber, portalın Cloudflare'den (Workers, D1, R2) Türkiye'deki bir sunucuya (Node.js, PostgreSQL, S3 uyumlu dosya
deposu) nasıl taşınacağını anlatır. Gerekçe K2 kararıdır: KVKK değerlendirmesi kişisel verinin Türkiye'de tutulmasını
gerektirirse geçiş kolay ve belgeli olmalıdır (talimatlar 0.2).

Rehber teknik sorumlu içindir. Komutlar Ubuntu 24.04 ve Docker Engine üzerinde denenmiştir.

## 1. Özet

- Uygulama kodu iki sağlayıcıda da aynıdır. Hangisinin kullanılacağını `SAGLAYICI` değişkeni seçer:
  `cloudflare` (D1 + R2) veya `node` (PostgreSQL + S3 uyumlu depo).
- Göç dört adımdır: veritabanı dökümünü al → PostgreSQL'e aktar → dosyaları aktar → alan adını yeni sunucuya yönlendir.
- Veri az olduğu için kesinti kısa sürer. 15 Kasım 2026 provasında veri aktarımı bir dakikadan kısa sürdü (bölüm 9).
- Cloudflare'deki veri göçten sonra bir süre olduğu gibi tutulur. Sorun çıkarsa alan adı geri yönlendirilir (bölüm 7).

## 2. Hedef mimari

Tek sunucuda dört Docker hizmeti çalışır (`compose.yaml`):

| Hizmet | Görevi | Dışarıya açık mı? |
| --- | --- | --- |
| `uygulama` | Next.js + Payload; site, paneller ve yönetim ekranı | Yalnızca sunucudaki ters vekile (127.0.0.1:3000) |
| `zamanlayici` | Gece işleri ve hatırlatmalar (Cloudflare Cron Triggers'ın karşılığı) | Hayır |
| `veritabani` | PostgreSQL 16 | Hayır |
| `depo` | SeaweedFS (S3 uyumlu dosya deposu; CV'ler, logolar) | Hayır |

HTTPS, sunucudaki ters vekilde (Caddy veya Nginx) sonlanır. Caddy kullanılırsa sertifikayı kendisi alır:

```
kariyer.pauteknokent.com.tr {
	reverse_proxy 127.0.0.1:3000
}
```

Üniversite veya kurum altyapısında hazır bir PostgreSQL ya da S3 uyumlu depo varsa bunlar da kullanılabilir. O
durumda `compose.yaml`'daki `veritabani` ve `depo` hizmetleri çıkarılır, `DATABASE_URL` ve `S3_*` değişkenleri kurumun
sunucularını gösterir.

**Dosya deposu seçimi:** MinIO'nun topluluk sürümü 2025'ten beri hazır imaj olarak dağıtılmıyor. Bu yüzden Apache
lisanslı ve olgun bir proje olan SeaweedFS seçildi. Uygulama yalnızca S3 arayüzünü kullandığı için depo istendiğinde
değiştirilebilir (Garage, MinIO, kurumun nesne deposu).

### Cloudflare'e özgü parçaların karşılıkları

| Cloudflare'de | Sunucuda | Not |
| --- | --- | --- |
| D1 | PostgreSQL 16 | Ayrı göç seti: `src/migrations-pg` |
| R2 | S3 uyumlu depo | Nesne anahtarları aynı (dosya adı) |
| Cron Triggers (`wrangler.jsonc`) | `zamanlayici` hizmeti (`scripts/zamanlayici.ts`) | Saatler tek yerde: `src/alan/zamanlama.ts` |
| `worker.ts` (statik dosya, noindex başlığı) | Gerekmez | Yayın dışı ortamda robots.txt yine her şeyi kapatır |
| Turnstile | Turnstile | Sunucudan bağımsız çalışır; anahtarlar aynı kalır |
| Workers Builds (otomatik dağıtım) | `docker compose build` | İsteğe bağlı olarak CI'dan |

## 3. Sunucu kaynakları

| Kaynak | Önerilen | Gerekçe |
| --- | --- | --- |
| İşlemci | 2 çekirdek | Uygulama ve veritabanı aynı sunucuda |
| Bellek | 4 GB (imaj sunucuda derlenecekse 8 GB) | Çalışırken uygulama yaklaşık 1 GB kullanır; `next build` derleme sırasında daha fazlasını ister |
| Disk | 40 GB SSD | Veritabanı küçük; büyüyen kısım CV dosyaları ve yedekler |
| İşletim sistemi | Ubuntu 24.04 LTS | Docker Engine ve Compose eklentisi |
| Ağ | 80 ve 443 dışarıya açık | Diğer kapılar kapalı |

İmaj başka bir makinede derlenip sunucuya taşınırsa (`docker save` / `docker load`) 4 GB bellek yeterlidir.

## 4. Hazırlık (göçten önce, kesinti yok)

1. **Sunucuyu kurun.** Docker Engine'i ve Caddy'yi (veya Nginx) kurun. Depoyu sunucuya alın.
2. **Ortam dosyasını hazırlayın:** `cp sunucu.env.ornek sunucu.env`, sonra değerleri doldurun.
   - `PAYLOAD_SECRET`: **Cloudflare'deki değerin aynısı** olmalıdır. Doğrulayıcı uygulama anahtarları ve bekleyen girişler
     bununla şifrelidir. Farklı olursa açık oturumlar kapanır, doğrulayıcı uygulama kurmuş kullanıcılar uygulamayı yeniden
     kurmak zorunda kalır. Değer Cloudflare panelinde: Workers & Pages → `teknokariyer-…` → Settings → Variables and Secrets.
     Panel gizli değeri göstermez; değer kayıtlı değilse kullanıcılara yeniden kurulum duyurulur.
   - `POSTGRES_PASSWORD`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: yeni, rastgele değerler (`openssl rand -base64 32`).
   - `TURNSTILE_SITE_ANAHTARI`, `TURNSTILE_GIZLI_ANAHTAR`: Cloudflare paneli → Turnstile → aracın ayarları. Araca yeni
     alan adı eklenmelidir (Hostname Management). **Yayında bu iki değer zorunludur;** boş bırakılırsa kayıt, giriş ve
     şifre sıfırlama formları güvenlik gereği reddedilir.
   - `ORTAM=yayin` yalnızca gerçek yayında; prova için `test`.
3. **İmajı derleyin ve hizmetleri başlatın:** `docker compose --env-file sunucu.env up -d --build`.
   Uygulama ilk açılışta PostgreSQL göçlerini uygular ve dosya kovasını oluşturur. Bu aşamada veritabanı boştur.
4. **Alan adının TTL değerini düşürün.** Göçten en az bir gün önce `kariyer.pauteknokent.com.tr` kaydının TTL'si 300
   saniyeye indirilir. DNS'i kimin yöneteceği K10'da açık bırakıldı; bu adım için o kişiyle önceden konuşulmalıdır.
5. **Provayı yapın** (bölüm 5'in tamamı, `ORTAM=test` ve `--bosalt` ile). Prova sonucu bölüm 9'a yazılır.
6. **Kullanıcılara duyurun:** kesinti saati ve süresi (öneri: hafta içi akşam, 30 dakika).

## 5. Göç adımları (kesinti penceresi)

Komutlar depo kökünde çalıştırılır. Cloudflare erişimi için `CLOUDFLARE_API_TOKEN` (D1 ve R2 okuma yetkili) ve
`CF_HESAP` (hesap kimliği) gerekir.

1. **Siteyi yazmaya kapatın.** Cloudflare panelinde Worker'ın özel alan adını geçici olarak kaldırın veya bakım sayfası
   gösterin. Böylece göç sırasında yeni başvuru veya kayıt gelmez.
2. **Geri dönüş noktası alın:** Cloudflare panelinde D1 → veritabanı → Time Travel'da o anki yer imini not edin.
3. **Veritabanı dökümünü alın.** Döküm aynı zamanda sağlayıcıdan bağımsız yedektir; güvenli bir yerde saklanır:

   ```bash
   pnpm exec wrangler d1 export <veritabanı-adı> --remote --output=yedek.sql
   ```

   Veritabanı adı `wrangler.jsonc` → `d1_databases` → `database_name` alanındadır (test ortamında `teknokariyer-test`).

4. **Dökümü SQLite dosyasına açın.** Betik bağlantısı kopuk satır varsa durur:

   ```bash
   pnpm exec tsx scripts/goc/dokumu-ac.ts yedek.sql yedek.sqlite
   ```

5. **PostgreSQL'e aktarın.** Hedef veritabanı göçlerle kurulmuş ve boş olmalıdır. Betik her tabloyu tek işlemde
   kopyalar; satır sayıları ve yabancı anahtarlar tutmazsa hiçbir şey yazmadan geri alır:

   ```bash
   DATABASE_URL=postgres://… pnpm exec tsx scripts/goc/sqlite-postgres.ts yedek.sqlite
   ```

   Veritabanı Docker'daysa kapı geçici olarak açılabilir ya da betik uygulama kapsayıcısında çalıştırılabilir
   (`docker compose exec uygulama pnpm exec tsx …`; döküm dosyası kapsayıcıya kopyalanır).

6. **Dosyaları aktarın.** Betik yarıda kalırsa yeniden çalıştırılabilir; aynı boyuttaki nesneleri atlar:

   ```bash
   CF_HESAP=… R2_KOVA=<r2-kova-adı> R2_YETKI_ALANI=eu \
   S3_ENDPOINT=… S3_BUCKET=teknokariyer-dosyalar S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… \
   DATABASE_URL=postgres://… pnpm exec tsx scripts/goc/r2-s3.ts
   ```

   R2 kovasının adı `wrangler.jsonc` → `r2_buckets` → `bucket_name` alanındadır (test ortamında
   `teknokariyer-test-dosyalar`). Sonunda kaynaktaki her nesnenin hedefte aynı boyutta olduğu ve veritabanındaki her dosya kaydının nesnesinin bulunduğu
   denetlenir.

7. **Uygulamayı yeniden başlatın:** `docker compose --env-file sunucu.env restart uygulama zamanlayici`.
8. **Denetim listesini uygulayın** (bölüm 8). Sunucuyu alan adına bağlamadan denemek için kendi bilgisayarınızda
   `hosts` dosyasına sunucunun adresi yazılır.
9. **Alan adını yönlendirin.** DNS kaydı yeni sunucunun IP adresine çevrilir. TTL 300 saniye olduğu için birkaç dakikada
   yayılır.
10. **Zamanlanmış işleri denetleyin.** `docker compose logs zamanlayici` çıktısında “başladı” satırı görünmelidir. Elle bir
    kez çalıştırmak için: `docker compose exec -e ZAMANLAYICI_SIMDI=1 zamanlayici pnpm exec tsx scripts/zamanlayici.ts`.
    Her çalışma Yönetici A.Ş. panelinde “Bugün” sayfasında ve işlem kayıtlarında görünür.

## 6. Yedekleme (sunucuda)

Talimatlara göre yedekler sağlayıcıdan bağımsız biçimde alınır: SQL dökümü ve dosya arşivi. Sunucudaki zamanlayıcıya
(`crontab -e`) gecelik iki iş eklenir:

```bash
# Veritabanı (her gece 03:15)
15 3 * * * cd /srv/teknokariyer && docker compose --env-file sunucu.env exec -T veritabani pg_dump -U teknokariyer teknokariyer | gzip > /yedek/vt-$(date +\%F).sql.gz
# Dosyalar (her gece 03:45)
45 3 * * * docker run --rm -v teknokariyer_depo:/veri -v /yedek:/yedek alpine tar czf /yedek/depo-$(date +\%F).tgz -C /veri .
```

Yedekler sunucu dışında ikinci bir yere de kopyalanmalıdır (kurumun yedek sunucusu). Saklama süresi KVKK saklama
politikasıyla uyumlu olmalıdır: silinen hesapların verisi yedeklerde de en geç yedek saklama süresi sonunda yok olur.
Bu süre hukuk birimiyle belirlenir (talimatlar 19. bölüm sonu).

Geri yükleme: boş bir veritabanına `gunzip -c vt-….sql.gz | docker compose exec -T veritabani psql -U teknokariyer
teknokariyer`, dosyalar için arşiv depo biriminin içine açılır.

## 7. Geri dönüş planı

- Cloudflare'deki D1 ve R2 verisine göçten sonra dokunulmaz. Worker silinmez, yalnızca alan adı bağlantısı kaldırılır.
- **İlk saatlerde ciddi bir sorun çıkarsa:** DNS kaydı eski hâline döndürülür ve Worker'ın alan adı yeniden bağlanır.
  Göçten sonra yeni sunucuya yazılan veriler (yeni başvurular, kayıtlar) Cloudflare'e kendiliğinden geri gitmez. Bu yüzden
  geri dönüş kararı ilk gün içinde verilmelidir. Geri dönülürse yeni sunucudaki o günün kayıtları işlem kayıtlarından
  çıkarılıp ilgili firmalara ve adaylara elle bildirilir.
- **Göç sırasında bir adım başarısız olursa:** aktarma betikleri hata durumunda hiçbir şey yazmadan geri alır. Sorun
  giderilir, adım yeniden çalıştırılır. Site Cloudflare'de olduğu gibi durduğu için alan adı bağlantısı geri açılabilir.
- **Bekleme süresi bittikten sonra** (öneri: 30 gün, hukuk birimiyle teyit edilir) Cloudflare'deki D1 veritabanı ve R2
  kovası silinir. Kişisel verinin iki yerde tutulmaması KVKK'nın veri en aza indirme ilkesinin gereğidir.

## 8. Denetim listesi

Göçten sonra, alan adı yönlendirilmeden önce ve sonra:

- [ ] Ana sayfa, ilan listesi, bir ilan sayfası ve bir firma sayfası açılıyor.
- [ ] Var olmayan bir adres gerçek 404 döndürüyor.
- [ ] `robots.txt` yayında hesap ve panel yollarını kapatıyor, site haritasını bildiriyor; `sitemap.xml` yeni alan adını
      kullanıyor.
- [ ] Bir aday hesabıyla giriş yapılıyor; başvurular ve profil görünüyor.
- [ ] Bir firma hesabıyla giriş yapılıyor; tanınmayan cihazda e-posta kodu isteniyor ve kod geliyor.
- [ ] Firma panelinde bir başvurunun CV'si portal içindeki görüntüleyicide açılıyor ve filigranlı olarak iniyor.
- [ ] Yönetici A.Ş. panelinde “Bugün”, “Yönetici özeti” ve raporlar açılıyor; Excel çıktısı iniyor.
- [ ] Doğrulayıcı uygulama kurmuş bir kullanıcı uygulama koduyla giriş yapabiliyor (`PAYLOAD_SECRET` doğru aktarıldıysa).
- [ ] Yeni bir CV yüklenebiliyor (dosya deposuna yazma).
- [ ] Turnstile kayıt ve giriş formlarında çalışıyor.
- [ ] Zamanlayıcı başladı; elle çalıştırma işlem kaydına düştü.
- [ ] Gece yedekleri oluştu ve sunucu dışına kopyalandı.
- [ ] E-posta gönderimi yayında çalışıyor (e-posta servisi seçildikten sonra; teknoloji önerisi 5. bölüm).

## 9. Prova sonucu (15 Kasım 2026)

Test ortamının verisi (Cloudflare D1 + R2) bu çalışma ortamında yerel PostgreSQL 16 ve SeaweedFS 4.53'e taşındı.
Uygulama `SAGLAYICI=node` ile bu veriler üzerinde çalıştırıldı.

| Adım | Sonuç |
| --- | --- |
| `wrangler d1 export` | 63 tablo, 1.614 satırlık döküm (yaklaşık 480 KB) |
| `dokumu-ac.ts` | 63 tablo, 1.614 satır; kopuk bağlantı yok |
| PostgreSQL göçü (`src/migrations-pg`) | 63 tablo; D1 ile aynı |
| `sqlite-postgres.ts` | 62 tablo, 1.603 satır (göç kayıtları hariç); satır sayıları tutuyor; 102 yabancı anahtar denetlendi; 43 sayaç ayarlandı; sütun uyuşmazlığı yok |
| `r2-s3.ts` | 6 nesne kopyalandı, boyutlar tutuyor; 6 dosya kaydının hepsi depoda |
| Uygulama (node) | Herkese açık sayfalar 200, bilinmeyen adres 404; site haritası canlıdakiyle aynı 38 adres |
| Firma girişi | E-posta koduyla ikinci adım çalıştı; başvuru açıldı (işlem kaydı yazıldı) |
| CV | Portal içindeki görüntüleyicide açıldı; filigranlı PDF S3'ten okunup indirildi |
| Zamanlayıcı | Elle çalıştırma tamamlandı, işlem kaydına yazıldı |
| Docker imajı | Bölüm 10'a bakınız |

Provada öğrenilenler:

- D1 dökümünde dizinler tablolarından önce gelebiliyor ve tablolar ada göre sıralı. `dokumu-ac.ts` önce tabloları kurar,
  yabancı anahtar denetimini sona bırakır.
- R2 kovası AB yetki alanında olduğu için API isteklerine `cf-r2-jurisdiction: eu` başlığı gerekir (`R2_YETKI_ALANI=eu`).
- `payload run` ile çalışan betiklerde `@payload-config` takma adı tsconfig'de Cloudflare yapılandırmasına çözülür.
  PostgreSQL'e yazacak betikler `src/payload.config.node.js` dosyasını doğrudan içe aktarır (uzantı `.js` yazılır;
  `.node` soneki Node'da yerel eklenti sanılır).

## 10. Docker imajının derlenmesi

Bu bölüm imaj bu çalışma ortamında derlenip denendiğinde güncellenir.

## 11. Geliştiriciler için: şemayı iki tarafta aynı tutmak

- Bir koleksiyon veya alan değiştiğinde **iki göç** üretilir:
  - D1: `pnpm payload migrate:create ad` (bkz. CLAUDE.md, D1 göçleri)
  - PostgreSQL: `PAYLOAD_CONFIG_PATH=src/payload.config.node.ts DATABASE_URL=postgres://… pnpm payload migrate:create ad`
    (göçler `src/migrations-pg` altına yazılır).
- Değişiklik yokken PostgreSQL göçü üretmeye çalışmak “değişiklik yok” der; bu, iki tarafın aynı olduğunun basit denetimidir.
- Yerel PostgreSQL ve S3 için `compose.yaml`'daki `veritabani` ve `depo` hizmetleri tek başına çalıştırılabilir:
  `docker compose --env-file sunucu.env up -d veritabani depo`.
