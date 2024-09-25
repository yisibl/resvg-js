import { resolve } from 'node:path'
import process from 'node:process'

import test from 'ava'

import type { ParsedArgs } from '../cli/cli'
import { transformOptions, transformPaths } from '../cli/option'

const absTestPath = (filename: string) => resolve(__dirname, filename)

test('CLI options should be transform to ResvgOptions', (t) => {
  const parsedArgv: ParsedArgs = {
    _: ['tiger.svg', 'output.png'],
    'system-font': false,
    'font-file': ['./font-bold.ttf', './font-light.ttf'],
    'font-dir': './fonts',
    'font-default-size': 12,
    'font-default-family': 'Arial',
    'font-serif-family': 'Times New Roman',
    'font-sans-serif-family': 'Arial',
    'font-cursive-family': 'Comic Sans MS',
    'font-fantasy-family': 'Papyrus',
    'font-monospace-family': 'Courier New',
    'shape-rendering': 0,
    'text-rendering': 1,
    'image-rendering': 1,
    'fit-width': 1200,
    'crop-top': 0,
    'crop-left': 1,
    'crop-right': 10,
    'crop-bottom': 100,
    dpi: 96,
    language: 'en',
    background: '#ffffff',
    'log-level': 'info',
  }

  t.deepEqual(transformOptions(parsedArgv), {
    font: {
      loadSystemFonts: false,
      fontFiles: [resolve(process.cwd(), './font-bold.ttf'), resolve(process.cwd(), './font-light.ttf')],
      fontDirs: [resolve(process.cwd(), './fonts')],
      defaultFontSize: 12,
      defaultFontFamily: 'Arial',
      serifFamily: 'Times New Roman',
      sansSerifFamily: 'Arial',
      cursiveFamily: 'Comic Sans MS',
      fantasyFamily: 'Papyrus',
      monospaceFamily: 'Courier New',
    },
    shapeRendering: 0,
    textRendering: 1,
    imageRendering: 1,
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    crop: {
      top: 0,
      left: 1,
      right: 10,
      bottom: 100,
    },
    dpi: 96,
    languages: ['en'],
    background: '#ffffff',
    logLevel: 'info',
  })
})

test('CLI argv should be transform to input and output paths', (t) => {
  t.deepEqual(
    transformPaths({
      _: [absTestPath('tiger.svg'), 'output.png'],
    }),
    {
      input: absTestPath('tiger.svg'),
      output: resolve(process.cwd(), 'output.png'),
    },
  )

  t.deepEqual(
    transformPaths({
      _: [absTestPath('tiger.svg')],
    }),
    {
      input: absTestPath('tiger.svg'),
    },
  )

  t.deepEqual(
    transformPaths({
      _: ['-'],
    }),
    {
      input: '-',
    },
  )
})

test('should throw because empty input path', (t) => {
  const error = t.throws(() => transformPaths({ _: [] }))
  t.is(
    error?.message,
    '- E|resvg-js: Please provide svg input file path\n  help: resvg-js [OPTIONS] <input_svg_path|"-"> [output_image_path]',
  )
})

test('should throw because input path is not exsit', (t) => {
  const error = t.throws(() => transformPaths({ _: ['./not_exsit.svg'] }))
  t.is(
    error?.message,
    `- E|resvg-js: Input file not found. please check file exsit.\n  input: ==> ${resolve(
      process.cwd(),
      'not_exsit.svg',
    )}`,
  )
})

test('should throw because unkonw options', (t) => {
  const error = t.throws(() => transformOptions({ _: ['-'], loadSystemFonts: 'false' }))
  t.is(error?.message, '- E|resvg-js: Unkonw option ==> --loadSystemFonts\n  help: resvg-js --help')
})
