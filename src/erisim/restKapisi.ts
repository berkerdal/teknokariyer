/**
 * REST kapısı (güvenlik denetimi, 16.11.2026). Portalın bütün ekranları Payload'u sunucu içinde (yerel API) kullanır;
 * `/api/...` REST uçlarına yalnızca gelişmiş yönetim ekranı (teknik sorumlu) ihtiyaç duyar.
 *
 * Kapı olmadan REST üzerinden: Turnstile, istek sınırı ve aydınlatma onayı atlanarak aday hesabı açılabiliyor (ve
 * doğrulama e-postası rastgele bir adrese gönderilebiliyordu); ziyaretçi, yayındaki ilanın firmanın gizlediği ücretini,
 * tam başvuru ve görüntülenme sayısını (K23) ve moderasyon alanlarını okuyabiliyordu.
 */
import { APIError, type CollectionBeforeOperationHook, type CollectionConfig } from 'payload'
import { kullanici, teknikSorumluMu } from './index'

export const restKapisi: CollectionBeforeOperationHook = ({ req, operation }) => {
  if (req.payloadAPI === 'local') return
  if (teknikSorumluMu(kullanici(req))) return
  // Oturum yenileme açık açılmış oturuma yeni yetki vermez.
  if (operation === 'refresh') return
  throw new APIError('Bu adres portalın iç kullanımı içindir.', 403, undefined, true)
}

export const restKapisiEkle = (k: CollectionConfig): CollectionConfig => ({
  ...k,
  hooks: { ...k.hooks, beforeOperation: [restKapisi, ...(k.hooks?.beforeOperation ?? [])] },
})
