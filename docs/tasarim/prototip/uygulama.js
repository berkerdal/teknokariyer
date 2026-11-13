/* TeknoKariyer prototip çekirdeği: yönlendirme, cihaz çerçevesi, yardımcılar, eşleşme hesabı. */
"use strict";

/* ---------- Yardımcılar ---------- */
const kac = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const tarihNesne = ([ay, gun]) => new Date(2026 + Math.floor(ay / 12), ay % 12, gun);
const tarihYaz = (t, yil = false) => { const d = Array.isArray(t) ? tarihNesne(t) : t; return `${d.getDate()} ${AYLAR[d.getMonth()]}${yil ? " " + d.getFullYear() : ""}`; };
const kalanGun = (t) => Math.round((tarihNesne(t) - BUGUN) / 86400000);
const sonTarihMetni = (ilan) => {
  const k = kalanGun(ilan.son);
  if (k < 0) return `<span class="ikincil">Süresi doldu</span>`;
  if (k <= 2) return `<span class="son-gun">Son ${k === 0 ? "gün" : k + " gün"}</span>`;
  return `${tarihYaz(ilan.son)}’a kadar`.replace("’a kadar", ekAKadar(tarihYaz(ilan.son)));
};
/* Türkçe ünlü uyumuyla “’a / ’e / ’ya / ’ye kadar” */
function ekAKadar(s) {
  const son = s.trim().split(" ").pop().toLowerCase();
  const unluler = son.match(/[aeıioöuü]/g) || ["a"];
  const sonUnlu = unluler[unluler.length - 1];
  const kalin = "aıou".includes(sonUnlu);
  const unluIleBiter = /[aeıioöuü]$/.test(son);
  return `’${unluIleBiter ? "y" : ""}${kalin ? "a" : "e"} kadar`;
}
const firmaAd = (id) => FIRMALAR[id].ad;
const ilanBul = (id) => ILANLAR.find((i) => i.id === Number(id));
const ikon = (ad, sinif = "") => `<svg class="ikon ${sinif}" aria-hidden="true"><use href="#i-${ad}"/></svg>`;
const ornek = (metin = "örnek") => `<span class="ornek">${kac(metin)}</span>`;
const kareLogo = (firmaId, boy = 48) => {
  /* Firma logosu gelene kadar: blok/oda kodu karosu. Fotoğraf veya baş harf avatarı yerine Teknokent'e özgü bilgi. */
  const k = FIRMALAR[firmaId].konum.replace(" Blok ", "").replace("Blok ", "");
  return `<span class="firma-karo" style="--boy:${boy}px" aria-hidden="true"><span>${kac(k)}</span></span>`;
};

