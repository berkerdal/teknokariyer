/* Yönetici A.Ş. paneli: veri yoğun, koyu çerçeve, sıkı düzen. Tüm sayılar örnektir. */
"use strict";

const BASVURUSUZ = () => ILANLAR.filter((i) => i.basvuru === 0 && kalanGun(i.son) >= 0 && kalanGun(i.son) < 7);
const IS_SAYISI = () => ONAY_KUYRUGU.length + 1 + 1 + 1 + BASVURUSUZ().length + KURULUM.takip.length;
function yonetimDuzen(c, aktif, icerik) {
  const m = (id, ad, sayi) => `<a href="#${id}" data-git="${id}" ${aktif === id ? 'aria-current="page"' : ""}><span>${ad}</span>${sayi ? `<span class="y-sayi">${sayi}</span>` : ""}</a>`;
  const menu = [m("yonetim-is", "Bugün", IS_SAYISI()), m("yonetim-onay", "İlan onayı", ONAY_KUYRUGU.length), m("yonetim-kurulum", "Firma kurulumu", KURULUM.takip.length), m("yonetim-pano", "Pano")];
  const diger = [["Firmalar"], ["Adaylar"], ["KVKK talepleri", "yonetim-kvkk"], ["Taksonomi"], ["E-posta şablonları"], ["Test posta kutusu", "yonetim-posta"], ["Duyurular"], ["Site metinleri"], ["İşlem kayıtları", "yonetim-kayit"], ["Ayarlar"]];
  if (c === "mobil") {
    return `<header class="y-ust"><img class="ust-logo" src="logo/logo-kompakt-negatif.svg" alt="TeknoKariyer" width="140" height="24"><span class="y-rol">Yönetim</span><button class="ikon-dugme y-ikon" aria-label="Menü">${ikon("menu")}</button></header>
      <nav class="y-sekmeler" aria-label="Yönetim menüsü">${menu.join("")}</nav><main class="y-mobil">${icerik}</main>`;
  }
  return `<div class="y-masa"><nav class="y-yan" aria-label="Yönetim menüsü"><div class="y-logo"><img class="ust-logo" src="logo/logo-kompakt-negatif.svg" alt="TeknoKariyer" width="150" height="26"><span class="y-rol">Yönetici A.Ş.</span></div>
    <div class="y-menu">${menu.join("")}</div><p class="y-menu-bas">Yönetim</p><div class="y-menu y-menu--ikincil">${diger.map(([d, id]) => id ? m(id, d) : `<a href="#"><span>${d}</span></a>`).join("")}</div>
    <p class="y-kisi">Kurumsal İletişim · Yönetici</p></nav><main class="y-icerik">${icerik}</main></div>`;
}

