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
    logLevel: 'debug',
  }

  const t = performance.now()
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()

  console.info('Simplified svg string: \n', resvg.toString())
  console.info('SVG original size:', `${resvg.width} x ${resvg.height}px`)
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './sprite-out.png'), pngData)
}

main()
