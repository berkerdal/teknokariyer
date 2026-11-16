/**
 * E-posta şablonları ve aynı içerikte düz metin. Hitap: adaya “sen”, firma ve kurum kullanıcısına “siz” (K9).
 *
 * Düzen: lacivert üst bant (TeknoKariyer negatif logosu), beyaz kart, gece zeminli kurumsal alt bilgi (Teknokent ve TTO
 * logoları, adres, bağlantılar). E-posta istemcileri için tablo tabanlı ve satır içi stillidir; Outlook dahil çalışır.
 * Logolar PNG'dir (istemciler SVG göstermez) ve `public/eposta/` altından sunulur: `tools/kimlik/eposta_png.cjs`.
 * Görseller engellenirse alt metinler zemin üzerinde okunur kalır.
 */
import { KURUM } from './kurum'

export const siteAdresi = () => (process.env.SITE_ADRESI || 'http://localhost:3000').replace(/\/$/, '')

const kac = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export interface Eposta {
  konu: string
  html: string
  metin: string
  /** Metin ekler (ör. takvim dosyası) */
  ekler?: Array<{ dosyaAdi: string; icerik: string; tur: string }>
}

export type EpostaHitabi = 'sen' | 'siz'

const R = {
  zemin: '#F7F6F3',
  yuzey: '#FFFFFF',
  cizgi: '#E4E1DA',
  metin: '#1E1E1C',
  metin2: '#5B5852',
  lacivert: '#2155AD',
  camgobegi: '#05A1E6',
  gece: '#13284F',
  geceCizgi: '#1C3666',
  geceMetin: '#C9D3E6',
  geceMetin2: '#9AA9C6',
}
const YAZI = "'Source Sans 3','Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function altBilgi(site: string, hitap: EpostaHitabi) {
  const bag = (ad: string, adres: string) => `<a href="${kac(adres)}" style="color:#FFFFFF;text-decoration:none">${kac(ad)}</a>`
  const neden =
    hitap === 'sen'
      ? `Bu e-postayı TeknoKariyer hesabınla ilgili bir işlem yapıldığı için aldın. Kişisel verilerinle ilgili soruların için ${KURUM.kvkkEposta} adresine yazabilirsin.`
      : `Bu e-postayı TeknoKariyer hesabınızla ilgili bir işlem yapıldığı için aldınız. Kişisel verilerle ilgili sorularınız için ${KURUM.kvkkEposta} adresine yazabilirsiniz.`
  const baglantilar =
    hitap === 'sen'
      ? [bag('İlanlar', `${site}/ilanlar`), bag('Hesabım', `${site}/hesabim`), bag('Aydınlatma metni', `${site}/metin/aday-aydinlatma`), bag('pauteknokent.com.tr', KURUM.web)]
      : [bag('İlanlar', `${site}/ilanlar`), bag('Firma girişi', `${site}/giris?firma=1`), bag('pauteknokent.com.tr', KURUM.web)]
  return `<tr><td style="background:${R.gece};padding:28px 32px 8px" class="ic">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding:0 20px 0 0;border-right:1px solid ${R.geceCizgi}"><a href="${KURUM.web}"><img src="${site}/eposta/teknokent-negatif.png" width="120" height="63" alt="Pamukkale Teknokent" style="display:block;border:0;color:#FFFFFF;font:700 14px ${YAZI}"></a></td>
<td style="padding:0 0 0 20px"><img src="${site}/eposta/tto-beyaz.png" width="56" height="56" alt="Pamukkale Teknoloji Transfer Ofisi" style="display:block;border:0;color:#FFFFFF;font:12px ${YAZI}"></td>
</tr></table>
</td></tr>
<tr><td style="background:${R.gece};padding:16px 32px 0;color:${R.geceMetin};font:14px/20px ${YAZI}" class="ic">
<strong style="color:#FFFFFF">${kac(KURUM.unvan)}</strong><br>${kac(KURUM.adres)}<br>
<a href="tel:${KURUM.telefonHam}" style="color:${R.geceMetin};text-decoration:none">${kac(KURUM.telefon)}</a> &middot; <a href="mailto:${KURUM.eposta}" style="color:${R.geceMetin};text-decoration:none">${KURUM.eposta}</a>
</td></tr>
<tr><td style="background:${R.gece};padding:16px 32px 0;font:600 14px/22px ${YAZI}" class="ic">
${baglantilar.join('<span style="color:' + R.geceMetin2 + '"> &nbsp;&middot;&nbsp; </span>')}
</td></tr>
<tr><td style="background:${R.gece};padding:16px 32px 28px;color:${R.geceMetin2};font:13px/18px ${YAZI}" class="ic">
<div style="border-top:1px solid ${R.geceCizgi};padding-top:16px">${kac(neden)}</div>
</td></tr>`
}

/**
 * Başlık, paragraflar, tek bir eylem düğmesi ve düğmeden sonraki notlar.
 * İlk paragraf “Merhaba …” selamıysa ön izleme metni ikinci paragraftan alınır.
 */
