/* Denetimde eksik kalan ekranlar: giriş/kayıt, profili eksik başvuru, kapanmış ilan, hesap ve gizlilik,
   yayındaki ilanı düzenleme, firma ekibi, KVKK talepleri, işlem kayıtları, test posta kutusu. */
"use strict";

/* ---------- GİRİŞ ---------- */
ekran("giris-yap", {
  ad: "Giriş", alan: "aday",
  aciklama: "Aday ve firma girişi aynı yerde ama ayrı sekmede. Firma ve yönetici hesaplarında iki aşamalı doğrulama zorunlu.",
  not: `<ul><li>Firma hesabı kendi kendine açılmaz; Yönetici A.Ş. davet eder. Listede olmayan firma için “Firmam listede yok” formu var.</li>
    <li>İki aşamalı doğrulama firma ve yönetici hesaplarında zorunlu, adaylarda isteğe bağlı. Kod alanı tek kutu, telefon klavyesi sayısal açılır, otomatik doldurmaya izin verir.</li>
    <li>Bot koruması (Turnstile) görünmez çalışır; yalnızca şüpheli durumda doğrulama ister. Hatalı denemeler sınırlanır.</li>
    <li>Hata mesajı hangi bilginin yanlış olduğunu söylemez (“e-posta veya şifre”); hesap var mı yok mu anlaşılmasın diye.</li></ul>`,
  ciz(param, c) {
    const firma = param === "firma" || param === "kod";
    const sekme = `<div class="sekmeler" role="tablist"><a class="sekme" role="tab" href="#giris-yap" data-git="giris-yap" aria-selected="${!firma}">Aday</a><a class="sekme" role="tab" href="#giris-yap-firma" data-git="giris-yap-firma" aria-selected="${firma}">Firma</a></div>`;
    let govde;
    if (param === "kod") {
      govde = `<h1 class="b2">Doğrulama kodu</h1><p>Telefonunuzdaki doğrulama uygulamasında <strong>TeknoKariyer</strong> için görünen 6 haneli kodu yazın.</p>
        <div class="alan"><label for="g-kod">Kod</label><input id="g-kod" class="girdi kod-girdi" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="482 1"></div>
        <label class="secenek"><input type="checkbox"> <span>Bu cihazda 30 gün boyunca kod sorma</span></label>
        <a class="dugme dugme--genis" href="#firma-ana" data-git="firma-ana">Giriş yap</a>
        <p class="kucuk"><a href="#">Telefonuma erişemiyorum: yedek kod kullan</a></p>`;
    } else {
      govde = `${sekme}<h1 class="b2">${firma ? "Firma girişi" : "Giriş yap"}</h1>
        ${firma ? `<p class="kucuk ikincil">Firma hesapları Yönetici A.Ş. davetiyle açılır. Davet e-postanızdaki bağlantıyla hesabınızı devralabilirsiniz.</p>` : ""}
        <div class="alan"><label for="g-e">E-posta</label><input id="g-e" class="girdi" type="email" autocomplete="email" inputmode="email" value="${firma ? "selin.aydemir@kodpit.com" : ""}"></div>
        <div class="alan"><label for="g-s">Şifre</label><input id="g-s" class="girdi" type="password" autocomplete="current-password" value="${firma ? "••••••••••" : ""}"><a class="kucuk" href="#">Şifremi unuttum</a></div>
        <a class="dugme dugme--genis" href="#${firma ? "giris-yap-kod" : "aday-panel"}" data-git="${firma ? "giris-yap-kod" : "aday-panel"}">${firma ? "Devam et" : "Giriş yap"}</a>
        ${firma ? `<p class="kucuk">Firmanız listede yok mu? <a href="#">Firma hesabı talep edin</a></p>` : `<p>Hesabın yok mu? <a href="#kayit" data-git="kayit">Hesap aç</a></p>`}`;
    }
    const html = `${adayUst(c, false)}<main class="giris-ekran"><div class="giris-kutu">${govde}</div>
      ${c === "masaustu" ? `<aside class="giris-yan"><p class="ust-etiket">Neden hesap?</p><ul class="madde"><li>Profilini bir kez doldurursun, her başvuruda kullanılır.</li><li>Başvurularının durumunu tek yerden izlersin.</li><li>İstersen CV havuzuna katılırsın; firmalar sana önce izin sorar.</li></ul></aside>` : ""}</main>`;
    return { html };
  },
});

