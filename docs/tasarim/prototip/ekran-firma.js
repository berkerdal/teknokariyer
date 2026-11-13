/* Firma paneli ekranları (giriş yapan: Kodpit Teknoloji, Selin Aydemir — kurgusal kullanıcı) */
"use strict";

function firmaDuzen(c, aktif, icerik, { altCubuk = "" } = {}) {
  const f = FIRMALAR[FIRMA_KULLANICI.firma];
  const yeni = FIRMA_ILANLARI.reduce((n, x) => n + (x.yeni || 0), 0);
  const m = (id, ad, ik, sayi) => `<a href="#${id}" data-git="${id}" ${aktif === id ? 'aria-current="page"' : ""}>${ikon(ik)}<span>${ad}</span>${sayi ? `<span class="rozet-sayi">${sayi}</span>` : ""}</a>`;
  const menu = [m("firma-ana", "Özet", "ev"), m("firma-ilanlar", "İlanlar", "liste"), m("firma-basvurular", "Başvurular", "kisi", yeni), m("firma-havuz", "CV havuzu", "ara")];
  const ust = `<header class="f-ust"><div class="f-ust-ic">${logoKompakt()}<span class="f-firma">${kareLogo("kodpit", 28)}<span><strong>${kac(f.ad)}</strong>${c === "mobil" ? "" : `<span class="kucuk ikincil">${kac(f.konum)}</span>`}</span></span>
    ${c === "mobil" ? `<button class="ikon-dugme" aria-label="Menü">${ikon("menu")}</button>` : `<span class="f-kisi kucuk">${kac(FIRMA_KULLANICI.ad)} · ${kac(FIRMA_KULLANICI.rol)}</span>`}</div></header>`;
  if (c === "mobil") return `${ust}<main class="f-mobil">${icerik}</main>${altCubuk}<nav class="a-alt-menu f-alt-menu" aria-label="Firma menüsü">${menu.join("")}</nav>`;
  return `${ust}<div class="f-masa"><nav class="f-menu" aria-label="Firma menüsü">${menu.join("")}<hr>${m("firma-profil", "Firma profili", "ofis")}${m("firma-ekip", "Ekip", "kisi")}<a href="#">${ikon("ayar")}<span>Ayarlar</span></a></nav><main class="f-icerik">${icerik}</main></div>${altCubuk}`;
}

/* ---------- ÖZET ---------- */
ekran("firma-ana", {
  ad: "Firma paneli: Özet", alan: "firma",
  aciklama: "Açılış ekranı görev odaklı: yeni başvurular, dikkat isteyen ilanlar ve tek düğmeyle yeni ilan.",
  not: `<ul><li>Pano kartları yerine yapılacaklar: “3 yeni başvuru”, “1 ilan düzeltme bekliyor”.</li>
    <li>Onay kuralı açıkça yazar (K4): ilk 3 ilan onaydan geçer; kaçıncı ilanda olunduğu görünür.</li>
    <li>Yeni ilan iki yoldan başlar: boş form veya önceki ilandan kopya. Eski portalın en büyük sorunu ilan girmekti (K1).</li></ul>`,
  ciz(_, c) {
    const iy = (id) => FIRMA_ILANLARI.find((x) => x.id === id);
    const poz = (x) => x.poz || ilanBul(x.id).poz;
    const icerik = `<div class="f-bas"><div><p class="ust-etiket">13 Kasım 2026, Cuma</p><h1 class="b1">Özet</h1></div>
      <div class="dugme-grubu"><a class="dugme" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">${ikon("arti")} Yeni ilan</a><button class="dugme dugme--ikincil" data-eylem="kopyala-sec">${ikon("kopya")} Önceki ilandan kopyala</button></div></div>
      <div class="f-izgara">
        <section class="panel f-blok"><h2 class="b3 kare-bas">Yeni başvurular</h2><ul class="f-satirlar">
          ${FIRMA_ILANLARI.filter((x) => x.yeni).map((x) => `<li><a href="#firma-basvurular" data-git="firma-basvurular"><span><strong>${kac(poz(x))}</strong><span class="kucuk ikincil">Toplam ${x.toplam} başvuru</span></span><span class="yeni-sayi">${x.yeni} yeni</span></a></li>`).join("")}</ul></section>
        <section class="panel f-blok"><h2 class="b3 kare-bas">Dikkat isteyenler</h2><ul class="f-satirlar">
          <li><div><p>${durum("reddedildi")} <strong>${kac(iy(103).poz)}</strong></p><p class="kucuk">${kac(iy(103).gerekce)}</p></div><a class="dugme dugme--kucuk" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">Düzelt</a></li>
          <li><div><p>${durum("onayda")} <strong>${kac(iy(101).poz)}</strong></p><p class="kucuk ikincil">Gönderildi: ${kac(iy(101).gonderim)} · Tahmini onay: ${kac(iy(101).tahmini)}</p></div></li>
          <li><div><p>${durum("duraklatildi")} <strong>${kac(iy(104).poz)}</strong></p><p class="kucuk ikincil">Başvuru almıyor · son başvuru ${kac(iy(104).son)}</p></div><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="devam">Yeniden başlat</button></li></ul></section>
        <section class="panel f-blok"><h2 class="b3 kare-bas">Yayındaki ilanlar</h2><div class="tablo-kap"><table class="tablo"><thead><tr><th>İlan</th><th class="sag">Görüntülenme</th><th class="sag">Başvuru</th><th>Son tarih</th></tr></thead><tbody>
          ${[3, 11].map((id) => { const i = ilanBul(id); return `<tr><td><a href="#firma-ilanlar" data-git="firma-ilanlar">${kac(i.poz)}</a></td><td class="sag">${i.goruntulenme}</td><td class="sag">${i.basvuru}</td><td>${tarihYaz(i.son)}</td></tr>`; }).join("")}</tbody></table></div></section>
        <section class="panel f-blok"><h2 class="b3 kare-bas">Onay durumu</h2><p>İlk 3 ilanınız Yönetici A.Ş. onayından geçer. <strong>2 ilanınız onaylandı</strong>; üçüncüsü onaydadır.</p>
          <div class="onay-kareler" aria-label="3 ilandan 2'si onaylandı"><i class="dolu"></i><i class="dolu"></i><i class="bekliyor"></i></div>
          <p class="kucuk ikincil">Sonrasında Yönetici A.Ş. firmanızı “güvenilir” olarak işaretlerse ilanlarınız doğrudan yayına girer. Hedef onay süresi 1 iş günü.</p></section>
      </div>`;
    return { html: firmaDuzen(c, "firma-ana", icerik), eylemler: {
      devam: () => bildirim("Front-end Geliştirici yeniden başvuru alıyor", true),
      "kopyala-sec": () => altPanel("Hangi ilandan başlayalım?", `<ul class="secim-listesi">${FIRMA_ILANLARI.filter((x) => !["taslak"].includes(x.durum)).map((x) => `<li><a href="#firma-ilan-yeni" data-git="firma-ilan-yeni"><strong>${kac(x.poz || ilanBul(x.id).poz)}</strong>${durum(x.durum)}</a></li>`).join("")}</ul>
        <p class="kucuk ikincil">Kopyada son başvuru tarihi boş gelir; diğer tüm alanlar doldurulmuş olur.</p>`),
    } };
  },
});

