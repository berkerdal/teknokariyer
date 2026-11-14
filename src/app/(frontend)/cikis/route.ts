/**
 * Oturumu kapatıp giriş sayfasına götürür. Ekipten çıkarılan (pasif) firma kullanıcısının açık kalmış oturumu buraya
 * yönlendirilir; giriş sayfası nedenini açıklar.
 */
import { NextResponse } from 'next/server'
import { oturumKapat } from '@/veri/cerez'

export const dynamic = 'force-dynamic'

export async function GET(istek: Request) {
  await oturumKapat()
  const pasif = new URL(istek.url).searchParams.get('pasif') === '1'
  return NextResponse.redirect(new URL(pasif ? '/giris?firma=1&pasif=1' : '/', istek.url), 303)
}
