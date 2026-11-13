/* Prototip verisi. Firmalar Pamukkale Teknokent firma rehberinden gerçek kayıtlardır (unvan, sektör, blok/oda).
   İlanlar, kişiler, tanıtım metinleri ve tüm sayılar ÖRNEKTİR. Bugün: 13 Kasım 2026, Cuma. */
"use strict";

const BUGUN = new Date(2026, 10, 13);

const FIRMALAR = {
  kodpit:     { ad: "Kodpit Teknoloji", unvan: "Kodpit Teknoloji A.Ş.", sektor: "Yazılım", konum: "D Blok 208", web: "kodpit.com" },
  netinternet:{ ad: "Netinternet", unvan: "Netinternet Bilişim Teknolojileri A.Ş.", sektor: "Bilgisayar ve İletişim Teknolojileri", konum: "D Blok B01", web: "netinternet.com.tr" },
  ratel:      { ad: "Ratel Bilişim", unvan: "Ratel Bilişim Hizmetleri Ltd. Şti.", sektor: "Yazılım", konum: "D Blok 102" },
  bulutfon:   { ad: "Bulutfon", unvan: "Bulutfon Telekomünikasyon A.Ş.", sektor: "Telekomünikasyon", konum: "D Blok 212" },
  pinova:     { ad: "Pinova Elektronik", unvan: "Pinova Elektronik Mühendislik San. ve Tic. Ltd. Şti.", sektor: "Elektronik", konum: "B Blok G12" },
  senkron:    { ad: "Senkron Arge", unvan: "Senkron Arge Mühendislik Elektrik Elektronik San. ve Tic. Ltd. Şti.", sektor: "Elektronik", konum: "B Blok G11" },
  alternet:   { ad: "Alternet Yazılım", unvan: "Alternet Yazılım Bilgisayar Elektronik Eğitim Hizmetleri San. ve Tic. Ltd. Şti.", sektor: "Yazılım", konum: "D Blok Z01" },
  osteotech:  { ad: "Osteotech Medikal", unvan: "Osteotech Medikal Sağlık Teknolojileri San. Tic. Ltd. Şti.", sektor: "Medikal", konum: "C Blok G01" },
  argeplus:   { ad: "Argeplus", unvan: "Argeplus İleri Teknoloji Makine Sistemleri ve Danışmanlık San. ve Tic. Ltd. Şti.", sektor: "Makine ve Teçhizat İmalatı", konum: "B Blok G03" },
  evaporatif: { ad: "Evaporatif Soğutma", unvan: "Evaporatif Soğutma ve Isıtma Sistemleri Arge Teknoloji San. ve Tic. A.Ş.", sektor: "İklimlendirme", konum: "B Blok G15" },
  probox:     { ad: "3D Probox", unvan: "3D Probox Teknoloji Hizmetleri San. Tic. A.Ş.", sektor: "Yazılım", konum: "B Blok G19" },
  arelsis:    { ad: "Arelsis Mühendislik", unvan: "Arelsis Mühendislik Arge San. ve Tic. Ltd. Şti.", sektor: "Elektronik", konum: "B Blok 103" },
  april:      { ad: "April Yazılım", unvan: "April Yazılım Bilişim Eğitim Dan. Hiz. San. ve Tic. Ltd. Şti.", sektor: "Yazılım", konum: "B Blok Z14" },
};