export function eposta(
  konu: string,
  paragraflar: string[],
  eylem?: { metin: string; adres: string },
  son: string[] = [],
  hitap: EpostaHitabi = 'sen',
): Eposta {
  const site = siteAdresi()
  const p = (x: string) => `<p style="margin:0 0 16px">${kac(x)}</p>`
  const onizleme = paragraflar.find((x) => !/^Merhaba\b/.test(x)) ?? konu
  const dugme = eylem
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="background:${R.lacivert};border-radius:4px">
<a href="${kac(eylem.adres)}" style="display:inline-block;padding:13px 22px;color:#FFFFFF;font:700 16px/20px ${YAZI};text-decoration:none;border-radius:4px">${kac(eylem.metin)}</a>
</td></tr></table>`
    : ''
  const yedek = eylem
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:20px;color:${R.metin2}">${hitap === 'sen' ? 'Düğme çalışmazsa bu adresi tarayıcına yapıştır' : 'Düğme çalışmazsa bu adresi tarayıcınıza yapıştırın'}:<br><a href="${kac(eylem.adres)}" style="color:${R.lacivert};word-break:break-all">${kac(eylem.adres)}</a></p>`
    : ''
  const notlar = son.length
    ? `<div style="border-top:1px solid ${R.cizgi};margin-top:8px;padding-top:16px;font-size:14px;line-height:20px;color:${R.metin2}">${son.map((x) => `<p style="margin:0 0 8px">${kac(x)}</p>`).join('')}</div>`
    : ''
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${kac(konu)}</title>
<style>@media (max-width:600px){.ic{padding-left:20px!important;padding-right:20px!important}.kart{padding:24px 20px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${R.zemin};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${R.zemin}">${kac(onizleme)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${R.zemin}"><tr><td align="center" style="padding:24px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse">
<tr><td style="background:${R.lacivert};padding:22px 32px;border-bottom:3px solid ${R.camgobegi}" class="ic">
<a href="${site}/" style="text-decoration:none"><img src="${site}/eposta/teknokariyer-negatif.png" width="200" height="23" alt="TeknoKariyer · Pamukkale Teknokent" style="display:block;border:0;color:#FFFFFF;font:700 18px ${YAZI}"></a>
</td></tr>
<tr><td style="background:${R.yuzey};padding:32px;color:${R.metin};font:16px/24px ${YAZI}" class="kart">
<h1 style="margin:0 0 20px;font:700 22px/28px ${YAZI};color:${R.metin}">${kac(konu)}</h1>
${paragraflar.map(p).join('\n')}
${dugme}${yedek}${notlar}
</td></tr>
${altBilgi(site, hitap)}
</table>
</td></tr></table>
</body></html>`
  const metin = [
    ...paragraflar,
    ...(eylem ? [`${eylem.metin}: ${eylem.adres}`] : []),
    ...son,
    '—',
    `TeknoKariyer · ${KURUM.kisaAd}`,
    `${KURUM.unvan}, ${KURUM.adres}, ${KURUM.telefon}`,
  ].join('\n\n')
  return { konu, html, metin }
}

type Hitap = { ad?: string | null; rol?: string | null }
const sen = (k: Hitap) => k.rol === 'aday' || !k.rol

export function dogrulamaEpostasi(k: Hitap, anahtar: string): Eposta {
  const adres = `${siteAdresi()}/dogrula?anahtar=${encodeURIComponent(anahtar)}`
  return sen(k)
    ? eposta('E-posta adresini doğrula', [`Merhaba ${k.ad ?? ''},`.trim(), 'TeknoKariyer hesabını açtın. Hesabını kullanmaya başlamak için e-posta adresini doğrula.'], { metin: 'E-posta adresimi doğrula', adres }, [
        'Bu hesabı sen açmadıysan bu e-postayı yok sayabilirsin; adres doğrulanmadan hesap kullanılamaz.',
      ])
    : eposta('E-posta adresinizi doğrulayın', [`Merhaba ${k.ad ?? ''},`.trim(), 'TeknoKariyer hesabınızı kullanmaya başlamak için e-posta adresinizi doğrulayın.'], { metin: 'E-posta adresimi doğrula', adres }, [], 'siz')
}

export function sifreSifirlamaEpostasi(k: Hitap, anahtar: string): Eposta {
  const adres = `${siteAdresi()}/sifre-yenile?anahtar=${encodeURIComponent(anahtar)}`
  return sen(k)
    ? eposta('Şifreni yenile', [`Merhaba ${k.ad ?? ''},`.trim(), 'Şifreni yenilemek için bir istek aldık. Yeni şifreni aşağıdaki bağlantıdan belirleyebilirsin. Bağlantı 1 saat geçerlidir.'], { metin: 'Yeni şifre belirle', adres }, [
        'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.',
      ])
    : eposta('Şifrenizi yenileyin', [`Merhaba ${k.ad ?? ''},`.trim(), 'Şifrenizi yenilemek için bir istek aldık. Yeni şifrenizi aşağıdaki bağlantıdan belirleyebilirsiniz. Bağlantı 1 saat geçerlidir.'], { metin: 'Yeni şifre belirle', adres }, [
        'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.',
      ], 'siz')
}

/** Var olan bir adresle yeniden kayıt denendiğinde: hesabın varlığı ekranda belli edilmez, sahibine bilgi gider. */
export function hesapZatenVarEpostasi(k: Hitap): Eposta {
  return eposta('TeknoKariyer hesabın zaten var', [
    `Merhaba ${k.ad ?? ''},`.trim(),
    'Bu e-posta adresiyle yeni bir TeknoKariyer hesabı açılmak istendi. Bu adresle zaten bir hesabın var; yeni hesap açılmadı.',
  ], { metin: 'Giriş yap', adres: `${siteAdresi()}/giris` }, ['Şifreni hatırlamıyorsan giriş sayfasındaki “Şifremi unuttum” bağlantısını kullanabilirsin. Bu isteği sen yapmadıysan bir şey yapmana gerek yok.'])
}

export function basvuruAlindiEpostasi(k: Hitap, ilan: { pozisyonAdi: string; firma: string }): Eposta {
  return eposta(
    `Başvurun alındı: ${ilan.pozisyonAdi}`,
    [
      `Merhaba ${k.ad ?? ''},`.trim(),
      `${ilan.firma} firmasının “${ilan.pozisyonAdi}” ilanına başvurun alındı ve firmaya iletildi.`,
      'Firma başvurunu incelediğinde ve karar verdiğinde sana haber vereceğiz. Karar ne olursa olsun sonuç sana bildirilir.',
    ],
    { metin: 'Başvurularımı gör', adres: `${siteAdresi()}/hesabim` },
    ['Bu e-posta başvurunla ilgili olduğu için bildirim ayarlarından kapatılamaz.'],
  )
}

/**
 * Başvurunun durumu değişince adaya bildirim (görüşme, teklif, olumlu, olumsuz). Firma bu bildirimi kapatamaz
 * (prototip “Başvurular”). Olumsuz bildirimde firmanın isteğe bağlı kişisel notu eklenir.
 */
export function basvuruDurumuEpostasi(
  k: Hitap,
  b: { durum: 'gorusme' | 'teklif' | 'olumlu' | 'olumsuz'; pozisyonAdi: string; firma: string; not?: string },
): Eposta {
  const selam = `Merhaba ${k.ad ?? ''},`.trim()
  const ilan = `“${b.pozisyonAdi}”`
  const not = b.not?.trim() ? [`${b.firma} firmasının notu: “${b.not.trim()}”`] : []
  const basvurularim = { metin: 'Başvurularımı gör', adres: `${siteAdresi()}/hesabim` }
  switch (b.durum) {
    case 'gorusme':
      return eposta(`Görüşme aşaması: ${b.pozisyonAdi}`, [selam, `${b.firma}, ${ilan} ilanına yaptığın başvuruyu görüşme aşamasına aldı.`, 'Firma görüşmenin zamanı ve yeri için seninle iletişime geçecek.', ...not], basvurularim)
    case 'teklif':
      return eposta(`Teklif aşaması: ${b.pozisyonAdi}`, [selam, `${b.firma}, ${ilan} ilanına yaptığın başvuruda teklif aşamasına geçti.`, 'Firma teklifin ayrıntıları için seninle iletişime geçecek.', ...not], basvurularim)
    case 'olumlu':
      return eposta(`Başvurun olumlu sonuçlandı: ${b.pozisyonAdi}`, [selam, `Tebrikler! ${b.firma}, ${ilan} ilanına yaptığın başvuruyu olumlu sonuçlandırdı.`, 'Firma sonraki adımlar için seninle iletişime geçecek.', ...not], basvurularim)
    case 'olumsuz':
      return eposta(
        `Başvurunun sonucu: ${b.pozisyonAdi}`,
        [selam, `${b.firma}, ${ilan} ilanı için başka bir adayla ilerlemeye karar verdi.`, 'Başvurun ve gösterdiğin ilgi için teşekkür ederiz. Bu karar, başka ilanlara yapacağın başvuruları etkilemez.', ...not],
        { metin: 'Diğer ilanlara göz at', adres: `${siteAdresi()}/ilanlar` },
      )
  }
}

/** Firma ekibine (veya Yönetici A.Ş.'nin firma yetkilisine) davet. Bağlantı tek kullanımlık ve 14 gün geçerlidir. */
export function davetEpostasi(d: { ad: string; firma: string; davetEden: string; anahtar: string; gun: number }): Eposta {
  return eposta(
    `TeknoKariyer’de ${d.firma} ekibine davet edildiniz`,
    [
      `Merhaba ${d.ad},`,
      `${d.davetEden}, sizi Pamukkale Teknokent’in kariyer portalı TeknoKariyer’de ${d.firma} firmasının ekibine davet etti.`,
      'Firma panelinde ilanları yönetebilir, başvuruları değerlendirebilir ve yetkinize göre CV havuzunda arama yapabilirsiniz.',
      'Daveti kabul etmek için aşağıdaki bağlantıyı açın ve kendinize bir şifre belirleyin.',
    ],
    { metin: 'Daveti kabul et', adres: `${siteAdresi()}/davet?anahtar=${encodeURIComponent(d.anahtar)}` },
    [`Bu bağlantı ${d.gun} gün geçerlidir ve yalnızca bir kez kullanılabilir.`, 'Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz; hesap açılmaz.'],
    'siz',
  )
}

/* ---------- Yönetici A.Ş. kararları: firmaya ve talep edene bildirim (siz) ---------- */

export function ilanOnaylandiEpostasi(i: { pozisyonAdi: string; id: number; adres: string }): Eposta {
  return eposta(
    `İlanınız yayına girdi: ${i.pozisyonAdi}`,
    ['Merhaba,', `“${i.pozisyonAdi}” ilanınız Yönetici A.Ş. tarafından onaylandı ve yayına girdi. Adaylar artık ilanınızı görüp başvurabilir.`],
    { metin: 'İlanı görüntüle', adres: `${siteAdresi()}${i.adres}` },
    ['Başvurular geldikçe firma panelinizin “Başvurular” sayfasında listelenir.'],
    'siz',
  )
}

export function ilanDuzeltmeEpostasi(i: { pozisyonAdi: string; id: number; gerekce: string }): Eposta {
  return eposta(
    `İlanınızda düzeltme istendi: ${i.pozisyonAdi}`,
    ['Merhaba,', `Yönetici A.Ş., “${i.pozisyonAdi}” ilanınızı yayınlamadan önce bir düzeltme istedi.`, `Yönetici A.Ş.’nin notu: ${i.gerekce}`, 'İlanı düzelttikten sonra yeniden yayına gönderin; düzeltilen ilanlar öncelikle incelenir.'],
    { metin: 'İlanı düzelt', adres: `${siteAdresi()}/firma-paneli/ilanlar/${i.id}` },
    [],
    'siz',
  )
}

export function degisiklikSonucuEpostasi(i: { pozisyonAdi: string; id: number; onay: boolean; gerekce?: string }): Eposta {
  return eposta(
    i.onay ? `İlan değişikliğiniz onaylandı: ${i.pozisyonAdi}` : `İlan değişikliğiniz onaylanmadı: ${i.pozisyonAdi}`,
    i.onay
      ? ['Merhaba,', `“${i.pozisyonAdi}” ilanınızda istediğiniz değişiklik onaylandı ve yayındaki ilana yansıdı.`]
      : ['Merhaba,', `“${i.pozisyonAdi}” ilanınızda istediğiniz değişiklik onaylanmadı. İlan önceki hâliyle yayında kalıyor.`, `Yönetici A.Ş.’nin notu: ${i.gerekce ?? ''}`],
    { metin: 'İlanı aç', adres: `${siteAdresi()}/firma-paneli/ilanlar/${i.id}` },
    [],
    'siz',
  )
}

export function talepSonucuEpostasi(
  k: Hitap,
  t: { liste: string; eklenenler: string[]; reddedilenler: Array<{ ad: string; neden: string }>; duzeltilenler?: Record<string, string>; not?: string },
): Eposta {
  const siz = !sen(k)
  const paragraf = [`Merhaba ${k.ad ?? ''},`.trim()]
  if (t.eklenenler.length)
    paragraf.push(
      `${t.liste} listesine eklenmesini ${siz ? 'istediğiniz' : 'istediğin'} şu öğeler eklendi: ${t.eklenenler.join(', ')}. Artık ${siz ? 'seçebilirsiniz' : 'seçebilirsin'}.`,
    )
  for (const [a, y] of Object.entries(t.duzeltilenler ?? {})) paragraf.push(`“${a}” listeye “${y}” yazımıyla eklendi.`)
  for (const r of t.reddedilenler) paragraf.push(`“${r.ad}” listeye eklenmedi. ${r.neden}`)
  if (t.not?.trim()) paragraf.push(`Yönetici A.Ş.’nin notu: ${t.not.trim()}`)
  return eposta(
    `${siz ? 'Talebiniz' : 'Talebin'} sonuçlandı${t.eklenenler.length ? `: ${t.eklenenler.length} öğe eklendi` : ''}`,
    paragraf,
    undefined,
    [],
    siz ? 'siz' : 'sen',
  )
}

export function basvurusuzHatirlatmaEpostasi(i: { pozisyonAdi: string; id: number; kalan: number }): Eposta {
  const sure = i.kalan === 0 ? 'bugün sona eriyor' : `${i.kalan} gün sonra sona eriyor`
  return eposta(
    `İlanınız henüz başvuru almadı: ${i.pozisyonAdi}`,
    [
      'Merhaba,',
      `“${i.pozisyonAdi}” ilanınızın başvuru süresi ${sure} ve ilan henüz başvuru almadı.`,
      'Daha fazla adaya ulaşmak için ilanı LinkedIn’de paylaşabilir, aranan nitelikleri gözden geçirebilir veya son başvuru tarihini uzatabilirsiniz. CV havuzunda ilanınıza uygun adayları da arayabilirsiniz.',
    ],
    { metin: 'İlanı aç', adres: `${siteAdresi()}/firma-paneli/ilanlar?durum=yayinda#ilan-${i.id}` },
    ['Bu hatırlatmayı Yönetici A.Ş. gönderdi. Yardım isterseniz bu e-postayı yanıtlayabilirsiniz.'],
    'siz',
  )
}

/* ---------- Kurulum hatırlatmaları (talimatlar 0.3, 6) ---------- */

export function davetHatirlatmaEpostasi(d: { ad: string; firma: string; anahtar: string; sonGun: string; son: boolean }): Eposta {
  return eposta(
    d.son ? `Son hatırlatma: ${d.firma} için TeknoKariyer davetiniz` : `${d.firma} için TeknoKariyer davetiniz bekliyor`,
    [
      `Merhaba ${d.ad},`,
      `Pamukkale Teknokent’in kariyer portalı TeknoKariyer’de ${d.firma} adına bir davetiniz var. Daveti kabul ettiğinizde firmanızın ilanlarını yayınlayabilir ve başvuruları tek yerden yönetebilirsiniz.`,
      'Hesabınızı açmak birkaç dakika sürer: aşağıdaki bağlantıyı açın ve kendinize bir şifre belirleyin.',
    ],
    { metin: 'Daveti kabul et', adres: `${siteAdresi()}/davet?anahtar=${encodeURIComponent(d.anahtar)}` },
    [
      `Bu bağlantı ${d.sonGun} tarihine kadar geçerlidir. Önceki e-postalardaki bağlantılar artık çalışmaz.`,
      d.son
        ? 'Bu son otomatik hatırlatmadır. Sorunuz varsa bu e-postayı yanıtlayabilir veya Yönetici A.Ş.’yi arayabilirsiniz.'
        : 'Daveti beklemiyorsanız bu e-postayı yanıtlayarak bize bildirin.',
    ],
    'siz',
  )
}

export function profilHatirlatmaEpostasi(d: { ad?: string | null; firma: string; eksikler: string[]; son: boolean }): Eposta {
  return eposta(
    `${d.firma} profilini tamamlayın`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      `${d.firma} firmasının TeknoKariyer profili henüz tamamlanmadı. Profil tamamlanana kadar firma sayfanız adaylara görünmez.`,
      `Eksik olanlar: ${d.eksikler.join(', ')}. Bu bilgileri girmeniz birkaç dakika sürer.`,
    ],
    { metin: 'Profili tamamla', adres: `${siteAdresi()}/firma-paneli/profil` },
    [d.son ? 'Bu son otomatik hatırlatmadır. Yardım isterseniz bu e-postayı yanıtlayabilirsiniz.' : 'Yardım isterseniz bu e-postayı yanıtlayabilirsiniz.'],
    'siz',
  )
}

