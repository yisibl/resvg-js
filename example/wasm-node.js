const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { render } = require('../wasm-node')

async function main() {
  const svg = await promises.readFile(join(__dirname, './text.svg'))
  const svgString = svg.toString('utf-8')

  const opts = {
    background: 'rgba(238, 235, 230, .9)',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  }
  const t = performance.now()
  const pngData = render(svgString, JSON.stringify(opts))
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './text-out-wasm.png'), pngData)
}

main()
