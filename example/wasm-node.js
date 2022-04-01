const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg, initWasm } = require('../wasm')

async function main() {
  await initWasm(fs.readFile(join(__dirname, '../wasm/index_bg.wasm')))

  const svg = await fs.readFile(join(__dirname, './sprite.svg'))
  const opts = {
    fitTo: {
      mode: 'width',
      value: 500,
    },
  }
  const t = performance.now()
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)
  console.info('✨ Done in', performance.now() - t, 'ms')

  await fs.writeFile(join(__dirname, './sprite-out-wasm.png'), pngBuffer)
}

main()
