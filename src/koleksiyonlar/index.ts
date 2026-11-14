/**
 * Koleksiyon listesi. Her koleksiyon kendi dosyasında; erişim kuralları src/erisim/ altında.
 */
import type { CollectionConfig, GlobalConfig } from 'payload'

import { Kullanicilar } from './Kullanicilar'
import { Firmalar } from './Firmalar'
import { Ilanlar } from './Ilanlar'
import { Adaylar } from './Adaylar'
import { Basvurular } from './Basvurular'
import { Taksonomiler } from './Taksonomiler'
import { Rizalar } from './Rizalar'
import { HavuzGoruntulemeleri } from './HavuzGoruntulemeleri'
import { Davetler } from './Davetler'
import { IslemKayitlari } from './IslemKayitlari'
import { Dosyalar } from './Dosyalar'
import { TestPostalar } from './TestPostalar'
import { Talepler } from './Talepler'
import { Ayarlar } from '../globaller/Ayarlar'

export const koleksiyonlar: CollectionConfig[] = [
  Kullanicilar,
  Firmalar,
  Ilanlar,
  Basvurular,
  Adaylar,
  Taksonomiler,
  Davetler,
  Rizalar,
  HavuzGoruntulemeleri,
  IslemKayitlari,
  Dosyalar,
  TestPostalar,
  Talepler,
]

export const globaller: GlobalConfig[] = [Ayarlar]

/** Dosya yükleyen koleksiyonlar: depolama adaptörü (R2 / S3) bunlara bağlanır. */
export const DOSYA_KOLEKSIYONLARI = ['dosyalar'] as const
