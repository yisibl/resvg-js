import { promises as fs } from 'fs'
import { join } from 'path'
import b from 'benny'

import { render } from '../index'
import sharp from 'sharp'
import svg2img from 'svg2img'
import { createCanvas, Image } from '@napi-rs/canvas'

async function run() {
  const svg1 = await fs.readFile(join(__dirname, '../example/text.svg'))
  const tiger = await fs.readFile(join(__dirname, '../__test__/tiger.svg'))

  await b.suite(
    'resize width',
    b.add('resvg-js(Rust)', () => {
      render(svg1.toString('utf-8'), {
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
      await sharp('example/text.svg').resize(1200).toBuffer()
    }),

    // test from https://github.com/Brooooooklyn/canvas/blob/main/example/resize-svg.js
    b.add('skr-canvas(Rust)', async () => {
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
      await canvas.encode('png')
    }),

    b.add('svg2img(canvg and node-canvas)', () => {
      svg2img(svg1, { width: 1200 }, function (error, buffer) {})
    }),

    b.cycle(),
    b.complete(),
  )

  await b.suite(
    'default options and no text',
    b.add('resvg-js(Rust)', () => {
      render(tiger.toString('utf-8'), {
        font: {
          loadSystemFonts: false,
          fontFiles: ['../example/SourceHanSerifCN-Light-subset.ttf'],
          defaultFontFamily: 'Source Han Serif CN Light',
        },
        logLevel: 'off',
      })
    }),

    b.add('sharp', async () => {
      await sharp('__test__/tiger.svg').toBuffer()
    }),

    b.add('skr-canvas(Rust)', async () => {
      const image = new Image()
      image.src = tiger

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
      await canvas.encode('png')
    }),

    b.add('svg2img(canvg and node-canvas)', () => {
      svg2img(tiger, function (error, buffer) {})
    }),

    b.cycle(),
    b.complete(),
  )
}

run()
