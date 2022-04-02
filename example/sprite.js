const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg } = require('../index')

async function main() {
  const svg = await promises.readFile(join(__dirname, './sprite.svg'))
  const opts = {
    fitTo: {
      mode: 'width',
      value: 500,
    },
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
    },
    logLevel: 'off',
  }

  const t = performance.now()
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('Simplified svg string: \n', resvg.toString())
  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './sprite-out.png'), pngBuffer)
}

main()