ekran("kayit", {
  ad: "Aday hesabı açma", alan: "aday",
  aciklama: "Yalnızca gerekli üç bilgi. Aydınlatma metni okunur; ticari ileti onayı ayrı ve varsayılan olarak kapalı.",
  not: `<ul><li>Profil bilgileri kayıtta sorulmaz; ilk başvuruda yalnızca ilanın gerektirdikleri istenir.</li>
    <li>Şifre kuralları yazarken karşılanır gibi gösterilir; gönderimden sonra sürpriz hata olmaz.</li>
    <li>Her onay, metnin sürümüyle birlikte kaydedilir (KVKK).</li></ul>`,
  ciz(_, c) {
    const html = `${adayUst(c, false)}<main class="giris-ekran"><div class="giris-kutu"><h1 class="b2">Hesap aç</h1>
      <div class="alan"><label for="k-ad">Ad soyad</label><input id="k-ad" class="girdi" autocomplete="name" value="Elif Karaca"></div>
      <div class="alan"><label for="k-e">E-posta</label><input id="k-e" class="girdi" type="email" inputmode="email" autocomplete="email" value="elif.karaca@ornek.com"></div>
      <div class="alan"><label for="k-s">Şifre</label><input id="k-s" class="girdi" type="password" autocomplete="new-password" value="••••••••">
        <ul class="sifre-kurallari kucuk"><li class="tamam">En az 10 karakter</li><li>Bir rakam veya simge</li></ul></div>
      <p class="kucuk"><a href="#">Aday aydınlatma metnini</a> okuyabilirsin. Metin sürümü 1.0 · 1 Kasım 2026.</p>
      <label class="secenek kucuk"><input type="checkbox"> <span>Teknokent kariyer etkinlikleri ve duyurularıyla ilgili e-posta almak istiyorum. <span class="istege-bagli">(isteğe bağlı)</span></span></label>
      <a class="dugme dugme--genis" href="#aday-panel" data-git="aday-panel">Hesabı aç</a>
      <p class="kucuk ikincil">E-posta adresini doğrulaman için bir bağlantı göndereceğiz.</p></div></main>`;
    return { html };
  },
});

/* ---------- PROFİLİ EKSİK BAŞVURU ---------- */
ekran("basvuru-eksik", {
  ad: "Başvuru: profil eksikse", alan: "aday",
  aciklama: "Profili eksik aday için başvurunun ilk adımı: yalnızca bu ilanın gerektirdiği eksikler sorulur, bütün profil değil.",
  not: `<ul><li>Bu ilan İngilizce B1 ve 1–3 yıl deneyim istiyor; adayın profilinde dil ve mezuniyet tarihi yok. Yalnızca bu ikisi soruluyor.</li>
    <li>Cevaplar profile de kaydedilir; bir sonraki başvuruda tekrar sorulmaz.</li>
    <li>Diğer eksikler (sertifikalar, portfolyo) başvuruyu engellemez.</li></ul>`,
  ciz(_, c) {
    const html = `${basvuruBas(c, 1)}<main class="bv"><div class="bv-govde"><h1 class="b2">Bu ilan için 2 bilgi eksik</h1>
      <p class="ikincil">Cevapların profiline de kaydedilir, sonraki başvurularda tekrar sormayız.</p>
      <fieldset class="alan"><legend>Mezuniyet tarihin (beklenen)</legend><div class="iki-alan"><div class="alan"><label for="m-ay">Ay</label><select id="m-ay" class="secim">${AYLAR.map((a) => `<option ${a === "Haziran" ? "selected" : ""}>${a}</option>`).join("")}</select></div>
        <div class="alan"><label for="m-yil">Yıl</label><select id="m-yil" class="secim">${[2026, 2027, 2028, 2029].map((y) => `<option ${y === 2027 ? "selected" : ""}>${y}</option>`).join("")}</select></div></div></fieldset>
      <fieldset class="alan"><legend>İngilizce seviyen</legend><span class="ipucu">Avrupa Ortak Dil Çerçevesi (CEFR). Emin değilsen kendini değerlendirdiğin seviyeyi seç.</span>
        <div class="cefr">${CEFR.map((s) => `<label class="secenek secenek-kutu"><input type="radio" name="cefr" ${s === "B2" ? "checked" : ""}> <span><strong>${s}</strong></span></label>`).join("")}</div></fieldset>
      </div></main><div class="yapiskan-alt bv-ayak"><a class="dugme dugme--genis" href="#basvuru-1" data-git="basvuru-1">Kaydet ve devam et</a></div>`;
    return { html };
  },
});