/* ---------- İLANLARIM ---------- */
const DURUM_SEKMELERI = [["tum", "Tümü"], ["yayinda", "Yayında"], ["onayda", "Onayda"], ["taslak", "Taslak"], ["reddedildi", "Düzeltme bekliyor"], ["duraklatildi", "Duraklatıldı"], ["kapali", "Kapanan"]];
ekran("firma-ilanlar", {
  ad: "Firma paneli: İlanlarım", alan: "firma",
  aciklama: "Her ilanın durumu tek bakışta. Duraklat, süre uzat, kapat, kopyala, yeniden yayınla. Birden çok ilan seçilip toplu işlem yapılır.",
  not: `<ul><li>Yedi durum (taslak, onayda, yayında, duraklatıldı, süresi doldu, kapandı, düzeltme bekliyor) kare işaret + metinle gösterilir; renk tek başına anlam taşımaz.</li>
    <li>Onaydaki ilanda tahmini onay zamanı, reddedilen ilanda gerekçe ve “Düzelt” yolu görünür.</li>
    <li>Süre uzatma Türkçe tarih seçiciyle yapılır; 60 günden sonrası seçilemez ve nedeni yazar.</li>
    <li>Kapatırken neden sorulur; adaylara nazik bir bildirim gider.</li>
    <li>Satırları işaretleyip “Süreyi uzat” veya “Kapat” toplu işlemlerini deneyin.</li></ul>`,
  ciz(param, c) {
    const sekme = param || "tum";
    const uygun = (x) => sekme === "tum" || x.durum === sekme || (sekme === "kapali" && ["kapandi", "suresi-doldu"].includes(x.durum));
    const sayi = (k) => FIRMA_ILANLARI.filter((x) => k === "tum" || x.durum === k || (k === "kapali" && ["kapandi", "suresi-doldu"].includes(x.durum))).length;
    const poz = (x) => x.poz || ilanBul(x.id).poz;
    const ayrinti = (x) => {
      const i = ilanBul(x.id);
      if (x.durum === "yayinda") return `Son başvuru ${tarihYaz(i.son)} · ${kalanGun(i.son)} gün kaldı`;
      if (x.durum === "onayda") return `Tahmini onay: ${x.tahmini}`;
      if (x.durum === "taslak") return `Son kayıt: ${x.kayit}`;
      if (x.durum === "reddedildi") return x.gerekce;
      if (x.durum === "duraklatildi") return `Başvuru almıyor · son başvuru ${x.son}`;
      if (x.durum === "kapandi") return `${x.neden} · ${x.kapanis}`;
      if (x.durum === "suresi-doldu") return `Süresi doldu · ${x.kapanis}`;
      return "";
    };
    const anaEylem = (x) => ({ yayinda: `<button class="dugme dugme--ikincil dugme--kucuk" data-eylem="islemler" data-id="${x.id}">İşlemler</button>`,
      onayda: `<button class="dugme dugme--ikincil dugme--kucuk" data-eylem="islemler" data-id="${x.id}">İşlemler</button>`,
      taslak: `<a class="dugme dugme--kucuk" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">Devam et</a>`,
      reddedildi: `<a class="dugme dugme--kucuk" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">Düzelt</a>`,
      duraklatildi: `<button class="dugme dugme--kucuk" data-eylem="devam" data-id="${x.id}">Yeniden başlat</button>`,
      kapandi: `<button class="dugme dugme--ikincil dugme--kucuk" data-eylem="yeniden" data-id="${x.id}">Yeniden yayınla</button>`,
      "suresi-doldu": `<button class="dugme dugme--ikincil dugme--kucuk" data-eylem="yeniden" data-id="${x.id}">Yeniden yayınla</button>` })[x.durum];
    const satirlar = FIRMA_ILANLARI.filter(uygun);
    const sekmeler = `<div class="sekmeler" role="tablist">${DURUM_SEKMELERI.map(([k, a]) => `<a class="sekme" role="tab" href="#firma-ilanlar-${k}" data-git="firma-ilanlar-${k}" aria-selected="${k === sekme}">${a} <span class="sayi">${sayi(k)}</span></a>`).join("")}</div>`;
    const secilebilir = (x) => ["yayinda", "duraklatildi"].includes(x.durum);
    let liste;
    if (c === "mobil") {
      liste = `<ul class="f-ilan-kartlar">${satirlar.map((x) => `<li class="f-ilan-kart ${x.durum === "reddedildi" ? "f-ilan-kart--hata" : ""}">
        <div class="f-ilan-kart-bas">${secilebilir(x) ? `<input type="checkbox" aria-label="${kac(poz(x))} ilanını seç" data-degis="sec" data-id="${x.id}" ${DURUM.firmaSecili.has(x.id) ? "checked" : ""}>` : `<span class="bos-kutu"></span>`}
        <div><p class="poz-ad">${kac(poz(x))}</p>${durum(x.durum)}</div></div>
        <p class="kucuk ${x.durum === "reddedildi" ? "" : "ikincil"}">${kac(ayrinti(x))}</p>
        <div class="f-ilan-kart-alt"><span class="kucuk">${x.toplam ? `${x.toplam} başvuru${x.yeni ? ` · <strong>${x.yeni} yeni</strong>` : ""}` : "Başvuru yok"}</span>${anaEylem(x)}</div></li>`).join("")}</ul>`;
    } else {
      liste = `<div class="tablo-kap"><table class="tablo f-tablo"><thead><tr><th><span class="gizli">Seç</span></th><th>İlan</th><th>Durum</th><th class="sag">Başvuru</th><th class="sag">Görüntülenme</th><th></th></tr></thead><tbody>
        ${satirlar.map((x) => { const i = ilanBul(x.id); return `<tr class="${x.durum === "reddedildi" ? "satir-hata" : ""}"><td>${secilebilir(x) ? `<input type="checkbox" aria-label="${kac(poz(x))} ilanını seç" data-degis="sec" data-id="${x.id}" ${DURUM.firmaSecili.has(x.id) ? "checked" : ""}>` : ""}</td>
          <td><strong>${kac(poz(x))}</strong><span class="kucuk ${x.durum === "reddedildi" ? "" : "ikincil"} satir-alt">${kac(ayrinti(x))}</span></td><td>${durum(x.durum)}</td>
          <td class="sag">${x.toplam || "–"}${x.yeni ? `<span class="kucuk satir-alt"><strong>${x.yeni} yeni</strong></span>` : ""}</td><td class="sag">${i ? i.goruntulenme : "–"}</td><td class="sag">${anaEylem(x)}</td></tr>`; }).join("")}</tbody></table></div>`;
    }
    const topluCubuk = () => DURUM.firmaSecili.size ? `<div class="toplu-cubuk" role="region" aria-label="Toplu işlem"><span><strong>${DURUM.firmaSecili.size} ilan seçildi</strong></span>
      <button class="dugme dugme--kucuk" data-eylem="uzat">Süreyi uzat</button><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="kapat-sor">Kapat</button><button class="dugme dugme--sade dugme--kucuk" data-eylem="secim-kaldir">Seçimi kaldır</button></div>` : "";
    const icerik = `<div class="f-bas"><h1 class="b1">İlanlar</h1><a class="dugme" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">${ikon("arti")} Yeni ilan</a></div>${sekmeler}<div data-toplu>${topluCubuk()}</div>${liste}`;
    const takvimHtml = (secili) => turkceTakvim({ yil: 2026, ay: 11, secili, enGec: [12, 12], neden: "İlan en fazla 60 gün yayında kalabilir: 12 Ocak 2027’ye kadar." });
    return { html: firmaDuzen(c, "firma-ilanlar", icerik), eylemler: {
      sec: (el) => { const id = Number(el.dataset.id); el.checked ? DURUM.firmaSecili.add(id) : DURUM.firmaSecili.delete(id); document.querySelector("[data-toplu]").innerHTML = topluCubuk(); },
      "secim-kaldir": () => { DURUM.firmaSecili.clear(); ciz(); },
      devam: () => bildirim("İlan yeniden başvuru alıyor", true),
      yeniden: () => { bildirim("İlan kopyalandı; son başvuru tarihini seçip yayına gönderin."); setTimeout(() => git("firma-ilan-yeni"), 700); },
      uzat: () => pencere(`<h2 class="b3">Son başvuru tarihini uzat</h2><p class="kucuk ikincil">${DURUM.firmaSecili.size || 1} ilan için yeni tarih</p>${takvimHtml(20)}
        <div class="dugme-grubu"><button class="dugme" data-eylem="uzatildi">20 Aralık 2026’ya uzat</button><button class="dugme dugme--sade" data-eylem-genel="kapat">Vazgeç</button></div>`),
      uzatildi: () => { katmanKapat(); DURUM.firmaSecili.clear(); ciz(); bildirim("Son başvuru tarihi 20 Aralık 2026 oldu"); },
      gun: (el) => { document.querySelectorAll(".takvim button[aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", "false")); el.setAttribute("aria-pressed", "true");
        const b = document.querySelector('[data-eylem="uzatildi"]'); if (b) b.textContent = `${el.dataset.gun} ${el.dataset.ay}’a uzat`.replace("Aralık’a", "Aralık’a"); },
      "kapat-sor": () => pencere(`<h2 class="b3">${DURUM.firmaSecili.size} ilanı kapat</h2><fieldset class="alan"><legend>Kapatma nedeni</legend>
        ${["Pozisyon doldu", "Pozisyon iptal edildi", "Başka bir kanaldan aday bulundu"].map((n, k) => `<label class="secenek"><input type="radio" name="kn" ${k === 0 ? "checked" : ""}> <span>${n}</span></label>`).join("")}</fieldset>
        <p class="bilgi kucuk">Değerlendirmesi biten başvurulara nazik bir bildirim gider. Kapanan ilanı daha sonra yeniden yayınlayabilirsiniz.</p>
        <div class="dugme-grubu"><button class="dugme dugme--tehlike" data-eylem="kapatildi">İlanları kapat</button><button class="dugme dugme--sade" data-eylem-genel="kapat">Vazgeç</button></div>`),
      kapatildi: () => { katmanKapat(); DURUM.firmaSecili.clear(); ciz(); bildirim("İlanlar kapatıldı", true); },
      islemler: (el) => {
        const x = FIRMA_ILANLARI.find((y) => y.id === Number(el.dataset.id));
        const yayinda = x.durum === "yayinda";
        altPanel(poz(x), `<ul class="islem-listesi">
          <li><a href="#firma-ilan-duzenle" data-git="firma-ilan-duzenle">${ikon("kalem")}<span>Düzenle<span class="ipucu">Yazım ve tarih düzeltmeleri hemen yayına yansır. Pozisyon adı, ilan türü ve ücret değişiklikleri onaydan geçer.</span></span></a></li>
          ${yayinda ? `<li><button data-eylem="duraklat">${ikon("duraklat")}<span>Başvuru almayı geçici olarak durdur</span></button></li>
          <li><button data-eylem="uzat">${ikon("takvim")}<span>Son başvuru tarihini uzat</span></button></li>
          <li><button data-eylem="paylas">${ikon("paylas")}<span>LinkedIn’de paylaş</span></button></li>
          <li><a href="#firma-basvurular" data-git="firma-basvurular">${ikon("kisi")}<span>Başvuruları gör</span></a></li>
          <li><button data-eylem="istatistik">${ikon("grafik")}<span>İstatistikler</span></button></li>` : ""}
          <li><a href="#firma-ilan-yeni" data-git="firma-ilan-yeni">${ikon("kopya")}<span>Kopyala ve yeni ilan başlat</span></a></li>
          ${yayinda ? `<li><button data-eylem="kapat-tek" class="tehlike">${ikon("kapat")}<span>İlanı kapat</span></button></li>` : ""}</ul>`);
      },
      duraklat: () => { katmanKapat(); bildirim("İlan başvuru almayı durdurdu", true); },
      "kapat-tek": () => { DURUM.firmaSecili = new Set([3]); eylemler["kapat-sor"](); },
      paylas: () => altPanel("LinkedIn’de paylaş", `<div class="form-yigin"><p>LinkedIn metniniz ve ilan bağlantısı hazır. Metni kopyalayın, sonra LinkedIn’de yapıştırın.</p>
        <div class="alan"><label for="lk-m">LinkedIn metni</label><textarea id="lk-m" class="metin-alani" maxlength="700">Denizli’deki ekibimize Flutter geliştirici arıyoruz. Haftada 2 gün uzaktan, Pamukkale Teknokent D Blok’ta. Ayrıntılar ve başvuru: kariyer.pauteknokent.com.tr/ilan/flutter-gelistirici-kodpit?kaynak=linkedin</textarea><span class="sayac-metin">232 / 700</span></div>
        <p class="kucuk ikincil">Bağlantıdaki “kaynak=linkedin” etiketi sayesinde LinkedIn’den gelen başvurular istatistiklerde ayrı görünür.</p></div>`,
        `<button class="dugme dugme--ikincil" data-eylem="kopyalandi">${ikon("kopya")} Metni kopyala</button><button class="dugme dugme--genis" data-eylem="kopyalandi">LinkedIn’i aç</button>`),
      kopyalandi: () => { katmanKapat(); bildirim("Metin kopyalandı. LinkedIn yeni sekmede açılıyor."); },
      istatistik: () => altPanel("Flutter Geliştirici · İstatistikler", `<div class="form-yigin">${ornek()}
        <dl class="ozet-dl"><div><dt>Görüntülenme</dt><dd>356 (tekil 281)</dd></div><div><dt>Başvuru</dt><dd>14 · dönüşüm %5,0</dd></div><div><dt>İlk başvuru</dt><dd>Yayından 3 saat sonra</dd></div></dl>
        <h3 class="b3">Başvurular nereden geldi?</h3><div class="cubuklar">${[["Portal araması", 6], ["LinkedIn", 4], ["Google", 2], ["Doğrudan bağlantı", 2]].map(([a, n]) => `<div class="cubuk"><span>${a}</span><span class="iz"><span style="width:${(n / 6) * 100}%"></span></span><span class="n">${n}</span></div>`).join("")}</div>
        <h3 class="b3">Başvuru hunisi</h3><div class="huni">${[["Alındı", 14], ["İnceleniyor", 6], ["Görüşme", 2], ["Teklif", 0]].map(([a, n], k, d) => `<div class="huni-satir"><span>${a}</span><span class="n">${n}</span><span class="huni-kareler">${"<i></i>".repeat(n)}</span></div>`).join("")}</div></div>`),
    } };
  },
});

