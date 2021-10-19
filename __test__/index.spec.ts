import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp'

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
  const result = await jimp.read(pngData)

  t.is(result.getWidth(), 1200)
  t.is(result.getHeight(), 623)
})

test('Set the background with alpha by rgba().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: 'rgba(0, 0, 0, 0.6)',
  })
  const result = await jimp.read(pngData)

  t.is(result.hasAlpha(), true)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: 'hsla(255, 80%, 50%, 1)',
  })
  const result = await jimp.read(pngData)

  t.is(result.hasAlpha(), false)
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
  const result = await jimp.read(pngData)

  t.is(result.getWidth(), 1324)
  t.is(result.getHeight(), 687)
})