/* İlan: tarih alanları [ay(0-11), gün] olarak 2026 yılına göredir; ay 12+ → 2027. */
const ILANLAR = [
  { id: 1, firma: "pinova", poz: "Gömülü Yazılım Mühendisi", tur: "İş", alt: "Tam zamanlı", aile: "Gömülü sistemler", model: "Ofiste",
    deneyim: "1–3 yıl", egitim: "Lisans", bolumler: ["Elektrik-Elektronik Mühendisliği", "Bilgisayar Mühendisliği"],
    zorunlu: ["C", "STM32", "RTOS", "Git"], tercih: ["CAN bus", "Python"], dil: [["İngilizce", "B1"]],
    yayin: [10, 10], son: [11, 12], basvuru: 23, goruntulenme: 412, pozSayi: 1, ucret: null,
    is: ["Endüstriyel sensör kartlarımız için STM32 tabanlı yazılım geliştireceksin.", "Donanım ekibiyle birlikte prototipleri masanın yanında test edeceksin.", "Sahadan gelen hata kayıtlarını inceleyip düzeltmeleri yayına alacaksın."],
    nitelik: ["Elektrik-Elektronik veya Bilgisayar Mühendisliği lisans mezunu", "C ile en az bir yıllık gömülü sistem deneyimi", "Bir RTOS (FreeRTOS, Zephyr vb.) ile çalışmış olmak"],
    yanHak: ["Servis (Denizli merkez)", "Yemek kartı", "Özel sağlık sigortası"], sorular: 2 },
  { id: 2, firma: "netinternet", poz: "Ağ ve Sistem Stajyeri", tur: "Staj", alt: "Uzun dönem staj", aile: "Sistem ve ağ yönetimi", model: "Ofiste",
    deneyim: "Öğrenci", egitim: "Önlisans veya lisans", bolumler: ["Bilgisayar Mühendisliği", "Bilgisayar Programcılığı", "Yönetim Bilişim Sistemleri"],
    zorunlu: ["Linux", "TCP/IP"], tercih: ["Bash", "Ansible"], dil: [],
    yayin: [10, 1], son: [10, 15], basvuru: 61, goruntulenme: 980, pozSayi: 3, ucretliStaj: true, pau: true,
    staj: { donem: "Şubat–Haziran 2027 (bahar dönemi)", sgk: "Okul karşılıyor", belge: "İmzalanıyor" },
    is: ["Veri merkezimizdeki Linux sunucuların günlük bakımına katılacaksın.", "İzleme uyarılarını takip edip ilk müdahaleyi ekiple birlikte yapacaksın."],
    nitelik: ["Bilgisayar Mühendisliği, Bilgisayar Programcılığı veya YBS öğrencisi", "Haftada en az 3 tam gün çalışabilecek olmak"],
    yanHak: ["Staj ücreti", "Yemek"], sorular: 1 },
  { id: 3, firma: "kodpit", poz: "Flutter Geliştirici", tur: "İş", alt: "Tam zamanlı", aile: "Yazılım geliştirme", model: "Hibrit",
    deneyim: "1–3 yıl", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği", "Yazılım Mühendisliği"],
    zorunlu: ["Dart", "Flutter", "REST API", "Git"], tercih: ["Firebase", "CI/CD"], dil: [["İngilizce", "B1"]],
    yayin: [10, 6], son: [11, 20], basvuru: 14, goruntulenme: 356, pozSayi: 1, ucret: "45.000–55.000 ₺ net / ay",
    is: ["Müşterilerimiz için geliştirdiğimiz mobil uygulamalarda Flutter ile yeni ekranlar ve özellikler yazacaksın.", "Kod incelemelerine katılıp test kapsamını artıracaksın."],
    nitelik: ["Flutter ile yayında en az bir uygulama", "REST servisleriyle çalışma deneyimi"],
    yanHak: ["Haftada 2 gün uzaktan", "Eğitim bütçesi", "Yemek kartı"], sorular: 2 },
  { id: 4, firma: "ratel", poz: "Destek Mühendisi", tur: "İş", alt: "Tam zamanlı", aile: "Teknik destek", model: "Ofiste",
    deneyim: "Yeni mezun", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği", "Yönetim Bilişim Sistemleri"],
    zorunlu: ["SQL", "Windows Server"], tercih: ["PowerShell"], dil: [],
    yayin: [10, 3], son: [12, 5], basvuru: 37, goruntulenme: 640, pozSayi: 2,
    is: ["Kurumsal müşterilerimizin yazılım kurulumlarını ve sorunlarını uzaktan çözeceksin."], nitelik: ["SQL sorgularını okuyup yazabilmek"],
    yanHak: ["Servis", "Yemek"], sorular: 0 },
  { id: 5, firma: "senkron", poz: "Elektronik Tasarım Stajyeri", tur: "Staj", alt: "Zorunlu staj", aile: "Donanım ve elektronik", model: "Ofiste",
    deneyim: "Öğrenci", egitim: "Lisans", bolumler: ["Elektrik-Elektronik Mühendisliği"],
    zorunlu: ["Devre analizi", "KiCad"], tercih: ["Altium"], dil: [],
    yayin: [10, 9], son: [10, 28], basvuru: 19, goruntulenme: 301, pozSayi: 2, ucretliStaj: true, pau: true,
    staj: { donem: "Yaz 2027, 30 iş günü", sgk: "Okul karşılıyor", belge: "İmzalanıyor" },
    is: ["Güç elektroniği kartlarının şematik ve baskı devre çizimlerine katılacaksın."], nitelik: ["Elektrik-Elektronik Mühendisliği 3. veya 4. sınıf öğrencisi"],
    yanHak: ["Staj ücreti", "Yemek"], sorular: 1 },
  { id: 6, firma: "bulutfon", poz: "Backend Geliştirici (Go)", tur: "İş", alt: "Tam zamanlı", aile: "Yazılım geliştirme", model: "Uzaktan",
    deneyim: "3–5 yıl", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği"],
    zorunlu: ["Go", "PostgreSQL", "Docker"], tercih: ["Kubernetes", "SIP"], dil: [["İngilizce", "B2"]],
    yayin: [10, 12], son: [12, 2], basvuru: 8, goruntulenme: 205, pozSayi: 1,
    is: ["Bulut santral altyapımızın çağrı yönlendirme servislerini Go ile geliştireceksin."], nitelik: ["Go ile üretimde en az 2 yıl"],
    yanHak: ["Tamamen uzaktan", "Ekipman desteği"], sorular: 2 },
  { id: 7, firma: "osteotech", poz: "Ar-Ge Mühendisi (Medikal Cihaz)", tur: "İş", alt: "Tam zamanlı", aile: "Makine tasarımı", model: "Ofiste",
    deneyim: "1–3 yıl", egitim: "Lisans", bolumler: ["Makine Mühendisliği", "Biyomedikal Mühendisliği"],
    zorunlu: ["SolidWorks", "ISO 13485"], tercih: ["Sonlu elemanlar analizi"], dil: [["İngilizce", "B2"]],
    yayin: [10, 4], son: [11, 18], basvuru: 11, goruntulenme: 233, pozSayi: 1,
    is: ["Ortopedik implant tasarım dosyalarının hazırlanmasına katılacaksın."], nitelik: ["Medikal cihaz mevzuatına ilgi"], yanHak: ["Servis", "Yemek"], sorular: 1 },
  { id: 8, firma: "argeplus", poz: "Makine Tasarım Mühendisi", tur: "İş", alt: "Tam zamanlı", aile: "Makine tasarımı", model: "Ofiste",
    deneyim: "3–5 yıl", egitim: "Lisans", bolumler: ["Makine Mühendisliği"],
    zorunlu: ["SolidWorks", "GD&T"], tercih: ["ANSYS"], dil: [],
    yayin: [9, 31], son: [10, 30], basvuru: 15, goruntulenme: 288, pozSayi: 1,
    is: ["Tekstil makineleri için özel mekanizma tasarımları yapacaksın."], nitelik: ["Üretime girmiş tasarım deneyimi"], yanHak: ["Servis"], sorular: 0 },
  { id: 9, firma: "probox", poz: "3D Görselleştirme Stajyeri", tur: "Staj", alt: "Gönüllü staj", aile: "Tasarım", model: "Hibrit",
    deneyim: "Öğrenci", egitim: "Önlisans veya lisans", bolumler: [],
    zorunlu: ["Blender"], tercih: ["Unity"], dil: [],
    yayin: [10, 11], son: [11, 10], basvuru: 9, goruntulenme: 190, pozSayi: 1, ucretliStaj: false,
    staj: { donem: "Aralık 2026–Şubat 2027", sgk: "Firma karşılıyor", belge: "İmzalanmıyor" },
    is: ["Ürün tanıtımları için 3B sahneler hazırlayacaksın."], nitelik: ["Blender portfolyosu"], yanHak: ["Esnek saat"], sorular: 1 },
  { id: 10, firma: "alternet", poz: "Front-end Geliştirici (Yarı Zamanlı)", tur: "İş", alt: "Yarı zamanlı", aile: "Yazılım geliştirme", model: "Hibrit",
    deneyim: "Öğrenci", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği"],
    zorunlu: ["React", "TypeScript"], tercih: ["Tailwind CSS"], dil: [],
    yayin: [10, 8], son: [11, 22], basvuru: 26, goruntulenme: 402, pozSayi: 1,
    is: ["Eğitim platformumuzun arayüzünde haftada 20 saat çalışacaksın."], nitelik: ["React ile yapılmış bir proje"], yanHak: ["Esnek saat"], sorular: 1 },
  { id: 11, firma: "kodpit", poz: "Yazılım Stajyeri", tur: "Staj", alt: "Uzun dönem staj", aile: "Yazılım geliştirme", model: "Hibrit",
    deneyim: "Öğrenci", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği", "Yazılım Mühendisliği", "Yönetim Bilişim Sistemleri"],
    zorunlu: ["Git"], tercih: ["Python", "Flutter"], dil: [],
    yayin: [10, 2], son: [11, 6], basvuru: 38, goruntulenme: 720, pozSayi: 2, ucretliStaj: true, pau: true,
    staj: { donem: "Şubat–Haziran 2027", sgk: "Okul karşılıyor", belge: "İmzalanıyor" },
    is: ["Bir mentorla eşleşip gerçek müşteri projelerinde küçük işler üstleneceksin."], nitelik: ["3. veya 4. sınıf öğrencisi"], yanHak: ["Staj ücreti", "Yemek kartı"], sorular: 1 },
  { id: 12, firma: "evaporatif", poz: "Satış ve Pazarlama Uzmanı", tur: "İş", alt: "Tam zamanlı", aile: "Satış ve pazarlama", model: "Ofiste",
    deneyim: "3–5 yıl", egitim: "Lisans", bolumler: [],
    zorunlu: ["CRM", "Teklif hazırlama"], tercih: ["İhracat"], dil: [["İngilizce", "B2"]],
    yayin: [10, 5], son: [10, 19], basvuru: 0, goruntulenme: 96, pozSayi: 1,
    is: ["Endüstriyel soğutma sistemlerimizin yurt içi satışlarını yöneteceksin."], nitelik: ["B2B satış deneyimi"], yanHak: ["Araç", "Prim"], sorular: 0 },
  { id: 13, firma: "arelsis", poz: "Donanım Test Mühendisi", tur: "İş", alt: "Tam zamanlı", aile: "Test ve kalite", model: "Ofiste",
    deneyim: "1–3 yıl", egitim: "Lisans", bolumler: ["Elektrik-Elektronik Mühendisliği"],
    zorunlu: ["Osiloskop", "Test planı"], tercih: ["LabVIEW", "Python"], dil: [],
    yayin: [10, 7], son: [11, 14], basvuru: 6, goruntulenme: 150, pozSayi: 1,
    is: ["Seri üretim öncesi kartların doğrulama testlerini yürüteceksin."], nitelik: ["Ölçüm cihazlarıyla çalışma deneyimi"], yanHak: ["Yemek"], sorular: 0 },
  { id: 14, firma: "april", poz: "Veri Analisti", tur: "İş", alt: "Tam zamanlı", aile: "Veri", model: "Uzaktan",
    deneyim: "1–3 yıl", egitim: "Lisans", bolumler: ["İstatistik", "Endüstri Mühendisliği", "Bilgisayar Mühendisliği"],
    zorunlu: ["SQL", "Python"], tercih: ["Power BI"], dil: [["İngilizce", "B1"]],
    yayin: [10, 12], son: [11, 27], basvuru: 4, goruntulenme: 120, pozSayi: 1,
    is: ["Eğitim kurumu müşterilerimizin verisinden raporlar hazırlayacaksın."], nitelik: ["SQL ile analiz deneyimi"], yanHak: ["Uzaktan çalışma"], sorular: 1 },
  { id: 15, firma: "netinternet", poz: "DevOps Mühendisi", tur: "İş", alt: "Tam zamanlı", aile: "Sistem ve ağ yönetimi", model: "Hibrit",
    deneyim: "3–5 yıl", egitim: "Lisans", bolumler: ["Bilgisayar Mühendisliği"],
    zorunlu: ["Linux", "Kubernetes", "Terraform"], tercih: ["Ansible"], dil: [["İngilizce", "B1"]],
    yayin: [10, 13], son: [12, 10], basvuru: 2, goruntulenme: 48, pozSayi: 1,
    is: ["Barındırma altyapımızın otomasyonunu geliştireceksin."], nitelik: ["Kubernetes ile üretim deneyimi"], yanHak: ["Hibrit çalışma", "Yemek"], sorular: 1 },
];