/* ---------- Eşleşme: açıklanabilir, puansız ---------- */
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DENEYIM_SIRA = ["Öğrenci", "Yeni mezun", "1–3 yıl", "3–5 yıl", "5+ yıl"];
function eslesme(ilan, kisi) {
  const sahip = new Set(Object.keys(kisi.beceriler || {}).concat(kisi.beceri || []));
  const varZ = ilan.zorunlu.filter((b) => sahip.has(b));
  const eksikZ = ilan.zorunlu.filter((b) => !sahip.has(b));
  const varT = ilan.tercih.filter((b) => sahip.has(b));
  const satirlar = [];
  satirlar.push({ s: eksikZ.length === 0 ? "var" : "eksik", m: `Zorunlu ${ilan.zorunlu.length} becerinin ${varZ.length}’${ekSayi(varZ.length)} var` });
  if (varT.length) satirlar.push({ s: "var", m: `Tercih sebebi: ${varT.join(", ")}` });
  const modeller = kisi.modeller || [kisi.model];
  satirlar.push(modeller.includes(ilan.model)
    ? { s: "var", m: `${ilan.model} çalışma ${kisi === ADAY ? "tercihine" : "tercihiyle"} uyuyor` }
    : { s: "eksik", m: `İlan ${ilan.model.toLowerCase()}; ${kisi === ADAY ? "sen" : "aday"} ${modeller.join(" / ").toLowerCase()} tercih ${kisi === ADAY ? "ediyorsun" : "ediyor"}` });
  if (ilan.bolumler.length) {
    const b = kisi.bolum;
    satirlar.push(ilan.bolumler.includes(b) ? { s: "var", m: "Bölüm uyuyor" } : { s: "notr", m: `Bölüm tercih listesinde değil (${b})` });
  }
  const dIlan = DENEYIM_SIRA.indexOf(ilan.deneyim), dKisi = DENEYIM_SIRA.indexOf(kisi.deneyim);
  if (dIlan >= 0 && dKisi >= 0 && dKisi < dIlan) satirlar.push({ s: "eksik", m: `Deneyim: ilan ${ilan.deneyim} istiyor` });
  for (const [dil, sev] of ilan.dil) {
    const k = (kisi.diller || []).find((d) => d[0] === dil);
    const kSev = k ? k[1] : (kisi.dil || "").match(new RegExp(dil + " ([ABC][12])"))?.[1];
    if (!kSev) satirlar.push({ s: "eksik", m: `${dil} ${sev} isteniyor` });
    else if (CEFR.indexOf(kSev) >= CEFR.indexOf(sev)) satirlar.push({ s: "var", m: `${dil} ${kSev} (istenen ${sev})` });
    else satirlar.push({ s: "eksik", m: `${dil}: ${sev} isteniyor, ${kSev} var` });
  }
  const kisa = `Zorunlu ${ilan.zorunlu.length} becerinin ${varZ.length}’${ekSayi(varZ.length)} var` + (eksikZ.length ? ` · eksik: ${eksikZ.join(", ")}` : "");
  return { satirlar, kisa, varZ: varZ.length, eksikZ };
}
function ekSayi(n) { return ({ 0: "ı", 1: "i", 2: "si", 3: "ü", 4: "ü", 5: "i", 6: "sı", 7: "si", 8: "i", 9: "u" })[n % 10]; }
const eslesmeListe = (e) => `<ul class="eslesme">${e.satirlar.map((s) => `<li class="${s.s}">${kac(s.m)}</li>`).join("")}</ul>`;

/* ---------- Durum ---------- */
const durum = (k, metin) => `<span class="durum durum--${k}">${kac(metin || DURUM_ADI[k])}</span>`;

/* ---------- Ekran kaydı ve yönlendirme ---------- */
const EKRANLAR = {};
const GRUPLAR = [];
function ekran(id, tanim) { EKRANLAR[id] = { id, ...tanim }; }
function grup(ad, idler) { GRUPLAR.push({ ad, idler }); }

const DURUM = {
  cihaz: (() => { try { return localStorage.getItem("tk-cihaz") || null; } catch { return null; } })(),
  kaydedilen: new Set([3, 6]),
  formKirli: false,
  sayacBicimi: "aralik",
  basvuru: { cv: 0, onYazi: "", cevaplar: {}, havuz: false, aydinlatma: false, hatalar: [] },
  filtre: { tur: new Set(), model: new Set(), aile: new Set(), deneyim: new Set(), ucretli: false, ara: "" },
  firmaSecili: new Set(),
  basvuranSecili: "b1",
  basvuranDurum: Object.fromEntries(BASVURANLAR.map((b) => [b.id, b.durum])),
  onceki: null,
};
const eylemler = {};   // geçerli ekranın eylemleri
let simdiki = null;

function cihazVarsayilan() { return window.innerWidth < 760 ? "mobil" : "masaustu"; }
function cihaz() { return DURUM.cihaz || cihazVarsayilan(); }
function cihazAyarla(c) {
  DURUM.cihaz = c;
  try { localStorage.setItem("tk-cihaz", c); } catch { /* depolama kapalı olabilir */ }
  ciz();
}