/* Türkçe tarih seçici */
function turkceTakvim({ yil, ay, secili, enGec, neden }) {
  const ilk = new Date(yil, ay, 1);
  const bas = (ilk.getDay() + 6) % 7; // pazartesi başlangıç
  const gunSay = new Date(yil, ay + 1, 0).getDate();
  const sinir = tarihNesne(enGec);
  let h = "<tr>";
  for (let k = 0; k < bas; k++) h += "<td></td>";
  for (let g = 1; g <= gunSay; g++) {
    const d = new Date(yil, ay, g);
    const gecmis = d < BUGUN, sonra = d > sinir;
    h += `<td><button type="button" data-eylem="gun" data-gun="${g}" data-ay="${AYLAR[ay]}" ${gecmis || sonra ? "disabled" : ""} aria-pressed="${g === secili}" class="${+d === +BUGUN ? "bugun" : ""}" aria-label="${g} ${AYLAR[ay]} ${yil}, ${GUNLER[d.getDay()]}${sonra ? ", seçilemez" : ""}">${g}</button></td>`;
    if ((bas + g) % 7 === 0 && g < gunSay) h += "</tr><tr>";
  }
  h += "</tr>";
  return `<div class="takvim"><div class="takvim-bas"><button class="ikon-dugme" aria-label="Önceki ay" type="button">${ikon("geri", "ikon--k")}</button><span>${AYLAR[ay]} ${yil}</span><button class="ikon-dugme" aria-label="Sonraki ay" type="button">${ikon("ileri", "ikon--k")}</button></div>
    <table role="grid"><thead><tr>${["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((g) => `<th scope="col">${g}</th>`).join("")}</tr></thead><tbody>${h}</tbody></table>
    ${neden ? `<p class="not">${kac(neden)}</p>` : ""}</div>`;
}

