const { promises } = require('fs')
const { join } = require('path')
const { performance } = require('perf_hooks')

const { Resvg } = require('../index')

async function main() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">
    <defs>
      <linearGradient id="fill" x1="0%" y1="45%" x2="100%" y2="55%">
        <stop stop-color="#7f00de" offset="0%"/>
        <stop stop-color="#ff007e" offset="100%"/>
      </linearGradient>
    </defs>
    <text fill="url(#fill)" font-family="" font-size="60">
      <tspan x="40" y="80">竹外桃花三两枝</tspan>
      <tspan x="40" y="160">Hello resvg-js</tspan>
    </text>
  </svg>
  `
  const t = performance.now()
  const resvg = new Resvg(svg, {
    background: '#fff',
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      // fontFiles: ['./__test__/Pacifico-Regular.ttf'],
      fontDirs: ['./example'],
      // defaultFontFamily: 'Source Han Serif CN Light',
      // defaultFontFamily: 'Nabla',
      defaultFontFamily: 'this-is-a-non-existent-font-family',
    },
    logLevel: 'debug', // Default Value: error
  })
  const pngBuffer = resvg.render().asPng()
  console.info('✨ Done in', performance.now() - t, 'ms')

  await promises.writeFile(join(__dirname, './text2-out.png'), pngBuffer)
}

main()
