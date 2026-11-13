import type { CollectionConfig } from 'payload'
import { alanSadeceYonetici, kullanici, kurumKullanicisiMi, sistemIslemiMi, yoneticiMi } from '../erisim'
import { dogrulamaEpostasi, sifreSifirlamaEpostasi } from '../altyapi/epostaSablonlari'

/**
 * Kullanıcılar: aday, firma kullanıcısı ve Yönetici A.Ş. personeli tek koleksiyonda, role göre ayrılır.
 * - Rol ve firma ataması yalnızca yönetici tarafından değiştirilir (kişi kendini yükseltemez).
 * - Giriş denemeleri sınırlanır (talimatlar 12).
 * - İki aşamalı doğrulama (TOTP) firma ve kurum hesaplarında zorunlu; akış M5'te bağlanacak.
 */
export const Kullanicilar: CollectionConfig = {
  slug: 'kullanicilar',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  admin: { useAsTitle: 'email', defaultColumns: ['ad', 'email', 'rol', 'firma'], group: 'Hesaplar' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8, // 8 saat
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    // E-posta doğrulanmadan giriş yapılamaz. Davetle açılan firma ve kurum hesapları doğrulanmış olarak açılır.
    verify: {
      generateEmailSubject: ({ user }) => dogrulamaEpostasi(user as never, '').konu,
      generateEmailHTML: ({ token, user }) => dogrulamaEpostasi(user as never, token ?? '').html,
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000, // 1 saat
      generateEmailSubject: (a) => sifreSifirlamaEpostasi((a?.user ?? {}) as never, '').konu,
      generateEmailHTML: (a) => sifreSifirlamaEpostasi((a?.user ?? {}) as never, a?.token ?? '').html,
    },
  },
  access: {
    // Kişi kendini, kurum herkesi okur.
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      return k ? { id: { equals: k.id } } : false
    },
    // Aday kendi hesabını açar (kayıt); firma ve kurum hesaplarını yalnızca yönetici açar (davet akışı).
    create: () => true,
    update: ({ req }) => {
      const k = kullanici(req)
      if (yoneticiMi(k)) return true
      return k ? { id: { equals: k.id } } : false
    },
    delete: ({ req }) => yoneticiMi(kullanici(req)),
    admin: ({ req }) => kurumKullanicisiMi(kullanici(req)),
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // Kendi kendine kayıt olan herkes aday olarak açılır; rolü yalnızca yönetici belirler.
        if (operation === 'create' && !yoneticiMi(kullanici(req)) && !sistemIslemiMi(req)) {
          data.rol = 'aday'
          data.firma = null
          data.firmaYetkisi = null
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'ad', label: 'Ad soyad', type: 'text', required: true },
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'aday',
      access: { create: alanSadeceYonetici, update: alanSadeceYonetici },
      options: [
        { label: 'Yönetici (Yönetici A.Ş.)', value: 'yonetici' },
        { label: 'Moderatör (Yönetici A.Ş.)', value: 'moderator' },
        { label: 'Raporlayıcı (Yönetici A.Ş.)', value: 'raporlayici' },
        { label: 'Firma kullanıcısı', value: 'firma' },
        { label: 'Aday', value: 'aday' },
      ],
    },
    {
      name: 'firma',
      label: 'Firma',
      type: 'relationship',
      relationTo: 'firmalar',
      access: { create: alanSadeceYonetici, update: alanSadeceYonetici },
      admin: { condition: (veri) => veri?.rol === 'firma' },
    },
    {
      name: 'firmaYetkisi',
      label: 'Firma içindeki yetki',
      type: 'select',
      access: { create: alanSadeceYonetici, update: alanSadeceYonetici },
      admin: { condition: (veri) => veri?.rol === 'firma' },
      options: [
        { label: 'Yönetici (her şey)', value: 'yonetici' },
        { label: 'İlan sorumlusu (ilan ve başvurular)', value: 'ilan-sorumlusu' },
        { label: 'Değerlendirici (başvuruları görür, not yazar)', value: 'degerlendirici' },
      ],
    },
    {
      name: 'ikiAsamaliAcik',
      label: 'İki aşamalı doğrulama açık',
      type: 'checkbox',
      defaultValue: false,
      access: { update: () => false }, // yalnızca doğrulama akışı değiştirir
    },
    { name: 'totpGizli', type: 'text', hidden: true, access: { read: () => false, update: () => false } },
  ],
}