function cozumle(hash) {
  const h = (hash || "").replace(/^#/, "") || "giris";
  if (EKRANLAR[h]) return { id: h, param: null };
  const m = h.match(/^(.*)-(\d+|[a-z0-9]+)$/);
  if (m && EKRANLAR[m[1]]) return { id: m[1], param: m[2] };
  return { id: "giris", param: null };
}

function git(hedef) {
  if (location.hash === "#" + hedef) ciz(); else location.hash = hedef;
}

window.addEventListener("hashchange", () => {
  const { id } = cozumle(location.hash);
  if (DURUM.formKirli && simdiki === "firma-ilan-yeni" && id !== "firma-ilan-yeni") {
    const hedef = location.hash;
    history.replaceState(null, "", "#firma-ilan-yeni");
    kaydedilmemisUyarisi(hedef);
    return;
  }
  ciz();
});

function kaydedilmemisUyarisi(hedef) {
  pencere(`<h2 class="b3">Kaydedilmemiş değişiklikler var</h2>
    <p>“Ücret aralığı” ve “Ön eleme soruları” bölümlerinde yaptığınız değişiklikler henüz kaydedilmedi. Sayfadan çıkarsanız bu değişiklikler kaybolur.</p>
    <div class="dugme-grubu"><button class="dugme" data-eylem-genel="kaydet-cik" data-hedef="${kac(hedef)}">Kaydet ve çık</button>
    <button class="dugme dugme--ikincil" data-eylem-genel="kapat">Sayfada kal</button>
    <button class="dugme dugme--sade" data-eylem-genel="vazgec-cik" data-hedef="${kac(hedef)}">Kaydetmeden çık</button></div>`);
}

/* ---------- Katmanlar (cihaz içinde) ---------- */
function katman() { return document.querySelector(".cihaz .katman"); }
function katmanKapat() { const k = katman(); if (k) k.innerHTML = ""; }
function altPanel(baslik, govde, ayak = "") {
  katman().innerHTML = `<div class="ortu" data-eylem-genel="kapat"></div>
    <div class="alt-panel" role="dialog" aria-modal="true" aria-label="${kac(baslik)}"><div class="tutamak"></div>
    <div class="bas"><h2 class="b3">${kac(baslik)}</h2><button class="ikon-dugme" data-eylem-genel="kapat" aria-label="Kapat">${ikon("kapat")}</button></div>
    <div class="govde">${govde}</div>${ayak ? `<div class="ayak">${ayak}</div>` : ""}</div>`;
  katman().querySelector(".alt-panel button, .alt-panel a")?.focus();
}
function pencere(govde) {
  katman().innerHTML = `<div class="ortu" data-eylem-genel="kapat"></div><div class="pencere" role="dialog" aria-modal="true">${govde}</div>`;
  katman().querySelector(".pencere button")?.focus();
}
let bildirimZaman;
function bildirim(metin, geriAl) {
  const k = katman();
  k.querySelector(".bildirim")?.remove();
  k.insertAdjacentHTML("beforeend", `<div class="bildirim" role="status">${kac(metin)}${geriAl ? ` <button data-eylem-genel="kapat">Geri al</button>` : ""}</div>`);
  clearTimeout(bildirimZaman);
  bildirimZaman = setTimeout(() => k.querySelector(".bildirim")?.remove(), 3600);
}

/* ---------- Çizim ---------- */
function ciz() {
  const { id, param } = cozumle(location.hash);
  const e = EKRANLAR[id];
  simdiki = id;
  for (const k of Object.keys(eylemler)) delete eylemler[k];
  const c = cihaz();
  const sonuc = e.ciz(param, c);
  document.title = `${e.ad} · TeknoKariyer Prototip`;

  /* yan menü */
  document.querySelectorAll(".pr-menu a").forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + id));
  document.querySelectorAll("[data-cihaz-sec]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cihazSec === c)));
  const secim = document.getElementById("pr-ekran-secim");
  if (secim) secim.value = id;

  document.getElementById("pr-baslik").textContent = e.ad;
  document.getElementById("pr-aciklama").innerHTML = e.aciklama || "";
  const sahne = document.getElementById("pr-sahne");
  const notAlan = document.getElementById("pr-not");

  if (e.belge) {
    sahne.className = "pr-sahne pr-sahne--belge";
    sahne.innerHTML = `<div class="tk belge">${sonuc.html}</div>`;
    document.querySelector(".pr-cihaz-sec").hidden = true;
  } else {
    document.querySelector(".pr-cihaz-sec").hidden = false;
    sahne.className = "pr-sahne";
    sahne.innerHTML = `<div class="cihaz cihaz--${c}" data-alan="${e.alan || "aday"}"><div class="tk ekran-kok" tabindex="-1">${sonuc.html}</div><div class="katman"></div></div>`;
    olcekle();
    sahne.querySelector(".ekran-kok").scrollTop = 0;
  }
  notAlan.innerHTML = e.not ? `<h2>Bu ekran neden böyle?</h2>${e.not}` : "";
  notAlan.hidden = !e.not;
  Object.assign(eylemler, sonuc.eylemler || {});
  sonuc.sonra?.(sahne);
}

