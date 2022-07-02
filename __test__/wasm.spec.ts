import { Buffer } from 'buffer'
import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp-compact'

import { Resvg, initWasm } from '../wasm'

// Init Wasm
test.before(async () => {
  await initWasm(fs.readFile(join(__dirname, '../wasm/index_bg.wasm')))
})

test('buffer input', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))

  const opts = {
    background: 'rgba(0, 0, 0, .36)',
  }
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

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
  const resvg = new Resvg(svgString, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.getWidth(), 1200)
  t.is(result.getHeight(), 623)
})

test('Get SVG original size', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const resvg = new Resvg(svg, {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200, // The original size is not affected by the fitTo parameter
    },
  })

  t.is(resvg.width, 1324)
  t.is(resvg.height, 687)
})

test('SVG size must be rounded to an integer', (t) => {
  const svg = `<svg viewBox="0 0 200.5 126.49999" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect fill="#FCA6A6" x="0" y="0" width="100%" height="100%"></rect>
  </svg>`
  const resvg = new Resvg(svg)
  const { width, height } = resvg

  t.is(width, 201)
  t.is(height, 126)
})

test('SVG size must be equal to PNG size', async (t) => {
  const svg = `<svg viewBox="0 0 200.5 126.49999" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect fill="#FCA6A6" x="0" y="0" width="100%" height="100%"></rect>
  </svg>`
  const resvg = new Resvg(svg)

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))
  const { width, height } = resvg

  t.is(width, result.getWidth())
  t.is(height, result.getHeight())
})

test('Set the background with alpha by rgba().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgba(0, 0, 0, 0.6)',
  }
  const resvg = new Resvg(svgString, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.hasAlpha(), true)
})

test('Set the background with alpha by rgb().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgb(255, 0, 0, .832)',
  }
  const resvg = new Resvg(svgString, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.hasAlpha(), true)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'hsla(255, 80%, 50%, 1)',
  }
  const resvg = new Resvg(svgString, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.hasAlpha(), false)
})

test('should generate a 80x80 png and opaque', async (t) => {
  const svg = `<svg width="200px" height="200px" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <rect fill="green" x="0" y="0" width="100" height="100"></rect>
  </svg>`
  const resvg = new Resvg(svg, {
    crop: {
      left: 20,
      top: 20,
      right: 100,
      bottom: 100,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.getWidth(), 100 - 20)
  t.is(result.getHeight(), 100 - 20)
  t.is(result.hasAlpha(), false)
})

test('should render `<use xlink:href>` to an `<svg>` element', async (t) => {
  const svg = `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <svg id="svg1" xmlns="http://www.w3.org/2000/svg">
      <rect width="50%" height="50%" fill="green" />
    </svg>
    <use id="use1" x="50%" y="50%" xlink:href="#svg1" />
    <use id="use2" x="50%" y="0" xlink:href="#svg1" />
    <use id="use3" x="0" y="50%" xlink:href="#svg1" />
  </svg>
  `
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'height',
      value: 800,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.hasAlpha(), false)
  t.is(result.getWidth(), 800)
  t.is(result.getHeight(), 800)
})

test('should render `<use xlink:href>` to an `<defs>` element', async (t) => {
  const svg = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <svg id="svg1">
        <rect width="50%" height="50%" fill="green" />
      </svg>
    </defs>
    <use id="use1" x="0" y="0" xlink:href="#svg1" />
    <use id="use2" x="50%" y="50%" xlink:href="#svg1" />
  </svg>`

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 900,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(Buffer.from(pngBuffer))

  t.is(result.hasAlpha(), true)
  t.is(result.getWidth(), 900)
  t.is(result.getHeight(), 900)
})

test('should get svg bbox(rect)', async (t) => {
  const svg = `<svg width="300px" height="300px" viewBox="0 0 300 300" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#5283E8" x="50.4" y="60.8" width="200" height="100"></rect>
</svg>`

  const resvg = new Resvg(svg)
  const bbox = resvg.getBBox()
  t.not(bbox, undefined)
  if (bbox) {
    resvg.cropByBBox(bbox)
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()
    const result = await jimp.read(Buffer.from(pngBuffer))

    t.is(bbox.width, 200)
    t.is(bbox.height, 100.00000000000001)
    t.is(bbox.x, 50.4)
    t.is(bbox.y, 60.8)
    // Must not have Alpha
    t.is(result.hasAlpha(), false)
    // Here the expected value is actually 200*100, and the calculation of the bbox needs to be fixed.
    t.is(result.getWidth(), 200)
    t.is(result.getHeight(), 100)
  }
})

test('should return undefined if bbox is invalid', (t) => {
  const svg = `<svg width="300px" height="300px" viewBox="0 0 300 300" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>`
  const resvg = new Resvg(svg)
  t.is(resvg.getBBox(), undefined)
  t.is(resvg.innerBBox(), undefined)
})

// throws
test('should throw because invalid SVG (blank string)', (t) => {
  const error = t.throws(
    () => {
      new Resvg('')
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'SVG data parsing failed cause the document does not have a root node')
})

test('should throw (no input parameters)', (t) => {
  const error = t.throws(
    () => {
      new Resvg()
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'Input must be string or Uint8Array')
})