/* ---------- YENİ İLAN FORMU ---------- */
ekran("firma-ilan-yeni", {
  ad: "Firma paneli: Yeni ilan", alan: "firma",
  aciklama: "Zorunlu alanlar önde, isteğe bağlılar açılır bölümlerde. Taslak otomatik kaydedilir; kaydedilmemiş değişiklikle çıkarken uyarı verilir.",
  not: `<ul><li>Hedef: ilk kez kullanan bir personel ilanı yardımsız 5 dakikadan kısa sürede yayına gönderebilmeli. Bu yüzden zorunlu alanlar tek ekranda, sırayla.</li>
    <li>Beceriler serbest metin değil, taksonomiden seçilir; “zorunlu” ve “tercih sebebi” ayrı listelerdir. Eşleşme ancak böyle doğru çalışır.</li>
    <li>Tarih seçici tamamen Türkçe; 60 günden sonrası seçilemez ve nedeni yazar.</li>
    <li>“Önizle”ye eksik alanla basın: hata özeti üstte çıkar, her alanın altında Türkçe ve çözüm söyleyen bir mesaj olur. İsteğe bağlı bir alan kaydı engellemez.</li>
    <li>Bir alanı değiştirip soldaki menüden başka bir ekrana geçmeyi deneyin: kaydedilmemiş değişiklik uyarısı çıkar.</li></ul>`,
  ciz(param, c) {
    const hatali = param === "hata";
    const onizle = param === "onizleme";
    if (onizle) {
      const i = { ...ilanBul(3), poz: "Kıdemli Flutter Geliştirici", son: [11, 30] };
      const icerik = `<div class="f-bas"><div><p class="ust-etiket">Önizleme · adayın göreceği şekliyle</p><h1 class="b1">${kac(i.poz)}</h1></div></div>
        <div class="onizleme-cerceve">${ilanOnizleme(i, true).replace(/<div class="eslesme-kutu">[\s\S]*?<\/div>/, "").replace(/<div class="dugme-grubu">[\s\S]*?<\/div>/, "")}</div>
        <div class="bilgi"><p><strong>Bu ilan Yönetici A.Ş. onayına gidecek.</strong> İlk 3 ilanınız onaydan geçer; hedef süre 1 iş günü. Onaylanınca e-posta alırsınız.</p></div>`;
      const alt = `<div class="yapiskan-alt f-form-ayak"><a class="dugme dugme--ikincil" href="#firma-ilan-yeni" data-git="firma-ilan-yeni">Düzenlemeye dön</a><button class="dugme" data-eylem="gonder">İlanı onaya gönder</button></div>`;
      return { html: firmaDuzen(c, "firma-ilanlar", icerik, { altCubuk: alt }), eylemler: {
        gonder: () => { DURUM.formKirli = false; pencere(`<h2 class="b3">İlanınız onaya gönderildi</h2><p>Yönetici A.Ş. ilanınızı inceleyecek. Tahmini onay: <strong>Pazartesi 17:00’ye kadar</strong>. Sonucu e-postayla bildireceğiz.</p>
          <div class="dugme-grubu"><a class="dugme" href="#firma-ilanlar" data-git="firma-ilanlar">İlanlara dön</a></div>`); },
      } };
    }
    const hata = (id) => hatali && ["f-son", "f-zorunlu"].includes(id);
    const beceriKutu = (id, ad, ipucu, beceriler, oneriler) => `<div class="alan ${hata(id) ? "alan--hata" : ""}" id="${id}"><span class="alan-ad">${ad}</span><span class="ipucu">${ipucu}</span>
      ${hata(id) ? `<p class="hata-metni">En az bir zorunlu beceri ekleyin. Listeden seçin; listede yoksa önerin.</p>` : ""}
      <div class="beceri-giris">${beceriler.map((b) => `<span class="beceri-cip">${kac(b)}<button aria-label="${kac(b)} becerisini kaldır" data-eylem="kirli">${ikon("kapat", "ikon--k")}</button></span>`).join("")}
      <input class="beceri-girdi" placeholder="Beceri yazın: Flutter, Docker…" aria-label="${ad}: beceri ekle" data-girdi="kirli"></div>
      ${oneriler ? `<p class="kucuk ikincil">Öneriler: ${oneriler.map((o) => `<button class="dugme dugme--sade dugme--kucuk oneri" data-eylem="kirli">+ ${kac(o)}</button>`).join("")}</p>` : ""}</div>`;
    const bolum = (no, ad, icerik, acik = true) => `<section class="form-bolum" id="fb-${no}" aria-labelledby="fb-${no}-b"><h2 class="b3" id="fb-${no}-b"><span class="bolum-no">${no}</span>${ad}</h2>${icerik}</section>`;
    const form = `
      ${hatali ? `<div class="hata-ozeti" tabindex="-1" role="alert"><h2>İlanı önizlemeden önce 2 alanı tamamlayın</h2><ul><li><a href="#f-son" data-eylem="odakla" data-hedef="f-son">Son başvuru tarihini seçin</a></li><li><a href="#f-zorunlu" data-eylem="odakla" data-hedef="f-zorunlu">En az bir zorunlu beceri ekleyin</a></li></ul></div>` : ""}
      <div class="kopya-bilgi bilgi kucuk">“Flutter Geliştirici” ilanından kopyalandı. Son başvuru tarihi boş bırakıldı.</div>
      ${bolum(1, "Pozisyon", `
        <div class="alan"><label for="f-poz">Pozisyon adı</label><input id="f-poz" class="girdi" value="Kıdemli Flutter Geliştirici" data-girdi="kirli"></div>
        <fieldset class="alan"><legend>İlan türü</legend><div class="yan-yana"><label class="secenek secenek-kutu"><input type="radio" name="tur" checked data-degis="kirli"> <span>İş</span></label><label class="secenek secenek-kutu"><input type="radio" name="tur" data-degis="kirli"> <span>Staj</span></label></div></fieldset>
        <div class="iki-alan"><div class="alan"><label for="f-alt">Çalışma şekli</label><select id="f-alt" class="secim" data-degis="kirli"><option>Tam zamanlı</option><option>Yarı zamanlı</option><option>Proje bazlı / sözleşmeli</option></select></div>
        <div class="alan"><label for="f-aile">Pozisyon ailesi</label><select id="f-aile" class="secim" data-degis="kirli">${POZ_AILELERI.map((p) => `<option ${p === "Yazılım geliştirme" ? "selected" : ""}>${p}</option>`).join("")}</select></div></div>
        <fieldset class="alan"><legend>Çalışma modeli</legend><div class="yan-yana">${["Ofiste", "Hibrit", "Uzaktan"].map((m) => `<label class="secenek secenek-kutu"><input type="radio" name="model" ${m === "Hibrit" ? "checked" : ""} data-degis="kirli"> <span>${m}</span></label>`).join("")}</div></fieldset>
        <div class="iki-alan"><div class="alan"><label for="f-konum">Konum</label><input id="f-konum" class="girdi" value="Pamukkale Teknokent, D Blok 208" data-girdi="kirli"></div>
        <div class="alan"><label for="f-deneyim">Deneyim</label><select id="f-deneyim" class="secim" data-degis="kirli">${DENEYIM_SIRA.map((d) => `<option ${d === "3–5 yıl" ? "selected" : ""}>${d}</option>`).join("")}</select></div></div>`)}
      ${bolum(2, "Beceriler ve nitelikler", `
        ${beceriKutu("f-zorunlu", "Zorunlu beceriler", "Adayda mutlaka olması gerekenler. Eşleşme bu listeye göre hesaplanır.", hatali ? [] : ["Dart", "Flutter", "REST API"], ["Git", "Riverpod", "Bloc"])}
        ${beceriKutu("f-tercih", "Tercih sebebi", "Olursa iyi olur.", ["Firebase", "CI/CD"], null)}
        <div class="iki-alan"><div class="alan"><label for="f-egitim">Eğitim düzeyi</label><select id="f-egitim" class="secim"><option>Lisans</option><option>Önlisans</option><option>Yüksek lisans</option></select></div>
        <div class="alan"><label for="f-bolum">Tercih edilen bölümler <span class="istege-bagli">(isteğe bağlı)</span></label><input id="f-bolum" class="girdi" value="Bilgisayar Mühendisliği, Yazılım Mühendisliği"></div></div>
        <div class="alan"><label for="f-is">İş tanımı: Ne yapacak?</label><span class="ipucu">Maddeler hâlinde yazmanız okunmayı kolaylaştırır.</span><textarea id="f-is" class="metin-alani" data-girdi="kirli">Müşterilerimiz için geliştirdiğimiz mobil uygulamalarda Flutter ile yeni ekranlar ve özellikler yazacak.\nKod incelemelerine katılıp test kapsamını artıracak.</textarea></div>
        <div class="alan"><label for="f-nit">Aranan nitelikler</label><textarea id="f-nit" class="metin-alani" data-girdi="kirli">Flutter ile yayında en az iki uygulama\nREST servisleriyle çalışma deneyimi</textarea></div>`)}
      ${bolum(3, "Tarih ve başvuru", `
        <div class="alan ${hata("f-son") ? "alan--hata" : ""}" id="f-son"><span class="alan-ad">Son başvuru tarihi</span><span class="ipucu">En fazla 60 gün sonrası: 12 Ocak 2027.</span>
          ${hata("f-son") ? `<p class="hata-metni">Son başvuru tarihini seçin.</p>` : ""}${turkceTakvim({ yil: 2026, ay: 11, secili: hatali ? null : 31, enGec: [12, 12] })}</div>
        <details class="acilir"><summary>Ücret aralığı <span class="istege-bagli kucuk">isteğe bağlı</span></summary><div class="icerik">
          <div class="iki-alan"><div class="alan"><label for="f-u1">En az (₺, net/ay)</label><input id="f-u1" class="girdi" inputmode="numeric" value="60.000" data-girdi="kirli"></div><div class="alan"><label for="f-u2">En çok (₺, net/ay)</label><input id="f-u2" class="girdi" inputmode="numeric" value="75.000" data-girdi="kirli"></div></div>
          <label class="secenek"><input type="checkbox" data-degis="kirli"> <span>Ücret ilanda görünsün<span class="ipucu">Gizli kalsa da eşleştirmede adayın beklentisiyle karşılaştırılır.</span></span></label></div></details>
        <details class="acilir"><summary>Ön eleme soruları <span class="istege-bagli kucuk">isteğe bağlı · 2 / 5</span></summary><div class="icerik">
          <div class="soru-satiri"><p><strong>1.</strong> Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız? <span class="kucuk ikincil">Kısa cevap</span></p></div>
          <div class="soru-satiri"><p><strong>2.</strong> Haftada 2 gün ofiste çalışabilir misiniz? <span class="kucuk ikincil">Evet/Hayır · Eleyici: “Hayır” diyen aday listede ayrı işaretlenir</span></p></div>
          <button class="dugme dugme--sade dugme--kucuk" data-eylem="kirli">${ikon("arti", "ikon--k")} Soru ekle</button></div></details>
        <details class="acilir"><summary>Yan haklar <span class="istege-bagli kucuk">firma profilinden geldi</span></summary><div class="icerik">${["Haftada 2 gün uzaktan", "Eğitim bütçesi", "Yemek kartı", "Özel sağlık sigortası"].map((y, k) => `<label class="secenek"><input type="checkbox" ${k < 3 ? "checked" : ""} data-degis="kirli"> <span>${y}</span></label>`).join("")}</div></details>
        <details class="acilir"><summary>Şartname veya ek belge <span class="istege-bagli kucuk">isteğe bağlı · PDF, en fazla 5 MB</span></summary><div class="icerik"><div class="dosya"><label class="dugme dugme--ikincil dugme--kucuk">${ikon("yukle", "ikon--k")} PDF seç<input type="file" accept="application/pdf" class="gizli"></label></div></div></details>`)}
      ${bolum(4, "Paylaşım ve dil", `
        <div class="alan"><label for="f-lk">LinkedIn metni <span class="istege-bagli">(isteğe bağlı)</span></label><span class="ipucu">“LinkedIn’de paylaş” düğmesine bastığınızda bu metin ve ilan bağlantısı hazırlanır.</span>
          <textarea id="f-lk" class="metin-alani" maxlength="700" data-girdi="lk">Denizli’deki ekibimize kıdemli bir Flutter geliştirici arıyoruz.</textarea><span class="sayac-metin" data-lk>64 / 700</span></div>
        <fieldset class="alan"><legend>İlanın dili</legend><div class="yan-yana">${["Türkçe", "İngilizce", "Her ikisi"].map((d, k) => `<label class="secenek secenek-kutu"><input type="radio" name="dil" ${k === 0 ? "checked" : ""}> <span>${d}</span></label>`).join("")}</div></fieldset>`)}`;
    const durumCubugu = `<p class="kayit-durumu" aria-live="polite" data-kayit>${ikon("tik", "ikon--k")} Taslak kaydedildi · 14:32</p>`;
    let icerik;
    if (c === "mobil") {
      icerik = `<div class="f-bas"><h1 class="b2">Yeni ilan</h1>${durumCubugu}</div><div class="form-yigin form-ilan">${form}</div>`;
    } else {
      icerik = `<div class="f-bas"><div><a class="geri kucuk" href="#firma-ilanlar" data-git="firma-ilanlar">${ikon("geri", "ikon--k")} İlanlar</a><h1 class="b1">Yeni ilan</h1></div>${durumCubugu}</div>
        <div class="form-duzen"><nav class="form-icindekiler" aria-label="Form bölümleri"><ol><li><a href="#fb-1" data-eylem="odakla" data-hedef="fb-1">Pozisyon</a></li><li><a href="#fb-2" data-eylem="odakla" data-hedef="fb-2">Beceriler ve nitelikler</a></li><li><a href="#fb-3" data-eylem="odakla" data-hedef="fb-3">Tarih ve başvuru</a></li><li><a href="#fb-4" data-eylem="odakla" data-hedef="fb-4">Paylaşım ve dil</a></li></ol>
          <p class="kucuk ikincil">Esaslı değişiklikler (pozisyon adı, ilan türü, ücret) yayındaki ilanda onaydan geçer.</p></nav>
        <div class="form-yigin form-ilan">${form}</div></div>`;
    }
    const alt = `<div class="yapiskan-alt f-form-ayak"><button class="dugme dugme--ikincil" data-eylem="kaydet">Taslağı kaydet</button><button class="dugme" data-eylem="onizle">Önizle</button></div>`;
    return { html: firmaDuzen(c, "firma-ilanlar", icerik, { altCubuk: alt }), eylemler: {
      kirli: () => { DURUM.formKirli = true; const k = document.querySelector("[data-kayit]"); if (k) k.innerHTML = `<span class="kirli-nokta"></span> Kaydedilmemiş değişiklik var`; },
      lk: (el) => { DURUM.formKirli = true; document.querySelector("[data-lk]").textContent = `${el.value.length} / 700`; },
      kaydet: () => { DURUM.formKirli = false; document.querySelector("[data-kayit]").innerHTML = `${ikon("tik", "ikon--k")} Taslak kaydedildi · 14:36`; bildirim("Taslak kaydedildi"); },
      onizle: () => { if (!hatali && param !== "tamam") { git("firma-ilan-yeni-hata"); setTimeout(() => document.querySelector(".hata-ozeti")?.focus(), 50); } else { DURUM.formKirli = false; git("firma-ilan-yeni-onizleme"); } },
      gun: (el) => { DURUM.formKirli = true; document.querySelectorAll(".takvim button[aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", "false")); el.setAttribute("aria-pressed", "true"); },
      odakla: (el) => { document.getElementById(el.dataset.hedef)?.scrollIntoView({ block: "start" }); },
    } };
  },
});