function olcekle() {
  const sahne = document.getElementById("pr-sahne");
  const cihazEl = sahne.querySelector(".cihaz");
  if (!cihazEl) return;
  const genislik = cihazEl.classList.contains("cihaz--mobil") ? 390 : 1280;
  const alan = sahne.clientWidth - 2;
  const z = Math.min(1, alan / genislik);
  cihazEl.style.zoom = z < 1 ? String(Math.floor(z * 1000) / 1000) : "";
}
window.addEventListener("resize", olcekle);

/* ---------- Olaylar ---------- */
document.addEventListener("click", (olay) => {
  const git_ = olay.target.closest("[data-git]");
  if (git_) { olay.preventDefault(); katmanKapat(); git(git_.dataset.git); return; }
  const cs = olay.target.closest("[data-cihaz-sec]");
  if (cs) { cihazAyarla(cs.dataset.cihazSec); return; }
  const g = olay.target.closest("[data-eylem-genel]");
  if (g) {
    const a = g.dataset.eylemGenel;
    if (a === "kapat") katmanKapat();
    if (a === "kaydet-cik" || a === "vazgec-cik") { DURUM.formKirli = false; katmanKapat(); location.hash = g.dataset.hedef; }
    return;
  }
  const el = olay.target.closest("[data-eylem]");
  if (el && eylemler[el.dataset.eylem]) { olay.preventDefault(); eylemler[el.dataset.eylem](el, olay); }
});
document.addEventListener("input", (olay) => {
  const el = olay.target.closest("[data-girdi]");
  if (el && eylemler[el.dataset.girdi]) eylemler[el.dataset.girdi](el, olay);
});
document.addEventListener("change", (olay) => {
  const el = olay.target.closest("[data-degis]");
  if (el && eylemler[el.dataset.degis]) eylemler[el.dataset.degis](el, olay);
  if (olay.target.id === "pr-ekran-secim") git(olay.target.value);
});
document.addEventListener("keydown", (olay) => { if (olay.key === "Escape") katmanKapat(); });

/* ---------- Ortak parçalar ---------- */
const logoKompakt = (negatif = false) => `<img class="ust-logo" src="logo/logo-kompakt-${negatif ? "negatif" : "renkli"}.svg" alt="TeknoKariyer, Pamukkale Teknokent" width="150" height="26">`;

