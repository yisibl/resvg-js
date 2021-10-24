const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { render } = require('../index')
const sharp = require('sharp')
const { createCanvas, Image } = require('@napi-rs/canvas')

async function main() {
  // const svg = await fs.readFile(join(__dirname, './text.svg'))
  const svg = await fs.readFile(join(__dirname, './anime_girl.svg'))
  const svgString = svg.toString('utf-8')
  const t0 = performance.now()
  const pngData = render(svgString, {
    // background: 'rgba(238, 235, 230, .9)',
    fitTo: {
      mode: 'zoom',
      value: 2,
    },
    font: {
      loadSystemFonts: true, // It will be faster to disable loading system fonts.
      fontFiles: [
        './example/SourceHanSerifCN-Light-subset.ttf',
      ], // Load custom fonts.
    },
    // imageRendering: 1,
    // shapeRendering: 2,
    logLevel: 'off',
  })
  const t1 = performance.now()
  console.log('✨ resvg-js done in', t1 - t0, 'ms')
  await fs.writeFile(join(__dirname, './out-resvg-js.png'), pngData)
  
  sharpToPng('example/anime_girl.svg', 1052)
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
  console.log('✨ sharp done in', t1 - t0, 'ms')
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
  var pngData = await canvas.encode('png')
  const t1 = performance.now()

  console.log('✨ skr-canvas done in', t1 - t0, 'ms')

  await fs.writeFile(join(__dirname, './out-skr-canvas.png'), pngData)
}

main()
