import { describe, expect, it } from 'vitest'
import { csvOku, kisaAdTuret, onizle, rehberiCoz, sahisFirmasiOlabilir } from '@/alan/iceAktarma'

describe('rehberden içe aktarma', () => {
  it('Excel’in noktalı virgüllü, BOM’lu ve tırnaklı CSV’sini okur', () => {
    expect(csvOku('﻿Unvan;Blok/oda\r\n"Alfa; Beta A.Ş.";D Blok 1\r\n"Ç ""tırnak"" Ltd.";C Blok 2\r\n\r\n')).toEqual([
      ['Unvan', 'Blok/oda'],
      ['Alfa; Beta A.Ş.', 'D Blok 1'],
      ['Ç "tırnak" Ltd.', 'C Blok 2'],
    ])
    expect(csvOku('unvan,konum\nA,B')).toEqual([['unvan', 'konum'], ['A', 'B']])
  })
  it('başlıkları Türkçe yazım farklarına rağmen eşler, kısa adı unvandan türetir', () => {
    const s = rehberiCoz('ÜNVAN;Blok/Oda;SEKTÖR;E-Posta;Bilinmeyen\nRatel Bilişim Hizmetleri Ltd. Şti.;D Blok 102;Yazılım;INFO@ratel.test;x')
    expect(s.hata).toBeUndefined()
    expect(s.taninmayan).toEqual(['Bilinmeyen'])
    expect(s.firmalar[0]).toMatchObject({ satir: 2, unvan: 'Ratel Bilişim Hizmetleri Ltd. Şti.', kisaAd: 'Ratel Bilişim Hizmetleri', konum: 'D Blok 102', yetkiliEposta: 'info@ratel.test' })
    expect(rehberiCoz('Firma yok;Blok\na;b').hata).toMatch(/Unvan/)
  })
  it('şirket eklerini atar; eki olmayan unvanı şahıs firması olarak işaretler', () => {
    expect(kisaAdTuret('Kodpit Teknoloji Yazılım San. ve Tic. A.Ş.')).toBe('Kodpit Teknoloji Yazılım')
    expect(kisaAdTuret('Arelsis Mühendislik Limited Şirketi')).toBe('Arelsis Mühendislik')
    expect(sahisFirmasiOlabilir('Ayşe Yılmaz Yazılım Hizmetleri')).toBe(true)
    expect(sahisFirmasiOlabilir('Netinternet Bilişim A.Ş.')).toBe(false)
  })
  it('önizleme: kayıtlı, dosyada tekrar, hatalı ve uyarılar', () => {
    const { firmalar } = rehberiCoz(
      [
        'Unvan;Blok/oda;Sektör;E-posta;Yetkili',
        'Kodpit Teknoloji A.Ş.;D Blok 208;Yazılım;;',
        'Yeni Firma A.Ş.;C Blok 1;Uzay;info@yeni.test;',
        'Yeni Firma A.Ş.;C Blok 1;;;',
        'Eksik A.Ş.;;;;',
        'Tam Firma Ltd. Şti.;B Blok 3;Yazılım;ali@tam.test;Ali Veli',
      ].join('\n'),
    )
    const o = onizle(firmalar, [{ unvan: 'Kodpit Teknoloji A.Ş.', kisaAd: 'Kodpit Teknoloji' }], ['Yazılım'])
    expect(o.map((x) => x.durum)).toEqual(['kayitli', 'yeni', 'tekrar', 'hatali', 'yeni'])
    expect(o[1]!.uyarilar.join(' ')).toMatch(/genel bir kutu.*Uzay/s)
    expect(o[2]!.uyarilar[0]).toMatch(/3\. satırla/)
    expect(o[4]!.uyarilar).toEqual([])
  })
})
