const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { render } = require('../index')

async function main() {
  const svg = await promises.readFile(join(__dirname, './text.svg'))
  const svgString = svg.toString('utf-8')
  const t0 = performance.now()
  const pngData = render(svgString, {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  })
  const t1 = performance.now()
  // eslint-disable-next-line no-console
  console.log('✨ Done in', t1 - t0, 'ms')

  await promises.writeFile(join(__dirname, './text-out.png'), pngData)
}

main()
