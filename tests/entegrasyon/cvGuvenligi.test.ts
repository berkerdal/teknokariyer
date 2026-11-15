/**
 * CV güvenliği (K34): yüklenen PDF etkisizleştirilerek saklanır; şifreli PDF anlaşılır hatayla reddedilir;
 * temizlik işlem kaydına (kişisel veri olmadan) geçer.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { PDFDocument, PDFName, PDFString } from 'pdf-lib'
import config from '@/payload.config'
import { dosyaIcerigi } from '@/altyapi/depolama'
import { cvYukle } from '@/servisler/profil'

let payload: Payload
let aday: any
const ek = `cv${Date.now().toString(36)}`

beforeAll(async () => {
  payload = await getPayload({ config })
  aday = await payload.create({ collection: 'kullanicilar', overrideAccess: true, data: { email: `cvg-${ek}@ornek.com`, password: 'Deneme-12345', ad: 'CV Deneme', rol: 'aday', _verified: true } as any })
  await payload.create({ collection: 'adaylar', overrideAccess: true, data: { kullanici: aday.id, havuz: { gorunurluk: 'gizli' } } as any })
})

const metin = (b: Uint8Array) => new TextDecoder('latin1').decode(b)

describe('CV yükleme', () => {
  it('betikli ve ekli PDF temizlenerek saklanır; işlem kaydına geçer', async () => {
    const b = await PDFDocument.create()
    b.addPage([595, 842])
    b.catalog.set(PDFName.of('OpenAction'), b.context.obj({ S: 'JavaScript', JS: PDFString.of('app.alert(1)') }))
    await b.attach(new TextEncoder().encode('MZ'), 'x.exe', { mimeType: 'application/octet-stream' })
    const ham = await b.save({ useObjectStreams: false })
    const { id } = await cvYukle(payload, aday, { ad: 'CV', dosya: { veri: ham, boyut: ham.length } })
    const dosya = await payload.findByID({ collection: 'dosyalar', id, overrideAccess: true })
    const saklanan = await dosyaIcerigi(dosya.filename!)
    expect(saklanan).toBeTruthy()
    for (const iz of ['/JavaScript', '/OpenAction', 'app.alert', '/EmbeddedFile', 'x.exe']) expect(metin(saklanan!)).not.toContain(iz)
    const kayit = await payload.find({ collection: 'islem-kayitlari', where: { islem: { equals: 'Yüklenen CV’den etkin içerik çıkarıldı' } }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true })
    expect(kayit.docs[0]?.ayrinti).toMatchObject({ betik: expect.any(Number), ek: expect.any(Number) })
    expect(JSON.stringify(kayit.docs[0]?.ayrinti)).not.toContain('cvg-')
  })

  it('şifreli PDF anlaşılır hatayla reddedilir', async () => {
    const b = await PDFDocument.create()
    b.addPage([595, 842])
    b.context.trailerInfo.Encrypt = b.context.obj({ Filter: 'Standard', V: 2, R: 3 })
    const ham = await b.save({ useObjectStreams: false })
    await expect(cvYukle(payload, aday, { ad: 'CV', dosya: { veri: ham, boyut: ham.length } })).rejects.toThrow(/parola korumalı/)
  })
})