/* ---------- KAPANMIŞ İLAN (HTTP 410) ---------- */
ekran("ilan-kapandi", {
  ad: "Kapanmış ilan (410)", alan: "aday",
  aciklama: "Kapanan ilanın adresi kaybolmaz: kapandığı söylenir, firmanın açık ilanları ve benzerleri gösterilir. Sunucu HTTP 410 döner.",
  not: `<ul><li>Arama motorlarından ve paylaşılan bağlantılardan gelen aday boş sayfaya düşmez.</li>
    <li>Yapılandırılmış veri (JobPosting) kaldırılır; Google ilanı arama sonuçlarından çıkarır.</li>
    <li>Sayfa kapanma nedenini ayrıntılandırmaz; yalnızca tarihi söyler.</li></ul>`,
  ciz(_, c) {
    const benzer = ILANLAR.filter((i) => i.aile === "Yazılım geliştirme" && i.firma !== "kodpit").slice(0, 3);
    const acik = ILANLAR.filter((i) => i.firma === "kodpit");
    const html = `${adayUst(c, false)}<main class="kapandi"><div class="kapandi-ic">
      <div class="il-bas">${kareLogo("kodpit", 48)}<div><p><strong>Kodpit Teknoloji</strong></p><p class="kucuk ikincil">D Blok 208</p></div></div>
      <p class="ust-etiket">Bu ilan 3 Ekim 2026’da kapandı</p><h1 class="b1">iOS Geliştirici</h1>
      <p>Bu ilana artık başvurulamıyor. Aşağıda Kodpit’in açık ilanları ve benzer ilanlar var.</p>
      <h2 class="b3 kare-bas">Kodpit Teknoloji’nin açık ilanları</h2><div class="ilan-listesi">${acik.map((i) => ilanSatiri(i)).join("")}</div>
      <h2 class="b3 kare-bas">Benzer ilanlar</h2><div class="ilan-listesi">${benzer.map((i) => ilanSatiri(i)).join("")}</div>
      <a class="dugme dugme--ikincil" href="#ilanlar-is" data-git="ilanlar-is">Tüm iş ilanları</a></div></main>${adayAlt()}`;
    return { html, eylemler: { kaydet: kaydetEylemi } };
  },
});

