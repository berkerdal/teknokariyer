/**
 * Oturumu kapatıp giriş sayfasına götürür. Ekipten çıkarılan (pasif) firma kullanıcısının açık kalmış oturumu buraya
 * yönlendirilir; giriş sayfası nedenini açıklar.
 */
import { NextResponse } from 'next/server'
import { oturumKapat } from '@/veri/cerez'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request) {
  await oturumKapat()
  const pasif = new URL(istek.url).searchParams.get('pasif')
  const hedef = pasif === '1' ? '/giris?firma=1&pasif=1' : pasif === 'kurum' ? '/giris?pasif=kurum' : '/'
  return NextResponse.redirect(new URL(hedef, istek.url), 303)
}
