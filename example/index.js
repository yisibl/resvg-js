const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { render } = require('../index')

async function main() {
  const svg = await promises.readFile(join(__dirname, './text.svg'))
  const t = performance.now()
  const pngData = render(svg, {
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
  })
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './text-out.png'), pngData)
}

main()
