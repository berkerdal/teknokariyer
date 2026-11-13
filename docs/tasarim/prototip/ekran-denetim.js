/* Denetim sayfası ve menü grupları */
"use strict";

const DENETIM_SATIRLARI = [
  ["Ana sayfa", "Blok/oda karoları, “yalnızca Teknokent firmaları”, “PAÜ öğrencisine öncelik” etiketi, Teknokent konferans salonundaki kariyer günü duyurusu.",
    "Dev slogan yok; ilk ekranda arama ve gerçek ilanlar var. Sayılar veriden hesaplanıyor ve tanımı yazıyor.",
    "Masaüstünde arama alanının sağı boş kalıyor. Duyuru girilmediğinde “Duyurular” bölümü tamamen gizlenmeli."],
  ["İlan listesi", "Firma adlarının yanında blok/oda kodu; staj türleri (zorunlu, uzun dönem) Türkiye’deki üniversite düzenine göre.",
    "Büyük kart yok, satırlar yoğun. Etiketler düz metin; hap biçimi yalnızca filtrede.",
    "Listede eşleşme özeti gösterilmedi; yoğunluk için yalnızca ayrıntıda ve kaydedilenlerde var. Sıralama seçenekleri yalnızca görünüm olarak duruyor."],
  ["İlan detayı", "“Pamukkale Teknokent, B Blok G12” konumu; staj bilgilerinde SGK ve zorunlu staj belgesi.",
    "Eşleşme gerekçeli bir liste, yüzde değil. Sayaçta baskı dili yok.",
    "İngilizce arayüz prototipte yok. Sayaç biçimi kesinleşti (K23)."],
  ["Başvuru akışı", "Aydınlatma metni sürümüyle birlikte gösteriliyor; havuz rızası ayrı kutu.",
    "Hata özeti ve alan altı Türkçe hata mesajları var; sessiz hata yok. “İsteğe bağlı” alanlar kaydı engellemiyor.",
    "Şifre sıfırlama ve e-posta doğrulama ekranları çizilmedi; giriş, kayıt ve profili eksik başvuru ekranları eklendi."],
  ["Aday paneli", "Görüşme yeri “Teknokent D Blok 208”; CV havuzunda mevcut işverenden gizlenme seçeneği Teknokent çalışanları için düşünüldü.",
    "Puan veya rozet yok; profil tamamlanma göstergesi bir eksikler listesi.",
    "Kayıtlı aramalar ekranı çizilmedi (menüde yer tutucu). Hesap ve gizlilik ekranı eklendi."],
  ["Firma sayfası", "Teknokent’teki yeri sayfanın en görünür bilgisi; fotoğraf yerine firma karosu ve büyük tipografi.",
    "Stok fotoğraf yok. Fotoğrafsız da tamamlanmış görünüyor.",
    "Firmalar fotoğraf yükledikten sonra galeri düzeni yeniden denetlenmeli. Firmalar dizini sayfası çizilmedi."],
  ["Firma paneli", "Onay kuralı (ilk 3 ilan) ve “güvenilir firma” yolu Teknokent’in kendi süreci; konum varsayılanı “Pamukkale Teknokent, D Blok 208”.",
    "Pano kartı yok, yapılacaklar var. Düğmeler ne yapacağını söylüyor.",
    "İlan formu tek uzun sayfa. 5 dakika hedefi kurum içi kullanılabilirlik testinde ölçülmeli. Yayındaki ilanı düzenleme (esaslı değişiklik ve sürüm geçmişi) ile ekip yetkileri eklendi."],
  ["Başvurular ve CV havuzu", "İndirilen CV’de firma adı ve tarih filigranı (K6); havuzda aday kodları.",
    "Kara kutu uyum yüzdesi yok. Olumsuz bildirim kapatılamıyor.",
    "Toplu durum değiştirme ve ZIP indirme yalnızca düğme olarak var. Havuz görünürlüğü K24 ve K25’e göre güncellendi."],
  ["Yönetici A.Ş. paneli", "121 firmalık kare ızgara: her kare bir Teknokent firması. Kurulum aşamaları (iskelet, davet, devralma) kurumun kendi iş akışı (K3).",
    "“4 KPI kartı + alan grafiği” yok; pano yönetimin beş sorusuna göre kuruldu. Talep ve arz farklı ölçekli çubukla değil, tabloyla gösteriliyor.",
    "Taksonomi, e-posta şablonları, duyurular ve ayarlar menüde yer tutucu; KVKK talepleri, işlem kayıtları ve test posta kutusu eklendi. Menüdeki sayı rozetleri işlevsel (bekleyen iş sayısı); süs değil, ama sayılar sıfırken gizlenmeli."],
];