ekran("yonetim-is", {
  ad: "Yönetim: Bugün yapılacaklar", alan: "yonetim",
  aciklama: "Açılış ekranı bir pano değil, iş listesi: yöneticinin bugün ne yapması gerektiği, bekleme süreleriyle.",
  not: `<ul><li>Her kuyruk en eski bekleyen kaydın süresini gösterir; 1 iş günü hedefini aşan onay öne çıkar.</li>
    <li>KVKK başvurularında yasal 30 günlük süre sayılır.</li>
    <li>Başvuru almadan süresi dolmak üzere olan ilanlarda tek tıkla firmaya hatırlatma gider.</li>
    <li>Onay kuyruğu mobilde de çalışır; pano ve raporlar masaüstü önceliklidir.</li></ul>`,
  ciz(_, c) {
    const kuyruk = (baslik, sayi, bilgi, satirlar, hedef) => `<section class="y-kuyruk"><header><h2 class="b3">${baslik} <span class="y-n">${sayi}</span></h2><p class="kucuk">${bilgi}</p>${hedef ? `<a class="kucuk" href="#${hedef}" data-git="${hedef}">Tümünü aç</a>` : ""}</header><ul>${satirlar}</ul></section>`;
    const icerik = `<div class="y-bas"><div><p class="ust-etiket">13 Kasım 2026, Cuma</p><h1 class="b1">Bugün</h1></div><p class="kucuk ikincil">${IS_SAYISI()} iş bekliyor · en eskisi 1 gün 2 saat ${ornek()}</p></div>
      <div class="y-kuyruklar">
      ${kuyruk("İlan onayı", ONAY_KUYRUGU.length, "Hedef: 1 iş günü", ONAY_KUYRUGU.map((o) => `<li class="${o.risk ? "risk" : ""}"><a href="#yonetim-onay" data-git="yonetim-onay"><span><strong>${kac(o.poz)}</strong><span class="kucuk">${kac(FIRMALAR[o.firma].ad)}${o.kacinci ? ` · ${o.kacinci}. ilanı` : ""}</span></span><span class="y-sure">${o.risk ? `<span class="durum durum--reddedildi">${kac(o.risk)}</span>` : ""}${kac(o.bekleme)}</span></a></li>`).join(""), "yonetim-onay")}
      ${kuyruk("Firma hesap talebi", 1, "“Firmam listede yok” formundan", `<li><a href="#"><span><strong>Teknokent’e yeni taşınan bir firma</strong><span class="kucuk">C Blok 204 · yetkili: Ahmet Kılıç (örnek)</span></span><span class="y-sure">2 saat</span></a></li>`)}
      ${kuyruk("KVKK başvurusu", 1, "Yasal cevap süresi 30 gün", `<li><a href="#"><span><strong>Veri dökümü talebi</strong><span class="kucuk">Aday hesabı · başvuru 10 Kasım</span></span><span class="y-sure">27 gün kaldı</span></a></li>`)}
      ${kuyruk("Şikâyet edilen ilan", 1, "Adaylardan gelen bildirimler", `<li><a href="#"><span><strong>Satış ve Pazarlama Uzmanı</strong><span class="kucuk">Evaporatif Soğutma · “Ücretsiz deneme çalışması istiyor”</span></span><span class="y-sure">5 saat</span></a></li>`)}
      ${kuyruk("Başvurusuz bitmek üzere", BASVURUSUZ().length, "Son başvuruya 7 günden az kalan, hiç başvuru almamış ilanlar", BASVURUSUZ().map((i) => `<li class="y-eylemli"><span><strong>${kac(i.poz)}</strong><span class="kucuk">${kac(firmaAd(i.firma))} · ${kalanGun(i.son)} gün kaldı · ${i.basvuru} başvuru</span></span><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="hatirlat">Firmaya hatırlat</button></li>`).join(""))}
      ${kuyruk("Kurulumda kişisel takip", KURULUM.takip.length, "14 günü geçen ve 3 hatırlatmaya cevap vermeyen firmalar", KURULUM.takip.slice(0, 2).map((t) => `<li><a href="#yonetim-kurulum" data-git="yonetim-kurulum"><span><strong>${kac(t.firma)}</strong><span class="kucuk">${kac(t.asama)}</span></span><span class="y-sure">${t.gun} gün</span></a></li>`).join(""), "yonetim-kurulum")}
      </div>`;
    return { html: yonetimDuzen(c, "yonetim-is", icerik), eylemler: { hatirlat: (el) => { el.outerHTML = `<span class="kucuk">Hatırlatma gönderildi</span>`; } } };
  },
});

