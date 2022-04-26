const { promises } = require('fs')
const { join } = require('path')
// const { performance } = require('perf_hooks')

const fetch = require('node-fetch')

const { Resvg } = require('../index')

async function main() {
  const svg = await promises.readFile(join(__dirname, './url.svg'))
  const opts = {
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
    },
    logLevel: 'off',
  }

  const resvg = new Resvg(svg, opts)
  const resolved = await Promise.all(
    resvg.imagesToResolve().map(async (url) => {
      console.info('image url', url)
      const img = await fetch(url)
      const buffer = await img.arrayBuffer()
      return {
        url,
        mime: 'image/png',
        buffer: Buffer.from(buffer),
      }
    }),
  )

  for (const result of resolved) {
    const { url, mime, buffer } = result
    resvg.resolveImage(url, mime, buffer)
  }

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)

  await promises.writeFile(join(__dirname, './url-out.png'), pngBuffer)
}

main()
