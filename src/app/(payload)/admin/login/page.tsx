import { redirect } from 'next/navigation'

/**
 * Payload ekranının kendi giriş sayfası kullanılmaz: giriş, iki aşamalı doğrulamayla birlikte yalnızca portalın giriş
 * sayfasından yapılır (REST üzerinden giriş kapalı). Teknik sorumlu girişten sonra /admin'e döner.
 */
export default function PayloadGirisi() {
  redirect('/giris?donus=%2Fadmin')
}
