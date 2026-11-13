/* Belge sayfaları: prototip hakkında, referans panosu, tasarım sistemi, denetim */
"use strict";

ekran("giris", {
  ad: "Prototip hakkında", belge: true,
  aciklama: "Nasıl gezileceği, neyin gerçek neyin örnek olduğu ve sizden beklenen kararlar.",
  ciz() {
    const say = GRUPLAR.reduce((n, g) => n + g.idler.filter((id) => !EKRANLAR[id].belge).length, 0);
    return { html: `<div class="belge-ic">
      <p class="ust-etiket">TeknoKariyer · Prototip · Taslak 1 · 13 Kasım 2026</p>
      <h1 class="b1">Tıklanabilir prototip</h1>
      <p class="belge-giris">Aday, firma ve Yönetici A.Ş. taraflarından ${say} ekran. Her ekran mobil ve masaüstü için ayrı düzenlendi; üstteki düğmeyle geçebilirsiniz. Ekranların altında “Bu ekran neden böyle?” notu var.</p>
      <div class="belge-iki">
        <section><h2 class="b3 kare-bas">Nasıl gezilir?</h2><ul class="madde">
          <li>Soldaki menüden (telefonda üstteki listeden) bir ekran seçin.</li>
          <li><strong>Mobil / Masaüstü</strong> düğmesi cihazı değiştirir. Masaüstü ekranı sayfaya sığacak şekilde küçültülür.</li>
          <li>Düğmeler ve bağlantılar çalışır: filtreler sonuç sayısını değiştirir, başvuru adımları ilerler, ilan işlemleri bildirim verir.</li>
          <li>Hata durumlarını deneyin: başvurunun 2. adımında soruları boş bırakın; ilan formunda “Önizle”ye basın.</li></ul></section>
        <section><h2 class="b3 kare-bas">Ne gerçek, ne örnek?</h2><ul class="madde">
          <li><strong>Gerçek:</strong> firma unvanları, sektörleri ve blok/oda bilgileri (Teknokent firma rehberinden), kurum adresi ve telefonu, onaylı kimlik.</li>
          <li><strong>Örnek:</strong> ilanlar, kişiler, firma tanıtım metinleri ve tüm sayılar. Canlı sistemde sayılar veritabanından gelecek.</li>
          <li>Firma logoları henüz yok. Logo gelene kadar firmalar blok/oda kodlu bir karoyla görünüyor.</li></ul></section>
      </div>
      <section class="karar-kutusu"><h2 class="b2">Sizden beklenen kararlar</h2><ol class="karar-liste">
        <li><strong>Sayaç biçimi (K7).</strong> İlan sayfasında dört biçim var: aralık (“10–50 başvuru”), kesin sayı, görüntülenme + başvuru, hiç gösterme. <a href="#ilan-1">İlan detayında deneyin.</a> Önerim: aralık. Adayı yanıltmadan bilgi veriyor ve az başvurulu ilanı “kimse başvurmamış” diye damgalamıyor.</li>
        <li><strong>CV havuzunda adın gizlenmesi.</strong> Talimatlarda firma önce “iletişim bilgisi ve CV olmadan” bir özet görüyor. Ben adın da aday onay verene kadar gizli kalmasını öneriyorum (“A-1042”). Bu, ayrımcılık riskini azaltır. <a href="#firma-havuz">Ekranı görün.</a></li>
        <li><strong>İletişim talebinin süresi.</strong> Firmanın talebine aday 14 gün içinde cevap vermezse talep kapansın mı?</li>
        <li><strong>Favicon.</strong> Ana logodaki “t” ve kiremit kare. Tarayıcı sekmesinde görmek için <a href="https://claude.ai/artifact/Nqt3PPkQZxjTZemDeYtjxR">kimlik kılavuzuna</a> bakabilirsiniz.</li>
        <li><strong>Genel onay.</strong> Ekranlardaki yapı, akışlar ve görsel dil uygunsa teknoloji yığınını kesinleştirip geliştirmeye geçeceğim.</li></ol></section>
      <p class="kucuk ikincil">Kaynak: <code>docs/tasarim/prototip/</code>. Tasarım değişkenleri <code>tokenlar.css</code> dosyasında; uygulamaya aynı adlarla aktarılacak.</p>
    </div>` };
  },
});

