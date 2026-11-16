import { describe, expect, it } from 'vitest'
import { restKapisi } from '@/erisim/restKapisi'

const cagir = (payloadAPI: string, user: unknown, operation = 'read') => () => restKapisi({ req: { payloadAPI, user } as never, operation } as never)
const teknik = { id: 1, rol: 'yonetici', teknikSorumlu: true, pasif: false }

describe('REST kapısı', () => {
  it('yerel API (portalın kendi kodu) her zaman geçer', () => expect(cagir('local', null)).not.toThrow())
  it('REST yalnızca etkin teknik sorumluya açık', () => {
    expect(cagir('REST', teknik)).not.toThrow()
    expect(cagir('REST', null)).toThrow()
    expect(cagir('REST', null, 'create')).toThrow()
    expect(cagir('REST', { id: 2, rol: 'yonetici', teknikSorumlu: false })).toThrow()
    expect(cagir('REST', { ...teknik, pasif: true })).toThrow()
    expect(cagir('REST', { id: 3, rol: 'aday' })).toThrow()
    expect(cagir('GraphQL', null)).toThrow()
  })
  it('oturum yenileme geçer', () => expect(cagir('REST', { id: 3, rol: 'aday' }, 'refresh')).not.toThrow())
})
