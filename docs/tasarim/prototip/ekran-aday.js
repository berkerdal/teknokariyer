/* Aday tarafı ekranları */
"use strict";

/* ---------- Filtreleme (yüzlü: her seçeneğin yanında sonuç sayısı) ---------- */
const FILTRE_GRUPLARI = [
  { k: "tur", ad: "İlan türü", deg: (i) => i.tur, secenekler: ["Staj", "İş"] },
  { k: "model", ad: "Çalışma modeli", deg: (i) => i.model, secenekler: ["Ofiste", "Hibrit", "Uzaktan"] },
  { k: "deneyim", ad: "Deneyim", deg: (i) => i.deneyim, secenekler: DENEYIM_SIRA },
  { k: "aile", ad: "Pozisyon ailesi", deg: (i) => i.aile, secenekler: POZ_AILELERI },
];
const trKucuk = (s) => s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
function filtrele(haric) {
  const f = DURUM.filtre;
  return ILANLAR.filter((i) => kalanGun(i.son) >= 0).filter((i) => {
    for (const g of FILTRE_GRUPLARI) {
      if (g.k === haric) continue;
      const s = f[g.k];
      if (s.size && !s.has(g.deg(i))) return false;
    }
    if (haric !== "ucretli" && f.ucretli && !i.ucretliStaj) return false;
    if (f.ara) {
      const a = trKucuk(f.ara);
      const metin = trKucuk([i.poz, firmaAd(i.firma), ...i.zorunlu, ...i.tercih, i.aile].join(" "));
      if (!a.split(/\s+/).every((p) => metin.includes(p))) return false;
    }
    return true;
  });
}
const aktifFiltreSayisi = () => FILTRE_GRUPLARI.reduce((n, g) => n + DURUM.filtre[g.k].size, 0) + (DURUM.filtre.ucretli ? 1 : 0);
function bosDurumOnerisi() {
  /* Hangi filtre kaldırılırsa en çok sonuç gelir? */
  let en = null;
  for (const g of FILTRE_GRUPLARI) for (const d of DURUM.filtre[g.k]) {
    DURUM.filtre[g.k].delete(d);
    const n = filtrele().length;
    DURUM.filtre[g.k].add(d);
    if (n && (!en || n > en.n)) en = { g: g.k, d, n };
  }
  return en;
}
function filtreGovdesi() {
  return FILTRE_GRUPLARI.map((g) => {
    const taban = filtrele(g.k);
    const say = (d) => taban.filter((i) => g.deg(i) === d).length;
    const sec = g.secenekler.filter((d) => say(d) || DURUM.filtre[g.k].has(d));
    return `<fieldset class="f-grup"><legend>${kac(g.ad)}</legend><div class="f-haplar">${sec.map((d) => {
      const n = say(d), acik = DURUM.filtre[g.k].has(d);
      return `<button class="hap" data-eylem="filtre" data-g="${g.k}" data-d="${kac(d)}" aria-pressed="${acik}" ${!n && !acik ? "disabled" : ""}>${kac(d)} <span class="sayi">${n}</span></button>`;
    }).join("")}</div></fieldset>`;
  }).join("") + `<fieldset class="f-grup"><legend>Staj</legend><label class="secenek"><input type="checkbox" data-degis="ucretli" ${DURUM.filtre.ucretli ? "checked" : ""}>
    <span>Yalnızca ücretli staj <span class="ikincil">(${filtrele("ucretli").filter((i) => i.ucretliStaj).length})</span></span></label></fieldset>`;
}

