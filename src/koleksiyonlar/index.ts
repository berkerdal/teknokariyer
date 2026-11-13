/**
 * Koleksiyon listesi. Her koleksiyon kendi dosyasında; erişim kuralları src/erisim/ altında.
 */
import type { CollectionConfig } from 'payload'

import { Kullanicilar } from './Kullanicilar'
import { Dosyalar } from './Dosyalar'
import { TestPostalar } from './TestPostalar'

export const koleksiyonlar: CollectionConfig[] = [Kullanicilar, Dosyalar, TestPostalar]

/** Dosya yükleyen koleksiyonlar: depolama adaptörü (R2 / S3) bunlara bağlanır. */
export const DOSYA_KOLEKSIYONLARI = ['dosyalar'] as const
