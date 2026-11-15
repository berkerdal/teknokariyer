import Link from 'next/link'
import { ilanAyrintisi } from '@/veri/ilanlar'
import { eslesmeProfili, oturumdakiAday } from '@/veri/aday'
import { oturum } from '@/veri/payload'
import { kaydetmeBaglami } from '@/veri/kaydedilenler'
import { KaydetDugmesi } from './KaydetDugmesi'
import { FirmaKaro } from './FirmaKaro'
import { BeceriListesi } from './IlanSatiri'
import { EslesmeKutusu, IlanOlgulari, IlanOzetListesi, Metin } from './IlanParcalari'
import { ilanAdresi } from './bicim'

/** Masaüstü sağ bölme: seçili ilanın özeti. */
export async function IlanOnizleme({ id }: { id: number }) {
  const [ilan, aday, k, kaydetFn] = await Promise.all([ilanAyrintisi(id), oturumdakiAday(), oturum(), kaydetmeBaglami()])
  if (!ilan || ilan.durum !== 'yayinda') return <p className="ikincil">Bu ilan artık yayında değil.</p>
  const profil = aday ? eslesmeProfili(aday) : null
  const sahip = profil ? new Set(profil.beceriler.map((b) => b.toLocaleLowerCase('tr'))) : undefined
  return (
    <div className="onz">
      <div className="onz-firma">
        <FirmaKaro konum={ilan.firma.konum} logo={ilan.firma.logo} ad={ilan.firma.ad} boy={48} />
        <div>
          <Link href={`/firma/${ilan.firma.slug}`}>
            <strong>{ilan.firma.ad}</strong>
          </Link>
          <p className="kucuk ikincil">{ilan.firma.konum} · Pamukkale Teknokent</p>
        </div>
      </div>
      <h2 className="b2">{ilan.pozisyonAdi}</h2>
      <IlanOlgulari ilan={ilan} dort={false} />
      <IlanOzetListesi ilan={ilan} kisa />
      <div className="dugme-grubu">
        <Link className="dugme" href={`${ilanAdresi(ilan)}/basvur`}>
          Başvur
        </Link>
        <Link className="dugme dugme--ikincil" href={ilanAdresi(ilan)}>
          İlanın tamamı
        </Link>
        {kaydetFn(ilan.id, ilanAdresi(ilan)) && <KaydetDugmesi key={ilan.id} ilanId={ilan.id} baglam={kaydetFn(ilan.id, ilanAdresi(ilan))!} ad={ilan.pozisyonAdi} metinli />}
      </div>
      <EslesmeKutusu ilan={ilan} profil={profil} girisli={Boolean(k)} />
      <h3 className="b3">Ne yapacaksın?</h3>
      <Metin metin={ilan.isTanimi} />
      <h3 className="b3">Beceriler</h3>
      <BeceriListesi zorunlu={ilan.zorunluBeceriler} tercih={ilan.tercihBeceriler} sahip={sahip} />
    </div>
  )
}