/* Giriş yapmış örnek aday (kurgusal kişi) */
const ADAY = {
  ad: "Elif Karaca", eposta: "elif.karaca@ornek.com",
  okul: "Pamukkale Üniversitesi", bolum: "Bilgisayar Mühendisliği", sinif: "4. sınıf", mezuniyet: "Haziran 2027",
  deneyim: "Öğrenci", tanitim: "Gömülü sistemlere ve Linux'a ilgi duyan, Denizli'de staj ve ilk iş arayan bir öğrenciyim.",
  beceriler: { "C": "Orta", "Python": "Orta", "Git": "İyi", "Linux": "Orta", "STM32": "Başlangıç", "RTOS": "Başlangıç", "React": "Başlangıç", "SQL": "Başlangıç" },
  diller: [["İngilizce", "B2"]], modeller: ["Ofiste", "Hibrit"], sehir: "Denizli",
  cvler: [{ ad: "CV – Türkçe genel", dosya: "elif-karaca-cv-tr.pdf", boy: "212 KB", tarih: "2 Kasım" },
          { ad: "CV – English", dosya: "elif-karaca-cv-en.pdf", boy: "198 KB", tarih: "2 Kasım" }],
  eksik: [["Sertifikalar", "aday-profil"], ["Portfolyo bağlantısı (GitHub)", "aday-profil"]],
  havuz: { durum: "Fırsatlara açığım", rizaBitis: "2 Kasım 2027", goruntuleyen30: 4, gizli: [] },
};

