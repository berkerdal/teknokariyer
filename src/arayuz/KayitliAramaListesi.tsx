/**
 * Kayıtlı aramaların listesi (aday: Kaydedilenler sayfası; firma: CV havuzu sayfası). Her satırda sonuçlara bağlantı,
 * (ilan aramasında) bildirim sıklığı ve silme. Düğmeler sunucu eylemiyle çalışır; JavaScript olmadan da çalışır.
 */
import Link from 'next/link'
import type { KayitliAramalar } from '@/payload-types'
import { SIKLIK_ADI } from '@/alan/kayitliArama'
import { aramaIslemEylemi } from '@/eylemler/aramalar'
import { tarihYaz } from './bicim'
import { Ikon } from './Ikon'

export function KayitliAramaListesi({ aramalar, sonucAdresi }: { aramalar: KayitliAramalar[]; sonucAdresi: string }) {
  return (
    <ul className="ka-liste">
      {aramalar.map((a) => {
        const siz = a.tur === 'havuz'
        return (
          <li key={a.id} className="ka-satir">
            <div className="ka-govde">
              <Link className="ka-ad" href={`${sonucAdresi}${a.sorgu ? `?${a.sorgu}` : ''}`}>
                {a.ad}
              </Link>
              <span className="kucuk ikincil">
                {siz ? 'Haftada bir, yeni uyan aday sayısı' : SIKLIK_ADI[a.siklik]}
                {a.sonBildirim ? ` · son e-posta ${tarihYaz(a.sonBildirim, true)}` : ''}
              </span>
            </div>
            <div className="ka-eylemler">
              {!siz && (
                <form action={aramaIslemEylemi}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="tur" value={a.tur} />
                  <input type="hidden" name="islem" value="siklik" />
                  <input type="hidden" name="siklik" value={a.siklik === 'anlik' ? 'haftalik' : 'anlik'} />
                  <button className="dugme dugme--sade dugme--kucuk" type="submit">
                    {a.siklik === 'anlik' ? 'Haftalık özete çevir' : 'Anlık bildirime çevir'}
                  </button>
                </form>
              )}
              <form action={aramaIslemEylemi}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="tur" value={a.tur} />
                <input type="hidden" name="islem" value="sil" />
                <button className="dugme dugme--sade dugme--kucuk" type="submit" aria-label={`“${a.ad}” aramasını sil`}>
                  <Ikon ad="cop" kucuk /> Sil
                </button>
              </form>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