/* ---------- HESAP VE GİZLİLİK ---------- */
ekran("aday-hesap", {
  ad: "Aday paneli: Hesap ve gizlilik", alan: "aday",
  aciklama: "Bildirim tercihleri, verilen onaylar ve sürümleri, tek tuşla veri indirme ve hesap silme.",
  not: `<ul><li>Her onay, metnin sürümü ve tarihiyle listelenir; geri alınabilecek olanlar buradan geri alınır.</li>
    <li>Zorunlu işlem e-postaları (başvuru alındı, şifre sıfırlama) kapatılamaz; bu açıkça yazar.</li>
    <li>Hesap silinince açık başvurular firmalarda “aday hesabını sildi” olarak görünür; ne olacağı silmeden önce söylenir.</li></ul>`,
  ciz(_, c) {
    const bil = [["Başvurumun durumu değiştiğinde", true, true], ["Kaydettiğim ilanın süresi dolmak üzereyken", true], ["Kayıtlı aramama uyan yeni ilan", true], ["Bir firma benimle iletişime geçmek istediğinde", true, true], ["Kariyer etkinlikleri ve duyurular", false]];
    const icerik = `<h1 class="b1">Hesap ve gizlilik</h1>
      <section class="profil-bolum"><h2 class="b3 kare-bas">E-posta bildirimleri</h2><ul class="anahtarlar">${bil.map(([a, acik, zorunlu]) => `<li><label class="anahtar"><span>${a}${zorunlu ? `<span class="ipucu">Başvurunla ilgili olduğu için kapatılamaz</span>` : ""}</span><input type="checkbox" role="switch" ${acik ? "checked" : ""} ${zorunlu ? "disabled" : ""}><i aria-hidden="true"></i></label></li>`).join("")}</ul></section>
      <section class="profil-bolum"><h2 class="b3 kare-bas">Verdiğin onaylar</h2><div class="tablo-kap"><table class="tablo"><thead><tr><th>Onay</th><th>Metin sürümü</th><th>Tarih</th><th></th></tr></thead><tbody>
        <tr><td>Aday aydınlatma metni</td><td>1.0</td><td>2 Kasım 2026</td><td class="kucuk ikincil">Bilgilendirme</td></tr>
        <tr><td>CV havuzu açık rızası</td><td>1.0</td><td>2 Kasım 2026</td><td><button class="dugme dugme--sade dugme--kucuk">Geri al</button></td></tr>
        <tr><td>Ticari ileti onayı</td><td>—</td><td>Verilmedi</td><td><button class="dugme dugme--sade dugme--kucuk">Ver</button></td></tr></tbody></table></div></section>
      <section class="profil-bolum"><h2 class="b3 kare-bas">Verilerin</h2><p>Profilin, başvuruların, CV’lerin ve onay kayıtların tek bir dosyada. Hazırlanınca e-postana bağlantı göndeririz.</p>
        <div class="dugme-grubu"><button class="dugme dugme--ikincil" data-eylem="indir">${ikon("indir")} Verilerimi indir</button></div></section>
      <section class="profil-bolum tehlike-bolum"><h2 class="b3 kare-bas">Hesabı sil</h2><p>Profilin, CV’lerin ve havuz kaydın silinir. <strong>2 açık başvurun</strong> firmalarda “aday hesabını sildi” olarak görünür. Bu işlem geri alınamaz.</p>
        <button class="dugme dugme--tehlike" data-eylem="sil">Hesabımı sil</button></section>`;
    return { html: adayPanelDuzen(c, "aday-hesap", icerik), eylemler: {
      indir: () => bildirim("Verilerin hazırlanıyor. Bağlantıyı e-postana göndereceğiz."),
      sil: () => pencere(`<h2 class="b3">Hesabını silmek istediğine emin misin?</h2><p>Onaylamak için şifreni yaz.</p><div class="alan"><label for="sil-s">Şifre</label><input id="sil-s" class="girdi" type="password" autocomplete="current-password"></div>
        <div class="dugme-grubu"><button class="dugme dugme--tehlike" data-eylem-genel="kapat">Hesabı kalıcı olarak sil</button><button class="dugme dugme--ikincil" data-eylem-genel="kapat">Vazgeç</button></div>`),
    } };
  },
});

