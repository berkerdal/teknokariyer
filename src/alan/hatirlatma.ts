/**
 * Kurulum hatırlatmaları (talimatlar 0.3, 6): daveti kabul etmeyen veya profilini tamamlamayan firmaya 3., 7. ve 14. günde.
 * İş bir gün çalışmazsa sonraki çalışmada yalnızca en son eşik gönderilir (aynı gün üç e-posta gitmez).
 */
export const HATIRLATMA_GUNLERI = [3, 7, 14] as const

/** Gönderilecek hatırlatmanın günü; gerekmiyorsa null. */
export function siradakiHatirlatma(gecenGun: number, gonderilenler: number[]): number | null {
  const son = Math.max(0, ...gonderilenler)
  const uygun = HATIRLATMA_GUNLERI.filter((g) => g <= gecenGun && g > son)
  return uygun.length ? uygun[uygun.length - 1]! : null
}

/** Son hatırlatmada (14. gün) süresi biten davet bu kadar gün uzatılır; sonra kişisel takip başlar. */
export const SON_HATIRLATMA_UZATMA_GUN = 7