function adayUst(c, girisli = false, aktif = "") {
  if (c === "mobil") {
    return `<header class="a-ust"><a href="#ana-sayfa" data-git="ana-sayfa" class="a-ust-logo">${logoKompakt()}</a>
      ${girisli ? `<a class="a-ust-kisi" href="#aday-panel" data-git="aday-panel" aria-label="Hesabım: Elif Karaca">EK</a>` : `<a class="dugme dugme--sade dugme--kucuk" href="#aday-panel" data-git="aday-panel">Giriş</a>`}</header>`;
  }
  const m = (id, ad) => `<a href="#${id}" data-git="${id}" ${aktif === id ? 'aria-current="page"' : ""}>${ad}</a>`;
  return `<header class="a-ust"><div class="a-ust-ic">
    <a href="#ana-sayfa" data-git="ana-sayfa" class="a-ust-logo">${logoKompakt()}</a>
    <nav class="a-menu" aria-label="Ana menü">${m("ilanlar", "İlanlar")}${m("firma-vitrin-netinternet", "Firmalar")}${m("ilanlar-staj", "Staj")}${m("aday-havuz", "CV havuzu")}</nav>
    <div class="a-ust-sag"><a href="#firma-ana" data-git="firma-ana" class="a-firma-giris">Firma girişi</a>
    ${girisli ? `<a class="a-ust-kisi" href="#aday-panel" data-git="aday-panel" aria-label="Hesabım">EK</a><span class="kucuk">Elif Karaca</span>` : `<a class="dugme dugme--ikincil dugme--kucuk" href="#aday-panel" data-git="aday-panel">Giriş yap</a>`}</div>
  </div></header>`;
}
function adayAltMenu(aktif) {
  const m = (id, ad, ik) => `<a href="#${id}" data-git="${id}" ${aktif === id ? 'aria-current="page"' : ""}>${ikon(ik)}<span>${ad}</span></a>`;
  return `<nav class="a-alt-menu" aria-label="Hesap menüsü">${m("ilanlar", "İlanlar", "ara")}${m("aday-panel", "Başvurularım", "liste")}${m("aday-kaydedilen", "Kaydedilenler", "yer-imi")}${m("aday-profil", "Profil", "kisi")}</nav>`;
}
function adayAlt() {
  return `<footer class="a-alt"><div class="a-alt-ic">
    <p><strong>Pamukkale Teknokent</strong> · Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş.</p>
    <p class="ikincil">Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67 Pamukkale/Denizli · +90 258 215 50 01</p>
    <p class="a-alt-bag"><a href="#">KVKK aydınlatma metni</a><a href="#">Kullanım koşulları</a><a href="#">Sıkça sorulan sorular</a><a href="#">English</a></p>
  </div></footer>`;
}

/* İlan satırı (liste) */
function ilanSatiri(ilan, { secili = false, eslesmeGoster = false, hedef } = {}) {
  const f = FIRMALAR[ilan.firma];
  const kayitli = DURUM.kaydedilen.has(ilan.id);
  const tur = ilan.tur === "Staj" ? ilan.alt : ilan.alt;
  const ek = [ilan.model, ilan.tur === "İş" ? ilan.deneyim : null, ilan.ucretliStaj ? "Ücretli" : null, ilan.pau ? "PAÜ öncelikli" : null].filter(Boolean);
  return `<div class="ilan-satiri" ${secili ? 'aria-current="true"' : ""}>
    <a class="poz" href="#${hedef || "ilan-" + ilan.id}" data-git="${hedef || "ilan-" + ilan.id}">${kac(ilan.poz)}</a>
    <span class="firma">${kac(f.ad)} <span class="konum">· ${kac(f.konum)}</span></span>
    <button class="ikon-dugme kaydet" data-eylem="kaydet" data-id="${ilan.id}" aria-pressed="${kayitli}" aria-label="${kayitli ? "Kaydedilenlerden çıkar" : "İlanı kaydet"}: ${kac(ilan.poz)}">${ikon("yer-imi")}</button>
    <span class="alt"><span>${kac(tur)} · ${ek.map(kac).join(" · ")}</span><span>${sonTarihMetni(ilan)}</span></span>
    ${eslesmeGoster ? `<span class="eslesme-kisa">${kac(eslesme(ilan, ADAY).kisa)}</span>` : ""}
  </div>`;
}
function kaydetEylemi(el) {
  const id = Number(el.dataset.id);
  const k = DURUM.kaydedilen.has(id);
  k ? DURUM.kaydedilen.delete(id) : DURUM.kaydedilen.add(id);
  el.setAttribute("aria-pressed", String(!k));
  bildirim(k ? "Kaydedilenlerden çıkarıldı" : "İlan kaydedildi. Son başvuru tarihinden 2 gün önce hatırlatacağız.");
}

/* ---------- Açılış ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".pr-menu");
  const secim = document.getElementById("pr-ekran-secim");
  menu.innerHTML = GRUPLAR.map((g) => `<div class="pr-menu-grup"><p>${kac(g.ad)}</p><ul>${g.idler.map((id) =>
    `<li><a href="#${id}">${kac(EKRANLAR[id].ad)}</a></li>`).join("")}</ul></div>`).join("");
  secim.innerHTML = GRUPLAR.map((g) => `<optgroup label="${kac(g.ad)}">${g.idler.map((id) => `<option value="${id}">${kac(EKRANLAR[id].ad)}</option>`).join("")}</optgroup>`).join("");
  ciz();
});
