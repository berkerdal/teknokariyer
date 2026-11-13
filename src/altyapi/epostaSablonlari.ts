/**
 * E-posta şablonları. Sade HTML (tek sütun, sistem yazı tipi, görsel yok) ve aynı içerikte düz metin.
 * Hitap: adaya “sen”, firma ve kurum kullanıcısına “siz” (K9).
 */

export const siteAdresi = () => (process.env.SITE_ADRESI || 'http://localhost:3000').replace(/\/$/, '')

const kac = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export interface Eposta {
  konu: string
  html: string
  metin: string
}

/** Paragraflar ve tek bir eylem düğmesi. */
export function eposta(konu: string, paragraflar: string[], eylem?: { metin: string; adres: string }, son: string[] = []): Eposta {
  const p = (x: string) => `<p style="margin:0 0 16px">${kac(x)}</p>`
  const dugme = eylem
    ? `<p style="margin:24px 0"><a href="${kac(eylem.adres)}" style="display:inline-block;background:#2155AD;color:#FFFFFF;padding:12px 20px;border-radius:4px;font-weight:600;text-decoration:none">${kac(eylem.metin)}</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#5B5852">Düğme çalışmazsa bu adresi tarayıcıya yapıştırın:<br><span style="word-break:break-all">${kac(eylem.adres)}</span></p>`
    : ''
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${kac(konu)}</title></head>
<body style="margin:0;background:#F7F6F3;color:#1E1E1C;font:16px/1.5 -apple-system,'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<p style="margin:0 0 24px;font-weight:700;color:#2155AD">TeknoKariyer · Pamukkale Teknokent</p>
<div style="background:#FFFFFF;border:1px solid #E4E1DA;border-radius:6px;padding:24px">
${paragraflar.map(p).join('\n')}${dugme}${son.map(p).join('\n')}
</div>
<p style="margin:24px 0 0;font-size:13px;color:#5B5852">Pamukkale Teknoloji Geliştirme Bölgesi Yönetici A.Ş. · Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67 Pamukkale/Denizli</p>
</div></body></html>`
  const metin = [...paragraflar, ...(eylem ? [`${eylem.metin}: ${eylem.adres}`] : []), ...son, '—', 'TeknoKariyer · Pamukkale Teknokent'].join('\n\n')
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
    : eposta('E-posta adresinizi doğrulayın', [`Merhaba ${k.ad ?? ''},`.trim(), 'TeknoKariyer hesabınızı kullanmaya başlamak için e-posta adresinizi doğrulayın.'], { metin: 'E-posta adresimi doğrula', adres })
}

export function sifreSifirlamaEpostasi(k: Hitap, anahtar: string): Eposta {
  const adres = `${siteAdresi()}/sifre-yenile?anahtar=${encodeURIComponent(anahtar)}`
  return sen(k)
    ? eposta('Şifreni yenile', [`Merhaba ${k.ad ?? ''},`.trim(), 'Şifreni yenilemek için bir istek aldık. Yeni şifreni aşağıdaki bağlantıdan belirleyebilirsin. Bağlantı 1 saat geçerlidir.'], { metin: 'Yeni şifre belirle', adres }, [
        'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.',
      ])
    : eposta('Şifrenizi yenileyin', [`Merhaba ${k.ad ?? ''},`.trim(), 'Şifrenizi yenilemek için bir istek aldık. Yeni şifrenizi aşağıdaki bağlantıdan belirleyebilirsiniz. Bağlantı 1 saat geçerlidir.'], { metin: 'Yeni şifre belirle', adres }, [
        'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.',
      ])
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