/* Adayın başvuruları */
const BASVURULARIM = [
  { ilan: 1, tarih: "11 Kasım", durum: "inceleniyor", adim: 1 },
  { ilan: 2, tarih: "12 Kasım", durum: "alindi", adim: 0 },
  { ilan: 11, tarih: "4 Kasım", durum: "gorusme", adim: 2, not: "Görüşme için 3 zaman önerildi. Birini seçmen bekleniyor." },
  { ilan: 4, tarih: "9 Ekim", durum: "olumsuz", adim: 4, not: "Ratel Bilişim bu pozisyon için başka bir adayla ilerlemeye karar verdi." },
];

const DURUM_ADI = { taslak: "Taslak", onayda: "Onayda", yayinda: "Yayında", duraklatildi: "Duraklatıldı", "suresi-doldu": "Süresi doldu",
  kapandi: "Kapandı", reddedildi: "Düzeltme bekliyor", alindi: "Alındı", inceleniyor: "İnceleniyor", gorusme: "Görüşme", teklif: "Teklif",
  olumlu: "Olumlu", olumsuz: "Olumsuz", "geri-cekti": "Aday geri çekti" };
const BASVURU_ADIMLARI = ["Alındı", "İnceleniyor", "Görüşme", "Teklif", "Sonuç"];

