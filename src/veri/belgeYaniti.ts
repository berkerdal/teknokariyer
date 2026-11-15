/** Sertifika belgesi uçlarının ortak yanıtı: PDF veya görsel, önbelleksiz, betik çalıştırmaz. */
import { IslemHatasi } from '@/servisler/ortak'

export async function belgeYaniti(istek: Request, hazirla: () => Promise<{ icerik: Uint8Array; tur: string; dosyaAdi: string }>): Promise<Response> {
  const indir = new URL(istek.url).searchParams.get('indir') === '1'
  try {
    const { icerik, tur, dosyaAdi } = await hazirla()
    return new Response(icerik as unknown as BodyInit, {
      headers: {
        'content-type': tur,
        'content-disposition': `${indir ? 'attachment' : 'inline'}; filename="${dosyaAdi}"`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
        // Görsel betik taşımaz ama yine de kum havuzunda açılır; PDF'te kum havuzu tarayıcının PDF görüntüleyicisini engeller
        // (PDF yüklemede etkisizleştirildi, K34).
        'content-security-policy': tur === 'application/pdf' ? "default-src 'none'" : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    })
  } catch (e) {
    if (!(e instanceof IslemHatasi)) console.error(e)
    return new Response(e instanceof IslemHatasi ? e.message : 'Belge açılamadı. Biraz sonra yeniden deneyin.', {
      status: e instanceof IslemHatasi ? e.durumKodu : 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}
