/**
 * E-posta istemcileri SVG göstermediği için e-postada kullanılan logoların PNG kopyaları (2x, saydam zemin).
 * Kullanım: NODE_PATH=$(npm root -g) node tools/kimlik/eposta_png.cjs
 */
const { chromium } = require('playwright')
const path = require('path')
const kok = path.resolve(__dirname, '../..')
const ISLER = [
  ['public/logo/logo-kompakt-negatif.svg', 'public/eposta/teknokariyer-negatif.png', 200],
  ['public/logo/kurum/teknokent-dikey-negatif.svg', 'public/eposta/teknokent-negatif.png', 120],
  ['public/logo/kurum/pamukkale-tto-beyaz.svg', 'public/eposta/tto-beyaz.png', 56],
]
;(async () => {
  const b = await chromium.launch()
  for (const [kaynak, hedef, genislik] of ISLER) {
    const svg = require('fs').readFileSync(path.join(kok, kaynak), 'utf8')
    const [, , , w, h] = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/).map(Number)
    const W = genislik * 2
    const H = Math.round((W * h) / w)
    const p = await b.newPage({ viewport: { width: W, height: H } })
    // Bazı SVG'lerde sabit width/height var; img içinde istenen boya ölçeklenir.
    const veri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    await p.setContent(`<html><body style="margin:0;background:transparent"><img src="${veri}" style="display:block;width:${W}px;height:${H}px"></body></html>`)
    await p.screenshot({ path: path.join(kok, hedef), omitBackground: true })
    console.log(hedef, `${genislik}x${Math.round((genislik * h) / w)} (görüntü)`)
    await p.close()
  }
  await b.close()
})()