ekran("yonetim-onay", {
  ad: "Yönetim: İlan onayı", alan: "yonetim",
  aciklama: "Moderasyon kontrol listesi, otomatik uyarılar ve gerekçeli karar. Ret değil “düzeltme iste”: firmaya ne yapacağı söylenir.",
  not: `<ul><li>Kontrol listesi yasal ve etik maddeleri sırayla sorar: yaş, cinsiyet, medeni hâl şartı; ücretsiz deneme çalışması; ilanın firmaya ait olması.</li>
    <li>Otomatik tarama şüpheli ifadeleri işaretler, kararı insana bırakır.</li>
    <li>Düzeltme isteğinde hazır gerekçe seçilir ve firmaya ne yapması gerektiği yazılır.</li>
    <li>Üçüncü ilanı onaylanan firma için “güvenilir firma” önerisi çıkar (K4).</li></ul>`,
  ciz(_, c) {
    const i = { ...ilanBul(3), poz: "Kıdemli Backend Geliştirici", zorunlu: ["Go", "PostgreSQL", "Docker"], tercih: ["Kubernetes"], deneyim: "3–5 yıl", model: "Hibrit", son: [11, 31], ucret: "Gizli (eşleştirmede kullanılır)" };
    const kontrol = [["Yaş, cinsiyet veya medeni hâl şartı yok", true], ["Ücretsiz deneme çalışması istenmiyor", true], ["Pozisyon firmanın kendisine ait", true], ["Son başvuru tarihi 60 günü aşmıyor", true], ["Metin anlaşılır, iletişim bilgisi gömülü değil", false]];
    const icerik = `<div class="y-bas"><div><a class="geri kucuk" href="#yonetim-is" data-git="yonetim-is">${ikon("geri", "ikon--k")} Bugün</a><h1 class="b1">${kac(i.poz)}</h1><p class="ikincil">Kodpit Teknoloji · D Blok 208 · firmanın 3. ilanı · 5 saattir bekliyor</p></div></div>
      <div class="y-onay">
        <div class="y-onay-ilan panel"><p class="ust-etiket">Adayın göreceği şekliyle</p>${ilanOnizleme(i, true).replace(/<div class="eslesme-kutu">[\s\S]*?<\/div>/, "").replace(/<div class="dugme-grubu">[\s\S]*?<\/div>/, "")}
          <h3 class="b3">İletişim</h3><p class="isaretli">Başvurularınızı <mark>ik@kodpit.com</mark> adresine de gönderebilirsiniz.</p></div>
        <aside class="y-onay-karar">
          <section class="panel panel-ic"><h2 class="b3">Otomatik tarama</h2><ul class="eslesme"><li class="var">Ayrımcı ifade bulunmadı</li><li class="var">Ücret talebi bulunmadı</li><li class="eksik">Metinde e-posta adresi var: başvurular portal dışına yönlenebilir</li></ul></section>
          <section class="panel panel-ic"><h2 class="b3">Kontrol listesi</h2>${kontrol.map(([k, v], n) => `<label class="secenek"><input type="checkbox" ${v ? "checked" : ""}> <span>${k}</span></label>`).join("")}</section>
          <section class="panel panel-ic y-karar"><h2 class="b3">Karar</h2>
            <div class="alan"><label for="y-g">Düzeltme gerekçesi</label><select id="y-g" class="secim"><option>Metinde portal dışı iletişim bilgisi var</option><option>Ayrımcı ifade</option><option>Ücretsiz deneme çalışması</option><option>Diğer</option></select></div>
            <div class="alan"><label for="y-n">Firmaya not</label><textarea id="y-n" class="metin-alani">“İletişim” bölümündeki e-posta adresini kaldırın; başvurular portal üzerinden gelmeli. Düzelttiğinizde ilan öncelikle incelenecek.</textarea></div>
            <div class="dugme-grubu"><button class="dugme dugme--ikincil" data-eylem="duzelt">Düzeltme iste</button><button class="dugme" data-eylem="onay">Onayla ve yayınla</button></div>
            <label class="secenek kucuk"><input type="checkbox"> <span>Kodpit Teknoloji’yi “güvenilir firma” olarak işaretle<span class="ipucu">3 ilanı onaylandı. Sonraki ilanları doğrudan yayına girer.</span></span></label></section>
        </aside></div>`;
    return { html: yonetimDuzen(c, "yonetim-onay", icerik), eylemler: {
      onay: () => bildirim("İlan yayına alındı; firmaya e-posta gitti."),
      duzelt: () => bildirim("Düzeltme isteği firmaya gönderildi."),
    } };
  },
});

