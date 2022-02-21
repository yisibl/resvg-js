import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp'

import { render, renderAsync } from '../index'

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

test('Set the background with alpha by rgb().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const pngData = render(svgString, {
    background: 'rgb(255, 0, 0, .832)',
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
  const syncRenderingResult = render(svg, params)
  const asyncRenderingResult = await renderAsync(svg, params)
  t.is(syncRenderingResult.length, asyncRenderingResult.length)
  // Do not run this assert in non-x64 environment.
  // It's too slow
  if (process.arch === 'x64') {
    t.deepEqual(syncRenderingResult, asyncRenderingResult)
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
  const pngData = render(svg, {
    crop: {
      left: 20,
      top: 20,
      right: 100,
      bottom: 100,
    },
  })
  const result = await jimp.read(pngData)

  t.is(result.getWidth(), 100 - 20)
  t.is(result.getHeight(), 100 - 20)
  t.is(result.hasAlpha(), false)
})

// Generate a 100x100 transparent png starting from resvg 0.21.0
// https://github.com/RazrFalcon/resvg/commit/5998e9b8411ff3f0171515371938ee1940be17c3
test('should generate a 100x100 transparent png', async (t) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`
  const pngData = render(svg)
  const result = await jimp.read(pngData)

  t.is(result.hasAlpha(), true)
  t.is(result.getWidth(), 100)
  t.is(result.getHeight(), 100)
})

test('should generate a 128x128 png', async (t) => {
  const svg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"></svg>`
  const pngData = render(svg, {
    background: 'green',
  })
  const result = await jimp.read(pngData)

  t.is(result.hasAlpha(), false)
  t.is(result.getWidth(), 128)
  t.is(result.getHeight(), 128)
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
  const pngData = render(svg)
  const result = await jimp.read(pngData)

  t.is(result.hasAlpha(), false)
})

test('should throw because invalid SVG attribute (width attribute is 0)', (t) => {
  const error = t.throws(
    () => {
      render(`
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
      render(
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
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'Target size is zero (please do not set the width/height/zoom options to 0)')
})

test('should throw because invalid options (zoom 0)', (t) => {
  const error = t.throws(
    () => {
      render('<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"></svg>', {
        fitTo: {
          mode: 'zoom',
          value: 0,
        },
      })
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
      render(svg)
    },
    { instanceOf: Error },
  )

  t.is(error.message, 'SVG data parsing failed cause the document does not have a root node')
})
