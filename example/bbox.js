const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg } = require('../index')

async function main() {
  const svg = await promises.readFile(join(__dirname, './bbox.svg'))

  const opts = {
    fitTo: {
      mode: 'width',
      value: 500,
    },
    font: {
      loadSystemFonts: false,
    },
  }

  const t = performance.now()
  const resvg = new Resvg(svg, opts)
  const bbox = resvg.innerBBox()
  resvg.cropByBBox(bbox)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('SVG BBox:', `${bbox.width} x ${bbox.height}`)
  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './bbox-out.png'), pngBuffer)
}

main()
