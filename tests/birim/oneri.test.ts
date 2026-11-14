import { describe, expect, it } from 'vitest'
import { oneriler } from '@/alan/oneri'

const L = ['Python', 'PyTorch', 'C', 'C++', 'Embedded C', 'İngilizce', 'Bilgisayar Mühendisliği', 'Yazılım Mühendisliği', 'React Native'].map((ad, id) => ({ id, ad }))

describe('yazdıkça öneri', () => {
  it('başta eşleşen önce gelir; büyük/küçük ve Türkçe harf farkı gözetilmez', () => {
    expect(oneriler(L, 'py').map((x) => x.ad)).toEqual(['Python', 'PyTorch'])
    expect(oneriler(L, 'ingilizce').map((x) => x.ad)).toEqual(['İngilizce'])
    expect(oneriler(L, 'muhendis').map((x) => x.ad)).toEqual(['Yazılım Mühendisliği', 'Bilgisayar Mühendisliği'])
  })
  it('tam eşleşme en önde; kelime başı eşleşmesi içeride geçenden önce', () => {
    expect(oneriler(L, 'c').map((x) => x.ad).slice(0, 3)).toEqual(['C', 'C++', 'Embedded C'])
    expect(oneriler(L, 'native').map((x) => x.ad)).toEqual(['React Native'])
  })
  it('seçilmiş olanları ve boş yazımı dışarıda bırakır', () => {
    expect(oneriler(L, 'py', [0]).map((x) => x.ad)).toEqual(['PyTorch'])
    expect(oneriler(L, '  ')).toEqual([])
  })
})
