const fs = require('fs').promises
const { join } = require('path')
const { performance } = require('perf_hooks')

const { createCanvas, Image } = require('@napi-rs/canvas')
const Svg2 = require('oslllo-svg2')
const sharp = require('sharp')

const { render } = require('../index')

async function main() {
  const svg = await fs.readFile(join(__dirname, './anime_girl.svg'))
  const zoom = 1
  const w = 1052 * zoom // resize width
  const h = 744 * zoom // resize height

  const t0 = performance.now()
  const pngData = render(svg, {
    fitTo: {
      mode: 'width',
      value: w,
    },
    font: {
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
    },
    logLevel: 'off',
  })
  const t1 = performance.now()
  console.info('✨ resvg-js done in', t1 - t0, 'ms')
  await fs.writeFile(join(__dirname, './out-resvg-js.png'), pngData)

  sharpToPng(svg, w)
  skrCanvas(svg, w, h)
  osllloSvgToPng(svg, w, h)
}

async function sharpToPng(file, width) {
  const t0 = performance.now()
  await sharp(file, {
    // https://github.com/lovell/sharp/issues/1421#issuecomment-514446234
    density: (72 * width) / 1054, // 72 * width / actual width
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

async function osllloSvgToPng(file, width, height) {
  const t0 = performance.now()

  const instance = await Svg2(file)
  const svg = instance.svg
  svg.resize({ width, height })
  instance.png().toFile('example/out-oslllo-svg.png')

  const t1 = performance.now()
  console.info('✨ oslllo-svg2 done in', t1 - t0, 'ms')
}

main()