/** Kaydedilen ilanın son başvurusuna 2 gün kala, bir kez (talimatlar 5). Aday ilana başvurduysa gönderilmez. */
export function kaydedilenIlanHatirlatmaEpostasi(d: { ad?: string | null; pozisyonAdi: string; firma: string; sonGun: string; kalan: number; adres: string }): Eposta {
  return eposta(
    `Kaydettiğin ilanın süresi doluyor: ${d.pozisyonAdi}`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      `Kaydettiğin “${d.pozisyonAdi}” ilanının (${d.firma}) son başvuru tarihi ${d.sonGun}. ${d.kalan === 0 ? 'Bugün son gün.' : `${d.kalan} gün kaldı.`}`,
      'Başvurmak istiyorsan bu tarihten önce ilanın sayfasından başvurabilirsin.',
    ],
    { metin: 'İlana git', adres: `${siteAdresi()}${d.adres}` },
    ['Bu hatırlatma her kaydettiğin ilan için yalnızca bir kez gelir. İlanı kaydedilenlerden çıkarırsan hatırlatma gelmez.'],
  )
}

/** Arama adı zaten tırnaklıysa (“react” · Staj) ikinci kez tırnaklanmaz. */
const tirnak = (ad: string) => (ad.includes('“') ? ad : `“${ad}”`)

