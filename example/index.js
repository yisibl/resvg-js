const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { render } = require('../index')
const svg2img = require('svg2img')

async function main() {
  const svg = await fs.readFile(join(__dirname, './text.svg'))
  const svgString = svg.toString('utf-8')
  const t0 = performance.now()
  const pngData = render(svgString, {
    background: 'rgba(238, 235, 230, .9)',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
    // imageRendering: 1,
    // shapeRendering: 2,
    logLevel: 'debug',
  })
  const t1 = performance.now()
  // eslint-disable-next-line no-console
  console.log('✨ Done in', t1 - t0, 'ms')

  await fs.writeFile(join(__dirname, './text-out.png'), pngData)

  svg2img(svg, { width: 1200, preserveAspectRatio: true }, function (error, buffer) {
    fs.writeFile(join(__dirname, './text.png'), buffer)
  })
}

// sharp2()
main()
