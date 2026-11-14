import { describe, expect, it } from 'vitest'
import { benzerAdlar, mevcutlariAyir, talepOgeleri } from '@/alan/talep'

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

describe('benzerAdlar', () => {
  const liste = ['React', 'React Native', 'Kubernetes', 'Java', 'JavaScript', 'Go', 'Node.js', 'Yapay Zekâ']
  it('başka yazımı aynı kökle bulur', () => {
    expect(benzerAdlar('React.js', liste)[0]).toEqual({ ad: 'React', ayni: true })
    expect(benzerAdlar('nodejs', liste)[0]).toEqual({ ad: 'Node.js', ayni: true })
    expect(benzerAdlar('yapay zeka', liste)[0]).toEqual({ ad: 'Yapay Zekâ', ayni: true })
  })
  it('yazım hatasını ve önek benzerliğini gösterir, ilgisizi göstermez', () => {
    expect(benzerAdlar('Kubernets', liste).map((b) => b.ad)).toEqual(['Kubernetes'])
    expect(benzerAdlar('React', liste).map((b) => b.ad)).toEqual(['React', 'React Native'])
    expect(benzerAdlar('Rust', liste)).toEqual([])
    expect(benzerAdlar('Gö', liste)).toEqual([{ ad: 'Go', ayni: true }])
  })
})
