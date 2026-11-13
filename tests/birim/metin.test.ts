import { describe, expect, it } from 'vitest'
import { aramaMetni, aramayaUyar, normallestir, sayiIyelikEki, yonelmeEki } from '@/alan/metin'

describe('Türkçe arama', () => {
  it('Türkçe karakterlere duyarsız: "yazilim" = "yazılım"', () => {
    expect(normallestir('Yazılım')).toBe('yazilim')
    expect(aramayaUyar('yazilim', aramaMetni(['Gömülü Yazılım Mühendisi']))).toBe(true)
  })
  it('büyük İ ve I doğru küçülür', () => {
    expect(normallestir('İŞ İLANI')).toBe('is ilani')
    expect(normallestir('IĞDIR')).toBe('igdir')
  })
  it('C++, C# ve Node.js gibi adları korur', () => {
    expect(normallestir('C++ ve C# ile Node.js')).toBe('c++ ve c# ile node.js')
  })
  it('her kelime geçmeli; sıra önemsiz', () => {
    const m = aramaMetni(['Flutter Geliştirici', 'Kodpit Teknoloji', ['Dart', 'Flutter']])
    expect(aramayaUyar('kodpit flutter', m)).toBe(true)
    expect(aramayaUyar('kodpit go', m)).toBe(false)
    expect(aramayaUyar('', m)).toBe(true)
  })
})

describe('Türkçe ekler', () => {
  it('yönelme eki ünlü uyumuna uyar', () => {
    expect(`12 Aralık${yonelmeEki('12 Aralık')}`).toBe('12 Aralık’a')
    expect(`Kodpit${yonelmeEki('Kodpit')}`).toBe('Kodpit’e')
    expect(`Netinternet${yonelmeEki('Netinternet')}`).toBe('Netinternet’e')
    expect(`Ankara${yonelmeEki('Ankara')}`).toBe('Ankara’ya')
    expect(`Pinova Elektronik${yonelmeEki('Pinova Elektronik')}`).toBe('Pinova Elektronik’e')
  })
  it('sayı ekleri okunuşa göre', () => {
    const ek = (n: number) => `${n}${sayiIyelikEki(n)}`
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(ek)).toEqual(['0’ı', '1’i', '2’si', '3’ü', '4’ü', '5’i', '6’sı', '7’si', '8’i', '9’u'])
    expect([10, 20, 30, 40, 50, 60, 70, 80, 90].map(ek)).toEqual(['10’u', '20’si', '30’u', '40’ı', '50’si', '60’ı', '70’i', '80’i', '90’ı'])
    expect([100, 200, 1000, 1100, 2000000].map(ek)).toEqual(['100’ü', '200’ü', '1000’i', '1100’ü', '2000000’u'])
    expect(ek(23)).toBe('23’ü')
  })
})
