import { promises as fs } from 'fs'
import { join } from 'path'

import { createCanvas, Image } from '@napi-rs/canvas'
import b from 'benny'
import Svg2 from 'oslllo-svg2'
import sharp from 'sharp'
import svg2img from 'svg2img'

import { render } from '../index'

async function run() {
  const svg1 = await fs.readFile(join(__dirname, '../example/text.svg'))
  const tiger = await fs.readFile(join(__dirname, '../__test__/tiger.svg'))
  const icon = await fs.readFile(join(__dirname, '../__test__/icon-alarm.svg'))

  await b.suite(
    'resize width',
    b.add('resvg-js(Rust)', () => {
      render(svg1, {
        background: '#eeebe6',
        fitTo: {
          mode: 'width',
          value: 1200,
        },
        font: {
          loadSystemFonts: false,
        },
        logLevel: 'off',
      })
    }),

    b.add('sharp', async () => {
      await sharp('example/text.svg').flatten({ background: '#eeebe6' }).resize(1200).toBuffer()
    }),

    // test from https://github.com/Brooooooklyn/canvas/blob/main/example/resize-svg.js
    b.add('skr-canvas(Rust)', () => {
      const image = new Image()
      image.src = svg1

      const w = 1200
      const h = 623

      // resize SVG
      image.width = w
      image.height = h

      // create a canvas of the same size as the image
      const canvas = createCanvas(w, h)
      const ctx = canvas.getContext('2d')

      // fill the canvas with the image
      ctx.drawImage(image, 0, 0)
      canvas.toBuffer('image/png')
    }),

    b.add('svg2img(canvg + node-canvas)', () => {
      svg2img(svg1.toString('utf8'), { width: 1200, height: 623 }, function (_error, _buffer) {})
    }),

    b.add('oslllo-svg2(jsdom + node-canvas)', async () => {
      const instance = await Svg2(svg1)
      const svg = instance.svg
      svg.resize({ width: 1200, height: 623 })
      instance.png().toBuffer()
    }),

    b.cycle(),
    b.complete(),
  )

  await b.suite(
    'resize icon width',
    b.add('resvg-js(Rust)', () => {
      render(icon, {
        fitTo: {
          mode: 'width',
          value: 386,
        },
        font: {
          loadSystemFonts: false,
        },
        logLevel: 'off',
      })
    }),

    b.add('sharp', async () => {
      await sharp(icon, {
        // https://github.com/lovell/sharp/issues/1421#issuecomment-514446234
        density: (72 * 386) / 24, // 72 * width / actual width
      })
        .resize(386)
        .toBuffer()
    }),

    // test from https://github.com/Brooooooklyn/canvas/blob/main/example/resize-svg.js
    b.add('skr-canvas(Rust)', () => {
      const image = new Image()
      image.src = icon

      const w = 386
      const h = 386

      // resize SVG
      image.width = w
      image.height = h

      // create a canvas of the same size as the image
      const canvas = createCanvas(w, h)
      const ctx = canvas.getContext('2d')

      // fill the canvas with the image
      ctx.drawImage(image, 0, 0)
      canvas.toBuffer('image/png')
    }),

    b.add('svg2img(canvg + node-canvas)', () => {
      svg2img(icon.toString('utf8'), { width: 386, height: 386 }, function (_error, _buffer) {})
    }),

    b.add('oslllo-svg2(jsdom + node-canvas)', async () => {
      const instance = await Svg2(icon)
      const svg = instance.svg
      svg.resize({ width: 386, height: 386 })
      instance.png().toBuffer()
    }),

    b.cycle(),
    b.complete(),
  )

  await b.suite(
    'default options and no text',
    b.add('resvg-js(Rust)', () => {
      render(tiger, {
        font: {
          loadSystemFonts: false,
        },
        logLevel: 'off',
      })
    }),

    b.add('sharp', async () => {
      await sharp(tiger).toBuffer()
    }),

    b.add('skr-canvas(Rust)', () => {
      const image = new Image()
      image.src = tiger

      const w = 900
      const h = 900

      // resize SVG
      image.width = w
      image.height = h

      // create a canvas of the same size as the image
      const canvas = createCanvas(w, h)
      const ctx = canvas.getContext('2d')

      // fill the canvas with the image
      ctx.drawImage(image, 0, 0)
      canvas.toBuffer('image/png')
    }),

    b.add('svg2img(canvg + node-canvas)', () => {
      svg2img(tiger.toString('utf8'), { width: 900, height: 900 }, function (_error, _buffer) {})
    }),

    b.add('oslllo-svg2(jsdom + node-canvas)', async () => {
      await Svg2(tiger).png().toBuffer()
    }),

    b.cycle(),
    b.complete(),
  )
}

run().catch((e) => {
  console.error(e)
})
