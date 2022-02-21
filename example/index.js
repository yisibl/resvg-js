const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg } = require('../js-binding')

async function main() {
  const svg = await promises.readFile(join(__dirname, './text.svg'))
  const opts = {
    background: 'rgba(238, 235, 230, .9)',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
    // imageRendering: 1,
    // shapeRendering: 2,
    logLevel: 'debug',
  }

  const t = performance.now()
  const rusty = new Resvg(svg, JSON.stringify(opts))

  console.info(rusty.width)
  console.info(rusty.height)
  console.info(rusty)
  // const pngData = rusty.render()
  console.info('✨ Done in', performance.now() - t, 'ms')

  // await promises.writeFile(join(__dirname, './text-out.png'), pngData)
}

main()