/* ---------- ANA SAYFA ---------- */
ekran("ana-sayfa", {
  ad: "Ana sayfa", alan: "aday",
  aciklama: "İlk ekranda arama, hızlı filtreler ve gerçek son ilanlar. Dev slogan ve boş bir karşılama alanı yok.",
  not: `<ul><li>Başlık somut: kim, nerede, ne. Sayılar veritabanından gelir ve tanımı yazılır (“yayında 15 ilan”).</li>
    <li>Hızlı filtrelerin yanındaki sayılar canlıdır; sonuç vermeyecek bir seçenek gösterilmez.</li>
    <li>Firmalar logo gelene kadar blok/oda kodlu karoyla görünür: fotoğraf veya baş harf avatarı yerine Teknokent’e özgü bilgi.</li>
    <li>Firmalara tek satır yeter; aday sayfasını firma pazarlamasıyla doldurmuyoruz.</li></ul>`,
  ciz(_, c) {
    const yayinda = ILANLAR.filter((i) => kalanGun(i.son) >= 0);
    const firmaSay = new Set(yayinda.map((i) => i.firma)).size;
    const say = (fn) => yayinda.filter(fn).length;
    const son = [...yayinda].sort((a, b) => tarihNesne(b.yayin) - tarihNesne(a.yayin)).slice(0, c === "mobil" ? 6 : 8);
    const firmalar = Object.keys(FIRMALAR).map((id) => [id, yayinda.filter((i) => i.firma === id).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
    const hizli = `<div class="hizli-filtre" role="group" aria-label="Hızlı filtreler">
      <a class="hap" href="#ilanlar-staj" data-git="ilanlar-staj">Staj <span class="sayi">${say((i) => i.tur === "Staj")}</span></a>
      <a class="hap" href="#ilanlar-is" data-git="ilanlar-is">İş <span class="sayi">${say((i) => i.tur === "İş")}</span></a>
      <a class="hap" href="#ilanlar-uzaktan" data-git="ilanlar-uzaktan">Uzaktan <span class="sayi">${say((i) => i.model === "Uzaktan")}</span></a>
      <a class="hap" href="#ilanlar-yenimezun" data-git="ilanlar-yenimezun">Yeni mezun <span class="sayi">${say((i) => ["Yeni mezun", "Öğrenci"].includes(i.deneyim) && i.tur === "İş")}</span></a></div>`;
    const html = `${adayUst(c, false)}
    <main class="as">
      <section class="as-giris"><div class="as-giris-ic">
        <h1 class="b1">Pamukkale Teknokent firmalarında iş ve staj ilanları</h1>
        <p class="as-alt">Şu an yayında <strong>${yayinda.length} ilan</strong>, ${firmaSay} firmadan. İlanları yalnızca Teknokent’teki firmalar verir; başvuru herkese açık.</p>
        <form class="arama" role="search" data-eylem="ara-git"><label class="gizli" for="as-ara">İlan ara</label>
          <span class="arama-kutu">${ikon("ara")}<input id="as-ara" class="girdi" type="search" placeholder="Pozisyon, beceri veya firma" autocomplete="off" enterkeyhint="search"></span>
          <button class="dugme" type="submit">Ara</button></form>
        ${hizli}
      </div></section>
      <div class="as-govde">
        <section class="as-ilanlar" aria-labelledby="as-son"><div class="bolum-bas"><h2 id="as-son" class="b2 kare-bas">Son yayınlanan ilanlar</h2>
          <a href="#ilanlar" data-git="ilanlar" class="kucuk">${yayinda.length} ilanın tümü</a></div>
          <div class="ilan-listesi">${son.map((i) => ilanSatiri(i)).join("")}</div>
          <a class="dugme dugme--ikincil dugme--genis tumu" href="#ilanlar" data-git="ilanlar">${yayinda.length} ilanın tümünü göster</a></section>
        <aside class="as-yan">
          <section aria-labelledby="as-firma"><h2 id="as-firma" class="b3 kare-bas">İlan veren firmalar</h2>
            <ul class="firma-liste">${firmalar.slice(0, 8).map(([id, n]) => `<li><a href="#firma-vitrin-${id}" data-git="firma-vitrin-${id}">${kareLogo(id, 40)}<span><strong>${kac(FIRMALAR[id].ad)}</strong><span class="kucuk ikincil">${kac(FIRMALAR[id].sektor)} · ${n} açık ilan</span></span></a></li>`).join("")}</ul></section>
          <section aria-labelledby="as-tarih"><h2 id="as-tarih" class="b3 kare-bas">Duyurular ve tarihler ${ornek()}</h2>
            <ul class="tarih-liste">
              <li><span class="tarih-karo"><b>4</b>Ara</span><span><strong>Teknokent Kariyer Günü</strong><span class="kucuk ikincil">Firmalarla yüz yüze görüşme · Teknokent konferans salonu</span></span></li>
              <li><span class="tarih-karo"><b>15</b>Oca</span><span><strong>Bahar dönemi uzun dönem staj ilanları için son hafta</strong><span class="kucuk ikincil">Şubat’ta başlayacak stajlar</span></span></li>
            </ul></section>
          <p class="firma-satir">Teknokent firmasıysanız ilan vermek için <a href="#giris-yap-firma" data-git="giris-yap-firma">firma girişi</a> yapın. Hesabınız yoksa Yönetici A.Ş. sizi davet eder.</p>
        </aside>
      </div>
    </main>${adayAlt()}`;
    return { html, eylemler: {
      kaydet: kaydetEylemi,
      "ara-git": (el) => { DURUM.filtre.ara = el.querySelector("input").value.trim(); git("ilanlar"); },
    }, sonra(s) { s.querySelector("form.arama")?.addEventListener("submit", (e) => { e.preventDefault(); DURUM.filtre.ara = e.target.querySelector("input").value.trim(); git("ilanlar"); }); } };
  },
});

/* ---------- İLAN LİSTESİ ---------- */
ekran("ilanlar", {
  ad: "İlan listesi ve filtreler", alan: "aday",
  aciklama: "Mobilde filtre alttan açılan panelde; masaüstünde solda filtre, ortada liste, sağda ilan. Filtreler adreste tutulur.",
  not: `<ul><li>Liste yoğun ve taranabilir: 360 px ekranda 5 ilan görünür; büyük kart yok.</li>
    <li>Her filtre seçeneğinin yanında, diğer filtreler uygulanmış hâldeki sonuç sayısı yazar. Sonuç vermeyecek seçenek pasiftir.</li>
    <li>Alt paneldeki ana düğme canlı sayıyı söyler: “12 ilanı göster”.</li>
    <li>Sonuç kalmadığında boş ekran yerine hangi filtrenin kaldırılacağı ve kaç ilan geleceği söylenir.</li>
    <li>Masaüstünde ilana tıklayınca liste kaybolmaz; ilan sağda açılır, kaydırma konumu korunur.</li></ul>`,
  ciz(param, c) {
    if (param === "staj") { DURUM.filtre.tur = new Set(["Staj"]); }
    if (param === "is") { DURUM.filtre.tur = new Set(["İş"]); }
    if (param === "uzaktan") { DURUM.filtre.model = new Set(["Uzaktan"]); }
    if (param === "yenimezun") { DURUM.filtre.deneyim = new Set(["Yeni mezun", "Öğrenci"]); DURUM.filtre.tur = new Set(["İş"]); }
    const secili = /^\d+$/.test(param || "") ? Number(param) : null;
    const liste = () => {
      const s = filtrele();
      if (!s.length) {
        const o = bosDurumOnerisi();
        return `<div class="bos"><p class="b3">Bu filtrelerle ilan yok.</p>${o ? `<p>“${kac(o.d)}” filtresini kaldırırsan ${o.n} ilan var.</p>
          <button class="dugme dugme--ikincil" data-eylem="filtre" data-g="${o.g}" data-d="${kac(o.d)}">“${kac(o.d)}” filtresini kaldır</button>` : ""}
          <button class="dugme dugme--sade" data-eylem="temizle">Tüm filtreleri temizle</button></div>`;
      }
      return s.map((i) => ilanSatiri(i, { secili: i.id === secili, eslesmeGoster: false, hedef: c === "masaustu" ? "ilanlar-" + i.id : undefined })).join("");
    };
    const etiketler = () => {
      const t = [];
      for (const g of FILTRE_GRUPLARI) for (const d of DURUM.filtre[g.k]) t.push(`<button class="hap" aria-pressed="true" data-eylem="filtre" data-g="${g.k}" data-d="${kac(d)}">${kac(d)} ${ikon("kapat", "ikon--k")}<span class="gizli"> filtresini kaldır</span></button>`);
      if (DURUM.filtre.ucretli) t.push(`<button class="hap" aria-pressed="true" data-eylem="ucretli-kaldir">Ücretli staj ${ikon("kapat", "ikon--k")}</button>`);
      if (DURUM.filtre.ara) t.push(`<button class="hap" aria-pressed="true" data-eylem="ara-kaldir">“${kac(DURUM.filtre.ara)}” ${ikon("kapat", "ikon--k")}</button>`);
      return t.join("");
    };
    const arama = `<form class="arama arama--liste" role="search" data-form="ara"><label class="gizli" for="il-ara">İlan ara</label>
      <span class="arama-kutu">${ikon("ara")}<input id="il-ara" class="girdi" type="search" value="${kac(DURUM.filtre.ara)}" placeholder="Pozisyon, beceri veya firma" enterkeyhint="search"></span></form>`;
    const sayiBas = () => `<div class="liste-bas"><p><strong data-sayi>${filtrele().length}</strong> ilan</p>
      <label class="siralama kucuk">Sırala <select class="secim secim--kucuk"><option>En yeni</option><option>Son başvuru tarihi yakın</option></select></label></div>`;

    let html;
    if (c === "mobil") {
      html = `${adayUst(c, true)}<main class="il-mobil">${arama}<div class="secili-filtre" data-etiketler>${etiketler()}</div>${sayiBas()}
        <div class="ilan-listesi" data-liste>${liste()}</div></main>
        <div class="yapiskan-alt"><button class="dugme dugme--genis" data-eylem="filtre-ac">${ikon("filtre")} Filtrele${aktifFiltreSayisi() ? ` (${aktifFiltreSayisi()})` : ""}</button>
        <button class="dugme dugme--ikincil" data-eylem="arama-kaydet">${ikon("zil")}<span class="gizli">Aramayı kaydet</span></button></div>`;
    } else {
      const i = ilanBul(secili || filtrele()[0]?.id);
      html = `${adayUst(c, true, "ilanlar")}<main class="il-masa">
        <aside class="il-filtre" aria-label="Filtreler"><div class="il-filtre-bas"><h2 class="b3">Filtreler</h2>${aktifFiltreSayisi() ? `<button class="dugme dugme--sade dugme--kucuk" data-eylem="temizle">Temizle</button>` : ""}</div><div data-filtre>${filtreGovdesi()}</div>
          <button class="dugme dugme--ikincil dugme--genis" data-eylem="arama-kaydet">${ikon("zil")} Bu aramayı kaydet</button></aside>
        <section class="il-liste" aria-label="İlanlar">${arama}<div class="secili-filtre" data-etiketler>${etiketler()}</div>${sayiBas()}<div class="ilan-listesi" data-liste>${liste()}</div></section>
        <section class="il-onizleme" aria-label="Seçili ilan">${i ? ilanOnizleme(i) : ""}</section></main>`;
    }
    const yenile = () => {
      const s = document.querySelector(".ekran-kok");
      s.querySelector("[data-liste]").innerHTML = liste();
      s.querySelector("[data-etiketler]").innerHTML = etiketler();
      s.querySelectorAll("[data-sayi]").forEach((e) => (e.textContent = filtrele().length));
      const f = s.querySelector("[data-filtre]"); if (f) f.innerHTML = filtreGovdesi();
      const p = document.querySelector(".alt-panel [data-panel-filtre]"); if (p) p.innerHTML = filtreGovdesi();
      const d = document.querySelector("[data-goster]"); if (d) { const n = filtrele().length; d.textContent = n ? `${n} ilanı göster` : "Sonuç yok"; }
      const fb = s.querySelector('[data-eylem="filtre-ac"]'); if (fb) fb.innerHTML = `${ikon("filtre")} Filtrele${aktifFiltreSayisi() ? ` (${aktifFiltreSayisi()})` : ""}`;
    };
    return { html, eylemler: {
      kaydet: kaydetEylemi,
      filtre: (el) => { const s = DURUM.filtre[el.dataset.g]; s.has(el.dataset.d) ? s.delete(el.dataset.d) : s.add(el.dataset.d); yenile(); },
      ucretli: (el) => { DURUM.filtre.ucretli = el.checked; yenile(); },
      "ucretli-kaldir": () => { DURUM.filtre.ucretli = false; yenile(); },
      "ara-kaldir": () => { DURUM.filtre.ara = ""; document.getElementById("il-ara").value = ""; yenile(); },
      temizle: () => { for (const g of FILTRE_GRUPLARI) DURUM.filtre[g.k].clear(); DURUM.filtre.ucretli = false; DURUM.filtre.ara = ""; ciz(); },
      "filtre-ac": () => altPanel("Filtrele", `<div data-panel-filtre>${filtreGovdesi()}</div>`,
        `<button class="dugme dugme--ikincil" data-eylem="temizle">Temizle</button><button class="dugme dugme--genis" data-eylem-genel="kapat" data-goster>${filtrele().length} ilanı göster</button>`),
      "arama-kaydet": () => altPanel("Aramayı kaydet", `<div class="form-yigin"><p>Bu filtrelere uyan yeni bir ilan yayınlandığında e-posta gönderelim.</p>
        <fieldset class="alan"><legend>Ne sıklıkla?</legend><label class="secenek secenek-kutu"><input type="radio" name="sik" checked> <span>Anlık<span class="ipucu">İlan yayınlandığı gün</span></span></label>
        <label class="secenek secenek-kutu"><input type="radio" name="sik"> <span>Haftalık özet<span class="ipucu">Pazartesi sabahları</span></span></label></fieldset></div>`,
        `<button class="dugme dugme--genis" data-eylem="arama-kaydedildi">Aramayı kaydet</button>`),
      "arama-kaydedildi": () => { katmanKapat(); bildirim("Arama kaydedildi. Yeni ilanları e-postayla bildireceğiz."); },
    }, sonra(s) {
      s.querySelector('form[data-form="ara"]')?.addEventListener("submit", (e) => { e.preventDefault(); DURUM.filtre.ara = e.target.querySelector("input").value.trim(); yenile(); });
      s.querySelector("#il-ara")?.addEventListener("input", (e) => { DURUM.filtre.ara = e.target.value.trim(); yenile(); });
      if (secili) s.querySelector('.ilan-satiri[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
    } };
  },
});

/* Masaüstü sağ bölme: ilanın özeti */
function ilanOnizleme(i, notr = false) {
  const f = FIRMALAR[i.firma];
  const e = eslesme(i, ADAY);
  return `<div class="onz"><div class="onz-firma">${kareLogo(i.firma, 44)}<div><a href="#firma-vitrin-${i.firma}" data-git="firma-vitrin-${i.firma}"><strong>${kac(f.ad)}</strong></a><p class="kucuk ikincil">${kac(f.konum)} · Pamukkale Teknokent</p></div></div>
    <h2 class="b2">${kac(i.poz)}</h2>
    <p class="etiketler"><span class="etiket etiket--guclu">${kac(i.alt)}</span><span class="etiket">${kac(i.model)}</span><span class="etiket">${kac(i.deneyim)}</span>${i.ucretliStaj ? '<span class="etiket">Ücretli</span>' : ""}${i.pau ? '<span class="etiket">PAÜ öğrencisine öncelik</span>' : ""}</p>
    <dl class="ozet-dl"><div><dt>Son başvuru</dt><dd>${tarihYaz(i.son, true)} <span class="ikincil">(${kalanGun(i.son)} gün)</span></dd></div><div><dt>Yayın</dt><dd>${tarihYaz(i.yayin)}</dd></div>${i.ucret ? `<div><dt>Ücret</dt><dd>${kac(i.ucret)}</dd></div>` : ""}</dl>
    <div class="dugme-grubu"><a class="dugme" href="#basvuru-1" data-git="basvuru-1">Başvur</a><a class="dugme dugme--ikincil" href="#ilan-${i.id}" data-git="ilan-${i.id}">İlanın tamamı</a></div>
    <div class="eslesme-kutu"><p class="ust-etiket">Senin profilinle</p>${eslesmeListe(e)}</div>
    <h3 class="b3">Ne yapacaksın?</h3><ul class="madde">${i.is.map((m) => `<li>${kac(m)}</li>`).join("")}</ul>
    <h3 class="b3">Beceriler</h3>${beceriListesi(i, notr)}</div>`;
}
function beceriListesi(i, notr = false) {
  const sahip = new Set(Object.keys(ADAY.beceriler));
  const b = (x) => notr ? `<li class="notr">${kac(x)}</li>` : `<li class="${sahip.has(x) ? "var" : "eksik"}">${kac(x)}<span class="gizli">${sahip.has(x) ? " (profilinde var)" : " (profilinde yok)"}</span></li>`;
  return `<div class="beceriler"><div><p class="ust-etiket">Zorunlu</p><ul class="eslesme">${i.zorunlu.map(b).join("")}</ul></div>
    ${i.tercih.length ? `<div><p class="ust-etiket">Tercih sebebi</p><ul class="eslesme">${i.tercih.map(b).join("")}</ul></div>` : ""}</div>`;
}

/* ---------- İLAN DETAYI ---------- */
ekran("ilan", {
  ad: "İlan detayı", alan: "aday",
  aciklama: "Önce özet ve eşleşme, sonra açılır bölümler. “Başvur” her zaman görünür. Sayaç biçimi (K7) bu ekranda seçilecek.",
  not: `<ul><li>Eşleşme bir yüzde değil, gerekçeli bir liste: “Zorunlu 4 becerinin 3’ü var · eksik: RTOS”. Liste ilan ve profilden hesaplanır.</li>
    <li>Sayaç (K7) için dört biçim hazırladık. Kurumun seçimine göre biri kalacak. Hiçbiri “şu an 12 kişi bakıyor” gibi baskı kurmuyor; sayılar gerçek veriden gelir.</li>
    <li>Kapanmış ilanın adresi 404 vermez: “Bu ilan kapandı” ve firmanın açık ilanları gösterilir (HTTP 410).</li>
    <li>Şikâyet bağlantısı sayfanın sonunda, sakin bir dille.</li></ul>`,
  ciz(param, c) {
    const i = ilanBul(param || 1) || ILANLAR[0];
    const f = FIRMALAR[i.firma];
    const e = eslesme(i, ADAY);
    const sayac = () => {
      const b = i.basvuru, g = i.goruntulenme;
      const aralik = b < 10 ? "10’dan az başvuru" : b <= 50 ? "10–50 başvuru" : "50’den fazla başvuru";
      return ({ aralik: aralik, kesin: `${b} başvuru`, ikisi: `${g} görüntülenme · ${b} başvuru`, yok: "" })[DURUM.sayacBicimi];
    };
    const sayacSec = `<div class="prototip-secim" role="group" aria-label="Sayaç biçimi seçenekleri (kurum seçecek)"><p class="ust-etiket">Prototip seçeneği · Sayaç biçimi (K7)</p><div class="f-haplar">
      ${[["aralik", "Aralık"], ["kesin", "Kesin sayı"], ["ikisi", "Görüntülenme + başvuru"], ["yok", "Gösterme"]].map(([k, a]) => `<button class="hap" data-eylem="sayac" data-k="${k}" aria-pressed="${DURUM.sayacBicimi === k}">${a}</button>`).join("")}</div></div>`;
    const ozet = `<dl class="ozet-dl">
      <div><dt>Son başvuru</dt><dd>${tarihYaz(i.son, true)} <span class="ikincil">(${kalanGun(i.son)} gün kaldı)</span></dd></div>
      <div><dt>Yayın tarihi</dt><dd>${tarihYaz(i.yayin, true)}</dd></div>
      <div><dt>Konum</dt><dd>Pamukkale Teknokent, ${kac(f.konum)}</dd></div>
      <div><dt>Pozisyon sayısı</dt><dd>${i.pozSayi}</dd></div>
      ${i.ucret ? `<div><dt>Ücret</dt><dd>${kac(i.ucret)}</dd></div>` : ""}
      <div data-sayac-alan ${DURUM.sayacBicimi === "yok" ? "hidden" : ""}><dt>İlgi</dt><dd data-sayac>${sayac()}</dd></div></dl>`;
    const esl = `<div class="eslesme-kutu"><p class="ust-etiket">Senin profilinle</p>${eslesmeListe(e)}
      ${e.eksikZ.length ? `<p class="kucuk">Bu beceriler profilinde varsa ekle: <a href="#aday-profil" data-git="aday-profil">profili düzenle</a></p>` : ""}</div>`;
    const bolumler = `
      <details class="acilir" open><summary>Ne yapacaksın?</summary><div class="icerik"><ul class="madde">${i.is.map((m) => `<li>${kac(m)}</li>`).join("")}</ul></div></details>
      <details class="acilir" open><summary>Aranan nitelikler</summary><div class="icerik"><ul class="madde">${i.nitelik.map((m) => `<li>${kac(m)}</li>`).join("")}</ul>
        <p><strong>Eğitim:</strong> ${kac(i.egitim)}${i.bolumler.length ? ` · ${kac(i.bolumler.join(", "))}` : ""}</p>${i.dil.length ? `<p><strong>Dil:</strong> ${i.dil.map((d) => kac(d.join(" "))).join(", ")}</p>` : ""}</div></details>
      <details class="acilir" open><summary>Beceriler</summary><div class="icerik">${beceriListesi(i)}</div></details>
      ${i.staj ? `<details class="acilir" open><summary>Staj bilgileri</summary><div class="icerik"><dl class="ozet-dl"><div><dt>Dönem</dt><dd>${kac(i.staj.donem)}</dd></div><div><dt>Ücret</dt><dd>${i.ucretliStaj ? "Ücretli" : "Ücretsiz (gönüllü staj)"}</dd></div><div><dt>SGK</dt><dd>${kac(i.staj.sgk)}</dd></div><div><dt>Zorunlu staj belgesi</dt><dd>${kac(i.staj.belge)}</dd></div>${i.pau ? `<div><dt>Öncelik</dt><dd>PAÜ öğrencilerine öncelik veriliyor</dd></div>` : ""}</dl></div></details>` : ""}
      <details class="acilir"><summary>Yan haklar</summary><div class="icerik"><ul class="madde">${i.yanHak.map((m) => `<li>${kac(m)}</li>`).join("")}</ul></div></details>
      <details class="acilir"><summary>Başvuru nasıl ilerler?</summary><div class="icerik"><p>Profilin ve seçtiğin CV gönderilir${i.sorular ? `, ${i.sorular} kısa soruyu cevaplarsın` : ""}. Başvurunun durumunu “Başvurularım” sayfasından izlersin; firma karar verdiğinde sonuç sana mutlaka bildirilir.</p></div></details>
      <details class="acilir"><summary>${kac(f.ad)} hakkında</summary><div class="icerik"><p>${kac(f.unvan)} · ${kac(f.sektor)} · ${kac(f.konum)}</p><a href="#firma-vitrin-${i.firma}" data-git="firma-vitrin-${i.firma}">Firma sayfasına git</a></div></details>`;
    const bas = `<div class="il-bas">${kareLogo(i.firma, 48)}<div><p><a href="#firma-vitrin-${i.firma}" data-git="firma-vitrin-${i.firma}"><strong>${kac(f.ad)}</strong></a></p><p class="kucuk ikincil">${kac(f.sektor)} · ${kac(f.konum)}</p></div></div>
      <h1 class="b1">${kac(i.poz)}</h1>
      <p class="etiketler"><span class="etiket etiket--guclu">${kac(i.tur)} · ${kac(i.alt)}</span><span class="etiket">${kac(i.model)}</span><span class="etiket">${kac(i.deneyim)}</span>${i.ucretliStaj ? '<span class="etiket">Ücretli staj</span>' : ""}${i.pau ? '<span class="etiket">PAÜ öğrencisine öncelik</span>' : ""}</p>`;
    const sikayet = `<p class="sikayet kucuk"><button class="dugme dugme--sade dugme--kucuk" data-eylem="sikayet">Bu ilanda bir sorun mu var? Bize bildir</button></p>`;
    const kayitli = DURUM.kaydedilen.has(i.id);
    let html;
    if (c === "mobil") {
      html = `${adayUst(c, true)}<main class="id-mobil"><a class="geri" href="#ilanlar" data-git="ilanlar">${ikon("geri", "ikon--k")} İlanlar</a>
        ${bas}${ozet}${sayacSec}${esl}<div class="id-bolumler">${bolumler}</div>${sikayet}</main>
        <div class="yapiskan-alt"><button class="ikon-dugme ikon-dugme--cerceve" data-eylem="kaydet" data-id="${i.id}" aria-pressed="${kayitli}" aria-label="İlanı kaydet">${ikon("yer-imi")}</button>
        <a class="dugme dugme--genis" href="#basvuru-1" data-git="basvuru-1">Başvur</a></div>`;
    } else {
      html = `${adayUst(c, true, "ilanlar")}<main class="id-masa"><div class="id-ana"><a class="geri" href="#ilanlar" data-git="ilanlar">${ikon("geri", "ikon--k")} İlanlara dön</a>${bas}<div class="id-bolumler">${bolumler}</div>${sikayet}</div>
        <aside class="id-yan"><div class="id-yan-yapiskan"><div class="dugme-grubu"><a class="dugme dugme--genis" href="#basvuru-1" data-git="basvuru-1">Başvur</a>
          <button class="dugme dugme--ikincil" data-eylem="kaydet" data-id="${i.id}" aria-pressed="${kayitli}">${ikon("yer-imi")} ${kayitli ? "Kaydedildi" : "Kaydet"}</button></div>
          ${ozet}${esl}${sayacSec}<button class="dugme dugme--sade dugme--kucuk" data-eylem="kopyala">${ikon("kopya", "ikon--k")} Bağlantıyı kopyala</button></div></aside></main>${adayAlt()}`;
    }
    return { html, eylemler: {
      kaydet: (el) => { kaydetEylemi(el); if (c !== "mobil") el.innerHTML = `${ikon("yer-imi")} ${DURUM.kaydedilen.has(i.id) ? "Kaydedildi" : "Kaydet"}`; },
      sayac: (el) => { DURUM.sayacBicimi = el.dataset.k; document.querySelectorAll('[data-eylem="sayac"]').forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
        document.querySelector("[data-sayac]").textContent = sayac(); document.querySelector("[data-sayac-alan]").hidden = DURUM.sayacBicimi === "yok"; },
      kopyala: () => bildirim("Bağlantı kopyalandı"),
      sikayet: () => altPanel("İlanı bildir", `<div class="form-yigin"><p>Bildirimin Yönetici A.Ş.’ye gider; firmaya adın iletilmez.</p>
        <fieldset class="alan"><legend>Sorun ne?</legend>${["Sahte veya firmaya ait olmayan ilan", "Ayrımcı ifade (yaş, cinsiyet, medeni hâl…)", "Ücret veya ücretsiz deneme çalışması istiyor", "Başka bir sorun"].map((s, n) => `<label class="secenek"><input type="radio" name="sik" ${n === 0 ? "" : ""}> <span>${s}</span></label>`).join("")}</fieldset>
        <div class="alan"><label for="sk-ac">Açıklama <span class="istege-bagli">(isteğe bağlı)</span></label><textarea id="sk-ac" class="metin-alani"></textarea></div></div>`,
        `<button class="dugme dugme--genis" data-eylem="sikayet-gonder">Bildir</button>`),
      "sikayet-gonder": () => { katmanKapat(); bildirim("Bildirimin alındı. Yönetici A.Ş. inceleyecek."); },
    } };
  },
});

/* ---------- BAŞVURU AKIŞI (profili tam aday: 3 ekran) ---------- */
function basvuruBas(c, adim) {
  const i = ilanBul(1), f = FIRMALAR[i.firma];
  const adlar = ["CV ve ön yazı", "Sorular", "Onay"];
  return `<header class="bv-ust"><a class="geri" href="#ilan-1" data-git="ilan-1">${ikon("kapat", "ikon--k")}<span>Vazgeç</span></a>
    <span class="bv-ilan"><strong>${kac(i.poz)}</strong><span class="kucuk ikincil">${kac(f.ad)}</span></span></header>
    <div class="cubuk-ilerleme" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${adim}" aria-label="Başvuru adımı ${adim}/3"><span style="width:${(adim / 3) * 100}%"></span></div>
    <ol class="adimlar bv-adimlar">${adlar.map((a, n) => `<li class="${n + 1 < adim ? "tamam" : ""}" ${n + 1 === adim ? 'aria-current="step"' : ""}><span class="no">${n + 1}</span>${c === "mobil" && n + 1 !== adim ? "" : a}</li>`).join("")}</ol>`;
}
ekran("basvuru", {
  ad: "Başvuru akışı", alan: "aday",
  aciklama: "Profili tam aday 3 ekranda başvurur. Hatalar görünür ve Türkçe; CV havuzu kutusu ayrı ve işaretsiz gelir.",
  not: `<ul><li>Hedef: profili tam aday mobilde en fazla 3 ekranda başvurur. Profil eksikse yalnızca bu ilanın gerektirdiği eksikler sorulur.</li>
    <li>Hata olduğunda formun üstünde bir hata özeti çıkar, odak oraya taşınır; her alanın altında ne yapılacağını söyleyen bir mesaj olur.</li>
    <li>Aydınlatma metni onayı ile CV havuzu açık rızası ayrı kutulardır. Havuz kutusu varsayılan olarak işaretsizdir.</li>
    <li>Başvuru anında profilin bir kopyası saklanır; aday sonradan profilini değiştirse de firma başvuru anındaki bilgiyi görür.</li>
    <li>Ikinci adımı hatalı göndermeyi deneyin: “Devam et”e soruları cevaplamadan basın.</li></ul>`,
  ciz(param, c) {
    const a = Number(param || 1);
    const b = DURUM.basvuru;
    const i = ilanBul(1);
    const hataOzeti = (h) => h.length ? `<div class="hata-ozeti" tabindex="-1" role="alert"><h2>Devam etmeden önce düzelt</h2><ul>${h.map(([id, m]) => `<li><a href="#${id}" data-eylem="odakla" data-hedef="${id}">${kac(m)}</a></li>`).join("")}</ul></div>` : "";
    let govde, ayak;
    if (a === 1) {
      govde = `<h1 class="b2">CV’ni seç</h1>
        <div class="panel panel-ic profil-ozet"><div><p class="ust-etiket">Bu başvuruyla gönderilecek profil</p><p><strong>${kac(ADAY.ad)}</strong> · ${kac(ADAY.bolum)}, ${kac(ADAY.okul)} (${kac(ADAY.sinif)})</p>
          <p class="kucuk ikincil">${Object.keys(ADAY.beceriler).slice(0, 6).map(kac).join(", ")} · İngilizce B2</p></div><a href="#aday-profil" data-git="aday-profil" class="kucuk">Düzenle</a></div>
        <fieldset class="alan"><legend>Hangi CV gönderilsin?</legend>${ADAY.cvler.map((cv, n) => `<label class="secenek secenek-kutu"><input type="radio" name="cv" value="${n}" ${b.cv === n ? "checked" : ""} data-degis="cv">
          <span>${ikon("dosya", "ikon--k")} <strong>${kac(cv.ad)}</strong><span class="ipucu">${kac(cv.dosya)} · ${cv.boy} · ${cv.tarih}’de yüklendi</span></span></label>`).join("")}
          <button class="dugme dugme--sade dugme--kucuk" data-eylem="cv-yukle">${ikon("arti", "ikon--k")} Yeni CV yükle</button></fieldset>
        <div class="alan"><label for="bv-onyazi">Ön yazı <span class="istege-bagli">(isteğe bağlı)</span></label>
          <span class="ipucu">Firmaya neden bu ilana başvurduğunu birkaç cümleyle anlatabilirsin.</span>
          <textarea id="bv-onyazi" class="metin-alani" maxlength="1500" data-girdi="onyazi">${kac(b.onYazi)}</textarea><span class="sayac-metin" data-onyazi-say>${b.onYazi.length} / 1500</span></div>`;
      ayak = `<button class="dugme dugme--genis" data-eylem="ileri" data-a="2">Devam et</button>`;
    } else if (a === 2) {
      const h = b.hatalar;
      const hataVar = (id) => h.some(([x]) => x === id);
      govde = `${hataOzeti(h)}<h1 class="b2">${kac(FIRMALAR[i.firma].ad)}’nın soruları</h1>
        <fieldset class="alan ${hataVar("s1") ? "alan--hata" : ""}" id="s1"><legend>Haftada 5 gün Denizli’deki ofiste çalışabilir misin?</legend>
          ${hataVar("s1") ? `<p class="hata-metni">Bir seçenek işaretle.</p>` : ""}
          <label class="secenek secenek-kutu"><input type="radio" name="s1" value="Evet" ${b.cevaplar.s1 === "Evet" ? "checked" : ""} data-degis="s1"> <span>Evet</span></label>
          <label class="secenek secenek-kutu"><input type="radio" name="s1" value="Hayır" ${b.cevaplar.s1 === "Hayır" ? "checked" : ""} data-degis="s1"> <span>Hayır</span></label></fieldset>
        <div class="alan ${hataVar("s2") ? "alan--hata" : ""}"><label for="s2">Hangi RTOS ile çalıştın? Kısaca anlat.</label>
          <span class="ipucu">Okul projesi de olabilir. En fazla 300 karakter.</span>
          ${hataVar("s2") ? `<p class="hata-metni">Bu soruyu cevapla. Çalışmadıysan “çalışmadım” yazman yeterli.</p>` : ""}
          <textarea id="s2" class="metin-alani" maxlength="300" data-girdi="s2">${kac(b.cevaplar.s2 || "")}</textarea></div>`;
      ayak = `<button class="dugme dugme--ikincil" data-eylem="geri" data-a="1">Geri</button><button class="dugme dugme--genis" data-eylem="ileri" data-a="3">Devam et</button>`;
    } else if (a === 3) {
      const h = b.hatalar;
      govde = `${hataOzeti(h)}<h1 class="b2">Kontrol et ve gönder</h1>
        <dl class="kontrol-dl panel">
          <div><dt>CV</dt><dd>${kac(ADAY.cvler[b.cv].ad)}</dd><a href="#basvuru-1" data-git="basvuru-1">Değiştir</a></div>
          <div><dt>Ön yazı</dt><dd>${b.onYazi ? kac(b.onYazi.slice(0, 80)) + (b.onYazi.length > 80 ? "…" : "") : "Yok"}</dd><a href="#basvuru-1" data-git="basvuru-1">Değiştir</a></div>
          <div><dt>Ofiste çalışma</dt><dd>${kac(b.cevaplar.s1 || "—")}</dd><a href="#basvuru-2" data-git="basvuru-2">Değiştir</a></div>
          <div><dt>RTOS deneyimi</dt><dd>${kac(b.cevaplar.s2 || "—")}</dd><a href="#basvuru-2" data-git="basvuru-2">Değiştir</a></div></dl>
        <div class="alan ${h.some(([x]) => x === "aydinlatma") ? "alan--hata" : ""}" id="aydinlatma">
          ${h.some(([x]) => x === "aydinlatma") ? `<p class="hata-metni">Başvurmak için aydınlatma metnini okuduğunu onayla.</p>` : ""}
          <label class="secenek"><input type="checkbox" data-degis="aydinlatma" ${b.aydinlatma ? "checked" : ""}> <span><a href="#">Başvuru aydınlatma metnini</a> okudum. Profilimin ve CV’min ${kac(FIRMALAR[i.firma].ad)} ile paylaşılacağını biliyorum.<span class="ipucu">Metin sürümü 1.0 · 1 Kasım 2026</span></span></label></div>
        <div class="havuz-kutu"><label class="secenek"><input type="checkbox" data-degis="havuz" ${b.havuz ? "checked" : ""}> <span><strong>Bilgilerimi CV havuzuna ekle</strong> <span class="istege-bagli">(isteğe bağlı)</span>
          <span class="ipucu">Teknokent firmaları, ilan açmadan da profilinin iletişim bilgisi olmayan bir özetini görebilir. Sana ulaşmak isteyen firma önce izin ister. İznin 12 ay geçerli; istediğin zaman geri alabilirsin. <a href="#">Açık rıza metni</a></span></span></label></div>`;
      ayak = `<button class="dugme dugme--ikincil" data-eylem="geri" data-a="2">Geri</button><button class="dugme dugme--genis" data-eylem="gonder">Başvurunu gönder</button>`;
    }
    if (param === "tamam") {
      const html = `${basvuruBas(c, 3).replace(/<div class="cubuk-ilerleme[\s\S]*<\/ol>/, "")}<main class="bv bv-tamam"><div class="basari-kutu"><h1 class="b2">Başvurun ${kac(FIRMALAR.pinova.ad)}’e iletildi</h1>
        <p>Onay e-postası ${kac(ADAY.eposta)} adresine gönderildi.</p></div>
        <h2 class="b3 kare-bas">Bundan sonra ne olacak?</h2>
        <ol class="sonraki"><li><span><strong>Firma başvurunu inceler.</strong> Durum “İnceleniyor” olduğunda e-posta alırsın.</span></li>
        <li><span><strong>Görüşme isterse</strong> zaman seçenekleri gönderir; birini seçersin.</span></li><li><span><strong>Karar ne olursa olsun</strong> sonuç sana bildirilir.</span></li></ol>
        ${b.havuz ? `<p class="bilgi">CV havuzuna da katıldın. Ayarlarını “Profil → CV havuzu” bölümünden değiştirebilirsin.</p>` : ""}
        <div class="dugme-grubu"><a class="dugme" href="#aday-panel" data-git="aday-panel">Başvurularıma git</a><a class="dugme dugme--ikincil" href="#ilanlar" data-git="ilanlar">Diğer ilanlara bak</a></div></main>`;
      return { html };
    }
    const html = `${basvuruBas(c, a)}<main class="bv"><div class="bv-govde">${govde}</div></main><div class="yapiskan-alt bv-ayak">${ayak}</div>`;
    return { html, eylemler: {
      cv: (el) => { b.cv = Number(el.value); },
      onyazi: (el) => { b.onYazi = el.value; document.querySelector("[data-onyazi-say]").textContent = `${el.value.length} / 1500`; },
      s1: (el) => { b.cevaplar.s1 = el.value; },
      s2: (el) => { b.cevaplar.s2 = el.value; },
      aydinlatma: (el) => { b.aydinlatma = el.checked; },
      havuz: (el) => { b.havuz = el.checked; },
      "cv-yukle": () => altPanel("Yeni CV yükle", `<div class="form-yigin"><p>Telefonundaki dosyalardan, Google Drive’dan veya iCloud’dan seçebilirsin.</p>
        <div class="dosya"><p><strong>Yalnızca PDF, en fazla 5 MB.</strong> En fazla 3 CV saklayabilirsin; şu an 2 CV’n var.</p><label class="dugme dugme--ikincil">${ikon("yukle")} Dosya seç<input type="file" accept="application/pdf" class="gizli"></label></div>
        <div class="alan"><label for="cv-ad">CV’ye bir ad ver</label><input id="cv-ad" class="girdi" value="CV – Gömülü sistemler"></div></div>`, `<button class="dugme dugme--genis" data-eylem-genel="kapat">Yükle</button>`),
      odakla: (el) => { document.getElementById(el.dataset.hedef)?.scrollIntoView({ block: "center" }); document.querySelector(`#${el.dataset.hedef} input, #${el.dataset.hedef}`)?.focus(); },
      geri: (el) => { b.hatalar = []; git("basvuru-" + el.dataset.a); },
      ileri: (el) => {
        if (a === 2) {
          b.hatalar = [];
          if (!b.cevaplar.s1) b.hatalar.push(["s1", "Ofiste çalışma sorusunu cevapla"]);
          if (!(b.cevaplar.s2 || "").trim()) b.hatalar.push(["s2", "RTOS sorusunu cevapla"]);
          if (b.hatalar.length) { ciz(); document.querySelector(".hata-ozeti")?.focus(); return; }
        }
        b.hatalar = []; git("basvuru-" + el.dataset.a);
      },
      gonder: () => {
        b.hatalar = b.aydinlatma ? [] : [["aydinlatma", "Aydınlatma metnini okuduğunu onayla"]];
        if (b.hatalar.length) { ciz(); document.querySelector(".hata-ozeti")?.focus(); return; }
        git("basvuru-tamam");
      },
    } };
  },
});

/* ---------- ADAY PANELİ: Başvurularım ---------- */
function adayPanelDuzen(c, aktif, icerik) {
  if (c === "mobil") return `${adayUst(c, true)}<main class="ap-mobil">${icerik}</main>${adayAltMenu(aktif)}`;
  const m = (id, ad) => `<a href="#${id}" data-git="${id}" ${aktif === id ? 'aria-current="page"' : ""}>${ad}</a>`;
  return `${adayUst(c, true)}<main class="ap-masa"><nav class="ap-menu" aria-label="Hesabım">${m("aday-panel", "Başvurularım")}${m("aday-kaydedilen", "Kaydedilen ilanlar")}${m("aday-profil", "Profil ve CV’ler")}${m("aday-havuz", "CV havuzu")}<a href="#">Kayıtlı aramalar</a>${m("aday-hesap", "Hesap ve gizlilik")}</nav><div class="ap-icerik">${icerik}</div></main>`;
}
ekran("aday-panel", {
  ad: "Aday paneli: Başvurularım", alan: "aday",
  aciklama: "Adayın başvurularının durumu tek bakışta görünür. Hiçbir başvuru karanlıkta kalmaz; olumsuz sonuç da bildirilir.",
  not: `<ul><li>Durum ilerlemesi beş kareyle gösterilir: logodaki pikselin işlevsel kullanımı.</li>
    <li>Olumsuz sonuç nazik bir şablonla bildirilir ve firma bu bildirimi kapatamaz.</li>
    <li>Profil görüntülenmesinde firma adları değil yalnızca sayı görünür (K5).</li>
    <li>Yapılacak bir iş varsa (görüşme zamanı seçmek) listenin en üstüne çıkar.</li></ul>`,
  ciz(_, c) {
    const kart = (bv) => {
      const i = ilanBul(bv.ilan), f = FIRMALAR[i.firma];
      const kareler = BASVURU_ADIMLARI.map((ad, n) => `<i class="${n < bv.adim ? "gecti" : n === bv.adim ? (bv.durum === "olumsuz" ? "olumsuz" : "simdi") : ""}" title="${ad}"></i>`).join("");
      return `<li class="bv-kart"><div class="bv-kart-bas"><div><a href="#ilan-${i.id}" data-git="ilan-${i.id}" class="poz-baglanti">${kac(i.poz)}</a><p class="kucuk">${kac(f.ad)} · ${kac(f.konum)}</p></div>${durum(bv.durum)}</div>
        <div class="adim-kareler" aria-label="Durum: ${DURUM_ADI[bv.durum]}">${kareler}</div><p class="kucuk ikincil">Başvuru: ${kac(bv.tarih)}${bv.not ? " · " + kac(bv.not) : ""}</p>
        ${bv.durum === "gorusme" ? `<button class="dugme dugme--kucuk" data-eylem="zaman">Görüşme zamanını seç</button>` : ""}
        ${["alindi", "inceleniyor"].includes(bv.durum) ? `<button class="dugme dugme--sade dugme--kucuk" data-eylem="geri-cek">Başvuruyu geri çek</button>` : ""}</li>`;
    };
    const icerik = `<h1 class="b1">Başvurularım</h1>
      <div class="ap-ust-bilgi"><div class="gorev"><p class="ust-etiket">Senden bir şey bekleniyor</p><p><strong>Kodpit Teknoloji</strong> görüşme için 3 zaman önerdi.</p><button class="dugme dugme--kucuk" data-eylem="zaman">Zaman seç</button></div>
        <div class="goruntulenme"><p class="ust-etiket">CV havuzu</p><p><strong class="buyuk-sayi">${ADAY.havuz.goruntuleyen30}</strong> firma son 30 günde profilini görüntüledi.</p><a href="#aday-havuz" data-git="aday-havuz" class="kucuk">Havuz ayarları</a></div></div>
      <ul class="bv-liste">${[...BASVURULARIM].sort((x) => (x.durum === "gorusme" ? -1 : 0)).map(kart).join("")}</ul>`;
    return { html: adayPanelDuzen(c, "aday-panel", icerik), eylemler: {
      zaman: () => altPanel("Görüşme zamanı seç", `<div class="form-yigin"><p><strong>Kodpit Teknoloji · Yazılım Stajyeri</strong><br>Görüşme Teknokent D Blok 208’de, yaklaşık 45 dakika.</p>
        <fieldset class="alan"><legend>Sana uygun olan zamanı seç</legend>${["17 Kasım Salı, 10:00", "18 Kasım Çarşamba, 14:00", "19 Kasım Perşembe, 16:30"].map((z, n) => `<label class="secenek secenek-kutu"><input type="radio" name="z" ${n === 1 ? "checked" : ""}> <span>${z}</span></label>`).join("")}</fieldset>
        <p class="kucuk ikincil">Hiçbiri uymuyorsa firmaya not bırakabilirsin.</p></div>`, `<button class="dugme dugme--genis" data-eylem="zaman-tamam">Zamanı onayla</button>`),
      "zaman-tamam": () => { katmanKapat(); bildirim("Görüşme 18 Kasım 14:00 için onaylandı. Takvim dosyası e-postanda."); },
      "geri-cek": () => pencere(`<h2 class="b3">Başvuruyu geri çekmek istiyor musun?</h2><p>Firma başvurunu “Aday geri çekti” olarak görür. Aynı ilana tekrar başvuramazsın.</p>
        <div class="dugme-grubu"><button class="dugme dugme--tehlike" data-eylem-genel="kapat">Geri çek</button><button class="dugme dugme--ikincil" data-eylem-genel="kapat">Vazgeç</button></div>`),
    } };
  },
});

ekran("aday-kaydedilen", {
  ad: "Aday paneli: Kaydedilenler", alan: "aday",
  aciklama: "Kaydedilen ilanlar. Son başvuru tarihine 2 gün kala e-posta hatırlatması gider.",
  ciz(_, c) {
    const l = ILANLAR.filter((i) => DURUM.kaydedilen.has(i.id));
    const icerik = `<h1 class="b1">Kaydedilen ilanlar</h1><p class="ikincil">Son başvuru tarihine 2 gün kala sana e-posta göndereceğiz.</p>
      <div class="ilan-listesi">${l.length ? l.map((i) => ilanSatiri(i, { eslesmeGoster: true })).join("") : `<div class="bos"><p>Henüz kaydettiğin ilan yok. İlan listesinde ${ikon("yer-imi", "ikon--k")} işaretine dokunarak kaydedebilirsin.</p><a class="dugme dugme--ikincil" href="#ilanlar" data-git="ilanlar">İlanlara bak</a></div>`}</div>`;
    return { html: adayPanelDuzen(c, "aday-kaydedilen", icerik), eylemler: { kaydet: (el) => { kaydetEylemi(el); setTimeout(ciz, 400); } } };
  },
});

ekran("aday-profil", {
  ad: "Aday paneli: Profil ve CV’ler", alan: "aday",
  aciklama: "Profil bir kez doldurulur, her başvuruda kullanılır. Tamamlanma göstergesi puan değil, eksikler listesi.",
  not: `<ul><li>“%70 tamamlandı” yerine eksikler listesi: her eksiğin yanında doğrudan o alana giden bağlantı.</li>
    <li>Beceriler taksonomiden seçilir; ilan ile profil aynı listeyi kullandığı için eşleşme doğru çalışır.</li>
    <li>En fazla 3 CV saklanır; başvururken hangisinin gideceği seçilir.</li></ul>`,
  ciz(_, c) {
    const icerik = `<h1 class="b1">Profil ve CV’ler</h1>
      <section class="panel panel-ic eksik-panel"><h2 class="b3">Profilinde eksik olanlar</h2><ul class="eksikler">${ADAY.eksik.map(([a, h]) => `<li><span>${kac(a)}</span><a class="dugme dugme--sade dugme--kucuk" href="#${h}" data-git="${h}">Ekle</a></li>`).join("")}</ul></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Kimlik ve eğitim</h2><button class="dugme dugme--sade dugme--kucuk">Düzenle</button></div>
        <dl class="ozet-dl"><div><dt>Ad soyad</dt><dd>${kac(ADAY.ad)}</dd></div><div><dt>Okul</dt><dd>${kac(ADAY.okul)}</dd></div><div><dt>Bölüm</dt><dd>${kac(ADAY.bolum)} · ${kac(ADAY.sinif)}</dd></div><div><dt>Mezuniyet</dt><dd>${kac(ADAY.mezuniyet)} (beklenen)</dd></div></dl></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Beceriler</h2><button class="dugme dugme--sade dugme--kucuk">Düzenle</button></div>
        <ul class="beceri-seviye">${Object.entries(ADAY.beceriler).map(([b, s]) => `<li><span>${kac(b)}</span><span class="ikincil">${kac(s)}</span></li>`).join("")}</ul></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Diller</h2></div><p>İngilizce · B2 (CEFR)</p></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">CV’ler</h2><span class="kucuk ikincil">2 / 3</span></div>
        ${ADAY.cvler.map((cv) => `<div class="dosya-satiri">${ikon("dosya")}<span class="ad">${kac(cv.ad)}<span class="kucuk ikincil" style="display:block">${kac(cv.dosya)} · ${cv.boy}</span></span><button class="dugme dugme--sade dugme--kucuk">Değiştir</button></div>`).join("")}
        <button class="dugme dugme--ikincil dugme--kucuk">${ikon("arti", "ikon--k")} CV ekle</button></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Tercihler</h2></div><dl class="ozet-dl"><div><dt>İlan türü</dt><dd>Staj, iş</dd></div><div><dt>Çalışma modeli</dt><dd>Ofiste, hibrit</dd></div><div><dt>Şehir</dt><dd>Denizli · taşınmaya açık değil</dd></div><div><dt>Ücret beklentisi</dt><dd class="ikincil">Girilmedi (yalnızca CV havuzunda kullanılır)</dd></div></dl></section>`;
    return { html: adayPanelDuzen(c, "aday-profil", icerik) };
  },
});

ekran("aday-havuz", {
  ad: "Aday paneli: CV havuzu ayarları", alan: "aday",
  aciklama: "Havuza katılım ayrı açık rızayla olur ve 12 ayda bir yenilenir. Aday görünürlüğünü ve kimden gizleneceğini seçer.",
  not: `<ul><li>Görünürlük üç seçenekli: aktif iş arıyorum, fırsatlara açığım, gizle.</li>
    <li>“Mevcut işverenimden gizle”: Teknokent’te çalışan bir aday, kendi firmasının onu havuzda görmesini engeller.</li>
    <li>Rızanın bitiş tarihi açıkça yazar; yenilenmezse aday havuzdan otomatik çıkar.</li>
    <li>Firma önce iletişim bilgisi ve CV olmadan bir özet görür; iletişim adayın onayıyla başlar.</li></ul>`,
  ciz(_, c) {
    const icerik = `<h1 class="b1">CV havuzu</h1>
      <div class="ap-ust-bilgi"><div class="goruntulenme"><p class="ust-etiket">Son 30 gün</p><p><strong class="buyuk-sayi">4</strong> firma profilini görüntüledi.</p><p class="kucuk ikincil">Firma adlarını göstermiyoruz.</p></div>
        <div class="gorev"><p class="ust-etiket">İletişim talepleri</p><p><strong>1</strong> firma seninle iletişime geçmek istiyor.</p><button class="dugme dugme--kucuk" data-eylem="talep">Talebi gör</button></div></div>
      <fieldset class="alan"><legend class="b3">Görünürlüğün</legend>
        ${[["Aktif iş arıyorum", "Profilin arama sonuçlarında öne çıkar."], ["Fırsatlara açığım", "Profilin görünür ama öne çıkmaz."], ["Gizle", "Hiçbir firma profilini havuzda görmez. Başvuruların etkilenmez."]].map(([a, i]) =>
          `<label class="secenek secenek-kutu"><input type="radio" name="g" ${a === ADAY.havuz.durum ? "checked" : ""}> <span><strong>${a}</strong><span class="ipucu">${i}</span></span></label>`).join("")}</fieldset>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Şu firmalardan gizle</h2></div><p class="ikincil">Teknokent’te bir firmada çalışıyorsan o firmanın seni havuzda görmesini engelleyebilirsin.</p>
        <div class="dugme-grubu"><button class="dugme dugme--ikincil dugme--kucuk">${ikon("arti", "ikon--k")} Firma ekle</button></div></section>
      <section class="profil-bolum"><div class="bolum-bas"><h2 class="b3 kare-bas">Açık rızan</h2></div>
        <p>Havuz rızan <strong>${ADAY.havuz.rizaBitis}</strong> tarihine kadar geçerli. Süre dolmadan bir ay önce hatırlatacağız; yenilemezsen havuzdan otomatik çıkarsın.</p>
        <div class="dugme-grubu"><button class="dugme dugme--ikincil dugme--kucuk">Rızamı şimdi yenile</button><button class="dugme dugme--tehlike dugme--kucuk">Havuzdan çık</button></div></section>`;
    return { html: adayPanelDuzen(c, "aday-havuz", icerik), eylemler: {
      talep: () => altPanel("İletişim talebi", `<div class="form-yigin"><p><strong>Bulutfon</strong> · D Blok 212</p><p class="ikincil kucuk">İlgili ilan: Backend Geliştirici (Go)</p>
        <blockquote class="alinti">Merhaba, profilinizdeki Linux ve C deneyimi ilgimizi çekti. Yaz döneminde başlayacak bir staj için görüşmek isteriz.</blockquote>
        <p class="kucuk">Kabul edersen adın, e-posta adresin ve seçtiğin CV yalnızca Bulutfon’a açılır.</p>
        <fieldset class="alan"><legend>Hangi CV paylaşılsın?</legend>${ADAY.cvler.map((cv, n) => `<label class="secenek"><input type="radio" name="tcv" ${n === 0 ? "checked" : ""}> <span>${kac(cv.ad)}</span></label>`).join("")}</fieldset></div>`,
        `<button class="dugme dugme--ikincil" data-eylem-genel="kapat">Reddet</button><button class="dugme dugme--genis" data-eylem="talep-kabul">Kabul et ve paylaş</button>`),
      "talep-kabul": () => { katmanKapat(); bildirim("Bilgilerin Bulutfon ile paylaşıldı."); },
    } };
  },
});

/* ---------- FİRMA VİTRİNİ ---------- */
ekran("firma-vitrin", {
  ad: "Firma sayfası (vitrin)", alan: "aday",
  aciklama: "“Burada çalışmak nasıl bir şey?” sorusunu cevaplayan editoryal düzen. Fotoğraf gelene kadar tipografi ve blok/oda kodu taşır.",
  not: `<ul><li>Fotoğraf yokken sayfa eksik görünmez: büyük tipografi, ofis konumu ve gerçek bilgiler (çalışma modeli, yan haklar, teknolojiler) taşır (K12).</li>
    <li>Firma fotoğraf yüklediğinde galeri bölümü görünür; yüklemeden önce alt metin zorunludur.</li>
    <li>Firma profili en az logo, kısa tanıtım ve sektörle yayına girer.</li>
    <li>Tanıtım metni ve sayılar örnektir; gerçek metni firma kurulum sihirbazında yazacak.</li></ul>`,
  ciz(param, c) {
    const id = FIRMALAR[param] ? param : "netinternet", f = FIRMALAR[id];
    const acik = ILANLAR.filter((i) => i.firma === id && kalanGun(i.son) >= 0);
    const html = `${adayUst(c, false)}<main class="fv">
      <header class="fv-bas"><div class="fv-bas-ic">${kareLogo(id, c === "mobil" ? 64 : 96)}
        <div><p class="ust-etiket">${kac(f.sektor)}</p><h1 class="b1 fv-ad">${kac(f.ad)}</h1><p class="ikincil">${kac(f.unvan)}</p></div></div>
        <dl class="fv-gercekler"><div><dt>Teknokent’teki yeri</dt><dd>${kac(f.konum)}</dd></div><div><dt>Çalışma modeli</dt><dd>Ofiste, hibrit</dd></div><div><dt>Açık ilan</dt><dd>${acik.length}</dd></div><div><dt>Web</dt><dd><a href="#">${kac(f.web)}</a></dd></div></dl></header>
      <div class="fv-govde">
        <section class="fv-tanitim">${id === "netinternet" ? `<p class="fv-giris">Denizli’den hizmet veren bir barındırma ve veri merkezi şirketiyiz. Sunucularımız da ekibimiz de Teknokent’te. ${ornek("örnek metin")}</p>
          <p>Ekip; sistem yöneticileri, yazılımcılar ve 7/24 destek ekibinden oluşuyor. Yeni gelen arkadaşlar ilk ay bir mentorla çalışıyor. Stajyerlerimiz gerçek sunucularda, gözetim altında iş yapıyor.</p>`
          : `<p class="fv-giris">${kac(f.ad)}, Pamukkale Teknokent’te ${kac(f.sektor.toLocaleLowerCase("tr"))} alanında çalışan bir firma. ${ornek("örnek metin")}</p><p class="ikincil">Tanıtım metnini firma kurulum sihirbazında kendisi yazacak.</p>`}</section>
        <section class="fv-blok"><h2 class="b3 kare-bas">Burada çalışmak</h2><dl class="ozet-dl"><div><dt>Yan haklar</dt><dd>${kac([...new Set(acik.flatMap((i) => i.yanHak))].join(", ") || "—")}</dd></div><div><dt>Teknolojiler</dt><dd>${kac([...new Set(acik.flatMap((i) => i.zorunlu.concat(i.tercih)))].join(", ") || "—")}</dd></div><div><dt>Çalışan sayısı</dt><dd>50–99 ${ornek()}</dd></div></dl></section>
        <section class="fv-blok"><h2 class="b3 kare-bas">Açık ilanlar</h2><div class="ilan-listesi">${acik.map((i) => ilanSatiri(i)).join("")}</div><p class="kucuk ikincil">Bu yıl kapanan ilan: 6</p></section>
        <section class="fv-blok fv-foto-yok"><h2 class="b3 kare-bas">Fotoğraflar</h2><p class="ikincil">Firma henüz ofis veya ekip fotoğrafı eklemedi. <span class="kucuk">(Bu bölüm canlı sitede fotoğraf yoksa hiç görünmez; prototipte yerini göstermek için duruyor.)</span></p></section>
      </div></main>${adayAlt()}`;
    return { html, eylemler: { kaydet: kaydetEylemi } };
  },
});

