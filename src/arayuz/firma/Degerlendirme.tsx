'use client'
/**
 * Başvuru ayrıntısındaki değerlendirme araçları: durum, puan ve ekip notu (prototip “Başvurular”).
 * - Durum seçilince adaya ne gideceği önceden yazılır; “Olumsuz”da isteğe bağlı kişisel not eklenebilir.
 * - Yetkisi olmayan kullanıcıya durum düğmesi gösterilmez (değerlendirici yalnızca not ve puan ekler).
 */
import { useActionState, useEffect, useRef, useState } from 'react'
import { basvuruDurumuEylemi, ekipNotuEylemi, puanEylemi } from '@/eylemler/firma'
import { GonderDugmesi, type FormDurumu } from '../form'

const DURUMLAR: Array<[string, string, string]> = [
  ['inceleniyor', 'İnceleniyor', 'Adaya e-posta gitmez; aday başvurusunun incelendiğini panelinde görür.'],
  ['gorusme', 'Görüşme', 'Adaya “başvurun görüşme aşamasına alındı” e-postası gider. Görüşme ayrıntılarını adayla siz paylaşırsınız.'],
  ['teklif', 'Teklif', 'Adaya “teklif aşamasına geçildi” e-postası gider.'],
  ['olumlu', 'Olumlu', 'Adaya “başvurun olumlu sonuçlandı” e-postası gider.'],
  ['olumsuz', 'Olumsuz', 'Adaya nazik bir “başka bir adayla ilerleme kararı” e-postası gider. Bu bildirim kapatılamaz.'],
  ['alindi', 'Alındı (geri al)', 'Başvuruyu yeniden “yeni” olarak işaretler; adaya e-posta gitmez.'],
]

function useBildirim(durum: FormDurumu) {
  const [metin, setMetin] = useState('')
  const son = useRef(durum.surum)
  useEffect(() => {
    if (!durum.surum || durum.surum === son.current) return
    son.current = durum.surum
    setMetin(durum.tamam ?? '') // eslint-disable-line react-hooks/set-state-in-effect -- işlem bitti
  }, [durum])
  useEffect(() => {
    if (!metin) return
    const z = setTimeout(() => setMetin(''), 5000)
    return () => clearTimeout(z)
  }, [metin])
  return metin
}

export function DurumFormu({ basvuruId, durum }: { basvuruId: number; durum: string }) {
  const [sonuc, eylem] = useActionState<FormDurumu, FormData>(basvuruDurumuEylemi, {})
  const [secili, setSecili] = useState(durum === 'alindi' ? 'inceleniyor' : durum)
  const bildirim = useBildirim(sonuc)
  const aciklama = DURUMLAR.find(([d]) => d === secili)?.[2]
  return (
    <form action={eylem} className="durum-formu">
      <input type="hidden" name="basvuru" value={basvuruId} />
      <div className="alan">
        <label htmlFor="bsv-durum">Başvurunun durumu</label>
        <select id="bsv-durum" name="durum" className="secim" value={secili} onChange={(e) => setSecili(e.target.value)}>
          {DURUMLAR.map(([d, a]) => (
            <option key={d} value={d}>
              {a}
            </option>
          ))}
        </select>
        {aciklama && <span className="ipucu">{aciklama}</span>}
      </div>
      {secili === 'olumsuz' && secili !== durum && (
        <div className="alan">
          <label htmlFor="bsv-olumsuz-not">
            Adaya kişisel not <span className="istege-bagli">(isteğe bağlı)</span>
          </label>
          <textarea id="bsv-olumsuz-not" name="not" className="metin-alani" rows={3} maxLength={500} placeholder="Örnek: Görüşmedeki ilginiz için teşekkür ederiz; yeni ilanlarımızı takip etmenizi isteriz." />
        </div>
      )}
      {sonuc.genel && (
        <p className="hata-metni" role="alert">
          {sonuc.genel}
        </p>
      )}
      {secili === durum ? (
        <button type="button" className="dugme" disabled aria-disabled="true">
          Başka bir durum seçin
        </button>
      ) : (
        <GonderDugmesi className={secili === 'olumsuz' ? 'dugme dugme--tehlike' : 'dugme'} bekleme="Kaydediliyor…">
          {secili === 'olumsuz' || secili === 'olumlu' ? 'Sonucu kaydet ve adaya bildir' : 'Durumu kaydet'}
        </GonderDugmesi>
      )}
      {bildirim && (
        <div className="bildirim" role="status">
          {bildirim}
        </div>
      )}
    </form>
  )
}

export function PuanFormu({ basvuruId, puan }: { basvuruId: number; puan: number | null }) {
  const [sonuc, eylem] = useActionState<FormDurumu, FormData>(puanEylemi, {})
  const bildirim = useBildirim(sonuc)
  return (
    <form action={eylem} className="puan-formu">
      <input type="hidden" name="basvuru" value={basvuruId} />
      <div className="puan" role="group" aria-label="Ekip puanı, 1 ile 5 arası">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="submit" name="puan" value={n === puan ? '' : n} aria-pressed={n === puan} className={puan && n <= puan ? 'dolu' : ''}>
            {n}
            <span className="gizli">{n === puan ? ' (seçili; kaldırmak için basın)' : ''}</span>
          </button>
        ))}
      </div>
      {sonuc.genel && <p className="hata-metni">{sonuc.genel}</p>}
      {bildirim && (
        <div className="bildirim" role="status">
          {bildirim}
        </div>
      )}
    </form>
  )
}

export function NotFormu({ basvuruId }: { basvuruId: number }) {
  const [sonuc, eylem] = useActionState<FormDurumu, FormData>(ekipNotuEylemi, {})
  const bildirim = useBildirim(sonuc)
  return (
    <form action={eylem} key={sonuc.surum} className="form-yigin">
      <input type="hidden" name="basvuru" value={basvuruId} />
      <div className={sonuc.hatalar?.not ? 'alan alan--hata' : 'alan'}>
        <label htmlFor="bsv-not">Not ekle</label>
        {sonuc.hatalar?.not && <p className="hata-metni">{sonuc.hatalar.not}</p>}
        <textarea id="bsv-not" name="not" className="metin-alani" rows={3} maxLength={2000} placeholder="Örnek: Teknik görüşmede durum yönetimi deneyimini sor." />
      </div>
      <div>
        <GonderDugmesi className="dugme dugme--ikincil dugme--kucuk" bekleme="Ekleniyor…">
          Notu ekle
        </GonderDugmesi>
      </div>
      {bildirim && (
        <div className="bildirim" role="status">
          {bildirim}
        </div>
      )}
    </form>
  )
}
