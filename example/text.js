const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg } = require('../index')

async function main() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <text fill="blue" font-family="serif" font-size="120">
      <tspan x="40" y="143">水</tspan>
    </text>
  </svg>
  `
  const t = performance.now()
  const resvg = new Resvg(svg, {
    background: 'pink',
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
    logLevel: 'debug', // Default Value: error
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './text2-out.png'), pngBuffer)
}

main()
