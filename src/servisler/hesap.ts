/**
 * Hesap işlemleri: aday kaydı, giriş, e-posta doğrulama, şifre sıfırlama.
 *
 * Güvenlik kuralları (talimatlar 12, ASVS 2):
 * - Hata mesajı hangi bilginin yanlış olduğunu söylemez; hesabın var olup olmadığı anlaşılmaz.
 * - Var olan adresle kayıt denenirse ekranda başarı mesajı görünür, hesap sahibine bilgi e-postası gider.
 * - Şifre sıfırlama isteği, adres kayıtlı olsun olmasın aynı cevabı verir.
 * - Giriş denemeleri koleksiyon ayarıyla sınırlanır (5 deneme, 15 dakika kilit).
 */
import type { Payload } from 'payload'
import { hesapZatenVarEpostasi } from '@/altyapi/epostaSablonlari'
import { surum } from '@/metinler'
import { IslemHatasi } from './ortak'
import { epostaGecerliMi, epostaNormallestir, sifreHatasi } from './hesapKurallari'

export { SIFRE_EN_AZ, SIFRE_EN_COK, SIFRE_KURALLARI, sifreHatasi, epostaGecerliMi, epostaNormallestir } from './hesapKurallari'

/** Alan hataları: anahtar alan adı, değer kullanıcıya gösterilecek Türkçe mesaj. */
export class FormHatasi extends IslemHatasi {
  constructor(public alanlar: Record<string, string>) {
    super(Object.values(alanlar)[0] ?? 'Formda hata var.', 400)
    this.name = 'FormHatasi'
  }
}

export interface KayitGirdisi {
  ad: string
  eposta: string
  sifre: string
  aydinlatma: boolean
  ticariIleti: boolean
}

/** Aday hesabı açar. Doğrulama e-postası gönderilir; doğrulanmadan giriş yapılamaz. */
export async function adayKaydi(payload: Payload, g: KayitGirdisi): Promise<void> {
  const ad = g.ad.trim().replace(/\s+/g, ' ')
  const eposta = epostaNormallestir(g.eposta)
  const hatalar: Record<string, string> = {}
  if (ad.length < 2) hatalar.ad = 'Adını ve soyadını yaz.'
  else if (ad.length > 100) hatalar.ad = 'Ad soyad en fazla 100 karakter olabilir.'
  if (!eposta) hatalar.eposta = 'E-posta adresini yaz.'
  else if (!epostaGecerliMi(eposta)) hatalar.eposta = 'E-posta adresini ad@ornek.com biçiminde yaz.'
  const sh = sifreHatasi(g.sifre)
  if (sh) hatalar.sifre = sh
  if (!g.aydinlatma) hatalar.aydinlatma = 'Hesap açmak için aday aydınlatma metnini okuduğunu onayla.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)

  const { docs } = await payload.find({ collection: 'kullanicilar', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true })
  if (docs[0]) {
    const e = hesapZatenVarEpostasi(docs[0])
    await payload.sendEmail({ to: eposta, subject: e.konu, html: e.html, text: e.metin })
    return
  }

  // Herkese açık oluşturma: koleksiyon kancası rolü “aday”a zorlar.
  const k = await payload.create({ collection: 'kullanicilar', data: { email: eposta, password: g.sifre, ad, rol: 'aday' }, overrideAccess: false })
  const riza = (tur: 'aday-aydinlatma' | 'ticari-ileti') =>
    payload.create({ collection: 'rizalar', data: { kullanici: k.id, tur, metinSurumu: surum(tur) }, overrideAccess: true })
  await riza('aday-aydinlatma')
  if (g.ticariIleti) await riza('ticari-ileti')
  await payload.create({ collection: 'adaylar', data: { kullanici: k.id, havuz: { gorunurluk: 'gizli' } } as never, overrideAccess: true })
}

export interface GirisSonucu {
  token: string
  bitis: Date
  rol: string
}

/** Giriş. Hata mesajı hangi bilginin yanlış olduğunu söylemez. */
export async function girisYap(payload: Payload, epostaHam: string, sifre: string): Promise<GirisSonucu> {
  const eposta = epostaNormallestir(epostaHam)
  const hatalar: Record<string, string> = {}
  if (!eposta) hatalar.eposta = 'E-posta adresini yaz.'
  if (!sifre) hatalar.sifre = 'Şifreni yaz.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  try {
    const s = await payload.login({ collection: 'kullanicilar', data: { email: eposta, password: sifre }, overrideAccess: true })
    if (!s.token) throw new IslemHatasi('Giriş yapılamadı. Biraz sonra yeniden dene.', 400)
    return { token: s.token, bitis: new Date((s.exp ?? Math.floor(Date.now() / 1000) + 8 * 3600) * 1000), rol: String(s.user?.rol ?? 'aday') }
  } catch (e) {
    if (e instanceof IslemHatasi) throw e
    const ad = (e as Error)?.name ?? ''
    if (ad === 'LockedAuth') throw new IslemHatasi('Çok sayıda hatalı deneme yapıldı. Hesap 15 dakika kilitlendi; sonra yeniden dene veya şifreni yenile.', 403)
    if (ad === 'UnverifiedEmail') throw new IslemHatasi('E-posta adresin henüz doğrulanmadı. Hesap açarken gönderdiğimiz e-postadaki bağlantıya tıkla.', 403)
    throw new IslemHatasi('E-posta adresi veya şifre hatalı.', 400)
  }
}

/** Şifre sıfırlama bağlantısı ister. Adres kayıtlı olmasa da aynı sonuç döner. */
export async function sifreSifirlamaIste(payload: Payload, epostaHam: string): Promise<void> {
  const eposta = epostaNormallestir(epostaHam)
  if (!eposta || !epostaGecerliMi(eposta)) throw new FormHatasi({ eposta: 'E-posta adresini ad@ornek.com biçiminde yaz.' })
  await payload.forgotPassword({ collection: 'kullanicilar', data: { email: eposta }, disableEmail: false }).catch((): null => null)
}

/** Yeni şifreyi belirler ve oturum açar. */
export async function sifreYenile(payload: Payload, anahtar: string, sifre: string): Promise<GirisSonucu> {
  const sh = sifreHatasi(sifre)
  if (sh) throw new FormHatasi({ sifre: sh })
  try {
    const s = await payload.resetPassword({ collection: 'kullanicilar', data: { token: anahtar, password: sifre }, overrideAccess: true })
    if (!s.token) throw new Error('anahtar yok')
    const user = s.user as { rol?: string }
    return { token: s.token, bitis: new Date(Date.now() + 8 * 3600 * 1000), rol: String(user?.rol ?? 'aday') }
  } catch {
    throw new IslemHatasi('Bu bağlantının süresi dolmuş veya bağlantı daha önce kullanılmış. Yeni bir bağlantı iste.', 400)
  }
}

/** E-posta doğrulama bağlantısı. */
export async function epostaDogrula(payload: Payload, anahtar: string): Promise<boolean> {
  if (!anahtar) return false
  return payload.verifyEmail({ collection: 'kullanicilar', token: anahtar }).then(
    () => true,
    () => false,
  )
}