/* ---------- BAŞVURULAR ---------- */
ekran("firma-basvurular", {
  ad: "Firma paneli: Başvurular", alan: "firma",
  aciklama: "Solda başvurular, sağda okunabilir aday özeti: önce ilanla eşleşme, sonra cevaplar ve CV. Mobilde liste → ayrıntı.",
  not: `<ul><li>Eşleşme özeti ilan ve aday profilinden hesaplanır: “Zorunlu 4 becerinin 4’ü var · Hibrit tercihiyle uyuyor”. Kara kutu yüzde yok.</li>
    <li>Firma, başvuru anında dondurulmuş profili görür.</li>
    <li>İndirilen CV’nin altına küçük bir filigran eklenir: firma adı ve indirme tarihi (K6). Her indirme kayıt altına alınır.</li>
    <li>Not, etiket ve 1–5 kare puanı yalnızca firma ekibi görür.</li>
    <li>“Olumsuz” seçildiğinde adaya nazik bir şablon gider; firma bu bildirimi kapatamaz.</li></ul>`,
  ciz(param, c) {
    const ilan = ilanBul(3);
    const secId = param || DURUM.basvuranSecili;
    const b = BASVURANLAR.find((x) => x.id === secId) || BASVURANLAR[0];
    const kisiEsl = (x) => eslesme(ilan, { beceri: x.beceri, model: x.model, bolum: x.bolum, deneyim: x.deneyim.includes("ay") ? "Yeni mezun" : "1–3 yıl", dil: x.dil });
    const satir = (x) => `<a class="bsv-satir ${x.id === b.id ? "secili" : ""}" href="#firma-basvurular-${x.id}" data-git="firma-basvurular-${x.id}" ${x.id === b.id && c !== "mobil" ? 'aria-current="true"' : ""}>
      <span class="bsv-ad">${x.yeni ? '<span class="yeni-isaret" aria-label="Yeni"></span>' : ""}${kac(x.ad)}</span>${durum(DURUM.basvuranDurum[x.id])}
      <span class="kucuk ikincil bsv-alt">${kac(x.bolum)} · ${kac(x.okul.replace(" Üniversitesi", " Ü."))}</span><span class="kucuk bsv-esl">${kac(kisiEsl(x).kisa)}</span><span class="kucuk ikincil bsv-tarih">${kac(x.tarih)}</span></a>`;
    const liste = `<div class="bsv-liste-bas"><div><label class="gizli" for="bsv-ilan">İlan</label><select id="bsv-ilan" class="secim"><option>Flutter Geliştirici (14)</option><option>Yazılım Stajyeri (38)</option><option>Tüm ilanlar</option></select></div>
      <div class="f-haplar"><button class="hap" aria-pressed="false">Zorunlu becerilerin hepsi var</button><button class="hap" aria-pressed="false">Eleyici soruyu geçenler</button></div></div>
      <div class="bsv-liste">${BASVURANLAR.map(satir).join("")}</div>`;
    const e = kisiEsl(b);
    const ayrinti = `<article class="bsv-ayrinti">
      ${c === "mobil" ? `<a class="geri kucuk" href="#firma-basvurular" data-git="firma-basvurular">${ikon("geri", "ikon--k")} Başvurular</a>` : ""}
      <header class="bsv-ust"><div><h2 class="b2">${kac(b.ad)}</h2><p class="ikincil">${kac(b.bolum)}, ${kac(b.okul)} · ${kac(b.mezun)} mezunu · ${kac(b.deneyim)} deneyim</p>
        <p class="kucuk ikincil">${kac(ilan.poz)} ilanına ${kac(b.tarih)} başvurdu · Kaynak: ${kac(b.kaynak)}</p></div>
        <div class="alan bsv-durum"><label for="bsv-d">Durum</label><select id="bsv-d" class="secim" data-degis="durum">${["alindi", "inceleniyor", "gorusme", "teklif", "olumlu", "olumsuz"].map((k) => `<option value="${k}" ${DURUM.basvuranDurum[b.id] === k ? "selected" : ""}>${DURUM_ADI[k]}</option>`).join("")}</select></div></header>
      <div class="eslesme-kutu"><p class="ust-etiket">İlanınızla eşleşme</p>${eslesmeListe(e)}</div>
      <div class="dugme-grubu"><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="indir">${ikon("indir", "ikon--k")} CV’yi indir</button><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="indir">${ikon("dosya", "ikon--k")} Başvuru PDF’i</button>
        <button class="dugme dugme--ikincil dugme--kucuk" data-eylem="gorusme">${ikon("takvim", "ikon--k")} Görüşmeye davet et</button><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="eposta">${ikon("mesaj", "ikon--k")} E-posta gönder</button></div>
      <section><h3 class="b3 kare-bas">Ön eleme cevapları</h3><dl class="cevaplar">${b.cevaplar.map(([s, c2]) => `<div><dt>${kac(s)}</dt><dd>${kac(c2)}</dd></div>`).join("")}</dl></section>
      <section><h3 class="b3 kare-bas">Beceriler</h3><p>${b.beceri.map(kac).join(" · ")}</p><p class="kucuk ikincil">Dil: ${kac(b.dil)} · Çalışma tercihi: ${kac(b.model)}</p></section>
      <section><h3 class="b3 kare-bas">CV</h3><div class="cv-onizleme" aria-label="CV önizlemesi"><div class="cv-sayfa"><p class="cv-ad">${kac(b.ad)}</p><p class="cv-cizgi"></p><p class="cv-cizgi k"></p><p class="cv-bas">Deneyim</p><p class="cv-cizgi"></p><p class="cv-cizgi"></p><p class="cv-cizgi k"></p><p class="cv-bas">Eğitim</p><p class="cv-cizgi"></p><p class="cv-cizgi k"></p>
        <p class="cv-filigran">Kodpit Teknoloji · 13.11.2026 tarihinde TeknoKariyer’den indirildi</p></div></div>
        <p class="kucuk ikincil">İndirilen her CV’nin altına bu filigran eklenir ve indirme kayıt altına alınır.</p></section>
      <section class="ekip-notu"><h3 class="b3 kare-bas">Ekip değerlendirmesi <span class="kucuk ikincil">· yalnızca ekibiniz görür</span></h3>
        <div class="alan"><span class="alan-ad">Puan</span><div class="puan" role="group" aria-label="Puan, 1 ile 5 arası">${[1, 2, 3, 4, 5].map((n) => `<button data-eylem="puan" data-n="${n}" aria-pressed="${n === b.puan}" class="${n <= b.puan ? "dolu" : ""}">${n}</button>`).join("")}</div></div>
        <div class="alan"><label for="bsv-not">Not</label><textarea id="bsv-not" class="metin-alani" placeholder="Örn. Teknik görüşmede state yönetimini sor."></textarea></div></section>
    </article>`;
    let icerik;
    if (c === "mobil") icerik = param ? ayrinti : `<div class="f-bas"><h1 class="b2">Başvurular</h1></div>${liste}`;
    else icerik = `<div class="f-bas"><h1 class="b1">Başvurular</h1><button class="dugme dugme--ikincil dugme--kucuk">${ikon("indir", "ikon--k")} Seçilenleri ZIP olarak indir</button></div><div class="bsv-duzen"><div class="bsv-sol">${liste}</div>${ayrinti}</div>`;
    return { html: firmaDuzen(c, "firma-basvurular", icerik), eylemler: {
      durum: (el) => {
        DURUM.basvuranDurum[b.id] = el.value;
        if (el.value === "olumsuz") pencere(`<h2 class="b3">Adaya olumsuz sonuç bildirilecek</h2><p>${kac(b.ad)} adlı adaya aşağıdaki şablonla nazik bir e-posta gider. Bu bildirim kapatılamaz; metne kişisel bir not ekleyebilirsiniz.</p>
          <blockquote class="alinti kucuk">Merhaba ${kac(b.ad.split(" ")[0])}, Kodpit Teknoloji Flutter Geliştirici ilanı için başka bir adayla ilerlemeye karar verdi. Başvurun için teşekkür ederiz…</blockquote>
          <div class="alan"><label for="olm-not">Kişisel not <span class="istege-bagli">(isteğe bağlı)</span></label><textarea id="olm-not" class="metin-alani"></textarea></div>
          <div class="dugme-grubu"><button class="dugme" data-eylem="olumsuz-tamam">Durumu değiştir ve bildir</button><button class="dugme dugme--sade" data-eylem-genel="kapat">Vazgeç</button></div>`);
        else { ciz(); bildirim(`Durum “${DURUM_ADI[el.value]}” oldu. Aday e-postayla bilgilendirildi.`); }
      },
      "olumsuz-tamam": () => { katmanKapat(); ciz(); bildirim("Durum “Olumsuz” oldu. Bildirim gönderildi."); },
      puan: (el) => { b.puan = Number(el.dataset.n); document.querySelectorAll(".puan button").forEach((x) => { const n = Number(x.dataset.n); x.classList.toggle("dolu", n <= b.puan); x.setAttribute("aria-pressed", String(n === b.puan)); }); },
      indir: () => bildirim("CV filigranla indirildi; indirme kayda geçti."),
      gorusme: () => altPanel("Görüşmeye davet et", `<div class="form-yigin"><p>Adaya en fazla 3 zaman önerin; aday birini seçer ve ikiniz de takvim dosyası alırsınız.</p>
        ${[["17 Kasım", "10:00"], ["18 Kasım", "14:00"], ["19 Kasım", "16:30"]].map(([g, s], k) => `<div class="iki-alan"><div class="alan"><label for="gz${k}">Tarih ${k + 1}</label><input id="gz${k}" class="girdi" value="${g} 2026"></div><div class="alan"><label for="gs${k}">Saat</label><input id="gs${k}" class="girdi" value="${s}" inputmode="numeric"></div></div>`).join("")}
        <div class="alan"><label for="gyer">Yer</label><input id="gyer" class="girdi" value="Pamukkale Teknokent, D Blok 208"></div></div>`, `<button class="dugme dugme--genis" data-eylem="davet-gitti">Daveti gönder</button>`),
      "davet-gitti": () => { katmanKapat(); DURUM.basvuranDurum[b.id] = "gorusme"; ciz(); bildirim("Görüşme daveti gönderildi"); },
      eposta: () => altPanel("E-posta gönder", `<div class="form-yigin"><div class="alan"><label for="sab">Şablon</label><select id="sab" class="secim"><option>Ek bilgi isteği</option><option>Teknik ödev</option><option>Teklif öncesi görüşme</option></select></div>
        <div class="alan"><label for="eps">Mesaj</label><textarea id="eps" class="metin-alani">Merhaba ${kac(b.ad.split(" ")[0])}, başvurun için teşekkürler. Yayında olan uygulamanın kaynak kodunu inceleyebileceğimiz bir bağlantı paylaşabilir misin?</textarea></div>
        <p class="kucuk ikincil">E-posta kariyer@pauteknokent.com.tr üzerinden gider; adayın e-posta adresi size görünmez, cevabı panelinize düşer.</p></div>`, `<button class="dugme dugme--genis" data-eylem-genel="kapat">Gönder</button>`),
    } };
  },
});