/* Firma paneli: giriş yapan Kodpit kullanıcısı (kurgusal) */
const FIRMA_KULLANICI = { ad: "Selin Aydemir", rol: "İK sorumlusu", firma: "kodpit" };
const FIRMA_ILANLARI = [
  { id: 3, durum: "yayinda", yeni: 3, toplam: 14 },
  { id: 11, durum: "yayinda", yeni: 5, toplam: 38 },
  { id: 101, poz: "Kıdemli Backend Geliştirici", durum: "onayda", gonderim: "Bugün 09:40", tahmini: "Pazartesi 17:00'ye kadar", toplam: 0 },
  { id: 102, poz: "UI/UX Tasarımcı", durum: "taslak", kayit: "Dün 18:12", toplam: 0 },
  { id: 103, poz: "QA Stajyeri", durum: "reddedildi", gerekce: "İlanda yaş sınırı var (“25 yaşından küçük”). Yaş, cinsiyet ve medeni hâl şartı yazılamaz.", toplam: 0 },
  { id: 104, poz: "Front-end Geliştirici", durum: "duraklatildi", son: "30 Kasım", toplam: 22 },
  { id: 105, poz: "iOS Geliştirici", durum: "kapandi", neden: "Pozisyon doldu", kapanis: "3 Ekim", toplam: 41 },
  { id: 106, poz: "Proje Yöneticisi", durum: "suresi-doldu", kapanis: "28 Ekim", toplam: 9 },
];

