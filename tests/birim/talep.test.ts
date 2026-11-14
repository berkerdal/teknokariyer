import { describe, expect, it } from 'vitest'
import { mevcutlariAyir, talepOgeleri } from '@/alan/talep'

describe('taksonomi talebi', () => {
  it('satır ve virgülle ayrılmış öğeleri okur; boşları ve tekrarları atar', () => {
    expect(talepOgeleri('Rust\n\n rust , Zig;  Embedded   Linux ').ogeler).toEqual(['Rust', 'Zig', 'Embedded Linux'])
  })
  it('boş, çok kısa ve çok sayıda öğeyi Türkçe mesajla reddeder', () => {
    expect(talepOgeleri('  ').hata).toMatch(/yazın/)
    expect(talepOgeleri('R').hata).toMatch(/çok kısa/)
    expect(talepOgeleri(Array.from({ length: 11 }, (_, n) => `Öğe ${n}`).join('\n')).hata).toMatch(/en fazla 10/)
  })
  it('listede olanları ayırır', () => {
    expect(mevcutlariAyir(['İngilizce', 'Japonca'], ['ingilizce', 'Almanca'])).toEqual({ yeni: ['Japonca'], zatenVar: ['İngilizce'] })
  })
})
