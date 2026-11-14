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

export function talepSonucuEpostasi(k: Hitap, t: { liste: string; eklenenler: string[]; reddedilenler: string[]; not?: string }): Eposta {
  const siz = !sen(k)
  const selam = `Merhaba ${k.ad ?? ''},`.trim()
  const paragraf = [selam]
  if (t.eklenenler.length)
    paragraf.push(
      `${t.liste} listesine eklenmesini ${siz ? 'istediğiniz' : 'istediğin'} şu öğeler eklendi: ${t.eklenenler.join(', ')}. Artık ${siz ? 'seçebilirsiniz' : 'seçebilirsin'}.`,
    )
  if (t.reddedilenler.length) paragraf.push(`Şu öğeler listeye eklenmedi: ${t.reddedilenler.join(', ')}.`)
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