/* ---------- YAYINDAKİ İLANI DÜZENLEME ---------- */
ekran("firma-ilan-duzenle", {
  ad: "Firma paneli: Yayındaki ilanı düzenle", alan: "firma",
  aciklama: "Küçük düzeltmeler hemen yayına yansır; esaslı değişiklik (pozisyon adı, ilan türü, ücret) onaya gider. Sürüm geçmişi yanda.",
  not: `<ul><li>Hangi alanın esaslı sayıldığı alanın yanında yazar; firma değişikliğin sonucunu kaydetmeden önce bilir.</li>
    <li>Esaslı değişiklik onaylanana kadar ilanın mevcut hâli yayında kalır; başvuru almaya devam eder.</li>
    <li>Güvenilir firmalarda esaslı değişiklik de doğrudan yayına yansır.</li>
    <li>Her kayıt bir sürüm oluşturur; eski sürüm görüntülenip geri yüklenebilir.</li></ul>`,
  ciz(_, c) {
    const surumler = [["Sürüm 4", "Bugün 14:20", "Selin Aydemir", "Son başvuru 20 Aralık’a uzatıldı"], ["Sürüm 3", "10 Kasım", "Selin Aydemir", "İş tanımında yazım düzeltmesi"], ["Sürüm 2", "6 Kasım", "Yönetici A.Ş.", "Onaylandı ve yayınlandı"], ["Sürüm 1", "5 Kasım", "Selin Aydemir", "İlk taslak"]];
    const icerik = `<div class="f-bas"><div><a class="geri kucuk" href="#firma-ilanlar" data-git="firma-ilanlar">${ikon("geri", "ikon--k")} İlanlar</a><h1 class="b1">Flutter Geliştirici</h1><p>${durum("yayinda")} <span class="kucuk ikincil">· 14 başvuru · son başvuru 20 Aralık</span></p></div></div>
      <div class="duzenle-duzen"><div class="form-yigin">
        <div class="uyari-kutu"><p><strong>1 esaslı değişiklik var: ücret.</strong> Kaydettiğinizde bu değişiklik Yönetici A.Ş. onayına gider; onaylanana kadar ilanın mevcut hâli yayında kalır. Diğer 2 düzeltme hemen yayına yansır.</p></div>
        <section class="form-bolum"><div class="alan"><label for="d-poz">Pozisyon adı <span class="esasli">Esaslı · onaydan geçer</span></label><input id="d-poz" class="girdi" value="Flutter Geliştirici"></div>
          <div class="iki-alan"><div class="alan degisti"><label for="d-u1">Ücret, en az (₺) <span class="esasli">Esaslı · değişti</span></label><input id="d-u1" class="girdi" value="50.000"><span class="kucuk ikincil">Önceki: 45.000</span></div>
          <div class="alan degisti"><label for="d-u2">Ücret, en çok (₺) <span class="esasli">Esaslı · değişti</span></label><input id="d-u2" class="girdi" value="60.000"><span class="kucuk ikincil">Önceki: 55.000</span></div></div>
          <div class="alan degisti-kucuk"><label for="d-is">İş tanımı <span class="kucuk ikincil">· küçük düzeltme, hemen yayına yansır</span></label><textarea id="d-is" class="metin-alani">Müşterilerimiz için geliştirdiğimiz mobil uygulamalarda Flutter ile yeni ekranlar ve özellikler yazacaksın.
Kod incelemelerine katılıp test kapsamını artıracaksın.</textarea></div></section></div>
        <aside class="surumler panel"><h2 class="b3 panel-ic">Sürüm geçmişi</h2><ol>${surumler.map(([s, t, k, d], n) => `<li class="${n === 0 ? "guncel" : ""}"><p><strong>${s}</strong> <span class="kucuk ikincil">${t} · ${k}</span></p><p class="kucuk">${d}</p>${n ? `<button class="dugme dugme--sade dugme--kucuk">Görüntüle</button>` : `<span class="kucuk ikincil">Yayındaki sürüm</span>`}</li>`).join("")}</ol></aside></div>`;
    const alt = `<div class="yapiskan-alt f-form-ayak"><button class="dugme dugme--ikincil" data-eylem="kucuk">Yalnızca küçük düzeltmeleri yayınla</button><button class="dugme" data-eylem="hepsi">Kaydet: düzeltmeler yayına, ücret onaya</button></div>`;
    return { html: firmaDuzen(c, "firma-ilanlar", icerik, { altCubuk: alt }), eylemler: {
      kucuk: () => bildirim("Düzeltmeler yayında. Ücret değişikliği kaydedilmedi."),
      hepsi: () => bildirim("Düzeltmeler yayında; ücret değişikliği onaya gönderildi."),
    } };
  },
});

