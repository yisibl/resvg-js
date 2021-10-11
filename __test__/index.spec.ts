import { promises } from 'fs'
import { join } from 'path'

import test from 'ava'
import probeImageSize from 'probe-image-size'

import { render } from '../index'

test('transparent background', async (t) => {
  const filePath = './tiger.svg'
  const svg = await promises.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString)
  const result = probeImageSize.sync(pngData)

  t.is(result.width, 900)
  t.is(result.height, 900)
})

test('fit to width', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await promises.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })
  const result = probeImageSize.sync(pngData)

  t.is(result.width, 1200)
  t.is(result.height, 623)
})


test('Load custom font', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await promises.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  })
  const result = probeImageSize.sync(pngData)

  t.is(result.width, 1324)
  t.is(result.height, 687)
})
