import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import sharp from 'sharp'

import { render } from '../index'

test('fit to width', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })
  // doc: https://sharp.pixelplumbing.com/api-input#metadata
  const result = await sharp(pngData).metadata()

  t.is(result.width, 1200)
  t.is(result.height, 623)
})

test('Set the background with alpha by rgba().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: 'rgba(0, 0, 0, 0.6)',
  })
  // doc: https://sharp.pixelplumbing.com/api-input#stats
  const result = await sharp(pngData).stats()

  // Is the image fully opaque
  t.is(result.isOpaque, false)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: 'hsla(255, 80%, 50%, 1)',
  })
  const result = await sharp(pngData).stats()

  // Is the image fully opaque
  t.is(result.isOpaque, true)
})

test('Load custom font', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  })
  const result = await sharp(pngData).metadata()

  t.is(result.width, 1324)
  t.is(result.height, 687)
})