const ARAMA_SON = ['Bu e-posta, kaydettiğin aramaya uyan ilanlar için gönderildi. Aramayı “Kayıtlı aramalar” sayfasından değiştirebilir veya silebilirsin.']

/** Kayıtlı aramaya uyan yeni ilan (anlık). */
export function aramaAnlikEpostasi(d: { ad?: string | null; aramaAdi: string; pozisyonAdi: string; firma: string; sonGun: string; adres: string }): Eposta {
  return eposta(
    `Yeni ilan: ${d.pozisyonAdi} (${d.firma})`,
    [`Merhaba ${d.ad ?? ''},`.trim(), `${tirnak(d.aramaAdi)} aramana uyan yeni bir ilan yayına girdi: ${d.firma} firmasının “${d.pozisyonAdi}” ilanı. Son başvuru tarihi ${d.sonGun}.`],
    { metin: 'İlanı gör', adres: `${siteAdresi()}${d.adres}` },
    ARAMA_SON,
  )
}

/** Kayıtlı aramanın haftalık özeti. */
export function aramaHaftalikEpostasi(d: { ad?: string | null; aramaAdi: string; ilanlar: Array<{ pozisyonAdi: string; firma: string }>; fazla: number; aramaAdresi: string }): Eposta {
  const n = d.ilanlar.length + d.fazla
  return eposta(
    `${tirnak(d.aramaAdi)} aramana uyan ${n} yeni ilan`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      `Geçen hafta ${tirnak(d.aramaAdi)} aramana uyan ${n} yeni ilan yayına girdi:`,
      ...d.ilanlar.map((i) => `• ${i.pozisyonAdi}, ${i.firma}`),
      ...(d.fazla ? [`ve ${d.fazla} ilan daha.`] : []),
    ],
    { metin: 'İlanları gör', adres: `${siteAdresi()}/ilanlar${d.aramaAdresi}` },
    ARAMA_SON,
  )
}

