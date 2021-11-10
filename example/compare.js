const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { createCanvas, Image } = require('@napi-rs/canvas')
const sharp = require('sharp')

const { render } = require('../index')

async function main() {
  const svg = await fs.readFile(join(__dirname, './anime_girl.svg'))
  const t0 = performance.now()
  const pngData = render(svg, {
    fitTo: {
      mode: 'width',
      value: 1052,
    },
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
    },
    logLevel: 'off',
  })
  const t1 = performance.now()
  console.info('✨ resvg-js done in', t1 - t0, 'ms')
  await fs.writeFile(join(__dirname, './out-resvg-js.png'), pngData)

  sharpToPng('example/anime_girl.svg', 1052)
  sharpToPng(svg, 1052)
  skrCanvas(svg, 1052, 744)
}

async function sharpToPng(file, width) {
  const t0 = performance.now()
  await sharp(file, {
    density: 100,
  })
    .resize(width)
    // .flatten({ background: '#fff' })
    .toFile('example/out-sharp.png')
  const t1 = performance.now()
  console.info('✨ sharp done in', t1 - t0, 'ms')
}

async function skrCanvas(file, width, height) {
  const t0 = performance.now()

  const image = new Image()
  image.src = file

  const w = width
  const h = height

  // resize SVG
  image.width = w
  image.height = h

  // create a canvas of the same size as the image
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')

  // fill the canvas with the image
  ctx.drawImage(image, 0, 0)
  const pngData = await canvas.encode('png')
  const t1 = performance.now()

  console.info('✨ skr-canvas done in', t1 - t0, 'ms')

  await fs.writeFile(join(__dirname, './out-skr-canvas.png'), pngData)
}

main()
