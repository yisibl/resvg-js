const { promises } = require('fs')
const { join } = require('path')

const fetch = require('node-fetch')

const { Resvg } = require('../index')

async function main() {
  const svg = `
  <!-- From https://octodex.github.com/nyantocat/ -->
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image xlink:href="https://octodex.github.com/images/nyantocat.gif" width="500" height="500"/>
  </svg>
  `
  const opts = {
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
    },
    logLevel: 'off',
  }
  const resvg = new Resvg(svg, opts)

  const resolved = await Promise.all(
    resvg.imagesToResolve().map(async (url) => {
      const img = await fetch(url)
      const buffer = await img.arrayBuffer()
      return {
        url,
        buffer: Buffer.from(buffer),
      }
    }),
  )
  if (resolved.length > 0) {
    for (const result of resolved) {
      const { url, buffer } = result
      resvg.resolveImage(url, buffer)
    }
  }

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)

  await promises.writeFile(join(__dirname, './url-out.png'), pngBuffer)
}

main()