ekran("yonetim-kurulum", {
  ad: "Yönetim: Firma kurulum hunisi", alan: "yonetim",
  aciklama: "121 firmanın her biri bir kare. Hangi aşamada kaç firma var, kim takıldı, tek tıkla hatırlatma veya not.",
  not: `<ul><li>Huni kare birimli: her kare bir firma. 121 firma tek bakışta görülür; kare motifi süs değil, veri.</li>
    <li>Yetkili e-postası eksik firmalar ayrı listede; telefonla tamamlanmak üzere dışa aktarılır.</li>
    <li>Takip notları (“Aradım, haftaya dolduracak”) işlem kaydına yazılır.</li></ul>`,
  ciz(_, c) {
    const a = KURULUM.asamalar;
    const sinif = (n) => { for (let k = a.length - 1; k >= 0; k--) if (n < a[k][1]) return "a" + k; return "a0"; };
    const kareler = Array.from({ length: KURULUM.toplam }, (_, n) => `<i class="${sinif(n)}"></i>`).join("");
    const icerik = `<div class="y-bas"><div><h1 class="b1">Firma kurulumu</h1><p class="ikincil">Rehberden aktarılan ${KURULUM.toplam} firmanın portala geçişi ${ornek()}</p></div><div class="dugme-grubu"><button class="dugme dugme--ikincil dugme--kucuk">Rehberden içe aktar</button><button class="dugme dugme--kucuk">Toplu davet gönder</button></div></div>
      <section class="panel panel-ic y-huni"><div class="y-kareler" aria-label="Her kare bir firma">${kareler}</div>
        <ol class="y-asamalar">${a.map(([ad, n], k) => `<li><i class="a${k}"></i><span>${ad}</span><strong>${n}</strong>${k ? `<span class="kucuk ikincil">%${Math.round((n / a[k - 1][1]) * 100)} geçti</span>` : ""}</li>`).join("")}</ol></section>
      <div class="y-iki">
        <section class="panel"><header class="panel-ic y-panel-bas"><h2 class="b3">Kişisel takip gerekiyor</h2><span class="kucuk ikincil">14 gün ve 3 hatırlatma geçti</span></header>
          <div class="tablo-kap"><table class="tablo y-tablo"><thead><tr><th>Firma</th><th>Aşama</th><th class="sag">Gün</th><th>Son işlem / not</th><th></th></tr></thead><tbody>
          ${KURULUM.takip.map((t) => `<tr><td><strong>${kac(t.firma)}</strong></td><td>${kac(t.asama)}</td><td class="sag">${t.gun}</td><td class="kucuk">${kac(t.son)}${t.not ? `<br><span class="ikincil">${kac(t.not)}</span>` : ""}</td><td class="sag"><button class="dugme dugme--sade dugme--kucuk" data-eylem="not">Not düş</button></td></tr>`).join("")}</tbody></table></div></section>
        <section class="panel panel-ic"><h2 class="b3">Yetkili e-postası eksik</h2><p><strong class="buyuk-sayi">${KURULUM.yetkiliEksik}</strong> firmanın kişisel iş e-postası yok; rehberde yalnızca “info@” veya kişisel adres var.</p>
          <p class="kucuk ikincil">Davet, firma yetkilisinin kişisel iş e-postasına gider. Bu firmalar telefonla tamamlanmalı.</p><button class="dugme dugme--ikincil dugme--kucuk">${ikon("indir", "ikon--k")} Listeyi Excel olarak indir</button></section>
      </div>`;
    return { html: yonetimDuzen(c, "yonetim-kurulum", icerik), eylemler: {
      not: () => pencere(`<h2 class="b3">Takip notu</h2><div class="alan"><label for="tn">Not</label><textarea id="tn" class="metin-alani">Aradım, haftaya dolduracak.</textarea></div><p class="kucuk ikincil">Not işlem kaydına adınız ve saatle yazılır.</p><div class="dugme-grubu"><button class="dugme" data-eylem-genel="kapat">Kaydet</button></div>`),
    } };
  },
});