/** Firmanın kayıtlı havuz araması: yalnızca yeni aday sayısı (kişisel veri e-postaya yazılmaz). */
export function havuzAramaEpostasi(d: { ad?: string | null; aramaAdi: string; sayi: number; aramaAdresi: string }): Eposta {
  return eposta(
    `CV havuzunda ${tirnak(d.aramaAdi)} aramanıza uyan ${d.sayi} yeni aday`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      `Geçen hafta CV havuzuna katılan ${d.sayi} aday kayıtlı ${tirnak(d.aramaAdi)} aramanıza uyuyor. Adayların bilgileri yalnızca portalda, firma panelinizdeki CV havuzunda görünür.`,
    ],
    { metin: 'Adayları görün', adres: `${siteAdresi()}/firma-paneli/havuz${d.aramaAdresi}` },
    ['Bu e-posta, kaydettiğiniz havuz araması için gönderildi. Aramayı CV havuzu sayfasından silebilirsiniz.'],
    'siz',
  )
}

/** Firma hesap talebi alındı (talep edene). */
export function hesapTalebiAlindiEpostasi(d: { ad: string; firma: string }): Eposta {
  return eposta(
    'TeknoKariyer firma hesabı talebiniz alındı',
    [
      `Merhaba ${d.ad},`,
      `${d.firma} için TeknoKariyer firma hesabı talebinizi aldık. Yönetici A.Ş. talebinizi firmanızın Pamukkale Teknokent kaydıyla karşılaştırıp size davet gönderecek. Bu genellikle 1 iş günü sürer.`,
      'Davet e-postasındaki bağlantıyla şifrenizi belirleyip firma hesabınızı devralabilirsiniz.',
    ],
    undefined,
    ['Bu talebi siz göndermediyseniz bu e-postayı dikkate almayın.'],
    'siz',
  )
}

/** Firma hesap talebi reddedildi (talep edene, gerekçeyle). */
export function hesapTalebiRedEpostasi(d: { ad: string; firma: string; gerekce: string }): Eposta {
  return eposta(
    'TeknoKariyer firma hesabı talebiniz hakkında',
    [`Merhaba ${d.ad},`, `${d.firma} için gönderdiğiniz firma hesabı talebini inceledik ancak şu an hesap açamıyoruz.`, `Gerekçe: ${d.gerekce}`, 'Sorunuz varsa bu e-postayı yanıtlayabilirsiniz.'],
    undefined,
    [],
    'siz',
  )
}