/* Flutter Geliştirici ilanına gelen başvurular (kurgusal kişiler) */
const BASVURANLAR = [
  { id: "b1", ad: "Mert Aydoğan", okul: "Pamukkale Üniversitesi", bolum: "Bilgisayar Mühendisliği", mezun: "2024", deneyim: "2 yıl",
    beceri: ["Dart", "Flutter", "REST API", "Git", "Firebase"], model: "Hibrit", dil: "İngilizce B2", tarih: "Bugün 10:14", durum: "alindi", kaynak: "LinkedIn",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "Play Store: Denizli Otobüs Saatleri (kişisel proje, 10 bin+ indirme)"], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Evet"]], puan: 0, yeni: true },
  { id: "b2", ad: "Zeynep Kocabaş", okul: "Dokuz Eylül Üniversitesi", bolum: "Bilgisayar Mühendisliği", mezun: "2023", deneyim: "3 yıl",
    beceri: ["Dart", "Flutter", "REST API", "Git", "CI/CD"], model: "Hibrit", dil: "İngilizce C1", tarih: "Dün 21:03", durum: "alindi", kaynak: "Portal araması",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "İki kurumsal uygulama; bağlantılar CV'de."], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Evet"]], puan: 0, yeni: true },
  { id: "b3", ad: "Burak Er", okul: "Süleyman Demirel Üniversitesi", bolum: "Bilgisayar Mühendisliği", mezun: "2025", deneyim: "1 yıl",
    beceri: ["Dart", "Flutter", "Git"], model: "Uzaktan", dil: "İngilizce B1", tarih: "Dün 15:40", durum: "alindi", kaynak: "Google",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "Henüz yok, staj projesi GitHub'da."], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Hayır"]], puan: 0, yeni: true },
  { id: "b4", ad: "Ayşe Nur Demirtaş", okul: "Pamukkale Üniversitesi", bolum: "Yönetim Bilişim Sistemleri", mezun: "2024", deneyim: "1,5 yıl",
    beceri: ["Dart", "Flutter", "REST API", "Firebase"], model: "Ofiste", dil: "İngilizce B1", tarih: "10 Kasım", durum: "inceleniyor", kaynak: "Portal araması",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "Kafe sipariş uygulaması (App Store)"], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Evet"]], puan: 4 },
  { id: "b5", ad: "Amira Haddad", okul: "Ege Üniversitesi", bolum: "Yazılım Mühendisliği", mezun: "2024", deneyim: "2 yıl",
    beceri: ["Dart", "Flutter", "REST API", "Git", "Firebase", "CI/CD"], model: "Hibrit", dil: "İngilizce C1 · Türkçe B2", tarih: "8 Kasım", durum: "gorusme", kaynak: "Doğrudan bağlantı",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "github.com/… (3 yayında uygulama)"], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Evet"]], puan: 5 },
  { id: "b6", ad: "Kaan Yıldırım", okul: "Uşak Üniversitesi", bolum: "Bilgisayar Mühendisliği", mezun: "2025", deneyim: "6 ay",
    beceri: ["Flutter", "Git"], model: "Hibrit", dil: "İngilizce A2", tarih: "7 Kasım", durum: "olumsuz", kaynak: "Portal araması",
    cevaplar: [["Flutter ile yayında olan bir uygulamanızın bağlantısını paylaşır mısınız?", "Yok"], ["Haftada 2 gün ofiste çalışabilir misiniz?", "Evet"]], puan: 2 },
];

