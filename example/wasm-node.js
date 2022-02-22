const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg, initWasm } = require('../wasm/index')

async function main() {
  await initWasm(fs.readFile(join(__dirname, '../wasm/index_bg.wasm')))

  const svg = await fs.readFile(join(__dirname, './text.svg'))
  const opts = {
    background: 'rgba(238, 235, 230, .9)',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  }
  const t = performance.now()
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()
  console.info('✨ Done in', performance.now() - t, 'ms')

  await fs.writeFile(join(__dirname, './text-out-wasm.png'), pngData)
}

main()