const REFERANSLAR = [
  { ad: "GOV.UK Design System", tur: "Kamu tasarım sistemi", adres: "https://design-system.service.gov.uk",
    neden: "Formlarda hatanın nasıl gösterileceği için en iyi belgelenmiş kaynak: formun üstünde bağlantılı bir hata özeti, her alanın altında ne yapılacağını söyleyen mesaj, isteğe bağlı alanların açıkça işaretlenmesi.",
    alinan: "Hata özeti, alan altı hata mesajı, ipucu metni, “(isteğe bağlı)” işareti. Denetimde bulunan “sessiz doğrulama hatası” sorununun doğrudan karşılığı.",
    alinmayan: "Görsel dili. GOV.UK’nin siyah-beyaz, büyük ve kurumsal görünümü bize ait değil." },
  { ad: "NL Design System", tur: "Kamu tasarım sistemi (Hollanda)", adres: "https://nldesignsystem.nl",
    neden: "Farklı kurumların ortak bileşenleri kendi temalarıyla kullanmasını tasarım değişkenleriyle çözüyor.",
    alinan: "Değişken (token) mimarisi. Aday tarafı, firma paneli ve yönetim paneli aynı bileşenleri kullanıyor; yoğunluk ve çerçeve rengi değişkenlerle ayrılıyor.",
    alinmayan: "Bileşen görünümleri." },
  { ad: "LinkedIn iş ilanları (masaüstü)", tur: "İş ilanı ürünü", adres: "https://www.linkedin.com/jobs",
    neden: "Liste ile ilan ayrıntısını yan yana gösteren düzen, çok ilan gezen aday için en az tıklamayı gerektiriyor.",
    alinan: "Masaüstünde solda filtre, ortada liste, sağda ilan. İlan açılınca liste kaybolmuyor.",
    alinmayan: "Öne çıkarılmış ilan ve aciliyet dili. Talimatlardaki baskı yaratan ifade yasağı." },
  { ad: "Welcome to the Jungle firma sayfaları", tur: "İşveren vitrini", adres: "https://www.welcometothejungle.com",
    neden: "Firma sayfasını “burada çalışmak nasıl bir şey?” sorusuna göre kuruyor; firma tanıtımını iş ilanından ayırıyor.",
    alinan: "Firma vitrininin editoryal düzeni: büyük firma adı, somut bilgiler (çalışma modeli, yan haklar, teknolojiler), açık ilanlar.",
    alinmayan: "Fotoğraf ve video ağırlığı. Fotoğraflar sonra gelecek (K12); sayfa fotoğrafsız da tamam görünmeli." },
  { ad: "Kariyer.net", tur: "Türkiye’de bilinen model", adres: "https://www.kariyer.net",
    neden: "Kurumun ham notlarında model olarak geçiyor. Türkiye’deki adayın alışık olduğu kavramların kaynağı.",
    alinan: "Tanıdık terimler ve akışlar: özgeçmiş, başvurularım, kaydedilen ilanlar, kayıtlı aramalar.",
    alinmayan: "Ölçek. 121 firmalık tek bir teknokent için çok daha yalın bir yapı yeterli; her ekran daha az şey göstermeli." },
  { ad: "Linear", tur: "Veri yoğun uygulama arayüzü", adres: "https://linear.app",
    neden: "Çok sayıda kaydı sıkı ama okunur satırlarda, tutarlı durum işaretleriyle gösteriyor.",
    alinan: "Yönetim panelinin yoğunluğu: sıkı satır yüksekliği, kuyruk mantığı, tutarlı durum işaretleri.",
    alinmayan: "Pazarlama sitesindeki renk geçişleri ve parıltılar." },
  { ad: "GitHub Primer", tur: "Tasarım sistemi", adres: "https://primer.style",
    neden: "Durumları (açık, taslak, kapalı) renk, şekil ve metinle birlikte anlatıyor; erişilebilirlik belgeleri ayrıntılı.",
    alinan: "Durum etiketinde rengin tek başına anlam taşımaması. Bizde kare işaret + metin.",
    alinmayan: "Hap biçimli renkli durum rozetleri. Talimat 15.2 hap biçimli parlak zemini yasaklıyor." },
  { ad: "Teknopark İzmir web sitesi", tur: "Rakip, teknik kalite", adres: "https://www.teknoparkizmir.com.tr",
    neden: "CLAUDE.md’deki rakip analizinde teknik kalite referansı: tek H1, hreflang, hafif sayfalar.",
    alinan: "Teknik hedefler: her sayfada özgün başlık, hreflang, hafif sayfa.",
    alinmayan: "Görsel dil." },
  { ad: "Teknopark İstanbul", tur: "Rakip, bilgi mimarisi", adres: "https://www.teknoparkistanbul.com.tr",
    neden: "Menüsü amaca göre kurulmuş ve ayrı bir “Kariyer Fırsatları” sayfası var (CLAUDE.md, 4. bölüm).",
    alinan: "Amaç odaklı menü: İlanlar, Firmalar, Staj, CV havuzu. Firmalar için tek bir giriş noktası.",
    alinmayan: "—" },
  { ad: "Josef Müller-Brockmann, “Grid Systems in Graphic Design” (1981)", tur: "Editoryal tasarım", adres: "https://en.wikipedia.org/wiki/Josef_M%C3%BCller-Brockmann",
    neden: "Fotoğraf olmadığında sayfayı ızgara ve tipografinin taşıması. Fotoğrafsız tasarım kararının (K12) dayanağı.",
    alinan: "Kare modüle dayalı ızgara, asimetrik düzen, büyük tipografinin görsel yerine kullanılması (firma vitrini, sosyal medya şablonu).",
    alinmayan: "Afiş ölçeğindeki dramatik kompozisyon. Arayüzde okunurluk önce gelir." },
  { ad: "Pamukkale Teknokent logosu", tur: "Kaynak kimlik", adres: "https://claude.ai/artifact/Nqt3PPkQZxjTZemDeYtjxR",
    neden: "Pikselli kare motifi kimliğin ayırt edici öğesi.",
    alinan: "Kare; süs olarak değil, işlevle: bölüm işareti, durum işareti, başvuru ilerlemesi, kare birimli huni, 121 firmalık kurulum ızgarası.",
    alinmayan: "Logonun dağınık piksel kümesinin süs olarak tekrarı. Küme yalnızca logoda kalır (K22)." },
];

