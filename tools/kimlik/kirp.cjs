// public/logo/kurum/*.svg dosyalarının viewBox'ını içeriğin gerçek sınırlarına göre kırpar (tarayıcıda getBBox ile).
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const klasor = path.join(__dirname, '../../public/logo/kurum')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  for (const ad of fs.readdirSync(klasor).filter((f) => f.endsWith('.svg'))) {
    const yol = path.join(klasor, ad)
    let svg = fs.readFileSync(yol, 'utf8')
    await p.setContent(svg)
    const k = await p.evaluate(() => {
      const s = document.querySelector('svg')
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      while (s.firstChild) g.appendChild(s.firstChild)
      s.appendChild(g)
      const r = g.getBBox()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    })
    const pay = Math.max(k.w, k.h) * 0.01
    const vb = [k.x - pay, k.y - pay, k.w + 2 * pay, k.h + 2 * pay].map((n) => Math.round(n * 100) / 100)
    svg = svg.replace(/width="[^"]*" height="[^"]*" viewBox="[^"]*"/, `width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(' ')}"`)
    fs.writeFileSync(yol, svg)
    console.log(ad, vb.join(' '))
  }
  await b.close()
})()