/* ---------- CV HAVUZU ARAMASI ---------- */
ekran("firma-havuz", {
  ad: "Firma paneli: CV havuzu", alan: "firma",
  aciklama: "İlan açmadan aday arama. Listede ad ve iletişim gizli; profili açınca ad, iletişim ve CV görünür. Aday rızasını havuza katılırken verdi (K24).",
  not: `<ul><li>Önerimiz: adın da aday onay verene kadar gizli kalması (“A-1042”). Talimatlarda yalnızca iletişim bilgisi ve CV gizli; adı da gizlemek ayrımcılık riskini azaltır. Kurumun onayına sunuyoruz.</li>
    <li>“Zorunlu becerilerin hepsi / herhangi biri” seçimi aramanın sertliğini belirler.</li>
    <li>Her profil görüntülemesi kayda geçer; aday yalnızca sayıyı görür (K5).</li>
    <li>Kayıtlı arama: yeni uyan adaylar için haftalık e-posta.</li></ul>`,
  ciz(_, c) {
    const kart = (a) => `<li class="havuz-kart panel"><div class="havuz-kart-bas"><p class="ust-etiket">${kac(a.kod)} · ${kac(a.gorunurluk)}</p><p><strong>${kac(a.ozet)}</strong></p></div>
      <dl class="ozet-dl kucuk"><div><dt>Deneyim</dt><dd>${kac(a.deneyim)}</dd></div><div><dt>Beceriler</dt><dd>${a.beceri.map(kac).join(", ")}</dd></div><div><dt>Tercih</dt><dd>${kac(a.tercih)}</dd></div><div><dt>Başlama</dt><dd>${kac(a.baslama)}</dd></div><div><dt>Dil</dt><dd>${kac(a.dil)}</dd></div><div><dt>Cinsiyet</dt><dd>${kac(a.cinsiyet)}</dd></div></dl>
      <button class="dugme dugme--kucuk" data-eylem="ac" data-kod="${a.kod}">Profili aç</button></li>`;
    const filtre = `<div class="havuz-filtre"><div class="alan"><span class="alan-ad">Beceri</span><div class="beceri-giris"><span class="beceri-cip">Flutter<button aria-label="Flutter becerisini kaldır">${ikon("kapat", "ikon--k")}</button></span><span class="beceri-cip">Dart<button aria-label="Dart becerisini kaldır">${ikon("kapat", "ikon--k")}</button></span><input class="beceri-girdi" placeholder="Beceri ekle" aria-label="Beceri ekle"></div>
      <div class="yan-yana kucuk"><label class="secenek"><input type="radio" name="bh" checked> <span>Hepsi olsun</span></label><label class="secenek"><input type="radio" name="bh"> <span>Herhangi biri</span></label></div></div>
      <div class="iki-alan"><div class="alan"><label for="hv-d">Deneyim</label><select id="hv-d" class="secim"><option>Fark etmez</option><option>En az 1 yıl</option><option>En az 3 yıl</option></select></div><div class="alan"><label for="hv-s">Şehir</label><select id="hv-s" class="secim"><option>Denizli veya taşınmaya açık</option><option>Fark etmez</option></select></div></div></div>`;
    const icerik = `<div class="f-bas"><div><h1 class="b1">CV havuzu</h1><p class="ikincil">Havuzda açık rıza veren <strong>412 aday</strong> var. ${ornek()}</p></div><button class="dugme dugme--ikincil dugme--kucuk" data-eylem="kaydet">${ikon("zil", "ikon--k")} Aramayı kaydet</button></div>
      ${filtre}<p class="kucuk"><strong>${HAVUZ.length} aday</strong> · ad ve iletişim bilgisi profil açılınca görünür; her açılış kayda geçer</p><ul class="havuz-liste">${HAVUZ.map(kart).join("")}</ul>`;
    return { html: firmaDuzen(c, "firma-havuz", icerik), eylemler: {
      kaydet: () => bildirim("Arama kaydedildi. Yeni uyan adayları her pazartesi e-postayla bildireceğiz."),
      ac: (el) => { const a = HAVUZ.find((x) => x.kod === el.dataset.kod);
        altPanel(`${a.ad} · ${a.kod}`, `<div class="form-yigin"><p class="bilgi kucuk">Bu görüntüleme kayda geçti. Aday kimin baktığını değil, yalnızca kaç firmanın baktığını görür.</p>
          <dl class="ozet-dl"><div><dt>Ad soyad</dt><dd>${kac(a.ad)}</dd></div><div><dt>E-posta</dt><dd>${kac(a.eposta)}</dd></div><div><dt>Eğitim</dt><dd>${kac(a.ozet)}</dd></div><div><dt>Deneyim</dt><dd>${kac(a.deneyim)}</dd></div><div><dt>Beceriler</dt><dd>${a.beceri.map(kac).join(", ")}</dd></div><div><dt>Tercih</dt><dd>${kac(a.tercih)}</dd></div></dl>
          <div class="dosya-satiri">${ikon("dosya")}<span class="ad">CV – Türkçe<span class="kucuk ikincil" style="display:block">İndirilen CV’ye firma adı ve tarih filigranı eklenir</span></span><button class="dugme dugme--sade dugme--kucuk">İndir</button></div></div>`,
          `<button class="dugme dugme--ikincil" data-eylem-genel="kapat">Kapat</button><button class="dugme dugme--genis" data-eylem-genel="kapat">${ikon("mesaj", "ikon--k")} E-posta gönder</button>`); },
    } };
  },
});

