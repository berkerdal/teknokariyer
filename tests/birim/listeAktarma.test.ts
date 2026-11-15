import { describe, expect, it } from 'vitest'
import { aktarmaAdlari, aktarmaSiniflandir, basHarfleriDuzelt, bolumAdi, sutunOner, universiteAdi, xlsxOku } from '@/alan/listeAktarma'
import { resmiListeAdlari } from '@/alan/resmiListeler'
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

describe('listeyle karşılaştırma ve resmî liste', () => {
  it('zaten olanı, eş anlamlıyı ve aynı kökteki yazımı ayırır; dosya içindeki benzerleri bir kez alır', () => {
    const s = aktarmaSiniflandir(['Pamukkale Üniversitesi', 'ODTÜ', 'React.js', 'Yeni Ad', 'Yeni Ad.'], [
      { ad: 'Pamukkale Üniversitesi' },
      { ad: 'Orta Doğu Teknik Üniversitesi', esAnlamlilar: [{ ad: 'ODTÜ' }] },
      { ad: 'React' },
    ])
    expect(s.zatenVar).toBe(2)
    expect(s.benzer).toEqual([
      { ad: 'React.js', listede: 'React' },
      { ad: 'Yeni Ad.', listede: 'Yeni Ad' },
    ])
    expect(s.yeni).toEqual(['Yeni Ad'])
  })
  it('paketteki YÖK listesi temiz ve tekil gelir; özel yazımlar uygulanır', () => {
    const u = resmiListeAdlari('universite')
    const b = resmiListeAdlari('bolum')
    expect(u.length).toBeGreaterThan(200)
    expect(b.length).toBeGreaterThan(500)
    expect(u).toContain('Pamukkale Üniversitesi')
    expect(u).toContain('Bezmiâlem Vakıf Üniversitesi')
    expect(u).toContain('TOBB Ekonomi ve Teknoloji Üniversitesi')
    expect(u.some((a) => /\(|[A-ZÇĞİÖŞÜ]{6,}/.test(a))).toBe(false)
    expect(b).toContain('Bilgisayar Mühendisliği')
    expect(new Set(b).size).toBe(b.length)
  })
})
