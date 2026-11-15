/**
 * İki aşamalı doğrulama kurulumu: uygulama, karekod (veya elle anahtar), ilk kod. Sunucu bileşeni; karekod sunucuda
 * SVG olarak üretilir (dış hizmet yok). Telefondan girenler karekodu okutamayacağı için “bu telefondaki uygulamaya ekle”
 * bağlantısı ve elle yazılacak anahtar da verilir.
 */
import { renderSVG } from 'uqr'
import { gruplu } from '@/alan/ikiAdim'
import { KurulumFormu } from './IkiAdimFormlari'

export function KurulumAdimlari({ gizli, adres, siz }: { gizli: string; adres: string; siz: boolean }) {
  const svg = renderSVG(adres, { border: 2, pixelSize: 6 })
  return (
    <ol className="kurulum-adimlari">
      <li>
        <h2 className="b4">{siz ? 'Telefonunuza doğrulayıcı uygulama yükleyin' : 'Telefonuna doğrulayıcı uygulama yükle'}</h2>
        <p>
          {siz
            ? 'Google Authenticator veya Microsoft Authenticator ücretsizdir; uygulama mağazasından yükleyin. Telefonunuzda zaten bir doğrulayıcı uygulama varsa onu kullanabilirsiniz.'
            : 'Google Authenticator veya Microsoft Authenticator ücretsizdir; uygulama mağazasından yükle. Telefonunda zaten bir doğrulayıcı uygulama varsa onu kullanabilirsin.'}
        </p>
      </li>
      <li>
        <h2 className="b4">{siz ? 'Karekodu uygulamayla okutun' : 'Karekodu uygulamayla okut'}</h2>
        <p>{siz ? 'Uygulamada “+” veya “Hesap ekle” düğmesine dokunun ve kamerayı karekoda tutun.' : 'Uygulamada “+” veya “Hesap ekle” düğmesine dokun ve kamerayı karekoda tut.'}</p>
        <div className="karekod" role="img" aria-label="TeknoKariyer iki aşamalı doğrulama karekodu" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="kucuk">
          <a href={adres}>{siz ? 'Bu sayfayı telefondan açtıysanız uygulamaya buradan ekleyin' : 'Bu sayfayı telefondan açtıysan uygulamaya buradan ekle'}</a>
        </p>
        <details className="kucuk">
          <summary>{siz ? 'Karekodu okutamıyorsanız anahtarı elle girin' : 'Karekodu okutamıyorsan anahtarı elle gir'}</summary>
          <p>
            {siz ? 'Uygulamada “Kurulum anahtarı gir” seçeneğini seçin, hesap adına “TeknoKariyer” yazın ve şu anahtarı girin:' : 'Uygulamada “Kurulum anahtarı gir” seçeneğini seç, hesap adına “TeknoKariyer” yaz ve şu anahtarı gir:'}
          </p>
          <p className="anahtar-kodu">{gruplu(gizli)}</p>
          <p>Tür: zamana dayalı (TOTP).</p>
        </details>
      </li>
      <li>
        <h2 className="b4">{siz ? 'Uygulamadaki kodu yazın' : 'Uygulamadaki kodu yaz'}</h2>
        <KurulumFormu siz={siz} />
      </li>
    </ol>
  )
}