/** İlan şikâyeti sonucunda firmaya: uyarı veya yayından kaldırma (mesaj Yönetici A.Ş.'den). */
export function sikayetFirmaEpostasi(d: { pozisyonAdi: string; kaldirildi: boolean; mesaj: string; adres: string }): Eposta {
  return eposta(
    d.kaldirildi ? `İlanınız yayından kaldırıldı: ${d.pozisyonAdi}` : `İlanınızla ilgili uyarı: ${d.pozisyonAdi}`,
    [
      'Merhaba,',
      d.kaldirildi
        ? `“${d.pozisyonAdi}” ilanınız hakkında gelen bildirimleri inceledik ve ilanı yayından kaldırdık. Adaylar artık bu ilana başvuramaz; gelen başvurular firma panelinizde durur.`
        : `“${d.pozisyonAdi}” ilanınız hakkında gelen bildirimleri inceledik. İlan yayında kalıyor; aşağıdaki konuyu düzeltmenizi rica ederiz.`,
      `Yönetici A.Ş.'nin notu: ${d.mesaj}`,
      d.kaldirildi ? 'Sorunu giderip yeni bir ilan açabilirsiniz. Sorunuz varsa bu e-postayı yanıtlayabilirsiniz.' : 'İlanı firma panelinizden düzenleyebilirsiniz.',
    ],
    { metin: d.kaldirildi ? 'Firma panelini aç' : 'İlanı düzenle', adres: `${siteAdresi()}${d.adres}` },
    ['Bildirimde bulunan kişilerin kimliği firmalarla paylaşılmaz.'],
    'siz',
  )
}

/** Bildirimde bulunan adaya sonuç. */
export function sikayetSonucEpostasi(d: { ad?: string | null; pozisyonAdi: string; firma: string; sonuc: 'yersiz' | 'firma-uyarildi' | 'ilan-kaldirildi' }): Eposta {
  const metin = {
    yersiz: 'İnceledik; ilanda kurallarımıza aykırı bir durum bulmadık, ilan yayında kalıyor.',
    'firma-uyarildi': 'İnceledik ve firmaya ilanını düzeltmesi için uyarıda bulunduk.',
    'ilan-kaldirildi': 'İnceledik ve ilanı yayından kaldırdık.',
  }[d.sonuc]
  return eposta(
    `Bildirimin sonuçlandı: ${d.pozisyonAdi}`,
    [`Merhaba ${d.ad ?? ''},`.trim(), `${d.firma} firmasının “${d.pozisyonAdi}” ilanı hakkındaki bildirimin için teşekkür ederiz. ${metin}`, 'Kimliğin firmayla paylaşılmadı.'],
    undefined,
    ['Başka bir sorun görürsen ilan sayfasındaki “İlanı bildir” bağlantısını kullanabilirsin.'],
  )
}

/** CV havuzu rızası yenileme hatırlatması (30 ve 7 gün kala) ve süre doldu bildirimi (0). */
export function havuzRizaEpostasi(d: { ad?: string | null; kalan: number; bitis: string }): Eposta {
  const doldu = d.kalan <= 0
  return eposta(
    doldu ? 'CV havuzu rızanın süresi doldu' : `CV havuzu rızanın süresi ${d.kalan} gün sonra doluyor`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      doldu
        ? `CV havuzu için verdiğin açık rızanın süresi ${d.bitis} tarihinde doldu. Profilin artık firmaların havuz aramalarında görünmüyor.`
        : `CV havuzu için verdiğin açık rızanın süresi ${d.bitis} tarihinde doluyor. Bu tarihten sonra profilin firmaların havuz aramalarında görünmez.`,
      doldu
        ? 'Yeniden havuza katılmak istersen “CV havuzu” sayfasından rızanı yenileyebilirsin. Başvuruların bundan etkilenmez.'
        : 'Havuzda kalmak istiyorsan “CV havuzu” sayfasından rızanı tek tıkla yenileyebilirsin. Yenilemezsen bir şey yapmana gerek yok; profilin süre dolunca havuzdan kendiliğinden çıkar.',
    ],
    { metin: doldu ? 'Havuza yeniden katıl' : 'Rızamı yenile', adres: `${siteAdresi()}/hesabim/havuz` },
    ['Bu e-posta, CV havuzu rızanın süresiyle ilgili olduğu için gönderildi. Rızanı istediğin zaman geri alabilirsin.'],
  )
}

export function kurumHesabiEpostasi(d: { ad: string; rolAdi: string; acan: string; anahtar: string; gun: number }): Eposta {
  return eposta(
    'TeknoKariyer yönetim hesabınız açıldı',
    [
      `Merhaba ${d.ad},`,
      `${d.acan}, Pamukkale Teknokent’in kariyer portalı TeknoKariyer’de size bir Yönetici A.Ş. hesabı açtı. Yetkiniz: ${d.rolAdi}.`,
      'Hesabınızı kullanmaya başlamak için aşağıdaki bağlantıdan şifrenizi belirleyin. Ardından e-posta adresiniz ve şifrenizle giriş yapabilirsiniz.',
    ],
    { metin: 'Şifremi belirle', adres: `${siteAdresi()}/sifre-yenile?anahtar=${encodeURIComponent(d.anahtar)}` },
    [`Bu bağlantı ${d.gun} gün geçerlidir. Süresi dolarsa giriş sayfasındaki “Şifremi unuttum” bağlantısını kullanın.`, 'Bu hesabı beklemiyorsanız bu e-postayı yanıtlayarak bildirin.'],
    'siz',
  )
}

const GUN_AY = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })

/** KVKK başvurusu alındı (başvurana). Hesabı olan aday için “sen”, diğerleri için “siz”. */
export function kvkkAlindiEpostasi(d: { ad: string; turAdi: string; sonGun: Date; hitap: EpostaHitabi }): Eposta {
  const sen = d.hitap === 'sen'
  return eposta(
    sen ? 'KVKK başvurun alındı' : 'KVKK başvurunuz alındı',
    [
      `Merhaba ${d.ad},`,
      sen
        ? `Kişisel verilerinle ilgili “${d.turAdi}” başvurunu aldık. Başvurunu en geç ${GUN_AY.format(d.sonGun)} tarihine kadar ücretsiz olarak sonuçlandırıp sana bu adresten yazacağız.`
        : `Kişisel verilerinizle ilgili “${d.turAdi}” başvurunuzu aldık. Başvurunuzu en geç ${GUN_AY.format(d.sonGun)} tarihine kadar ücretsiz olarak sonuçlandırıp size bu adresten yazacağız.`,
    ],
    sen ? { metin: 'Başvurumu gör', adres: `${siteAdresi()}/hesabim/hesap#kvkk` } : undefined,
    [sen ? `Ek bilgi vermek istersen ${KURUM.kvkkEposta} adresine yazabilirsin.` : `Ek bilgi vermek isterseniz ${KURUM.kvkkEposta} adresine yazabilirsiniz.`],
    d.hitap,
  )
}

/** Portaldan yeni KVKK başvurusu geldi (Yönetici A.Ş.’nin KVKK adresine). Kişinin adı yazılmaz; ayrıntı panelde. */
export function kvkkYeniBasvuruEpostasi(d: { id: number; turAdi: string; sonGun: Date }): Eposta {
  return eposta(
    `Yeni KVKK başvurusu: ${d.turAdi}`,
    [`Portal üzerinden yeni bir ilgili kişi başvurusu geldi. Yasal süre ${GUN_AY.format(d.sonGun)} tarihinde doluyor.`, 'Başvurunun ayrıntısını ve kişinin bilgilerini Yönetici A.Ş. panelinde görebilirsiniz.'],
    { metin: 'Başvuruyu aç', adres: `${siteAdresi()}/yonetim/kvkk/${d.id}` },
    [],
    'siz',
  )
}

/** KVKK başvurusunun cevabı. Cevap metnini Yönetici A.Ş. yazar. */
export function kvkkCevapEpostasi(d: { ad: string; turAdi: string; sonucAdi: string; cevap: string; hitap: EpostaHitabi }): Eposta {
  const sen = d.hitap === 'sen'
  return eposta(
    sen ? 'KVKK başvurun sonuçlandı' : 'KVKK başvurunuz sonuçlandı',
    [`Merhaba ${d.ad},`, sen ? `“${d.turAdi}” başvurun sonuçlandı: ${d.sonucAdi}.` : `“${d.turAdi}” başvurunuz sonuçlandı: ${d.sonucAdi}.`, ...d.cevap.trim().split(/\n{2,}/)],
    undefined,
    [`${KURUM.unvan} · ${KURUM.kvkkEposta}`],
    d.hitap,
  )
}

/** İki aşamalı doğrulama sıfırlandı (kişiye bilgi; kendisi istemediyse haber vermesi için). */
export function ikiAdimSifirlandiEpostasi(d: { ad: string; hitap: EpostaHitabi; sifirlayan: string }): Eposta {
  const sen = d.hitap === 'sen'
  return eposta(
    'İki aşamalı doğrulama sıfırlandı',
    [
      `Merhaba ${d.ad},`.replace(' ,', ','),
      sen
        ? `TeknoKariyer hesabındaki iki aşamalı doğrulama ${d.sifirlayan} tarafından sıfırlandı. Doğrulayıcı uygulama kaldırıldı ve tanınan cihazların unutuldu. İstersen uygulamayı Hesap güvenliği sayfasından yeniden kurabilirsin.`
        : `TeknoKariyer hesabınızdaki iki aşamalı doğrulama ${d.sifirlayan} tarafından sıfırlandı. Doğrulayıcı uygulama kaldırıldı ve tanınan cihazlarınız unutuldu; bir sonraki girişinizde e-postanıza bir kod gönderilecek. Uygulamayı Hesap güvenliği sayfasından yeniden kurabilirsiniz.`,
    ],
    { metin: 'Giriş yap', adres: `${siteAdresi()}/giris` },
    [sen ? `Bu işlemi sen istemediysen hemen ${KURUM.eposta} adresine yaz.` : `Bu işlemi siz istemediyseniz hemen ${KURUM.eposta} adresine yazın.`],
    d.hitap,
  )
}

/** Yeni cihazdan giriş kodu. Konu kodu içermez (bildirim önizlemesinde görünmesin). */
export function girisKoduEpostasi(d: { ad: string; kod: string; dakika: number; hitap: EpostaHitabi }): Eposta {
  const sen = d.hitap === 'sen'
  const kod = `${d.kod.slice(0, 3)} ${d.kod.slice(3)}`
  return eposta(
    'TeknoKariyer giriş kodu',
    [
      `Merhaba ${d.ad},`.replace(' ,', ','),
      sen ? 'Tanımadığımız bir cihazdan hesabına giriş yapılıyor. Girişi tamamlamak için şu kodu yaz:' : 'Tanımadığımız bir cihazdan hesabınıza giriş yapılıyor. Girişi tamamlamak için şu kodu yazın:',
      kod,
      `Kod ${d.dakika} dakika geçerlidir ve bir kez kullanılır.`,
    ],
    undefined,
    [
      sen
        ? 'Giriş yapan sen değilsen bu kodu kimseyle paylaşma ve şifreni değiştir. Şifren doğru girildiği için bu e-postayı aldın.'
        : 'Giriş yapan siz değilseniz bu kodu kimseyle paylaşmayın ve şifrenizi değiştirin. Şifreniz doğru girildiği için bu e-postayı aldınız.',
    ],
    d.hitap,
  )
}

// ——— Görüşme daveti (src/servisler/gorusme.ts) ———

