import { describe, expect, it } from 'vitest'
import { parcalara, parcaliBul } from '@/altyapi/parcali'

describe('parça parça sorgu', () => {
  it('80’lik parçalara böler ve tekrarları atar', async () => {
    expect(parcalara(Array.from({ length: 170 }, (_, i) => i)).map((p) => p.length)).toEqual([80, 80, 10])
    const istenen: number[] = []
    const sonuc = await parcaliBul([...Array.from({ length: 120 }, (_, i) => i), 1, 2], async (p) => {
      istenen.push(p.length)
      return { docs: p.map((x) => x * 2) }
    })
    expect(istenen).toEqual([80, 40])
    expect(sonuc).toHaveLength(120)
  })
})