ekran("denetim", {
  ad: "Denetim", belge: true,
  aciklama: "Her ekranın 15. bölümdeki yasak listesi ve logo testiyle eleştirel denetimi, bilinen zayıflıklarıyla birlikte.",
  ciz() {
    const html = `<div class="belge-ic"><p class="ust-etiket">Tasarım incelemesi · 15.5</p><h1 class="b1">Denetim</h1>
      <p class="belge-giris">Her ekranı iki cihazda ekran görüntüsüyle inceledim. Ayrıca bir tarayıcı betiği her ekranı açıp konsol hatalarını ve yatay taşmaları kontrol etti; son taramada ikisinden de sonuç çıkmadı. Aşağıda her ekran için üç soru var: logo ve renkler kaldırılınca Teknokent’e ait olduğu anlaşılıyor mu, yasak listesine takılıyor mu, bilinen zayıflığı ne?</p>
      <section class="ts-blok"><h2 class="b3 kare-bas">İnceleme sırasında bulunan ve düzeltilen sorunlar</h2><ul class="madde">
        <li>Bağlantı biçimindeki düğmelerin yazısı lacivert zemin üzerinde lacivert kalıyordu (genel bağlantı rengi düğme rengini eziyordu). Bağlantı kuralı sıfır özgüllüğe çekildi.</li>
        <li>Pano, ilanlardaki beceri talebini ve havuzdaki arzı aynı çubukta iki farklı ölçekle çiziyordu; yanıltıcıydı. Tabloya çevrildi.</li>
        <li>Yönetici onay ekranındaki ilan önizlemesi, becerileri örnek adayın profiline göre “var/yok” işaretliyordu. Önizlemede nötr liste kullanılıyor.</li>
        <li>“Başvurusuz bitmek üzere” kuyruğunda başlıktaki sayı listeyle tutmuyordu. Tüm kuyruk sayıları artık veriden hesaplanıyor.</li>
        <li>“Hiç ilan vermeyen firmalar” listesinde ilanı olan bir firma vardı. Düzeltildi.</li>
        <li>Hata mesajında eksik beceri kırmızıyla yazılıyordu. Eksik beceri bir hata değil; nötr renge çekildi.</li>
        <li>Form gruplarında tarayıcının varsayılan çerçevesi, mobilde taşan tablo ve düğmeler, kırılan “Son 2 gün” ifadesi düzeltildi.</li></ul></section>
      <section class="ts-blok"><h2 class="b3 kare-bas">Ekran ekran</h2><div class="tablo-kap"><table class="tablo denetim-tablo"><thead><tr><th>Ekran</th><th>Logo testi: Teknokent’e özgü ne kalıyor?</th><th>Yasak listesi</th><th>Bilinen zayıflık</th></tr></thead><tbody>
        ${DENETIM_SATIRLARI.map((r) => `<tr>${r.map((h) => `<td>${kac(h)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
      <section class="ts-blok"><h2 class="b3 kare-bas">Bütün için</h2><ul class="madde">
        <li><strong>Renk:</strong> Lacivert yalnızca eylem, bağlantı ve seçili durumda; geniş yüzeyler kırık beyaz. Kiremit logoda, eşleşme kutusunun kenarında ve huninin son satırında. Yönetim panelinin koyu çerçevesi gece laciverti.</li>
        <li><strong>Yazı:</strong> Lexend ve Source Sans 3. Inter, Poppins ve Montserrat yok. Tablolarda eşit genişlikli rakam.</li>
        <li><strong>İkon:</strong> Tek set, kare uçlu çizgi. Başlıkların üstünde ikon yok; ikon yalnızca alt menüde ve işlem düğmelerinde metnin yanında.</li>
        <li><strong>Hareket:</strong> Yalnızca alt panel ve bildirimin açılması (160 ms). Hareket azaltma tercihine uyuluyor. Kaydırmada beliren öğe yok.</li>
        <li><strong>Henüz yapılmayan:</strong> Ekran okuyucu testi (NVDA, VoiceOver), gerçek cihazda ve yavaş 4G’de deneme, İngilizce arayüz. Bunlar geliştirme aşamasında yapılacak; prototip bu konuda bir şey kanıtlamıyor.</li></ul></section>
    </div>`;
    return { html };
  },
});

grup("Başlangıç", ["giris"]);
grup("Aday tarafı", ["ana-sayfa", "ilanlar", "ilan", "ilan-kapandi", "giris-yap", "kayit", "basvuru-eksik", "basvuru", "aday-panel", "aday-kaydedilen", "aday-profil", "aday-havuz", "aday-hesap", "firma-vitrin"]);
grup("Firma paneli", ["firma-ana", "firma-ilanlar", "firma-ilan-yeni", "firma-ilan-duzenle", "firma-basvurular", "firma-havuz", "firma-ekip", "firma-profil"]);
grup("Yönetici A.Ş. paneli", ["yonetim-is", "yonetim-onay", "yonetim-kurulum", "yonetim-pano", "yonetim-kvkk", "yonetim-kayit", "yonetim-posta"]);
grup("Tasarım belgeleri", ["referanslar", "tasarim-sistemi", "denetim"]);