ekran("firma-profil", {
  ad: "Firma paneli: Kurulum sihirbazı", alan: "firma",
  aciklama: "Yönetici A.Ş.’nin oluşturduğu iskelet kaydı devralan firma, profilini 7 adımda tamamlar. Her adım kaydedilir.",
  not: `<ul><li>İskelet bilgiler (unvan, sektör, blok/oda) dolu gelir; firma doğrular veya “Bu bilgilerde hata var” der.</li>
    <li>Yarıda bırakılabilir; 3., 7. ve 14. günde otomatik hatırlatma gider.</li>
    <li>Yayına hazır olma kriteri açıkça yazar: logo, kısa tanıtım ve sektör.</li></ul>`,
  ciz(_, c) {
    const adimlar = ["Temel bilgiler", "Logo ve kapak", "Tanıtım metni", "Faaliyet alanları", "Çalışma modeli ve yan haklar", "Ekip üyeleri", "İlk ilan"];
    const icerik = `<div class="f-bas"><div><p class="ust-etiket">Firma kurulumu · Adım 3 / 7</p><h1 class="b1">Tanıtım metni</h1></div></div>
      <ol class="sihirbaz-adim">${adimlar.map((a, k) => `<li class="${k < 2 ? "tamam" : k === 2 ? "simdi" : ""}" ${k === 2 ? 'aria-current="step"' : ""}><span class="no">${k < 2 ? "✓" : k + 1}</span>${a}${k >= 5 ? ' <span class="kucuk ikincil">isteğe bağlı</span>' : ""}</li>`).join("")}</ol>
      <div class="form-yigin sihirbaz-form">
        <div class="bilgi kucuk"><strong>Profiliniz yayına hazır olmak için:</strong> logo ✓ · kısa tanıtım · sektör ✓</div>
        <div class="alan"><label for="kt">Kısa tanıtım</label><span class="ipucu">İlan sayfalarında ve firma listesinde görünür. En fazla 300 karakter.</span><textarea id="kt" class="metin-alani" maxlength="300" data-girdi="say">Müşterilerimiz için mobil ve web uygulamaları geliştiriyoruz. Ekibimiz Teknokent D Blok’ta.</textarea><span class="sayac-metin" data-say>93 / 300</span></div>
        <div class="alan"><label for="ut">Burada çalışmak nasıl? <span class="istege-bagli">(isteğe bağlı)</span></label><span class="ipucu">Adayların en çok merak ettiği soru. Ekip yapısı, günlük iş, öğrenme imkânları.</span><textarea id="ut" class="metin-alani"></textarea></div>
      </div>`;
    const alt = `<div class="yapiskan-alt f-form-ayak"><button class="dugme dugme--sade">Sonra devam et</button><button class="dugme dugme--ikincil">Geri</button><button class="dugme">Kaydet ve devam et</button></div>`;
    return { html: firmaDuzen(c, "firma-ana", icerik, { altCubuk: alt }), eylemler: { say: (el) => (document.querySelector("[data-say]").textContent = `${el.value.length} / 300`) } };
  },
});

