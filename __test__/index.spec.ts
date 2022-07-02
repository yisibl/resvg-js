import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp-compact'

import { Resvg, renderAsync } from '../index'

test('fit to width', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const resvg = new Resvg(svg, {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

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
  const result = await jimp.read(pngBuffer)
  const { width, height } = resvg

  t.is(width, result.getWidth())
  t.is(height, result.getHeight())
})

test('render().width/height must be equal to PNG size', async (t) => {
  const svg = `<svg viewBox="0 0 200.5 126.49999" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect fill="#FCA6A6" x="0" y="0" width="100%" height="100%"></rect>
  </svg>`
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'height',
      value: 300,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)
  const { width, height } = pngData

  t.is(width, result.getWidth())
  t.is(height, result.getHeight())
})

test('Set the background with alpha by rgba()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const resvg = new Resvg(svgString, {
    background: 'rgba(0, 0, 0, 0.6)',
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), true)
})

test('Set the background with alpha by rgb()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const resvg = new Resvg(svgString, {
    background: 'rgb(255, 0, 0, .832)',
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), true)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const resvg = new Resvg(svgString, {
    background: 'hsla(255, 80%, 50%, 1)',
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), false)
})

test('Load custom font', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const resvg = new Resvg(svgString, {
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.getWidth(), 1324)
  t.is(result.getHeight(), 687)
})

test('Async rendering', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const params = {
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  }
  let syncRenderingResult = new Resvg(svg, params)
  syncRenderingResult = syncRenderingResult.render()

  const asyncRenderingResult = await renderAsync(svg, params)
  t.is(syncRenderingResult.length, asyncRenderingResult.length)
  // Do not run this assert in non-x64 environment.
  // It's too slow
  if (process.arch === 'x64') {
    t.deepEqual(syncRenderingResult, syncRenderingResult)
  }
})

const MaybeTest = typeof AbortController !== 'undefined' ? test : test.skip

MaybeTest('should be able to abort queued async rendering', async (t) => {
  // fill the task queue
  for (const _ of Array.from({ length: 100 })) {
    process.nextTick(() => {})
  }
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const params = {
    font: {
      fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Source Han Serif CN Light',
    },
  }
  const controller = new AbortController()
  const renderingPromise = renderAsync(svg, params, controller.signal)
  // renderingPromise is in the queue now and have not started yet.
  controller.abort()
  const err = await t.throwsAsync(() => renderingPromise)
  t.is(err.message, 'AbortError')
  // @ts-expect-error
  t.is(err.code, 'Cancelled')
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
  const result = await jimp.read(pngBuffer)

  t.is(result.getWidth(), 100 - 20)
  t.is(result.getHeight(), 100 - 20)
  t.is(result.hasAlpha(), false)
})

// Generate a 100x100 transparent png starting from resvg 0.21.0
// https://github.com/RazrFalcon/resvg/commit/5998e9b8411ff3f0171515371938ee1940be17c3
test('should generate a 100x100 transparent png', async (t) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`
  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), true)
  t.is(result.getWidth(), 100)
  t.is(result.getHeight(), 100)
})

test('should generate a 128x128 png', async (t) => {
  const svg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"></svg>`
  const resvg = new Resvg(svg, {
    background: 'green',
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), false)
  t.is(result.getWidth(), 128)
  t.is(result.getHeight(), 128)
})

test('should render HEXA color format', async (t) => {
  const HEXA_SVG = `<svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg"><rect fill="#00800080" x="0" y="0" width="100%" height="100%"></rect></svg>`
  const RGBA_SVG = `<svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg"><rect fill="rgba(0, 128, 0, 0.5)" x="0" y="0" width="100%" height="100%"></rect></svg>`

  const hexaPngData = new Resvg(HEXA_SVG).render().asPng()
  const rgbaPngData = new Resvg(RGBA_SVG).render().asPng()
  const HEXABuffer = await jimp.read(hexaPngData)
  const RGBABuffer = await jimp.read(rgbaPngData)

  const r1 = new jimp({ data: HEXABuffer.bitmap.data, width: 200, height: 200 })
  const r2 = new jimp({ data: RGBABuffer.bitmap.data, width: 200, height: 200 })
  const diff = await jimp.diff(r1, r2, 0.01)

  t.is(diff.percent, 0) // 0 means similar, 1 means not similar
})

// The four green <rect> must be tiled, with no alpha channel.
// View more test cases: https://github.com/RazrFalcon/resvg/commit/0eb347f2b6b9d76ffcb8e6b66ebefcd0f09da6a7
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
  const result = await jimp.read(pngBuffer)

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
  const result = await jimp.read(pngBuffer)

  t.is(result.hasAlpha(), true)
  t.is(result.getWidth(), 900)
  t.is(result.getHeight(), 900)
})

test('should get svg bbox', (t) => {
  const svg = `<svg viewBox="-40 0 150 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g fill="red" transform="rotate(-10 50 100) translate(-36 45.5) skewX(40) scale(1 0.5)">
      <path id="heart" d="M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z" />
    </g>
  </svg>`

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 500,
    },
  })
  const bbox = resvg.innerBBox()
  t.not(bbox, undefined)
  if (bbox) {
    t.is(bbox.width, 120)
    t.is(bbox.height, 49)
    t.is(bbox.x, -30)
    t.is(bbox.y, 49)
  }
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
    const result = await jimp.read(pngBuffer)

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

test('should throw because invalid SVG attribute (width attribute is 0)', (t) => {
  const error = t.throws(
    () => {
      new Resvg(`
      <svg width="0" height="100px" viewBox="0 0 200 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect fill="#FCA6A6" x="0" y="0" width="200" height="100"></rect>
      </svg>
      `)
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'SVG has an invalid size')
})

test('should throw because invalid options (width 0)', (t) => {
  const error = t.throws(
    () => {
      const resvg = new Resvg(
        `<svg width="200px" height="100px" viewBox="0 0 200 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <rect fill="#FCA6A6" x="0" y="0" width="200" height="100"></rect>
        </svg>`,
        {
          fitTo: {
            mode: 'width',
            value: 0,
          },
        },
      )

      resvg.render()
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'Target size is zero (please do not set the width/height/zoom options to 0)')
})

test('should throw because invalid options (zoom 0)', (t) => {
  const error = t.throws(
    () => {
      const resvg = new Resvg('<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"></svg>', {
        fitTo: {
          mode: 'zoom',
          value: 0,
        },
      })

      resvg.render()
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'Target size is zero (please do not set the width/height/zoom options to 0)')
})

// An SVG file must have a xmlns="http://www.w3.org/2000/svg" namespace.
// https://github.com/RazrFalcon/resvg/issues/192
test('should throw because missing namespace', (t) => {
  const svg = `<svg viewBox="0 0 0 16
                                     16"></svg>`
  const error = t.throws(
    () => {
      new Resvg(svg)
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

  t.is(error.code, 'InvalidArg')
  t.is(error.message, 'Expect type String or Object, but got Undefined')
})

test('should throw (SVG string is empty)', (t) => {
  const error = t.throws(
    () => {
      new Resvg('')
    },
    { instanceOf: Error },
  )

  t.is(error.code, 'GenericFailure')
  t.is(error.message, 'SVG data parsing failed cause the document does not have a root node')
})