ekran("yonetim-pano", {
  ad: "Yönetim: Pano", alan: "yonetim",
  aciklama: "“4 KPI kartı + alan grafiği” yerine yönetimin beş sorusu ve her birinin cevabı. Dönem raporu Excel ve PDF.",
  not: `<ul><li>Pano kararlara göre kuruldu: portal kullanılıyor mu, hangi firmalar aktif, bölgenin yetenek ihtiyacı ne, adaylar nereden geliyor, ilanlar sonuç veriyor mu.</li>
    <li>Her sayının tanımı ve dönemi yazılıdır; geçen dönemle karşılaştırılır.</li>
    <li>Beceri talebi (ilanlarda) ile arzı (havuzda) yan yana: bölgenin yetenek açığı.</li></ul>`,
  ciz(_, c) {
    const kars = [["Yayındaki ilan", 15, 9], ["Yeni başvuru", 214, 138], ["Yeni aday hesabı", 162, 97], ["İlan veren firma", 13, 8]];
    const beceri = [["Flutter", 3, 14], ["Linux", 3, 41], ["SolidWorks", 2, 9], ["Kubernetes", 2, 3], ["SQL", 2, 52], ["STM32", 1, 6]];
    const okul = [["Pamukkale Üniversitesi", 58], ["Dokuz Eylül Üniversitesi", 9], ["Süleyman Demirel Üniversitesi", 7], ["Ege Üniversitesi", 6], ["Diğer", 20]];
    const icerik = `<div class="y-bas"><div><h1 class="b1">Pano</h1><p class="ikincil">Son 30 gün · 14 Ekim–12 Kasım 2026 · karşılaştırma: önceki 30 gün ${ornek()}</p></div><div class="dugme-grubu"><button class="dugme dugme--ikincil dugme--kucuk">${ikon("indir", "ikon--k")} Dönem raporu (Excel)</button><button class="dugme dugme--ikincil dugme--kucuk">${ikon("dosya", "ikon--k")} PDF</button></div></div>
      <div class="y-sorular">
      <section class="panel panel-ic"><h2 class="b3 kare-bas">Portal kullanılıyor mu?</h2><table class="tablo y-tablo"><thead><tr><th>Ölçü</th><th class="sag">Bu dönem</th><th class="sag">Önceki</th><th class="sag">Fark</th></tr></thead><tbody>
        ${kars.map(([a, b, o]) => `<tr><td>${a}</td><td class="sag"><strong>${b}</strong></td><td class="sag ikincil">${o}</td><td class="sag">+${b - o}</td></tr>`).join("")}</tbody></table></section>
      <section class="panel panel-ic"><h2 class="b3 kare-bas">Hangi firmalar ilan vermiyor?</h2><p>121 firmanın <strong>17’si</strong> en az bir ilan verdi. <strong>104 firma</strong> hiç ilan vermedi; bunların 63’ü portala giriş bile yapmadı.</p>
        <ul class="y-firma-liste">${["Aksöz Arge Mühendislik", "Cityboss Yazılım", "Altraflora Doğal Bitki Ürünleri"].map((f, k) => `<li><span>${f}</span><span class="kucuk ikincil">${k === 2 ? "Profil tamam, ilan yok" : "Davet bekliyor"}</span><button class="dugme dugme--sade dugme--kucuk">İletişime geç</button></li>`).join("")}</ul></section>
      <section class="panel panel-ic"><h2 class="b3 kare-bas">Bölgenin yetenek ihtiyacı</h2><p class="kucuk ikincil">İlanlarda zorunlu olarak istenen beceriler ve havuzda bu beceriye sahip aday sayısı. İlan başına aday azaldıkça açık büyür.</p>
        <table class="tablo y-tablo"><thead><tr><th>Beceri</th><th class="sag">İlan</th><th class="sag">Havuzda aday</th><th class="sag">İlan başına aday</th></tr></thead><tbody>
        ${beceri.map(([b, t, a]) => ({ b, t, a, o: a / t })).sort((x, y) => x.o - y.o).map(({ b, t, a, o }, k) => `<tr><td>${k === 0 ? "<strong>" + b + "</strong>" : b}</td><td class="sag">${t}</td><td class="sag">${a}</td><td class="sag">${k === 0 ? "<strong>" + o.toLocaleString("tr", { maximumFractionDigits: 1 }) + "</strong>" : o.toLocaleString("tr", { maximumFractionDigits: 1 })}</td></tr>`).join("")}</tbody></table>
        <p class="kucuk">En büyük açık: <strong>Kubernetes</strong>. 2 ilanda isteniyor, havuzda 3 aday var.</p></section>
      <section class="panel panel-ic"><h2 class="b3 kare-bas">Adaylar nereden geliyor?</h2><p>Başvuranların <strong>%58’i</strong> Pamukkale Üniversitesi’nden.</p>
        <div class="cubuklar">${okul.map(([o, p]) => `<div class="cubuk"><span>${o}</span><span class="iz"><span style="width:${p}%"></span></span><span class="n">%${p}</span></div>`).join("")}</div></section>
      <section class="panel panel-ic"><h2 class="b3 kare-bas">İlanlar sonuç veriyor mu?</h2><p class="kucuk ikincil">Bu dönem kapanan ilanların başvuruları · her kare 2 başvuru</p>
        <div class="huni">${[["Başvuru", 214], ["İnceleniyor", 120], ["Görüşme", 41], ["Teklif", 9], ["Olumlu", 6]].map(([a, n], k, d) => `<div class="huni-satir ${k === d.length - 1 ? "son" : ""}"><span>${a}</span><span class="n">${n}</span><span class="huni-kareler">${"<i></i>".repeat(Math.ceil(n / 2))}</span></div>`).join("")}</div>
        <p class="kucuk">Başvurudan olumlu sonuca: <strong>%2,8</strong> · Ortalama ilk başvuru süresi: <strong>6 saat</strong></p></section>
      </div>`;
    return { html: yonetimDuzen(c, "yonetim-pano", icerik) };
  },
});

