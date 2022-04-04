const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { renderAsync } = require('../index')

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
    logLevel: 'off',
  }

  const t = performance.now()
  const resvg = await renderAsync(svg, opts)
  const pngBuffer = resvg.asPng()

  console.info('Output PNG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './text-out-async.png'), pngBuffer)
}

main()