/** Adaya: firma görüşme tarihleri önerdi (ilk davet veya tarih değişikliği). */
export function gorusmeDavetiEpostasi(d: {
  ad?: string | null
  firma: string
  pozisyonAdi: string
  secenekler: string[]
  bicim: string
  yer?: string | null
  not?: string | null
  adres: string
  degisiklik: boolean
}): Eposta {
  return eposta(
    d.degisiklik ? `Görüşme tarihi değişti: ${d.pozisyonAdi}` : `Görüşme daveti: ${d.pozisyonAdi}`,
    [
      `Merhaba ${d.ad ?? ''},`.trim(),
      d.degisiklik
        ? `${d.firma}, “${d.pozisyonAdi}” görüşmesi için yeni tarihler önerdi. Daha önceki tarih geçerli değil; aşağıdaki seçeneklerden sana uyanı seç.`
        : `${d.firma}, “${d.pozisyonAdi}” başvurun için seni görüşmeye davet ediyor. Aşağıdaki seçeneklerden sana uyanı seç.`,
      ...d.secenekler.map((s, i) => `${i + 1}. seçenek: ${s}`),
      `Görüşme biçimi: ${d.bicim}${d.yer ? ` (${d.yer})` : ''}.`,
      ...(d.not ? [`Firmanın notu: ${d.not}`] : []),
      'Seçeneklerin hiçbiri sana uymuyorsa aynı sayfadan başka tarih isteyebilirsin.',
    ],
    { metin: 'Tarih seç', adres: d.adres },
    ['Tarihi seçtiğinde sana ve firmaya takvim dosyası gönderilir.'],
  )
}

/** Aday tarih seçti: adaya (sen) ve firmaya (siz); takvim dosyası ekli. */
export function gorusmeKesinlestiEpostasi(d: {
  hitap: EpostaHitabi
  ad?: string | null
  firma: string
  pozisyonAdi: string
  zaman: string
  bicim: string
  yer?: string | null
  adres: string
  ics: string
}): Eposta {
  const sen = d.hitap === 'sen'
  const e = eposta(
    `Görüşme tarihi kesinleşti: ${d.pozisyonAdi}`,
    [
      sen ? `Merhaba ${d.ad ?? ''},`.trim() : 'Merhaba,',
      sen
        ? `${d.firma} ile “${d.pozisyonAdi}” görüşmen ${d.zaman} tarihinde.`
        : `${d.ad ?? 'Aday'}, “${d.pozisyonAdi}” görüşmesi için ${d.zaman} tarihini seçti.`,
      `Görüşme biçimi: ${d.bicim}${d.yer ? ` (${d.yer})` : ''}.`,
      sen ? 'Takvim dosyası bu e-postanın ekinde. Açarsan görüşme takvimine eklenir.' : 'Takvim dosyası bu e-postanın ekinde.',
    ],
    { metin: sen ? 'Görüşmeyi gör' : 'Başvuruyu aç', adres: d.adres },
    [sen ? 'Bu saatte katılamayacaksan aynı sayfadan başka tarih isteyebilirsin.' : 'Tarihi değiştirmek veya görüşmeyi iptal etmek için başvuru sayfasını kullanabilirsiniz.'],
    d.hitap,
  )
  return { ...e, ekler: [{ dosyaAdi: 'gorusme.ics', icerik: d.ics, tur: 'text/calendar; charset=utf-8; method=PUBLISH' }] }
}

/** Firmaya: aday önerilen tarihlerin hiçbirine uyamıyor veya kesinleşen saatte katılamıyor. */
export function gorusmeYeniTarihEpostasi(d: { aday: string; pozisyonAdi: string; not: string; adres: string; ics?: string }): Eposta {
  const e = eposta(
    `Aday başka bir görüşme tarihi istiyor: ${d.pozisyonAdi}`,
    ['Merhaba,', `${d.aday}, “${d.pozisyonAdi}” görüşmesi için önerdiğiniz tarihlere katılamayacağını bildirdi.`, `Adayın notu: ${d.not}`, 'Başvuru sayfasından yeni tarihler önerebilirsiniz.'],
    { metin: 'Yeni tarih öner', adres: d.adres },
    d.ics ? ['Daha önce kesinleşen görüşme iptal edildi; ekteki dosya takviminizden kaldırır.'] : [],
    'siz',
  )
  return d.ics ? { ...e, ekler: [{ dosyaAdi: 'gorusme-iptal.ics', icerik: d.ics, tur: 'text/calendar; charset=utf-8; method=CANCEL' }] } : e
}

/** Görüşme iptali: firma iptal etti (adaya) veya aday başvurusunu geri çekti / hesabını sildi (firmaya). */
export function gorusmeIptalEpostasi(d: { hitap: EpostaHitabi; ad?: string | null; firma: string; pozisyonAdi: string; neden: string; adres?: string; ics?: string; baslik?: string }): Eposta {
  const sen = d.hitap === 'sen'
  const e = eposta(
    d.baslik ?? `Görüşme iptal edildi: ${d.pozisyonAdi}`,
    [
      sen ? `Merhaba ${d.ad ?? ''},`.trim() : 'Merhaba,',
      ...(d.baslik ? [] : [sen ? `${d.firma}, “${d.pozisyonAdi}” görüşmesini iptal etti.` : `“${d.pozisyonAdi}” görüşmesi iptal oldu.`]),
      sen && !d.baslik ? `Firmanın açıklaması: ${d.neden}` : d.neden,
    ],
    d.adres ? { metin: sen ? 'Başvurularımı gör' : 'Başvuruyu aç', adres: d.adres } : undefined,
    d.ics ? [sen ? 'Ekteki dosya görüşmeyi takviminden kaldırır.' : 'Ekteki dosya görüşmeyi takviminizden kaldırır.'] : [],
    d.hitap,
  )
  return d.ics ? { ...e, ekler: [{ dosyaAdi: 'gorusme-iptal.ics', icerik: d.ics, tur: 'text/calendar; charset=utf-8; method=CANCEL' }] } : e
}