/* ---------- FİRMA EKİBİ ---------- */
ekran("firma-ekip", {
  ad: "Firma paneli: Ekip ve yetkiler", alan: "firma",
  aciklama: "Firma yöneticisi ekibini davet eder ve yetki verir. Yetkili ayrılırsa başka bir yönetici devralır.",
  not: `<ul><li>Üç hazır yetki: yönetici (her şey), ilan sorumlusu (ilan ve başvurular), değerlendirici (yalnızca başvuruları görür ve not yazar).</li>
    <li>Yetkisi olmayan kişiye işlem düğmesi gösterilmez; kontrol sunucuda da yapılır.</li>
    <li>Firmada tek yönetici kalırsa kendi yetkisini kaldıramaz; önce başka birini yönetici yapması istenir.</li></ul>`,
  ciz(_, c) {
    const kisiler = [["Selin Aydemir", "selin.aydemir@kodpit.com", "Yönetici", "Bugün"], ["Kerem Usta", "kerem.usta@kodpit.com", "Değerlendirici", "Dün"], ["Deniz Akgül", "deniz.akgul@kodpit.com", "İlan sorumlusu", "Davet bekliyor · 3 gün kaldı"]];
    const icerik = `<div class="f-bas"><div><h1 class="b1">Ekip</h1><p class="ikincil">Kişiler örnektir.</p></div><button class="dugme" data-eylem="davet">${ikon("arti")} Kişi davet et</button></div>
      <div class="tablo-kap"><table class="tablo"><thead><tr><th>Kişi</th><th>Yetki</th><th>Son giriş</th><th></th></tr></thead><tbody>
        ${kisiler.map(([a, e, y, s]) => `<tr><td><strong>${a}</strong><span class="kucuk ikincil satir-alt">${e}</span></td><td>${y}</td><td class="kucuk">${s}</td><td class="sag"><button class="dugme dugme--sade dugme--kucuk">Değiştir</button></td></tr>`).join("")}</tbody></table></div>
      <section class="panel panel-ic"><h2 class="b3 kare-bas">Yetkiler</h2><div class="tablo-kap"><table class="tablo yetki-tablo"><thead><tr><th>İşlem</th><th>Yönetici</th><th>İlan sorumlusu</th><th>Değerlendirici</th></tr></thead><tbody>
        ${[["İlan oluşturma ve düzenleme", 1, 1, 0], ["Başvuruları görme ve not yazma", 1, 1, 1], ["Başvuru durumunu değiştirme", 1, 1, 0], ["CV indirme", 1, 1, 0], ["CV havuzunda arama", 1, 1, 0], ["Firma profilini düzenleme", 1, 0, 0], ["Ekip ve yetki yönetimi", 1, 0, 0]].map(([a, ...v]) => `<tr><td>${a}</td>${v.map((x) => `<td>${x ? `<span class="evet">${ikon("tik", "ikon--k")}<span class="gizli">Var</span></span>` : `<span class="ikincil">—<span class="gizli">Yok</span></span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
    return { html: firmaDuzen(c, "firma-ekip", icerik), eylemler: {
      davet: () => altPanel("Kişi davet et", `<div class="form-yigin"><div class="alan"><label for="dv-e">İş e-postası</label><input id="dv-e" class="girdi" type="email" inputmode="email"></div>
        <fieldset class="alan"><legend>Yetki</legend>${["İlan sorumlusu", "Değerlendirici", "Yönetici"].map((y, k) => `<label class="secenek secenek-kutu"><input type="radio" name="y" ${k === 1 ? "checked" : ""}> <span>${y}</span></label>`).join("")}</fieldset>
        <p class="kucuk ikincil">Davet bağlantısı 14 gün geçerlidir ve yalnızca bir kez kullanılabilir.</p></div>`, `<button class="dugme dugme--genis" data-eylem-genel="kapat">Davet gönder</button>`),
    } };
  },
});

/* ---------- YÖNETİM: KVKK TALEPLERİ ---------- */
ekran("yonetim-kvkk", {
  ad: "Yönetim: KVKK talepleri", alan: "yonetim",
  aciklama: "İlgili kişi başvuruları: tür, kimlik doğrulama, yasal 30 günlük süre ve adım adım işlem.",
  not: `<ul><li>Yasal cevap süresi (30 gün) her talepte sayılır; süresi yaklaşan talep öne çıkar.</li>
    <li>Veri dökümü sistemden otomatik hazırlanır; silme talebinde firmalara giden başvuruların ne olacağı saklama kurallarına göre gösterilir.</li>
    <li>Her adım işlem kaydına yazılır.</li></ul>`,
  ciz(_, c) {
    const talepler = [["Veri dökümü", "Aday hesabı", "10 Kasım", 27, "Kimlik doğrulandı"], ["Silme", "Aday hesabı", "2 Kasım", 19, "Firmalara bildirim bekliyor"], ["Düzeltme", "Aday hesabı", "28 Ekim", 14, "Tamamlandı"]];
    const icerik = `<div class="y-bas"><div><h1 class="b1">KVKK talepleri</h1><p class="ikincil">İlgili kişi başvuruları · kvkk@pauteknokent.com.tr ve portal formundan ${ornek()}</p></div></div>
      <div class="y-iki"><section class="panel"><div class="tablo-kap"><table class="tablo y-tablo"><thead><tr><th>Tür</th><th>Kimden</th><th>Başvuru</th><th class="sag">Kalan</th><th>Durum</th></tr></thead><tbody>
        ${talepler.map(([t, k, b, g, d], n) => `<tr ${n === 0 ? 'class="secili-satir"' : ""}><td><strong>${t}</strong></td><td>${k}</td><td>${b}</td><td class="sag">${d === "Tamamlandı" ? "—" : g + " gün"}</td><td class="kucuk">${d}</td></tr>`).join("")}</tbody></table></div></section>
        <section class="panel panel-ic kvkk-ayrinti"><p class="ust-etiket">Seçili talep</p><h2 class="b3">Veri dökümü talebi</h2><p class="kucuk ikincil">Başvuru 10 Kasım · yasal süre 10 Aralık’ta doluyor</p>
          <ol class="kvkk-adim"><li class="tamam">Talep alındı</li><li class="tamam">Kimlik doğrulandı (hesaptan giriş yapılarak)</li><li class="simdi">Döküm hazırlanacak</li><li>Kişiye iletilecek</li></ol>
          <div class="dugme-grubu"><button class="dugme dugme--kucuk" data-eylem="dokum">Dökümü hazırla</button><button class="dugme dugme--ikincil dugme--kucuk">Yanıt şablonu</button></div></section></div>`;
    return { html: yonetimDuzen(c, "yonetim-kvkk", icerik), eylemler: { dokum: () => bildirim("Döküm hazırlandı: profil, 4 başvuru, 2 CV, 3 onay kaydı.") } };
  },
});

/* ---------- YÖNETİM: İŞLEM KAYITLARI ---------- */
ekran("yonetim-kayit", {
  ad: "Yönetim: İşlem kayıtları", alan: "yonetim",
  aciklama: "Kim neyi ne zaman değiştirdi; kişisel veriye her erişim. Kayıtlar değiştirilemez ve aranabilir.",
  not: `<ul><li>Kayıtlar yalnızca eklenir; düzenlenemez, silinemez. Saklama süresi sistem ayarlarından gelir.</li>
    <li>Kişisel veriye erişim (CV indirme, profil görüntüleme) ayrı bir türdür ve filtrelenebilir.</li>
    <li>IP adresi kısaltılarak saklanır.</li></ul>`,
  ciz(_, c) {
    const kayitlar = [["13.11.2026 14:36", "Selin Aydemir (Kodpit)", "CV indirildi", "Mert Aydoğan · Flutter Geliştirici", "Kişisel veri"],
      ["13.11.2026 14:20", "Selin Aydemir (Kodpit)", "İlan güncellendi", "Flutter Geliştirici · son başvuru 6 Ara → 20 Ara", "İlan"],
      ["13.11.2026 11:02", "Kurumsal İletişim", "İlan onaylandı", "Osteotech Medikal · Kalite Güvence Uzmanı", "Moderasyon"],
      ["13.11.2026 10:47", "Bulutfon", "Havuz profili görüntülendi", "A-1042", "Kişisel veri"],
      ["13.11.2026 09:15", "Kurumsal İletişim", "Takip notu eklendi", "Çiçek Makine Tekstil Arge · “Aradım, yetkili izinde”", "Kurulum"],
      ["12.11.2026 17:58", "Sistem", "Hatırlatma gönderildi", "Mmm Mutlu Medikal · 3. hatırlatma", "Kurulum"]];
    const icerik = `<div class="y-bas"><div><h1 class="b1">İşlem kayıtları</h1><p class="ikincil">Değiştirilemez kayıt ${ornek()}</p></div><button class="dugme dugme--ikincil dugme--kucuk">${ikon("indir", "ikon--k")} Dışa aktar</button></div>
      <div class="kayit-filtre"><span class="arama-kutu">${ikon("ara")}<input class="girdi" type="search" placeholder="Kişi, firma, ilan veya aday kodu" aria-label="Kayıtlarda ara"></span>
        <div class="f-haplar">${["Tümü", "Kişisel veri", "İlan", "Moderasyon", "Kurulum", "Ayarlar"].map((t, k) => `<button class="hap" aria-pressed="${k === 0}">${t}</button>`).join("")}</div></div>
      <section class="panel"><div class="tablo-kap"><table class="tablo y-tablo"><thead><tr><th>Zaman</th><th>Kim</th><th>İşlem</th><th>Kayıt</th><th>Tür</th></tr></thead><tbody>
        ${kayitlar.map(([z, k, i, r, t]) => `<tr><td class="kucuk" style="white-space:nowrap">${z}</td><td>${k}</td><td><strong>${i}</strong></td><td class="kucuk">${kac(r)}</td><td class="kucuk">${t}</td></tr>`).join("")}</tbody></table></div></section>`;
    return { html: yonetimDuzen(c, "yonetim-kayit", icerik) };
  },
});

/* ---------- YÖNETİM: TEST POSTA KUTUSU ---------- */
ekran("yonetim-posta", {
  ad: "Yönetim: Test posta kutusu", alan: "yonetim",
  aciklama: "Test ortamında hiçbir e-posta gerçek alıcıya gitmez; hepsi burada toplanır ve panelden okunur (0.5).",
  not: `<ul><li>Ortam “test” iken e-posta servisi hiç çağrılmaz; gönderim bu kutuya yazılır. Bu, sistem yayına alınana kadar kimseye e-posta gitmemesi talimatının teknik karşılığıdır.</li>
    <li>Personel test senaryolarında davet, hatırlatma ve bildirim e-postalarının metnini buradan kontrol eder.</li>
    <li>Ekranın üstündeki şerit test ortamında her sayfada görünür; yayın ortamında yoktur.</li></ul>`,
  ciz(_, c) {
    const postalar = [["selin.aydemir@kodpit.com", "Kodpit Teknoloji için TeknoKariyer hesabınız hazır", "Bugün 14:02", "Firma daveti"],
      ["elif.karaca@ornek.com", "Başvurun Pinova Elektronik’e iletildi", "Bugün 13:40", "Başvuru alındı"],
      ["ik@arslanarge.example", "Hatırlatma: TeknoKariyer hesabınızı devralın", "Bugün 09:00", "Kurulum hatırlatması"],
      ["burak.er@ornek.com", "Başvurunun durumu: İnceleniyor", "Dün 16:12", "Durum değişikliği"]];
    const icerik = `<div class="test-serit">TEST ORTAMI · E-postalar gönderilmez, burada toplanır</div>
      <div class="y-bas"><div><h1 class="b1">Test posta kutusu</h1><p class="ikincil">${postalar.length} e-posta ${ornek()}</p></div><button class="dugme dugme--ikincil dugme--kucuk">Kutuyu boşalt</button></div>
      <div class="y-iki"><section class="panel"><ul class="posta-liste">${postalar.map(([k, s, t, tur], n) => `<li class="${n === 0 ? "secili" : ""}"><p class="kucuk ikincil">${kac(k)} · ${t}</p><p><strong>${kac(s)}</strong></p><p class="kucuk">${tur}</p></li>`).join("")}</ul></section>
        <section class="panel panel-ic posta-onizleme"><p class="kucuk ikincil">Kime: selin.aydemir@kodpit.com · Kimden: kariyer@pauteknokent.com.tr</p><h2 class="b3">Kodpit Teknoloji için TeknoKariyer hesabınız hazır</h2>
          <p>Sayın Selin Aydemir,</p><p>Pamukkale Teknokent’in kariyer portalı TeknoKariyer’de Kodpit Teknoloji A.Ş. için bir firma hesabı açtık…</p><p><span class="dugme dugme--kucuk">Hesabı devral</span></p><p class="kucuk ikincil">Bağlantı yalnızca size özeldir ve 27 Kasım 2026’ya kadar geçerlidir.</p></section></div>`;
    return { html: yonetimDuzen(c, "yonetim-posta", icerik) };
  },
});
