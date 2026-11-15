import { describe, expect, it } from 'vitest'
import { aktarmaAdlari, basHarfleriDuzelt, bolumAdi, sutunOner, universiteAdi, xlsxOku } from '@/alan/listeAktarma'
import { excelOlustur } from '@/altyapi/excel'

describe('ad düzeltme', () => {
  it('ÖSYM biçimindeki üniversite adları', () => {
    expect(universiteAdi('PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)')).toBe('Pamukkale Üniversitesi')
    expect(universiteAdi('TOBB EKONOMİ VE TEKNOLOJİ ÜNİVERSİTESİ (ANKARA)')).toBe('TOBB Ekonomi ve Teknoloji Üniversitesi')
    expect(universiteAdi('ISPARTA UYGULAMALI BİLİMLER ÜNİVERSİTESİ (ISPARTA)')).toBe('Isparta Uygulamalı Bilimler Üniversitesi')
    expect(universiteAdi('İZMİR YÜKSEK TEKNOLOJİ ENSTİTÜSÜ')).toBe('İzmir Yüksek Teknoloji Enstitüsü')
    expect(universiteAdi('Orta Doğu Teknik Üniversitesi')).toBe('Orta Doğu Teknik Üniversitesi') // zaten düzgün
  })
  it('bölüm adlarından dil, ücret ve öğretim türü ekleri atılır', () => {
    expect(bolumAdi('Bilgisayar Mühendisliği (İngilizce) (%50 İndirimli)')).toBe('Bilgisayar Mühendisliği')
    expect(bolumAdi('ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ (İÖ)')).toBe('Elektrik-Elektronik Mühendisliği')
    expect(bolumAdi('Bilgisayar Programcılığı (Uzaktan Öğretim)')).toBe('Bilgisayar Programcılığı')
    expect(bolumAdi('BİLGİSAYAR VE ÖĞRETİM TEKNOLOJİLERİ ÖĞRETMENLİĞİ')).toBe('Bilgisayar ve Öğretim Teknolojileri Öğretmenliği')
  })
  it('karışık harfli ad değiştirilmez', () => {
    expect(basHarfleriDuzelt('Yönetim Bilişim Sistemleri')).toBe('Yönetim Bilişim Sistemleri')
  })
})

describe('aktarma', () => {
  const satirlar = [
    ['Program Kodu', 'Üniversite Adı', 'Program Adı'],
    ['101', 'PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)', 'Bilgisayar Mühendisliği'],
    ['102', 'PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)', 'Bilgisayar Mühendisliği (İÖ)'],
    ['103', 'EGE ÜNİVERSİTESİ (İZMİR)', 'BİLGİSAYAR MÜHENDİSLİĞİ (İngilizce)'],
    ['104', 'EGE ÜNİVERSİTESİ (İZMİR)', 'Yazılım Mühendisliği'],
  ]
  it('sütun başlıktan önerilir; adlar temizlenir, tekilleşir ve sıralanır', () => {
    expect(sutunOner(satirlar[0]!, 'universite')).toBe(1)
    expect(sutunOner(satirlar[0]!, 'bolum')).toBe(2)
    expect(aktarmaAdlari(satirlar, 1, 'universite')).toEqual(['Ege Üniversitesi', 'Pamukkale Üniversitesi'])
    expect(aktarmaAdlari(satirlar, 2, 'bolum')).toEqual(['Bilgisayar Mühendisliği', 'Yazılım Mühendisliği'])
  })
  it('Excel dosyası okunur (paylaşılan ve satır içi metin, boş hücreler)', () => {
    const dosya = excelOlustur([{ ad: 'Tablo', baslikli: true, satirlar: [['Üniversite Adı', 'Program Adı'], ['PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)', 'Yazılım & Veri <Bilimi>'], ['', 'Tek'], [12, 'Sayı']] }])
    const satir = xlsxOku(dosya)
    expect(satir[0]).toEqual(['Üniversite Adı', 'Program Adı'])
    expect(satir[1]).toEqual(['PAMUKKALE ÜNİVERSİTESİ (DENİZLİ)', 'Yazılım & Veri <Bilimi>'])
    expect(satir[2]).toEqual(['', 'Tek'])
    expect(satir[3]).toEqual(['12', 'Sayı'])
  })
})