/* CV havuzu (firma görür): ad ve iletişim aday onay verene kadar gizli */
const HAVUZ = [
  { kod: "A-1042", ozet: "Bilgisayar Mühendisliği · Pamukkale Üniversitesi · 2025 mezunu", deneyim: "1 yıl", beceri: ["Flutter", "Dart", "Firebase", "Git"], tercih: "Hibrit · Denizli", baslama: "Hemen", gorunurluk: "Aktif iş arıyor", dil: "İngilizce B2" },
  { kod: "A-0988", ozet: "Yazılım Mühendisliği · Ege Üniversitesi · 2023 mezunu", deneyim: "3 yıl", beceri: ["Flutter", "Kotlin", "REST API", "CI/CD"], tercih: "Uzaktan · İzmir, taşınmaya açık", baslama: "1 ay içinde", gorunurluk: "Fırsatlara açık", dil: "İngilizce C1" },
  { kod: "A-1107", ozet: "Bilgisayar Programcılığı · PAÜ Denizli Teknik Bilimler MYO · 2024 mezunu", deneyim: "2 yıl", beceri: ["Flutter", "Dart", "SQLite"], tercih: "Ofiste · Denizli", baslama: "Hemen", gorunurluk: "Aktif iş arıyor", dil: "İngilizce A2" },
  { kod: "A-0731", ozet: "Bilgisayar Mühendisliği · ODTÜ · 2021 mezunu", deneyim: "5 yıl", beceri: ["Flutter", "Swift", "Dart", "GraphQL"], tercih: "Hibrit · Denizli'ye dönmek istiyor", baslama: "2 ay içinde", gorunurluk: "Fırsatlara açık", dil: "İngilizce C1" },
];

/* Yönetim paneli */
const ONAY_KUYRUGU = [
  { firma: "kodpit", poz: "Kıdemli Backend Geliştirici", bekleme: "5 saat", kacinci: 3, risk: null },
  { firma: "osteotech", poz: "Kalite Güvence Uzmanı", bekleme: "9 saat", kacinci: 2, risk: null },
  { firma: "evaporatif", poz: "Saha Servis Teknisyeni", bekleme: "1 gün 2 saat", kacinci: 1, risk: "1 iş günü hedefi aşıldı" },
  { firma: "argeplus", poz: "Makine Ressamı (Esaslı değişiklik: ücret)", bekleme: "3 saat", kacinci: null, risk: null },
];
const KURULUM = { toplam: 121, asamalar: [["İskelet", 121], ["Davet gönderildi", 64], ["Devralındı", 41], ["Profil tamam", 29], ["İlk ilan verildi", 17]],
  yetkiliEksik: 38,
  takip: [
    { firma: "Arslan Arge ve Elektrik Makineleri", asama: "Davet gönderildi", gun: 16, son: "3. hatırlatma: 10 Kasım", not: "" },
    { firma: "Çiçek Makine Tekstil Arge", asama: "Davet gönderildi", gun: 15, son: "3. hatırlatma: 11 Kasım", not: "Aradım, yetkili izinde; 18 Kasım'da dönecek." },
    { firma: "Mmm Mutlu Medikal Mühendislik", asama: "Devralındı · sihirbaz 3/7", gun: 14, son: "3. hatırlatma: 12 Kasım", not: "" },
    { firma: "Sigma 20 Elektronik", asama: "Devralındı · sihirbaz 5/7", gun: 21, son: "3. hatırlatma: 5 Kasım", not: "Logo bekleniyor." },
  ] };

/* Ortak taksonomi örneği (kısaltılmış) */
const POZ_AILELERI = ["Yazılım geliştirme", "Gömülü sistemler", "Donanım ve elektronik", "Makine tasarımı", "Veri", "Tasarım", "Test ve kalite", "Sistem ve ağ yönetimi", "Teknik destek", "Satış ve pazarlama", "İdari ve mali işler"];