ekran("referanslar", {
  ad: "Referans panosu", belge: true,
  aciklama: "Her referansın neden seçildiği, ondan ne alındığı ve neyin bilerek alınmadığı.",
  ciz() {
    return { html: `<div class="belge-ic"><p class="ust-etiket">Tasarım süreci · 15.5</p><h1 class="b1">Referans panosu</h1>
      <p class="belge-giris">Görsel kopyalamak için değil, bir problemi nasıl çözdüklerini görmek için seçildi. Her referansın yanında ondan ne aldığımız ve neyi bilerek almadığımız yazıyor. Ekran görüntüsü kullanmadım; bağlantılar kaynağın kendisine gider.</p>
      <ol class="referans-liste">${REFERANSLAR.map((r, k) => `<li class="referans"><div class="ref-bas"><span class="ref-no">${String(k + 1).padStart(2, "0")}</span><div><h2 class="b3">${kac(r.ad)}</h2><p class="kucuk ikincil">${kac(r.tur)} · <a href="${r.adres}" target="_blank" rel="noopener">${kac(r.adres.replace("https://", ""))}</a></p></div></div>
        <dl class="ref-dl"><div><dt>Neden</dt><dd>${kac(r.neden)}</dd></div><div><dt>Aldığımız</dt><dd>${kac(r.alinan)}</dd></div><div><dt>Almadığımız</dt><dd>${kac(r.alinmayan)}</dd></div></dl></li>`).join("")}</ol></div>` };
  },
});

