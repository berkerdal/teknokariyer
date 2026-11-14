/**
 * Aydınlatma ve rıza metinleri (talimatlar 12; K24).
 *
 * - Her metnin bir sürümü vardır. Kullanıcının verdiği her onay bu sürümle kaydedilir (rizalar koleksiyonu).
 * - Metin değişince sürüm artırılır; eski onaylar eski sürümle kayıtlı kalır.
 * - DURUM: Bu metinler TASLAKTIR. Kurumun KVKK sorumlusu ve hukuk birimi onaylayana kadar `onayli: false` kalır ve
 *   sayfada “taslak” uyarısı görünür. Yurt dışına aktarım bölümü veri yeri kararına bağlıdır (CLAUDE.md 7).
 */

import { KURUM } from '@/altyapi/kurum'

export type MetinKimligi = 'aday-aydinlatma' | 'basvuru-aydinlatma' | 'havuz' | 'ticari-ileti'

export interface Metin {
  baslik: string
  surum: string
  tarih: string
  onayli: boolean
  /** Paragraflar; “- ” ile başlayan satırlar madde olur. */
  govde: string
}

const SORUMLU = `${KURUM.unvan} (${KURUM.adres})`
const HAKLAR = `KVKK’nın 11. maddesindeki haklarını (verinin işlenip işlenmediğini öğrenme, düzeltme, silme, itiraz ve diğerleri) ${KURUM.kvkkEposta} adresine yazarak kullanabilirsin. Verilerinin bir kopyasını ve hesabının silinmesini “Hesap ve gizlilik” sayfasından da isteyebilirsin.`

export const METINLER: Record<MetinKimligi, Metin> = {
  'aday-aydinlatma': {
    baslik: 'Aday aydınlatma metni',
    surum: '1.0',
    tarih: '2026-11-13',
    onayli: false,
    govde: `Veri sorumlusu: ${SORUMLU}.

TeknoKariyer’de hesap açtığında şu bilgilerini işliyoruz:
- Hesap bilgileri: ad soyad, e-posta adresi, şifrenin geri döndürülemez özeti
- Profilinde kendin girdiğin bilgiler: eğitim, deneyim, beceriler, diller, tercihler, CV dosyaların
- Güvenlik kayıtları: giriş zamanı, başarısız giriş denemeleri

Bu bilgileri hesabını yönetmek, ilanlara başvurmanı sağlamak ve hizmetin güvenliğini korumak için işliyoruz. Hukuki sebep: üyelik sözleşmesinin kurulması ve ifası (KVKK m. 5/2-c) ve hizmetin güvenliğine ilişkin meşru menfaat (m. 5/2-f).

Bilgilerin, sen bir ilana başvurmadıkça veya CV havuzuna katılmadıkça hiçbir firmayla paylaşılmaz. Hizmetin barındırıldığı altyapı sağlayıcısı verileri yalnızca bizim adımıza saklar.

Hesabını sildiğinde profilin, CV’lerin ve havuz kaydın silinir. Başvuruların, ilan kapandıktan 12 ay sonra anonimleştirilir.

${HAKLAR}`,
  },
  'basvuru-aydinlatma': {
    baslik: 'Başvuru aydınlatma metni',
    surum: '1.0',
    tarih: '2026-11-13',
    onayli: false,
    govde: `Veri sorumlusu: ${SORUMLU}.

Bir ilana başvurduğunda başvuru anındaki profilin, seçtiğin CV, ön yazın ve ön eleme cevapların ilanı veren firmaya iletilir. Firma bu bilgileri yalnızca bu pozisyon için değerlendirmede kullanır. Ücret beklentin firmaya gösterilmez.

Hukuki sebep: başvurunu iletmemizi istemen üzerine sözleşmenin kurulmasına ilişkin işlem (KVKK m. 5/2-c).

Başvurunun durumunu “Başvurularım” sayfasından izlersin; firma karar verdiğinde sonuç sana bildirilir. Başvurunu, firma karar vermeden geri çekebilirsin.

Başvuru kayıtların ilan kapandıktan 12 ay sonra anonimleştirilir; CV dosyası silinir.

${HAKLAR}`,
  },
  havuz: {
    baslik: 'CV havuzu açık rıza metni',
    surum: '1.0',
    tarih: '2026-11-13',
    onayli: false,
    govde: `Bu metni onaylarsan profilin, Pamukkale Teknokent’teki firmaların aday aradığı CV havuzuna eklenir. Onay vermek isteğe bağlıdır; vermezsen de ilanlara başvurabilirsin.

Onay verdiğinde ne olur:
- Firmalar havuzda arama yaptığında profilinin özetini görür: bölüm, okul, mezuniyet yılı, beceriler, diller, tercihler ve (girdiysen) cinsiyet. Arama sonuçlarında adın ve iletişim bilgilerin görünmez.
- Bir firma profilini açtığında adın, e-posta adresin, telefonun ve CV’lerin o firmaya görünür. Firma bunun için sana ayrıca sormaz.
- Profilini açan her firma kayda geçer. Son 30 günde kaç firmanın profilini açtığını görürsün; firmaların adlarını görmezsin.
- Profilini istediğin firmalardan gizleyebilirsin.

Rızan 12 ay geçerlidir; süre dolmadan seni hatırlatırız. Rızanı istediğin zaman “Hesap ve gizlilik” sayfasından geri alabilirsin; geri aldığında profilin havuzdan hemen çıkar.

Veri sorumlusu: ${SORUMLU}. ${HAKLAR}`,
  },
  'ticari-ileti': {
    baslik: 'Ticari elektronik ileti onayı',
    surum: '1.0',
    tarih: '2026-11-13',
    onayli: false,
    govde: `Bu onayı verirsen Pamukkale Teknokent’in kariyer etkinlikleri, staj dönemleri ve duyurularıyla ilgili e-posta alırsın. Onay isteğe bağlıdır. İstediğin zaman “Hesap ve gizlilik” sayfasından veya her e-postadaki bağlantıdan geri alabilirsin.

Başvurunla ilgili zorunlu bildirimler (başvuru alındı, durum değişti, şifre sıfırlama) bu onaydan bağımsızdır.`,
  },
}

/** Yürürlükteki sürüm (rıza kaydına yazılır). */
export const surum = (k: MetinKimligi) => METINLER[k].surum
