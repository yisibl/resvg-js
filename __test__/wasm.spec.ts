import { Buffer } from 'buffer'
import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp'

import { render, initWasm } from '../wasm'

// init wasm
test.before(async () => {
  await initWasm(fs.readFile(join(__dirname, '../wasm/index_bg.wasm')))
})

test('buffer input', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))

  const opts = {
    background: 'rgba(0, 0, 0, .36)',
  }
  const pngData = render(svg, opts)
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), true)
})

test('fit to width', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  }
  const pngData = render(svgString, opts)
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.getWidth(), 1200)
  t.is(result.getHeight(), 623)
})

test('Set the background with alpha by rgba().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgba(0, 0, 0, 0.6)',
  }
  const pngData = render(svgString, opts)
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), true)
})

test('Set the background with alpha by rgb().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgb(255, 0, 0, .832)',
  }
  const pngData = render(svgString, opts)
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), true)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'hsla(255, 80%, 50%, 1)',
  }
  const pngData = render(svgString, opts)
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), false)
})

test('should generate a 80x80 png and opaque', async (t) => {
  const svg = `<svg width="200px" height="200px" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <rect fill="green" x="0" y="0" width="100" height="100"></rect>
  </svg>`
  const pngData = render(svg, {
    crop: {
      left: 20,
      top: 20,
      right: 100,
      bottom: 100,
    },
  })
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.getWidth(), 100 - 20)
  t.is(result.getHeight(), 100 - 20)
  t.is(result.hasAlpha(), false)
})

// throws
test('should throw because invalid SVG (blank string)', (t) => {
  const error = t.throws(
    () => {
      render('')
    },
    { instanceOf: TypeError },
  )

  t.is(error.message, 'SVG data parsing failed cause the document does not have a root node')
})
