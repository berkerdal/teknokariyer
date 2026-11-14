/**
 * D1 (SQLite) tek sorguda en fazla 100 bağlı parametre kabul eder. `in` koşulu bu sınırı aşınca sorgu
 * “too many SQL variables” hatasıyla düşer; Payload'un toplu silmesi de silinen kayıt başına bir parametre kullanır.
 * Uzun kimlik listeleri bu yardımcıyla parça parça sorgulanır. PostgreSQL'de sınır yok ama aynı kod sorunsuz çalışır.
 */
export const PARCA = 80

export function parcalara<T>(dizi: readonly T[], boyut = PARCA): T[][] {
  const sonuc: T[][] = []
  for (let i = 0; i < dizi.length; i += boyut) sonuc.push(dizi.slice(i, i + boyut))
  return sonuc
}

/** Değer listesini parçalara bölüp her parça için sorguyu çalıştırır, sonuçları birleştirir. */
export async function parcaliBul<D, T>(degerler: readonly D[], sorgu: (parca: D[]) => Promise<{ docs: T[] }>): Promise<T[]> {
  const benzersiz = [...new Set(degerler)]
  const sonuc: T[] = []
  for (const p of parcalara(benzersiz)) sonuc.push(...(await sorgu(p)).docs)
  return sonuc
}