ekran("tasarim-sistemi", {
  ad: "Tasarım sistemi", belge: true,
  aciklama: "Değişkenler ve canlı bileşenler. Prototipteki her ekran yalnızca bunlardan kuruldu.",
  ciz() {
    const renk = [["--zemin", "Zemin"], ["--yuzey", "Yüzey"], ["--yuzey-2", "Yüzey 2"], ["--cizgi", "Çizgi"], ["--cizgi-kontrol", "Form kenarı"], ["--metin", "Metin"], ["--metin-2", "İkincil metin"], ["--lacivert", "Lacivert"], ["--lacivert-koyu", "Lacivert koyu"], ["--lacivert-acik", "Lacivert açık"], ["--baglanti", "Bağlantı"], ["--camgobegi", "Camgöbeği"], ["--camgobegi-acik", "Camgöbeği açık"], ["--kiremit", "Kiremit"], ["--gece", "Gece"], ["--basari", "Başarı"], ["--uyari", "Uyarı"], ["--hata", "Hata"]];
    const ikonlar = ["ara", "filtre", "konum", "takvim", "ofis", "ev", "yer-imi", "dosya", "indir", "yukle", "kapat", "geri", "ileri", "menu", "tik", "kisi", "zil", "arti", "kopya", "duraklat", "paylas", "liste", "mesaj", "kalem", "grafik", "ayar"];
    const blok = (b, i) => `<section class="ts-blok"><h2 class="b3 kare-bas">${b}</h2><div class="ts-ornek">${i}</div></section>`;
    const html = `<div class="belge-ic"><p class="ust-etiket">tokenlar.css · bilesenler.css</p><h1 class="b1">Tasarım sistemi</h1>
      <p class="belge-giris">Renk, yazı, boşluk ve köşe değerleri tek bir dosyada. Bileşenler renk değerini doğrudan yazmaz; değişkeni kullanır. Uygulamaya geçişte aynı adlar Tailwind temasına aktarılacak.</p>
      ${blok("Renk", `<ul class="ts-renkler">${renk.map(([v, a]) => `<li><span style="background:var(${v})"></span><strong>${a}</strong><code>${v}</code></li>`).join("")}</ul>`)}
      ${blok("Yazı", `<p class="b1">Başlık 1 · Gömülü Yazılım Mühendisi</p><p class="b2">Başlık 2 · Ne yapacaksın?</p><p class="b3">Başlık 3 · Staj bilgileri</p><p>Gövde 16/24 · Pinova’nın endüstriyel sensör kartları için STM32 tabanlı yazılım geliştireceksin.</p><p class="kucuk">Küçük 14/20 · D Blok 208 · Son başvuru 12 Aralık</p><p class="ust-etiket">Etiket 13/16 · SENİN PROFİLİNLE</p>
        <p class="kucuk ikincil">Lexend (başlık) · Source Sans 3 (metin ve tablo, eşit genişlikli rakam) · ĞÜŞİÖÇ ğüşıöç</p>`)}
      ${blok("Boşluk ve köşe", `<div class="ts-bosluk">${[4, 8, 12, 16, 24, 32, 48].map((b) => `<span><i style="width:${b}px;height:${b}px"></i>${b}</span>`).join("")}</div>
        <div class="ts-kose"><span style="border-radius:var(--kose-kontrol)">Kontrol 4</span><span style="border-radius:var(--kose-panel)">Panel 6</span><span style="border-radius:var(--kose-gorsel)">Görsel 2</span><span style="border-radius:999px">Yalnızca filtre hapı</span></div>`)}
      ${blok("Düğmeler", `<div class="dugme-grubu"><button class="dugme">Başvur</button><button class="dugme dugme--ikincil">Taslağı kaydet</button><button class="dugme dugme--sade">Vazgeç</button><button class="dugme dugme--tehlike">İlanı kapat</button><button class="dugme" disabled>Gönderiliyor</button><button class="dugme dugme--kucuk">Küçük</button></div>
        <p class="kucuk ikincil">En küçük dokunma alanı 44 px. Düğme metni ne yapacağını söyler.</p>`)}
      ${blok("Form", `<div class="ts-form"><div class="alan"><label for="ts1">Pozisyon adı</label><span class="ipucu">Adayın arayacağı adı yazın.</span><input id="ts1" class="girdi" value="Gömülü Yazılım Mühendisi"></div>
        <div class="alan alan--hata"><label for="ts2">E-posta</label><p class="hata-metni">E-posta adresini ad@firma.com biçiminde yazın.</p><input id="ts2" class="girdi" type="email" value="selin.aydemir@kodpit"></div>
        <div class="alan"><label for="ts3">Ön yazı <span class="istege-bagli">(isteğe bağlı)</span></label><textarea id="ts3" class="metin-alani"></textarea></div>
        <fieldset class="alan"><legend>Çalışma modeli</legend><label class="secenek secenek-kutu"><input type="radio" name="ts" checked> <span>Hibrit<span class="ipucu">Haftada en az bir gün ofiste</span></span></label><label class="secenek secenek-kutu"><input type="radio" name="ts"> <span>Uzaktan</span></label></fieldset>
        <div class="hata-ozeti"><h2>Devam etmeden önce düzelt</h2><ul><li><a href="#">E-posta adresini düzelt</a></li></ul></div></div>`)}
      ${blok("Durum ve etiket", `<p class="dugme-grubu">${["taslak", "onayda", "yayinda", "duraklatildi", "suresi-doldu", "kapandi", "reddedildi"].map((k) => durum(k)).join("")}</p>
        <p class="dugme-grubu">${["alindi", "inceleniyor", "gorusme", "teklif", "olumlu", "olumsuz"].map((k) => durum(k)).join("")}</p>
        <p class="etiketler"><span class="etiket etiket--guclu">Staj · Zorunlu staj</span><span class="etiket">Ücretli</span><span class="etiket">PAÜ öğrencisine öncelik</span><span class="son-gun">Son 2 gün</span></p>
        <p class="kucuk ikincil">Durum: kare işaret + metin. Etiket: düz metin. Hap biçimli parlak rozet yok.</p>`)}
      ${blok("Filtre hapı ve sekme", `<div class="f-haplar"><button class="hap" aria-pressed="true">Staj <span class="sayi">6</span></button><button class="hap" aria-pressed="false">İş <span class="sayi">9</span></button><button class="hap" disabled>Uzaktan <span class="sayi">0</span></button></div>
        <div class="sekmeler"><a class="sekme" aria-selected="true" href="#">Yayında <span class="sayi">2</span></a><a class="sekme" href="#">Onayda <span class="sayi">1</span></a><a class="sekme" href="#">Taslak <span class="sayi">1</span></a></div>`)}
      ${blok("İlan satırı ve eşleşme", `<div class="ilan-listesi ts-genislik">${ilanSatiri(ILANLAR[0], { eslesmeGoster: true })}${ilanSatiri(ILANLAR[1])}</div>
        <div class="eslesme-kutu ts-genislik"><p class="ust-etiket">Senin profilinle</p>${eslesmeListe(eslesme(ILANLAR[0], ADAY))}</div>`)}
      ${blok("Bilgi kutuları", `<div class="ts-yigin"><p class="bilgi">Bilgi: ilk 3 ilanınız onaydan geçer.</p><p class="uyari-kutu">Uyarı: ilanın süresi 3 gün içinde doluyor.</p><p class="hata-kutu">Hata: CV 5 MB’tan büyük. PDF’i sıkıştırıp tekrar yükle.</p><p class="basari-kutu">Başarı: başvurun iletildi.</p></div>`)}
      ${blok("Açılır bölüm ve adımlar", `<details class="acilir ts-genislik" open><summary>Ne yapacaksın?</summary><div class="icerik"><p>Açılır bölüm başlığı 52 px yüksekliğinde.</p></div></details>
        <ol class="adimlar"><li class="tamam"><span class="no">1</span>CV ve ön yazı</li><li aria-current="step"><span class="no">2</span>Sorular</li><li><span class="no">3</span>Onay</li></ol>`)}
      ${blok("Tarih seçici (Türkçe)", turkceTakvim({ yil: 2026, ay: 11, secili: 12, enGec: [12, 12], neden: "İlan en fazla 60 gün yayında kalabilir." }))}
      ${blok("Tablo, puan ve grafik", `<div class="tablo-kap ts-genislik"><table class="tablo"><thead><tr><th>İlan</th><th class="sag">Görüntülenme</th><th class="sag">Başvuru</th><th>Durum</th></tr></thead><tbody><tr><td>Flutter Geliştirici</td><td class="sag">356</td><td class="sag">14</td><td>${durum("yayinda")}</td></tr><tr><td>Kıdemli Backend Geliştirici</td><td class="sag">–</td><td class="sag">–</td><td>${durum("onayda")}</td></tr></tbody></table></div>
        <div class="puan">${[1, 2, 3, 4, 5].map((n) => `<button class="${n <= 3 ? "dolu" : ""}">${n}</button>`).join("")}</div>
        <div class="huni ts-genislik">${[["Alındı", 14], ["İnceleniyor", 6], ["Görüşme", 2]].map(([a, n], k, d) => `<div class="huni-satir ${k === d.length - 1 ? "son" : ""}"><span>${a}</span><span class="n">${n}</span><span class="huni-kareler">${"<i></i>".repeat(n)}</span></div>`).join("")}</div>`)}
      ${blok("İkonlar", `<ul class="ts-ikonlar">${ikonlar.map((i) => `<li>${ikon(i)}<code>${i}</code></li>`).join("")}</ul><p class="kucuk ikincil">Tek set, 1,75 px çizgi, kare uçlar. Yalnızca taramayı hızlandırdığı yerde kullanılır; başlıkların üstünde ikon yok.</p>`)}
    </div>`;
    return { html };
  },
});

